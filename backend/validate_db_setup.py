#!/usr/bin/env python3
"""
Database setup validation script for GeoSpatial Site Analyzer.
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from core.database import engine, comprehensive_health_check
from sqlalchemy import text

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


async def validate_postgis_version():
    """Validate PostGIS version meets requirements."""
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT PostGIS_Version()"))
        version = result.scalar()
        logger.info(f"PostGIS Version: {version}")
        
        # Check if version is 3.3 or higher
        version_parts = version.split()[0].split('.')
        major, minor = int(version_parts[0]), int(version_parts[1])
        
        if major > 3 or (major == 3 and minor >= 3):
            logger.info("✓ PostGIS version meets requirements (3.3+)")
            return True
        else:
            logger.error(f"✗ PostGIS version {major}.{minor} is below required 3.3")
            return False


async def validate_spatial_tables():
    """Validate all required spatial tables exist with proper geometry columns."""
    required_tables = {
        'demographic_zones': 'MULTIPOLYGON',
        'road_network': 'LINESTRING', 
        'points_of_interest': 'POINT',
        'land_use_zones': 'MULTIPOLYGON',
        'environmental_risks': 'MULTIPOLYGON',
        'candidate_sites': 'POINT'
    }
    
    all_valid = True
    
    async with engine.begin() as conn:
        for table_name, expected_geom_type in required_tables.items():
            # Check table exists
            result = await conn.execute(
                text("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_schema = 'public' AND table_name = :table_name
                    )
                """),
                {"table_name": table_name}
            )
            
            if not result.scalar():
                logger.error(f"✗ Table {table_name} does not exist")
                all_valid = False
                continue
            
            logger.info(f"✓ Table {table_name} exists")
    
    return all_valid


async def validate_spatial_indexes():
    """Validate spatial indexes exist."""
    async with engine.begin() as conn:
        result = await conn.execute(
            text("""
                SELECT COUNT(*) FROM pg_indexes 
                WHERE schemaname = 'public' 
                AND indexdef LIKE '%USING gist%'
            """)
        )
        
        spatial_index_count = result.scalar()
        logger.info(f"Found {spatial_index_count} spatial indexes")
        
        if spatial_index_count >= 6:  # Expect at least 6 main spatial indexes
            logger.info("✓ Sufficient spatial indexes found")
            return True
        else:
            logger.error("✗ Insufficient spatial indexes")
            return False


async def main():
    """Run database validation."""
    logger.info("Starting database validation...")
    
    try:
        # Validate PostGIS version
        postgis_ok = await validate_postgis_version()
        
        # Validate spatial tables
        tables_ok = await validate_spatial_tables()
        
        # Validate spatial indexes
        indexes_ok = await validate_spatial_indexes()
        
        # Run comprehensive health check
        health_status = await comprehensive_health_check()
        health_ok = health_status['overall_healthy']
        
        logger.info(f"Health check: {health_status}")
        
        # Summary
        all_passed = postgis_ok and tables_ok and indexes_ok and health_ok
        
        if all_passed:
            logger.info("🎉 Database validation passed!")
            return True
        else:
            logger.error("❌ Database validation failed")
            return False
            
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)