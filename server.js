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
            SELECT ca.*, u.email
            FROM creator_applications ca
            JOIN users u ON u.id = ca.user_id
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
                     verified, barter, barter_note)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
                 ON CONFLICT DO NOTHING`,
                [
                    app.niche, app.followers, 0, app.city,
                    0, 0, 0,
                    "18-35", 50, 50, [app.city],
                    app.reel_price  || 0,
                    app.story_price || 0,
                    app.post_price  || 0,
                    true, app.barter, app.barter_note || null,
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
