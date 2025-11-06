"""Create fresh database with all tables"""
import sys
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import engine
from app import models

# Drop all tables and recreate
models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)

print("Database created successfully with all tables!")
