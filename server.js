const express      = require("express");
const path         = require("path");
const { Resend }   = require("resend");

require("dotenv").config();

const { initDB, pool } = require("./db/pool");
const { router: authRouter, requireAdmin } = require("./routes/auth");
const creatorsRouter = require("./routes/creators");
const leadsRouter    = require("./routes/leads");

const resend   = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM     = process.env.RESEND_FROM    || "Brandbae <noreply@brandbae.co.in>";
const BASE_URL = process.env.BASE_URL       || "https://www.brandbae.co.in";

async function sendStatusEmail(app, status) {
    if (!resend) return;
    const { rows: [user] } = await pool.query(
        "SELECT email FROM users WHERE id = $1", [app.user_id]
    );
    if (!user?.email) return;

    const firstName  = (app.full_name || "Creator").split(" ")[0];
    const profileUrl = `${BASE_URL}/creator/${app.instagram_handle}`;

    if (status === "approved") {
        await resend.emails.send({
            from: FROM, to: user.email,
            replyTo: "adminbrandbae@gmail.com",
            subject: `You're live on Brandbae, ${firstName}`,
            html: `
            <!DOCTYPE html>
            <html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
            <body style="margin:0;padding:0;background:#f4f4f7;font-family:'Helvetica Neue',Arial,sans-serif">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 16px">
              <tr><td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

                  <!-- LOGO -->
                  <tr><td style="padding-bottom:28px">
                    <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#111118">Brand<span style="color:#3B5BDB">bae</span></span>
                  </td></tr>

                  <!-- MAIN CARD -->
                  <tr><td style="background:#ffffff;border-radius:20px;padding:40px 36px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">

                    <!-- HEADLINE -->
                    <h1 style="margin:0 0 6px;font-size:28px;font-weight:800;letter-spacing:-0.6px;color:#111118;line-height:1.2">
                      Hi ${firstName} 👋
                    </h1>
                    <p style="margin:0 0 24px;font-size:16px;font-weight:600;color:#3B5BDB;letter-spacing:-0.2px">
                      Welcome to Brandbae — as one of our very first creators. 🙌
                    </p>

                    <!-- BODY -->
                    <p style="margin:0 0 20px;font-size:15px;color:#3a3a4a;line-height:1.75">
                      Your profile is now live and brands can already discover you and reach out to collaborate.
                      You're part of something we're building from the ground up, and that genuinely means a lot to us.
                    </p>

                    <!-- PROFILE LINK -->
                    <p style="margin:0 0 28px;font-size:14px;color:#3a3a4a;line-height:1.75">
                      Your profile is live here: <a href="${profileUrl}" style="color:#3B5BDB;text-decoration:none;font-weight:600;word-break:break-all">${profileUrl}</a>
                    </p>

                    <!-- WHAT HAPPENS NEXT -->
                    <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#9696aa">What happens next</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
                      <tr>
                        <td style="padding:10px 0;border-top:1px solid #f0f0f4">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-right:14px;vertical-align:top;padding-top:2px">
                                <div style="width:6px;height:6px;background:#3B5BDB;border-radius:50%;margin-top:6px"></div>
                              </td>
                              <td style="font-size:14px;color:#3a3a4a;line-height:1.65">
                                Brands browse creator profiles on Brandbae and can view your profile directly
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-top:1px solid #f0f0f4">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-right:14px;vertical-align:top;padding-top:2px">
                                <div style="width:6px;height:6px;background:#3B5BDB;border-radius:50%;margin-top:6px"></div>
                              </td>
                              <td style="font-size:14px;color:#3a3a4a;line-height:1.65">
                                If they're interested, they'll reach out through our in-platform messaging
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-top:1px solid #f0f0f4;border-bottom:1px solid #f0f0f4">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-right:14px;vertical-align:top;padding-top:2px">
                                <div style="width:6px;height:6px;background:#3B5BDB;border-radius:50%;margin-top:6px"></div>
                              </td>
                              <td style="font-size:14px;color:#3a3a4a;line-height:1.65">
                                No middlemen — the deal is yours to own
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- EARLY CREATOR NOTE -->
                    <p style="margin:0 0 32px;font-size:14px;color:#3a3a4a;line-height:1.75;background:#fffbeb;border-left:3px solid #f59e0b;padding:14px 16px;border-radius:0 8px 8px 0">
                      As an early creator, your feedback shapes how we build this platform. If anything feels off or you have ideas, just hit reply — we actually read these.
                    </p>

                    <!-- CLOSING -->
                    <p style="margin:0 0 4px;font-size:15px;color:#3a3a4a;line-height:1.75">
                      Thank you for trusting us early. Let's get you your first brand collab soon.
                    </p>
                    <p style="margin:0 0 24px;font-size:15px;color:#3a3a4a">Warm regards,</p>

                    <!-- SIGNATURE -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:14px;vertical-align:middle">
                          <div style="width:44px;height:44px;background:#111118;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#fff;text-align:center;line-height:44px">K</div>
                        </td>
                        <td style="vertical-align:middle">
                          <div style="font-size:14px;font-weight:700;color:#111118;margin-bottom:2px">Koustav Majumder</div>
                          <div style="font-size:12px;color:#9696aa">Co-Founder, Brandbae · <a href="${BASE_URL}" style="color:#3B5BDB;text-decoration:none">brandbae.co.in</a></div>
                        </td>
                      </tr>
                    </table>

                  </td></tr>

                  <!-- FOOTER -->
                  <tr><td style="padding:24px 4px 0;text-align:center">
                    <p style="margin:0;font-size:12px;color:#b0b0c0;line-height:1.6">
                      You received this because you applied to Brandbae as @${app.instagram_handle}.<br/>
                      <a href="${BASE_URL}" style="color:#9696aa;text-decoration:none">brandbae.co.in</a>
                    </p>
                  </td></tr>

                </table>
              </td></tr>
            </table>
            </body></html>`
        });
    } else {
        await resend.emails.send({
            from: FROM, to: user.email,
            replyTo: "adminbrandbae@gmail.com",
            subject: "Your Brandbae application — an update",
            html: `
            <div style="font-family:'DM Sans',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#111118;background:#fff">
                <div style="font-size:20px;font-weight:800;margin-bottom:32px;letter-spacing:-0.5px">
                    Brand<span style="color:#3B5BDB">bae</span>
                </div>
                <h1 style="font-size:24px;font-weight:800;letter-spacing:-0.5px;margin-bottom:8px;line-height:1.2">
                    Hi ${firstName}, thanks for applying.
                </h1>
                <p style="font-size:15px;color:#5a5a6e;line-height:1.7;margin-bottom:20px">
                    After reviewing your application, we're not able to approve your Brandbae profile at this time.
                    This is usually because of follower count, engagement level, or profile completeness — not the quality of your content.
                </p>
                <p style="font-size:15px;color:#5a5a6e;line-height:1.7;margin-bottom:28px">
                    You're welcome to reapply in the future as your account grows. If you think this was a mistake, just reply to this email and we'll take another look.
                </p>
                <p style="font-size:12px;color:#9696aa;line-height:1.6;border-top:1px solid #f0f0f4;padding-top:20px">
                    Brandbae — India's creator marketplace.<br/>
                    This email was sent regarding your application for @${app.instagram_handle}.
                </p>
            </div>`
        });
    }

    console.log(`[EMAIL] ${status} email sent to ${user.email} (@${app.instagram_handle})`);
}

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
app.get("/creator/:handle",   page("creator-profile.html"));

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
                     verified, barter, barter_note, user_id, photo_url)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
                 ON CONFLICT DO NOTHING`,
                [
                    app.niche, app.followers, 0, app.city,
                    0, 0, app.avg_reel_views || 0,
                    app.audience_age_group || "18-35", app.female_p || 50, app.male_p || 50, [app.city],
                    app.reel_price  || 0,
                    app.story_price || 0,
                    app.post_price  || 0,
                    true, app.barter, app.barter_note || null, app.user_id, app.photo_url || null,
                ]
            );
        }

        await client.query("COMMIT");
        console.log(`[ADMIN] Application #${app.id} (@${app.instagram_handle}) → ${status}`);

        // Fire email non-blocking — failure must never break the approval
        sendStatusEmail(app, status).catch(err =>
            console.error("[EMAIL] Status email failed:", err.message)
        );

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
    const { engagement, avg_likes, avg_comments, avg_reel_views, age_range, female_p, male_p, locations, followers, photo_url } = req.body;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { rowCount } = await client.query(
            `UPDATE creators SET
                engagement     = COALESCE($1, engagement),
                avg_likes      = COALESCE($2, avg_likes),
                avg_comments   = COALESCE($3, avg_comments),
                avg_reel_views = COALESCE($4, avg_reel_views),
                age_range      = COALESCE($5, age_range),
                female_p       = COALESCE($6, female_p),
                male_p         = COALESCE($7, male_p),
                locations      = COALESCE($8, locations),
                followers      = COALESCE($9, followers),
                photo_url      = COALESCE($10, photo_url)
             WHERE user_id = $11`,
            [
                engagement    != null ? parseFloat(engagement)   : null,
                avg_likes     != null ? parseInt(avg_likes)      : null,
                avg_comments  != null ? parseInt(avg_comments)   : null,
                avg_reel_views!= null ? parseInt(avg_reel_views) : null,
                age_range     || null,
                female_p      != null ? parseInt(female_p)       : null,
                male_p        != null ? parseInt(male_p)         : null,
                locations     ? locations.split(",").map(l => l.trim()).filter(Boolean) : null,
                followers     != null ? parseInt(followers)      : null,
                photo_url     || null,
                req.params.userId,
            ]
        );

        if (!rowCount) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Creator not found" });
        }

        // Sync followers and photo_url back to creator_applications
        await client.query(
            `UPDATE creator_applications SET
                followers = COALESCE($1, followers),
                photo_url = COALESCE($2, photo_url)
             WHERE user_id = $3`,
            [
                followers != null ? parseInt(followers) : null,
                photo_url || null,
                req.params.userId,
            ]
        );

        await client.query("COMMIT");
        console.log(`[ADMIN] Stats updated for user #${req.params.userId}`);
        res.json({ success: true });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("PATCH /api/admin/creator-stats error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
});

// ── ADMIN — delete user ──
app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("DELETE FROM creators             WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM creator_applications WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM users                WHERE id      = $1", [userId]);
        await client.query("COMMIT");
        console.log(`[ADMIN] User #${userId} deleted`);
        res.json({ success: true });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("DELETE /api/admin/users error:", err.message);
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
