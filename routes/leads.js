const express = require("express");
const { pool } = require("../db/pool");

const router = express.Router();

// ── POST /api/leads ──
router.post("/", async (req, res) => {
    try {
        const { name, phone, city } = req.body;
        if (!name || !phone || !city) {
            return res.status(400).json({ error: "name, phone, and city are required" });
        }
        if (!/^\d{10}$/.test(phone.replace(/\s/g, ""))) {
            return res.status(400).json({ error: "Invalid phone number" });
        }
        const formattedPhone = "+91" + phone.trim().replace(/\s/g, "");
        const { rows } = await pool.query(
            `INSERT INTO leads (name, phone, city) VALUES ($1, $2, $3) RETURNING *`,
            [name.trim(), formattedPhone, city.trim()]
        );
        const lead = rows[0];
        console.log(`[${lead.created_at}] New lead: ${lead.name} | ${lead.phone} | ${lead.city}`);
        res.status(201).json({ success: true, lead });
    } catch (err) {
        console.error("POST /api/leads error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ── GET /api/leads ──
router.get("/", async (_req, res) => {
    try {
        const { rows } = await pool.query(`SELECT * FROM leads ORDER BY created_at DESC`);
        res.json({ total: rows.length, leads: rows });
    } catch (err) {
        console.error("GET /api/leads error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ── GET /api/leads/export ──
router.get("/export", async (_req, res) => {
    try {
        const { rows } = await pool.query(`SELECT * FROM leads ORDER BY created_at DESC`);
        const csv = [
            "ID,Name,Phone,City,Timestamp,Source",
            ...rows.map((l) => `${l.id},"${l.name}",${l.phone},"${l.city}",${l.created_at},${l.source}`),
        ].join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="brandbae_leads.csv"');
        res.send(csv);
    } catch (err) {
        console.error("GET /api/leads/export error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
