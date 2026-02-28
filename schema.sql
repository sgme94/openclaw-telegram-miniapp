-- Project State Management Database Schema
-- Event-Driven Alternative to Kanban

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',  -- active, blocked, completed, paused
  current_phase TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_update DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events table (captures all project activity)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,  -- progress, blocker, decision, pivot, standup
  description TEXT NOT NULL,
  context TEXT,  -- additional context, decisions, reasoning
  metadata TEXT,  -- JSON metadata (commits, links, etc.)
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Blockers table (tracks open and resolved blockers)
CREATE TABLE IF NOT EXISTS blockers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  blocker_text TEXT NOT NULL,
  status TEXT DEFAULT 'open',  -- open, resolved
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  resolved_by TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Git commits integration
CREATE TABLE IF NOT EXISTS commits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  commit_hash TEXT NOT NULL,
  commit_message TEXT NOT NULL,
  author TEXT,
  committed_at DATETIME,
  linked_event_id INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (linked_event_id) REFERENCES events(id)
);

-- Daily standup summaries
CREATE TABLE IF NOT EXISTS standups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  projects_covered INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  commits_count INTEGER DEFAULT 0,
  blockers_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_blockers_project ON blockers(project_id);
CREATE INDEX IF NOT EXISTS idx_blockers_status ON blockers(status);
CREATE INDEX IF NOT EXISTS idx_commits_project ON commits(project_id);
CREATE INDEX IF NOT EXISTS idx_standups_date ON standups(date);
