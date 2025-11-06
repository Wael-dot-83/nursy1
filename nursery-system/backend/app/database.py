from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from .settings import settings

# Database URL sourced from configuration
DATABASE_URL = settings.database_url

# Create engine
# Note: check_same_thread is only needed for SQLite
connect_args = {}
if "sqlite" in DATABASE_URL.lower():
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False,
    connect_args=connect_args
)

# For SQLite, ensure UTF-8 encoding
if "sqlite" in DATABASE_URL.lower():
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA encoding = 'UTF-8'")
        cursor.close()

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database - create all tables"""
    from . import models
    models.Base.metadata.create_all(bind=engine)
