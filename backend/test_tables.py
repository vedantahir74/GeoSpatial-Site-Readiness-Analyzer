#!/usr/bin/env python3
"""Test table creation."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from core.database import engine, Base
from core.models import *  # Import all models

async def test_tables():
    """Test table creation."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Check what tables exist
        result = await conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [row[0] for row in result.fetchall()]
        print(f"Created tables: {tables}")

if __name__ == "__main__":
    from sqlalchemy import text
    asyncio.run(test_tables())