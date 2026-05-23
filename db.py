
"""
db.py

这个文件只负责一件事：连接 MySQL，并提供几个最基础的查询函数。
项目要求不用 ORM，所以这里直接使用 pymysql 写 SQL。
"""

# os 用来读取环境变量，例如 MYSQL_HOST、MYSQL_USER。
# import os
# from urllib.parse import urlparse

# # pymysql 是 Python 连接 MySQL 的第三方库，本项目不用 ORM。
# import pymysql


import os
from urllib.parse import urlparse
from dotenv import load_dotenv  # ← 加这行

load_dotenv()  # ← 加这行，放在所有 os.getenv 之前

import pymysql

MYSQL_URL = os.getenv("MYSQL_URL") or os.getenv("DATABASE_URL")

if MYSQL_URL:
    parsed = urlparse(MYSQL_URL)
    # DB_CONFIG = {
    #     "host": parsed.hostname or "127.0.0.1",
    #     "port": parsed.port or 3306,
    #     "user": parsed.username or "root",
    #     "password": parsed.password or "",
    #     "database": parsed.path.lstrip("/") or "korean_learn",
    # }
    DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST") or os.getenv("MYSQLHOST", "127.0.0.1"),
    "port": int(os.getenv("MYSQL_PORT") or os.getenv("MYSQLPORT", 3306)),
    "user": os.getenv("MYSQL_USER") or os.getenv("MYSQLUSER", "root"),
    "password": os.getenv("MYSQL_PASSWORD") or os.getenv("MYSQLPASSWORD", ""),
    "database": os.getenv("MYSQL_DATABASE") or os.getenv("MYSQLDATABASE", "korean_learn"),
        }
else:
    # 从环境变量读取数据库配置；如果没有设置，就使用本机常见默认值。
    # Railway MySQL 会提供 MYSQLHOST、MYSQLPORT 等变量；本地开发使用 MYSQL_HOST、MYSQL_PORT。
    DB_CONFIG = {
        # 数据库用户名，默认 root。
        "user": os.getenv("MYSQL_USER") or os.getenv("MYSQLUSER", "root"),
        # 数据库密码，默认空字符串；如果本机 MySQL 有密码，需要设置环境变量。
        "password": os.getenv("MYSQL_PASSWORD") or os.getenv("MYSQLPASSWORD", ""),
        # 要连接的数据库名称，对应 sql/schema.sql 里创建的 korean_learn。
        "database": os.getenv("MYSQL_DATABASE") or os.getenv("MYSQLDATABASE", "korean_learn"),
    }

DB_CONFIG.update({
    # utf8mb4 可以同时保存中文、韩文、emoji 等字符。
    "charset": "utf8mb4",
    # DictCursor 会把查询结果变成字典，例如 row["korean"]，比 tuple 更适合返回 JSON。
    "cursorclass": pymysql.cursors.DictCursor,
    # autocommit=True 表示 INSERT/UPDATE/DELETE 后自动提交，不需要每次手动 commit。
    "autocommit": True,
})

MYSQL_SOCKET = os.getenv("MYSQL_SOCKET")

if MYSQL_SOCKET:
    # macOS 官方安装版 MySQL 可能只开启 socket，不监听 3306 端口。
    DB_CONFIG["unix_socket"] = MYSQL_SOCKET
elif not MYSQL_URL:
    # 数据库服务器地址，默认连接本机。
    DB_CONFIG["host"] = os.getenv("MYSQL_HOST") or os.getenv("MYSQLHOST", "127.0.0.1")
    # 数据库端口，MySQL 默认是 3306；环境变量读出来是字符串，所以要转成 int。
    DB_CONFIG["port"] = int(os.getenv("MYSQL_PORT") or os.getenv("MYSQLPORT", "3306"))


def get_connection():
    """创建并返回一个新的 MySQL 连接。"""
    # 每次调用都新建连接；小项目这样最容易理解。
    return pymysql.connect(**DB_CONFIG)


def fetch_all(sql, params=None):
    """执行 SELECT 查询，返回多行结果。"""
    # with 会在代码块结束时自动关闭连接。
    with get_connection() as conn:
        # cursor 是真正执行 SQL 的对象。
        with conn.cursor() as cursor:
            # execute 的第二个参数用于安全传值，避免自己拼接 SQL。
            cursor.execute(sql, params or ())
            # fetchall 读取全部查询结果。
            return cursor.fetchall()


def fetch_one(sql, params=None):
    """执行 SELECT 查询，返回一行结果；没有数据时返回 None。"""
    # 查询单条数据时也先建立连接。
    with get_connection() as conn:
        # 创建游标。
        with conn.cursor() as cursor:
            # 执行 SQL。
            cursor.execute(sql, params or ())
            # fetchone 只读取第一行。
            return cursor.fetchone()


def execute(sql, params=None):
    """执行 INSERT/UPDATE/DELETE，返回最后插入的自增 id。"""
    # autocommit=True 已经在 DB_CONFIG 中设置，所以执行后会自动提交。
    with get_connection() as conn:
        # 创建游标。
        with conn.cursor() as cursor:
            # 执行写入类 SQL。
            cursor.execute(sql, params or ())
            # INSERT 时 lastrowid 是新记录 id；UPDATE/DELETE 时通常用不到。
            return cursor.lastrowid
