CREATE INDEX enrollment_codes_student ON enrollment_codes(student_id);
CREATE INDEX enrollment_codes_expiry ON enrollment_codes(expires_at);
CREATE INDEX student_sessions_student ON student_sessions(student_id);
CREATE INDEX student_sessions_expiry ON student_sessions(expires_at);
CREATE INDEX login_challenges_expiry ON login_challenges(expires_at);
CREATE INDEX rate_budgets_expiry ON rate_budgets(expires_at);
CREATE INDEX reports_student_received ON reports(student_id, received_at, id);
