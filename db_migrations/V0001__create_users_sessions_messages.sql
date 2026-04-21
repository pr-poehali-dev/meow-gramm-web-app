
CREATE TABLE IF NOT EXISTS t_p89610145_meow_gramm_web_app.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar VARCHAR(10) DEFAULT '🐱',
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p89610145_meow_gramm_web_app.sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p89610145_meow_gramm_web_app.users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p89610145_meow_gramm_web_app.messages (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER REFERENCES t_p89610145_meow_gramm_web_app.users(id),
    to_user_id INTEGER REFERENCES t_p89610145_meow_gramm_web_app.users(id),
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_from ON t_p89610145_meow_gramm_web_app.messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to ON t_p89610145_meow_gramm_web_app.messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON t_p89610145_meow_gramm_web_app.sessions(token);
