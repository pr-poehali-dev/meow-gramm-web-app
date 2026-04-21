"""
Аутентификация: регистрация и вход в Мяу Грамм.
POST /register — создать аккаунт
POST /login — войти
POST /logout — выйти
GET / — получить текущего пользователя по токену
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ["MAIN_DB_SCHEMA"]
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

AVATARS = ["🐱", "🐯", "🦁", "🐻", "🦊", "🐼", "🐸", "🐧", "🦋", "🦄"]


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(pwd: str) -> str:
    return hashlib.sha256(pwd.encode()).hexdigest()


def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.username, u.display_name, u.avatar, u.role, u.status "
        f"FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = '{token}'",
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "username": row[1], "display_name": row[2], "avatar": row[3], "role": row[4], "status": row[5]}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/").rstrip("/")
    token = event.get("headers", {}).get("X-Auth-Token", "")

    conn = get_conn()

    # GET / — текущий пользователь
    if method == "GET":
        if not token:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
        user = get_user_by_token(conn, token)
        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Токен недействителен"})}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(user)}

    body = json.loads(event.get("body") or "{}")

    # POST /register
    if method == "POST" and path.endswith("register"):
        username = (body.get("username") or "").strip().lower()
        display_name = (body.get("display_name") or "").strip()
        password = body.get("password") or ""
        avatar = body.get("avatar") or AVATARS[0]

        if not username or not display_name or not password:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполни все поля"})}
        if len(username) < 3:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Логин минимум 3 символа"})}
        if len(password) < 4:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Пароль минимум 4 символа"})}

        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE username = '{username}'")
        if cur.fetchone():
            return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Такой логин уже занят"})}

        pwd_hash = hash_password(password)
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (username, display_name, avatar, password_hash) "
            f"VALUES ('{username}', '{display_name}', '{avatar}', '{pwd_hash}') RETURNING id"
        )
        user_id = cur.fetchone()[0]

        tok = secrets.token_hex(32)
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES ({user_id}, '{tok}')")
        conn.commit()

        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "token": tok,
            "user": {"id": user_id, "username": username, "display_name": display_name, "avatar": avatar, "role": "user", "status": "offline"}
        })}

    # POST /login
    if method == "POST" and path.endswith("login"):
        username = (body.get("username") or "").strip().lower()
        password = body.get("password") or ""

        if not username or not password:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Введи логин и пароль"})}

        pwd_hash = hash_password(password)
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, username, display_name, avatar, role FROM {SCHEMA}.users "
            f"WHERE username = '{username}' AND password_hash = '{pwd_hash}'"
        )
        row = cur.fetchone()
        if not row:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный логин или пароль"})}

        user_id, uname, dname, avatar, role = row
        cur.execute(f"UPDATE {SCHEMA}.users SET status = 'online', last_seen = NOW() WHERE id = {user_id}")

        tok = secrets.token_hex(32)
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES ({user_id}, '{tok}')")
        conn.commit()

        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "token": tok,
            "user": {"id": user_id, "username": uname, "display_name": dname, "avatar": avatar, "role": role, "status": "online"}
        })}

    # POST /logout
    if method == "POST" and path.endswith("logout"):
        if token:
            cur = conn.cursor()
            cur.execute(f"SELECT s.user_id FROM {SCHEMA}.sessions s WHERE s.token = '{token}'")
            row = cur.fetchone()
            if row:
                cur.execute(f"UPDATE {SCHEMA}.users SET status = 'offline' WHERE id = {row[0]}")
            cur.execute(f"DELETE FROM {SCHEMA}.sessions WHERE token = '{token}'")
            conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Не найдено"})}
