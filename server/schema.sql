-- Mellow accounts: a nickname, a password and one cloud backup per user.
-- Apply: npx wrangler d1 execute mellow --remote --file=server/schema.sql

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,            -- random, never shown
    nick TEXT NOT NULL UNIQUE,      -- lower case, [a-z0-9_]{3,20}
    salt TEXT NOT NULL,             -- base64, random per user
    hash TEXT NOT NULL,             -- HMAC(pepper, salt + key derived on the device)
    recovery TEXT NOT NULL,         -- HMAC(pepper, recovery code)
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,            -- SHA-256 of the cookie token: a leaked table does not sign anyone in
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

-- The last backup and the one before it, gzip in base64. "day" and "saves" limit saves per day.
CREATE TABLE IF NOT EXISTS backups (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    saved_at INTEGER NOT NULL,
    size INTEGER NOT NULL,
    prev_data TEXT,
    prev_saved_at INTEGER,
    day TEXT NOT NULL,
    saves INTEGER NOT NULL
);

-- Counters for the whole service per day: they keep the free daily write limit safe from floods.
CREATE TABLE IF NOT EXISTS daily (
    day TEXT NOT NULL,
    kind TEXT NOT NULL,
    n INTEGER NOT NULL,
    PRIMARY KEY (day, kind)
);
