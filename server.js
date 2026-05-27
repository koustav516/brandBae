const express = require("express");
const path    = require("path");

require("dotenv").config();

const { initDB, pool } = require("./db/pool");
const { router: authRouter, requireAdmin } = require("./routes/auth");
const creatorsRouter = require("./routes/creators");
const leadsRouter    = require("./routes/leads");

const app  = express();
const PORT = process.env.PORT || 3000;

const PUBLIC = path.join(__dirname, "public");

// ── MIDDLEWARE ──
app.use(express.json());
app.use(express.static(PUBLIC));

// Parse cookies without a dependency
app.use((req, _res, next) => {
    req.cookies = {};
    const raw = req.headers.cookie || "";
    raw.split(";").forEach((pair) => {
        const [k, ...v] = pair.trim().split("=");
        if (k) req.cookies[k.trim()] = decodeURIComponent(v.join("="));
    });
    next();
});

// ── PAGE ROUTES ──
const page = (f) => (_req, res) => res.sendFile(path.join(PUBLIC, f));
app.get("/",                  page("index.html"));
app.get("/marketplace",       page("marketplace.html"));
app.get("/join",              page("join.html"));
app.get("/login/creator",     page("login-creator.html"));
app.get("/creator/dashboard", page("creator-dashboard.html"));
app.get("/forgot-password",   page("forgot-password.html"));
app.get("/reset-password",    page("reset-password.html"));
app.get("/admin",             page("admin.html"));

// ── API ROUTES ──
app.use("/auth",         authRouter);
app.use("/api/creators", creatorsRouter);  // GET /api/creators — public list
app.use("/api/creator",  creatorsRouter);  // GET /api/creator/me — own profile
app.use("/api/leads",    leadsRouter);

// ── ADMIN API ──
app.get("/api/admin/applications", requireAdmin, async (_req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT ca.*, u.email,
                c.engagement    AS c_engagement,
                c.avg_likes     AS c_avg_likes,
                c.avg_comments  AS c_avg_comments,
                c.avg_reel_views AS c_avg_reel_views,
                c.age_range     AS c_age_range,
                c.female_p      AS c_female_p,
                c.male_p        AS c_male_p,
                c.locations     AS c_locations
            FROM creator_applications ca
            JOIN users u ON u.id = ca.user_id
            LEFT JOIN creators c ON c.user_id = ca.user_id
            ORDER BY ca.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error("GET /api/admin/applications error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.patch("/api/admin/applications/:id", requireAdmin, async (req, res) => {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { rows: [app] } = await client.query(
            `UPDATE creator_applications SET status = $1, reviewed_at = NOW()
             WHERE id = $2 RETURNING *`,
            [status, req.params.id]
        );
        if (!app) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Application not found" });
        }

        if (status === "approved") {
            await client.query(
                `INSERT INTO creators
                    (niche, followers, engagement, city,
                     avg_likes, avg_comments, avg_reel_views,
                     age_range, female_p, male_p, locations,
                     reel_price, story_price, post_price,
                     verified, barter, barter_note, user_id)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
                 ON CONFLICT DO NOTHING`,
                [
                    app.niche, app.followers, 0, app.city,
                    0, 0, app.avg_reel_views || 0,
                    app.audience_age_group || "18-35", app.female_p || 50, app.male_p || 50, [app.city],
                    app.reel_price  || 0,
                    app.story_price || 0,
                    app.post_price  || 0,
                    true, app.barter, app.barter_note || null, app.user_id,
                ]
            );
        }

        await client.query("COMMIT");
        console.log(`[ADMIN] Application #${app.id} (@${app.instagram_handle}) → ${status}`);
        res.json({ success: true, application: app });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("PATCH /api/admin/applications error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
});

// ── ADMIN — approve or reject a follower count update ──
app.patch("/api/admin/follower-update/:userId", requireAdmin, async (req, res) => {
    const { action } = req.body;
    if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "action must be 'approve' or 'reject'" });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        if (action === "approve") {
            const { rows: [app] } = await client.query(
                `UPDATE creator_applications
                 SET followers = pending_followers, pending_followers = NULL
                 WHERE user_id = $1 AND pending_followers IS NOT NULL
                 RETURNING followers, user_id, instagram_handle`,
                [req.params.userId]
            );
            if (!app) {
                await client.query("ROLLBACK");
                return res.status(404).json({ error: "No pending follower update found" });
            }
            // Update marketplace row — match by user_id, or fall back to niche+city join
            await client.query(
                `UPDATE creators c
                 SET    followers = $1,
                        user_id   = $2
                 FROM   creator_applications ca
                 WHERE  ca.user_id = $2
                   AND  (c.user_id = $2 OR (c.user_id IS NULL AND c.niche = ca.niche AND c.city = ca.city))`,
                [app.followers, req.params.userId]
            );
            console.log(`[ADMIN] Follower update approved for @${app.instagram_handle} → ${app.followers}`);
        } else {
            await client.query(
                `UPDATE creator_applications SET pending_followers = NULL WHERE user_id = $1`,
                [req.params.userId]
            );
            console.log(`[ADMIN] Follower update rejected for user #${req.params.userId}`);
        }

        await client.query("COMMIT");
        res.json({ success: true });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("PATCH /api/admin/follower-update error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
});

// ── ADMIN — update creator marketplace stats ──
app.patch("/api/admin/creator-stats/:userId", requireAdmin, async (req, res) => {
    const { engagement, avg_likes, avg_comments, avg_reel_views, age_range, female_p, male_p, locations } = req.body;

    try {
        const { rowCount } = await pool.query(
            `UPDATE creators SET
                engagement     = COALESCE($1, engagement),
                avg_likes      = COALESCE($2, avg_likes),
                avg_comments   = COALESCE($3, avg_comments),
                avg_reel_views = COALESCE($4, avg_reel_views),
                age_range      = COALESCE($5, age_range),
                female_p       = COALESCE($6, female_p),
                male_p         = COALESCE($7, male_p),
                locations      = COALESCE($8, locations)
             WHERE user_id = $9`,
            [
                engagement    != null ? parseFloat(engagement)   : null,
                avg_likes     != null ? parseInt(avg_likes)      : null,
                avg_comments  != null ? parseInt(avg_comments)   : null,
                avg_reel_views!= null ? parseInt(avg_reel_views) : null,
                age_range     || null,
                female_p      != null ? parseInt(female_p)       : null,
                male_p        != null ? parseInt(male_p)         : null,
                locations     ? locations.split(",").map(l => l.trim()).filter(Boolean) : null,
                req.params.userId,
            ]
        );

        if (!rowCount) return res.status(404).json({ error: "Creator not found" });
        console.log(`[ADMIN] Stats updated for user #${req.params.userId}`);
        res.json({ success: true });
    } catch (err) {
        console.error("PATCH /api/admin/creator-stats error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ── START ──
initDB()
    .then(() => {
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`\n Brandbae server running at http://localhost:${PORT}`);
            console.log(`   Join page:    http://localhost:${PORT}/join`);
            console.log(`   Admin panel:  http://localhost:${PORT}/admin`);
            console.log(`   Applications: http://localhost:${PORT}/api/admin/applications\n`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to database:", err.message);
        process.exit(1);
    });

process.on("unhandledRejection", (err) => { console.error("Unhandled rejection:", err.message); });
process.on("uncaughtException",  (err) => { console.error("Uncaught exception:", err.message); });
