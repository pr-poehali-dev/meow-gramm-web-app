"""
Сообщения Мяу Грамм.
GET /  — список чатов (собеседники) текущего пользователя
GET /?with=USER_ID — история переписки с пользователем
POST / — отправить сообщение
POST /read — отметить сообщения прочитанными
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

    token = event.get("headers", {}).get("X-Auth-Token", "")
    method = event.get("httpMethod", "GET")
    path = event.get("path", "/").rstrip("/")
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    me = get_user_by_token(conn, token)
    if not me:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    # Проверяем, не заблокирован ли текущий пользователь
    cur0 = conn.cursor()
    cur0.execute(f"SELECT is_blocked FROM {SCHEMA}.users WHERE id = {me['id']}")
    row0 = cur0.fetchone()
    if row0 and row0[0]:
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Аккаунт заблокирован"})}

    my_id = me["id"]
    cur = conn.cursor()

    # GET /?with=ID — история переписки
    if method == "GET" and "with" in params:
        other_id = int(params["with"])
        cur.execute(
            f"SELECT id, from_user_id, to_user_id, text, is_read, "
            f"to_char(created_at, 'HH24:MI') as time "
            f"FROM {SCHEMA}.messages "
            f"WHERE (from_user_id = {my_id} AND to_user_id = {other_id}) "
            f"   OR (from_user_id = {other_id} AND to_user_id = {my_id}) "
            f"ORDER BY created_at ASC"
        )
        rows = cur.fetchall()
        msgs = [{"id": r[0], "from": r[1], "to": r[2], "text": r[3], "read": r[4], "time": r[5]} for r in rows]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(msgs)}

    # GET / — список чатов
    if method == "GET":
        cur.execute(
            f"SELECT DISTINCT CASE WHEN from_user_id = {my_id} THEN to_user_id ELSE from_user_id END as other_id "
            f"FROM {SCHEMA}.messages "
            f"WHERE from_user_id = {my_id} OR to_user_id = {my_id}"
        )
        other_ids = [r[0] for r in cur.fetchall()]

        chats = []
        for oid in other_ids:
            cur.execute(
                f"SELECT u.id, u.username, u.display_name, u.avatar, u.status, u.last_seen "
                f"FROM {SCHEMA}.users u WHERE u.id = {oid}"
            )
            u = cur.fetchone()
            if not u:
                continue
            cur.execute(
                f"SELECT text, to_char(created_at, 'HH24:MI') "
                f"FROM {SCHEMA}.messages "
                f"WHERE (from_user_id = {my_id} AND to_user_id = {oid}) "
                f"   OR (from_user_id = {oid} AND to_user_id = {my_id}) "
                f"ORDER BY created_at DESC LIMIT 1"
            )
            last = cur.fetchone()
            cur.execute(
                f"SELECT COUNT(*) FROM {SCHEMA}.messages "
                f"WHERE from_user_id = {oid} AND to_user_id = {my_id} AND is_read = FALSE"
            )
            unread = cur.fetchone()[0]
            chats.append({
                "user": {"id": u[0], "username": u[1], "display_name": u[2], "avatar": u[3], "status": u[4]},
                "last_message": {"text": last[0], "time": last[1]} if last else None,
                "unread": unread,
            })
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(chats)}

    body = json.loads(event.get("body") or "{}")

    # POST / — отправить сообщение
    if method == "POST" and not path.endswith("read"):
        to_id = body.get("to_user_id")
        text = (body.get("text") or "").strip()
        if not to_id or not text:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажи получателя и текст"})}

        safe_text = text.replace("'", "''")
        cur.execute(
            f"INSERT INTO {SCHEMA}.messages (from_user_id, to_user_id, text) "
            f"VALUES ({my_id}, {int(to_id)}, '{safe_text}') "
            f"RETURNING id, to_char(created_at, 'HH24:MI')"
        )
        row = cur.fetchone()
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "id": row[0], "from": my_id, "to": int(to_id), "text": text, "read": False, "time": row[1]
        })}

    # POST /read — пометить как прочитанные
    if method == "POST" and path.endswith("read"):
        from_id = body.get("from_user_id")
        if from_id:
            cur.execute(
                f"UPDATE {SCHEMA}.messages SET is_read = TRUE "
                f"WHERE from_user_id = {int(from_id)} AND to_user_id = {my_id} AND is_read = FALSE"
            )
            conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Не найдено"})}