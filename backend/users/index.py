"""
Пользователи Мяу Грамм.
GET / — список всех пользователей (кроме себя)
GET /?admin=1 — список для панели администратора (все пользователи + статистика)
POST /block — заблокировать / разблокировать пользователя (только admin)
"""
import json
import os
import psycopg2

SCHEMA = os.environ["MAIN_DB_SCHEMA"]
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.username, u.display_name, u.avatar, u.role, u.status "
        f"FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = '{token}'"
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
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    me = get_user_by_token(conn, token)
    if not me:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    cur = conn.cursor()

    # POST /block — заблокировать / разблокировать (только admin)
    if method == "POST" and path.endswith("block"):
        if me["role"] != "admin":
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет прав"})}
        body = json.loads(event.get("body") or "{}")
        target_id = body.get("user_id")
        blocked = body.get("blocked", True)
        if not target_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажи user_id"})}
        cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = {int(target_id)}")
        row = cur.fetchone()
        if not row:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}
        if row[0] == "admin":
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нельзя заблокировать администратора"})}
        cur.execute(
            f"UPDATE {SCHEMA}.users SET is_blocked = {bool(blocked)} WHERE id = {int(target_id)}"
        )
        # Удаляем все сессии заблокированного
        if blocked:
            cur.execute(f"UPDATE {SCHEMA}.users SET status = 'offline' WHERE id = {int(target_id)}")
            cur.execute(f"DELETE FROM {SCHEMA}.sessions WHERE user_id = {int(target_id)}")
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "blocked": bool(blocked)})}

    # Список всех пользователей (для поиска/начала чата)
    cur.execute(
        f"SELECT id, username, display_name, avatar, role, status, "
        f"to_char(last_seen, 'HH24:MI') as last_seen, is_blocked "
        f"FROM {SCHEMA}.users ORDER BY display_name"
    )
    rows = cur.fetchall()
    users = []
    for r in rows:
        uid = r[0]
        is_blocked = r[7]
        # В обычном списке: не показываем себя и заблокированных
        if params.get("admin") != "1":
            if uid == me["id"] or is_blocked:
                continue
        unread = 0
        msg_count = 0
        if params.get("admin") == "1":
            cur2 = conn.cursor()
            cur2.execute(f"SELECT COUNT(*) FROM {SCHEMA}.messages WHERE to_user_id = {uid} AND is_read = FALSE")
            unread = cur2.fetchone()[0]
            cur2.execute(f"SELECT COUNT(*) FROM {SCHEMA}.messages WHERE from_user_id = {uid} OR to_user_id = {uid}")
            msg_count = cur2.fetchone()[0]
        users.append({
            "id": uid,
            "username": r[1],
            "display_name": r[2],
            "avatar": r[3],
            "role": r[4],
            "status": r[5],
            "last_seen": r[6],
            "is_blocked": is_blocked,
            "unread": unread,
            "message_count": msg_count,
        })

    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"users": users, "me": me})}