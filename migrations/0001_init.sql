-- HostTracker D1 şeması (SQLite)

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  project_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  hosting_company TEXT NOT NULL DEFAULT '',
  expiration_date TEXT NOT NULL,              -- YYYY-MM-DD
  status TEXT NOT NULL DEFAULT 'borc'
    CHECK (status IN ('odendi', 'iptal', 'durduruldu', 'borc', 'ertelendi')),
  price REAL,
  last_paid_amount REAL,
  slack_notified_at TEXT,                     -- ISO 8601
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_expiration ON projects (expiration_date);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
