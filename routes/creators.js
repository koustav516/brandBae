const express = require("express");
const { pool } = require("../db/pool");
const { requireAuth } = require("./auth");

const router = express.Router();

// ── GET /api/creators ──
router.get("/", async (_req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT id, niche, followers, engagement, city,
                avg_likes      AS "avgLikes",
                avg_comments   AS "avgComments",
                avg_reel_views AS "avgReelViews",
                age_range      AS "ageRange",
                female_p       AS "femaleP",
                male_p         AS "maleP",
                locations,
                reel_price     AS "reelPrice",
                story_price    AS "storyPrice",
                post_price     AS "postPrice",
                verified, barter,
                barter_note    AS "barterNote"
            FROM creators ORDER BY id
        `);
        res.json(rows);
    } catch (err) {
        console.error("GET /api/creators error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ── GET /api/creator/me ──
router.get("/me", requireAuth, async (req, res) => {
    if (req.user.role !== "creator") return res.status(403).json({ error: "Forbidden" });
    try {
        const { rows: [profile] } = await pool.query(
            `SELECT ca.*, u.email
             FROM creator_applications ca
             JOIN users u ON u.id = ca.user_id
             WHERE ca.user_id = $1`,
            [req.user.id]
        );
        if (!profile) return res.status(404).json({ error: "Profile not found" });
        res.json(profile);
    } catch (err) {
        console.error("GET /api/creator/me error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
