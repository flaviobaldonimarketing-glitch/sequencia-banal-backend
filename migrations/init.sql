PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS collaborators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  password TEXT
);

CREATE TABLE IF NOT EXISTS registers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collaborator_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  break_duration INTEGER DEFAULT 0,
  deploys INTEGER DEFAULT 0,
  collects INTEGER DEFAULT 0,
  km_start REAL DEFAULT 0,
  km_end REAL DEFAULT 0,
  observations TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) ON DELETE CASCADE
);
