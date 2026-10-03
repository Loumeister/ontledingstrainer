CREATE TABLE students (
  id TEXT PRIMARY KEY,
  teacher_subject TEXT NOT NULL,
  name TEXT NOT NULL,
  initial TEXT NOT NULL DEFAULT '',
  class_label TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX students_teacher ON students(teacher_subject);
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  received_at TEXT NOT NULL,
  report_json TEXT NOT NULL
);
CREATE INDEX reports_received ON reports(received_at, id);
CREATE TABLE enrollment_codes (
  code_hash TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  expires_at INTEGER NOT NULL
);
CREATE TABLE student_sessions (
  token_hash TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  expires_at INTEGER NOT NULL
);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE login_challenges (
  token_hash TEXT PRIMARY KEY,
  nonce TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE rate_budgets (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
