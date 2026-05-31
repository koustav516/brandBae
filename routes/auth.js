const express = require("express");
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");
const crypto  = require("crypto");
const { Resend } = require("resend");
const { pool, generateUserId } = require("../db/pool");

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const router = express.Router();
const JWT_SECRET  = process.env.JWT_SECRET || "brandbae-dev-secret-change-in-prod";
const IS_PROD     = process.env.NODE_ENV === "production" || !!process.env.RAILWAY_ENVIRONMENT;
const COOKIE_BASE = `HttpOnly; Path=/; SameSite=Lax${IS_PROD ? "; Secure" : ""}`;

function requireAuth(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}

function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
        next();
    });
}

// ── CREATOR REGISTER ──
router.post("/creator/register", async (req, res) => {
    const {
        email, password, full_name, instagram_handle, phone,
        niche, niche_subcategories, city, state, languages,
        followers, avg_reel_views, account_age,
        audience_age_group, female_p, male_p, top_locations,
        reel_price, story_price, post_price, bundle_pricing, min_deal_size,
        barter, barter_note,
        content_links, past_collabs, bio, photo_url,
    } = req.body;

    if (!email || !password || !full_name || !instagram_handle || !niche || !city || !followers) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase().trim()]);
        if (existing.rows.length) return res.status(409).json({ error: "An account with this email already exists." });

        const handleTaken = await pool.query(
            "SELECT id FROM creator_applications WHERE LOWER(instagram_handle) = LOWER($1)",
            [instagram_handle.trim()]
        );
        if (handleTaken.rows.length) return res.status(409).json({ error: "This Instagram handle is already registered on Brandbae." });

        const password_hash = await bcrypt.hash(password, 12);
        const userId = await generateUserId();

        const { rows: [user] } = await pool.query(
            `INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, 'creator') RETURNING id`,
            [userId, email.toLowerCase().trim(), password_hash]
        );

        await pool.query(
            `INSERT INTO creator_applications
             (user_id, full_name, instagram_handle, phone,
              niche, niche_subcategories, city, state, languages,
              followers, avg_reel_views, account_age,
              audience_age_group, female_p, male_p, top_locations,
              reel_price, story_price, post_price, bundle_pricing, min_deal_size,
              barter, barter_note,
              content_links, past_collabs, bio, photo_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)`,
            [
                user.id, full_name, instagram_handle, phone || null,
                niche, niche_subcategories || null, city, state || null, languages || null,
                parseInt(followers), avg_reel_views ? parseInt(avg_reel_views) : null, account_age || null,
                audience_age_group || null,
                female_p != null ? parseInt(female_p) : null,
                male_p   != null ? parseInt(male_p)   : null,
                top_locations || null,
                reel_price || 0, story_price || 0, post_price || 0, bundle_pricing || null,
                min_deal_size ? parseInt(min_deal_size) : null,
                barter || false, barter_note || null,
                content_links || null, past_collabs || null, bio || null, photo_url || null,
            ]
        );

        console.log(`[NEW APPLICATION] ${full_name} (@${instagram_handle}) — ${niche} · ${city}, ${state || "India"}`);

        // Application confirmation email — non-blocking
        if (resend) {
            const firstName  = full_name.split(" ")[0];
            const base       = process.env.BASE_URL || "https://www.brandbae.co.in";
            const FROM       = process.env.RESEND_FROM || "Brandbae <noreply@brandbae.co.in>";
            resend.emails.send({
                from: FROM, to: email.toLowerCase().trim(),
                replyTo: "adminbrandbae@gmail.com",
                subject: `We got your application, ${firstName} 🙌`,
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

                        <h1 style="margin:0 0 6px;font-size:28px;font-weight:800;letter-spacing:-0.6px;color:#111118;line-height:1.2">
                          Got it, ${firstName}. 🙌
                        </h1>
                        <p style="margin:0 0 24px;font-size:16px;font-weight:600;color:#3B5BDB;letter-spacing:-0.2px">
                          Your application is in — we'll review it within 48 hours.
                        </p>

                        <p style="margin:0 0 24px;font-size:15px;color:#3a3a4a;line-height:1.75">
                          Thanks for applying to Brandbae, ${firstName}. We've received your application for
                          <strong style="color:#111118">@${instagram_handle}</strong> and our team will review it shortly.
                          We're building something that truly works for creators, and we're glad you want to be part of it.
                        </p>

                        <!-- SUBMITTED DETAILS -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8ff;border:1px solid #e0e4f8;border-radius:12px;margin-bottom:28px">
                          <tr><td style="padding:16px 20px 10px">
                            <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#9696aa;margin-bottom:14px">Your application</div>
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="font-size:13px;color:#9696aa;padding-bottom:8px;width:40%">Instagram</td>
                                <td style="font-size:13px;font-weight:600;color:#111118;padding-bottom:8px">@${instagram_handle}</td>
                              </tr>
                              <tr>
                                <td style="font-size:13px;color:#9696aa;padding-bottom:8px">Niche</td>
                                <td style="font-size:13px;font-weight:600;color:#111118;padding-bottom:8px">${niche}</td>
                              </tr>
                              <tr>
                                <td style="font-size:13px;color:#9696aa;padding-bottom:8px">Location</td>
                                <td style="font-size:13px;font-weight:600;color:#111118;padding-bottom:8px">${city}${state ? ", " + state : ""}</td>
                              </tr>
                              <tr>
                                <td style="font-size:13px;color:#9696aa">Status</td>
                                <td style="padding-bottom:4px">
                                  <span style="display:inline-block;background:#fef9ee;border:1px solid #fde68a;color:#92400e;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px">Under Review</span>
                                </td>
                              </tr>
                            </table>
                          </td></tr>
                        </table>

                        <!-- WHAT NEXT -->
                        <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#9696aa">What happens now</p>
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
                          <tr><td style="padding:10px 0;border-top:1px solid #f0f0f4">
                            <table cellpadding="0" cellspacing="0"><tr>
                              <td style="padding-right:14px;vertical-align:top;padding-top:2px"><div style="width:6px;height:6px;background:#3B5BDB;border-radius:50%;margin-top:6px"></div></td>
                              <td style="font-size:14px;color:#3a3a4a;line-height:1.65">Our team reviews your profile — usually within <strong>48 hours</strong></td>
                            </tr></table>
                          </td></tr>
                          <tr><td style="padding:10px 0;border-top:1px solid #f0f0f4">
                            <table cellpadding="0" cellspacing="0"><tr>
                              <td style="padding-right:14px;vertical-align:top;padding-top:2px"><div style="width:6px;height:6px;background:#3B5BDB;border-radius:50%;margin-top:6px"></div></td>
                              <td style="font-size:14px;color:#3a3a4a;line-height:1.65">If approved, you'll get another email and your profile goes live immediately</td>
                            </tr></table>
                          </td></tr>
                          <tr><td style="padding:10px 0;border-top:1px solid #f0f0f4;border-bottom:1px solid #f0f0f4">
                            <table cellpadding="0" cellspacing="0"><tr>
                              <td style="padding-right:14px;vertical-align:top;padding-top:2px"><div style="width:6px;height:6px;background:#3B5BDB;border-radius:50%;margin-top:6px"></div></td>
                              <td style="font-size:14px;color:#3a3a4a;line-height:1.65">Brands can then discover you and reach out directly through the platform</td>
                            </tr></table>
                          </td></tr>
                        </table>

                        <p style="margin:0 0 4px;font-size:15px;color:#3a3a4a;line-height:1.75">
                          If you have any questions in the meantime, just hit reply.
                        </p>
                        <p style="margin:0 0 24px;font-size:15px;color:#3a3a4a">Warm regards,</p>

                        <!-- SIGNATURE -->
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-right:14px;vertical-align:middle">
                              <div style="width:44px;height:44px;background:#111118;border-radius:50%;text-align:center;line-height:44px;font-size:16px;font-weight:800;color:#fff">K</div>
                            </td>
                            <td style="vertical-align:middle">
                              <div style="font-size:14px;font-weight:700;color:#111118;margin-bottom:2px">Koustav Majumder</div>
                              <div style="font-size:12px;color:#9696aa">Co-Founder, Brandbae · <a href="${base}" style="color:#3B5BDB;text-decoration:none">brandbae.co.in</a></div>
                            </td>
                          </tr>
                        </table>

                      </td></tr>

                      <!-- FOOTER -->
                      <tr><td style="padding:24px 4px 0;text-align:center">
                        <p style="margin:0;font-size:12px;color:#b0b0c0;line-height:1.6">
                          You received this because you applied to Brandbae as @${instagram_handle}.<br/>
                          <a href="${base}" style="color:#9696aa;text-decoration:none">brandbae.co.in</a>
                        </p>
                      </td></tr>

                    </table>
                  </td></tr>
                </table>
                </body></html>`
            }).catch(err => console.error("[EMAIL] Application confirmation failed:", err.message));
        }

        res.status(201).json({ success: true, message: "Application submitted. We'll review it within 48 hours." });
    } catch (err) {
        console.error("POST /auth/creator/register error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ── CREATOR LOGIN ──
router.post("/creator/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    try {
        const { rows } = await pool.query(
            `SELECT u.id, u.email, u.password_hash, u.role, ca.status, ca.full_name
             FROM users u
             LEFT JOIN creator_applications ca ON ca.user_id = u.id
             WHERE u.email = $1 AND u.role = 'creator'`,
            [email.toLowerCase().trim()]
        );

        if (!rows.length) return res.status(401).json({ error: "Invalid email or password" });

        const user  = rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: "Invalid email or password" });

        if (user.status === "pending") {
            return res.status(403).json({ error: "Your application is still under review. We'll notify you once approved." });
        }
        if (user.status === "rejected") {
            return res.status(403).json({ error: "Your application was not approved. Contact support for more details." });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: "creator", name: user.full_name },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.setHeader("Set-Cookie", `token=${token}; ${COOKIE_BASE}; Max-Age=604800`);
        res.json({ success: true, name: user.full_name });
    } catch (err) {
        console.error("POST /auth/creator/login error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ── ADMIN LOGIN ──
router.post("/admin/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    try {
        const { rows } = await pool.query(
            `SELECT id, email, password_hash, role FROM users WHERE email = $1 AND role = 'admin'`,
            [email.toLowerCase().trim()]
        );

        if (!rows.length) return res.status(401).json({ error: "Invalid email or password" });

        const user  = rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: "Invalid email or password" });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: "admin" },
            JWT_SECRET,
            { expiresIn: "12h" }
        );

        res.setHeader("Set-Cookie", `token=${token}; ${COOKIE_BASE}; Max-Age=43200`);
        res.json({ success: true });
    } catch (err) {
        console.error("POST /auth/admin/login error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ── FORGOT PASSWORD ──
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
        const { rows } = await pool.query(
            `SELECT id FROM users WHERE email = $1 AND role = 'creator'`,
            [email.toLowerCase().trim()]
        );

        // Always return success to avoid leaking which emails are registered
        if (!rows.length) return res.json({ success: true });

        const token   = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await pool.query(
            `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
            [token, expires, rows[0].id]
        );

        const base     = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const resetUrl = `${base}/reset-password?token=${token}`;

        if (!resend) {
            console.warn("[RESET] RESEND_API_KEY not set — email not sent, token:", token);
            return res.json({ success: true });
        }
        await resend.emails.send({
            from:    process.env.RESEND_FROM || "Brandbae <noreply@brandbae.co.in>",
            to:      email.toLowerCase().trim(),
            subject: "Reset your Brandbae password",
            html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#0F0F12;">
                    <div style="font-size:20px;font-weight:800;margin-bottom:24px;">Brand<span style="color:#3B5BDB;">bae</span></div>
                    <h2 style="font-size:22px;font-weight:700;margin-bottom:8px;">Reset your password</h2>
                    <p style="color:#5A5A72;font-size:14px;line-height:1.6;margin-bottom:28px;">
                        We received a request to reset your Brandbae creator account password.
                        Click the button below — this link expires in <strong>1 hour</strong>.
                    </p>
                    <a href="${resetUrl}" style="display:inline-block;background:#0F0F12;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 28px;border-radius:10px;">
                        Reset password →
                    </a>
                    <p style="color:#9898AA;font-size:12px;margin-top:28px;line-height:1.6;">
                        If you didn't request this, you can safely ignore this email.<br/>
                        This link will expire in 1 hour.
                    </p>
                </div>
            `,
        });

        console.log(`[RESET] Password reset requested for ${email}`);
        res.json({ success: true });
    } catch (err) {
        console.error("POST /auth/forgot-password error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ── RESET PASSWORD ──
router.post("/reset-password", async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Token and password required" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    try {
        const { rows } = await pool.query(
            `SELECT id FROM users
             WHERE reset_token = $1
               AND reset_token_expires > NOW()
               AND role = 'creator'`,
            [token]
        );

        if (!rows.length) return res.status(400).json({ error: "This reset link is invalid or has expired." });

        const password_hash = await bcrypt.hash(password, 12);

        await pool.query(
            `UPDATE users
             SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
             WHERE id = $2`,
            [password_hash, rows[0].id]
        );

        console.log(`[RESET] Password reset completed for user #${rows[0].id}`);
        res.json({ success: true });
    } catch (err) {
        console.error("POST /auth/reset-password error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ── LOGOUT ──
router.post("/logout", (_req, res) => {
    res.setHeader("Set-Cookie", `token=; ${COOKIE_BASE}; Max-Age=0`);
    res.json({ success: true });
});

// ── ME ──
router.get("/me", requireAuth, (req, res) => {
    res.json({ id: req.user.id, email: req.user.email, role: req.user.role, name: req.user.name });
});

module.exports = { router, requireAuth, requireAdmin };
