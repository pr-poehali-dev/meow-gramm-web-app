
ALTER TABLE t_p89610145_meow_gramm_web_app.users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

INSERT INTO t_p89610145_meow_gramm_web_app.users (username, display_name, avatar, password_hash, role)
VALUES (
  'admin',
  'Администратор',
  '🛡️',
  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
  'admin'
)
ON CONFLICT (username) DO UPDATE SET
  role = 'admin',
  password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
