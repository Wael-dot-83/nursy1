"""
Migration: add password reset tracking tables and columns.
Uses SQLAlchemy metadata to remain portable across SQLite and MySQL.
"""
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    MetaData,
    String,
    Text,
    Index,
    Table,
    inspect,
    text,
)
from sqlalchemy.engine import Engine

from app.database import engine


metadata = MetaData()

password_reset_otps = Table(
    "password_reset_otps",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("phone", String(15), nullable=False),
    Column("otp_hash", String(255), nullable=False),
    Column("expires_at", DateTime, nullable=False),
    Column("attempts", Integer, nullable=False, server_default=text("0")),
    Column("used", Boolean, nullable=False, server_default=text("0")),
    Column("created_at", DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")),
    Index("idx_password_reset_otps_phone", "phone"),
    Index("idx_password_reset_otps_expires", "expires_at"),
    Index("idx_password_reset_otps_used", "used"),
)

password_reset_attempts = Table(
    "password_reset_attempts",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("phone", String(15), nullable=False),
    Column("ip_address", String(45), nullable=False),
    Column("user_agent", Text, nullable=True),
    Column("success", Boolean, nullable=False, server_default=text("0")),
    Column("failure_reason", String(200), nullable=True),
    Column("attempted_at", DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")),
    Index("idx_password_reset_attempts_phone", "phone", "attempted_at"),
    Index("idx_password_reset_attempts_ip", "ip_address", "attempted_at"),
)


def _column_exists(engine: Engine, table_name: str, column_name: str) -> bool:
    inspector = inspect(engine)
    for column in inspector.get_columns(table_name):
        if column["name"] == column_name:
            return True
    return False


def add_user_columns(engine: Engine) -> None:
    statements = []
    if not _column_exists(engine, "users", "last_password_reset"):
        statements.append("ALTER TABLE users ADD COLUMN last_password_reset DATETIME")
    if not _column_exists(engine, "users", "password_reset_count"):
        statements.append(
            "ALTER TABLE users ADD COLUMN password_reset_count INTEGER DEFAULT 0"
        )

    if not statements:
        return

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))


def run() -> None:
    metadata.create_all(
        engine,
        tables=[
            password_reset_otps,
            password_reset_attempts,
        ],
    )
    add_user_columns(engine)


if __name__ == "__main__":
    run()
