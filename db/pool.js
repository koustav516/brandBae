const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
    console.error("Unexpected database pool error:", err.message);
});

async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS leads (
            id         SERIAL PRIMARY KEY,
            name       TEXT NOT NULL,
            phone      TEXT NOT NULL,
            city       TEXT NOT NULL,
            source     TEXT DEFAULT 'marketplace_unlock',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS creators (
            id             SERIAL PRIMARY KEY,
            niche          TEXT NOT NULL,
            followers      INTEGER NOT NULL,
            engagement     NUMERIC(4,1) NOT NULL,
            city           TEXT NOT NULL,
            avg_likes      INTEGER NOT NULL,
            avg_comments   INTEGER NOT NULL,
            avg_reel_views INTEGER NOT NULL,
            age_range      TEXT NOT NULL,
            female_p       INTEGER NOT NULL,
            male_p         INTEGER NOT NULL,
            locations      TEXT[] NOT NULL,
            reel_price     INTEGER NOT NULL DEFAULT 0,
            story_price    INTEGER NOT NULL DEFAULT 0,
            post_price     INTEGER NOT NULL DEFAULT 0,
            verified       BOOLEAN NOT NULL DEFAULT false,
            barter         BOOLEAN NOT NULL DEFAULT false,
            barter_note    TEXT,
            created_at     TIMESTAMPTZ DEFAULT NOW()
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id            SERIAL PRIMARY KEY,
            email         TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role          TEXT NOT NULL CHECK (role IN ('brand', 'creator', 'admin')),
            created_at    TIMESTAMPTZ DEFAULT NOW()
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS creator_applications (
            id                  SERIAL PRIMARY KEY,
            user_id             INTEGER REFERENCES users(id) ON DELETE CASCADE,
            full_name           TEXT NOT NULL,
            instagram_handle    TEXT NOT NULL,
            niche               TEXT NOT NULL,
            niche_subcategories TEXT,
            city                TEXT NOT NULL,
            state               TEXT,
            languages           TEXT,
            followers           INTEGER NOT NULL,
            avg_reel_views      INTEGER,
            account_age         TEXT,
            audience_age_group  TEXT,
            audience_gender     TEXT,
            top_locations       TEXT,
            reel_price          INTEGER,
            story_price         INTEGER,
            post_price          INTEGER,
            bundle_pricing      TEXT,
            min_deal_size       INTEGER,
            barter              BOOLEAN NOT NULL DEFAULT false,
            barter_note         TEXT,
            content_links       TEXT,
            past_collabs        TEXT,
            bio                 TEXT,
            status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            reviewed_at         TIMESTAMPTZ,
            created_at          TIMESTAMPTZ DEFAULT NOW()
        )
    `);

    const newCols = [
        "ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS state TEXT",
        "ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS languages TEXT",
        "ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS niche_subcategories TEXT",
        "ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS avg_reel_views INTEGER",
        "ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS account_age TEXT",
        "ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS audience_age_group TEXT",
        "ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS audience_gender TEXT",
        "ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS top_locations TEXT",
        "ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS bundle_pricing TEXT",
        "ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS min_deal_size INTEGER",
        "ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS content_links TEXT",
        "ALTER TABLE creator_applications ADD COLUMN IF NOT EXISTS past_collabs TEXT",
    ];
    for (const sql of newCols) await pool.query(sql);

    console.log("Database ready.");
}

module.exports = { pool, initDB };
