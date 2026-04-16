#!/usr/bin/env python3
"""
Database setup validation script for GeoSpatial Site Analyzer.

This script validates that the PostgreSQL database with PostGIS extension
is properly configured with all required spatial tables, indexes, and optimizations.
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from core.database import engine, comprehensive_health_check
from core.database_enhancements import verify_spatial_indexes
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


async def validate_postgresql_version():
    """Validate PostgreSQL version meets requirements."""
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT version()"))
        version = result.scalar()
        logger.info(f"PostgreSQL Version: {version}")
        
        # Extract version number
        if "PostgreSQL 15" in version or "PostgreSQL 16" in version or "PostgreSQL 14" in version:
            logger.info("✓ PostgreSQL version meets requirements")
            return True
        else:
            logger.warning(f"⚠ PostgreSQL version may not be optimal: {version}")
            return True  # Don't fail, just warn


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
            # 
        logger.info("🎉 ALL VALIDATIONS PASSED - Database setup is optimal!")
        return True
    else:
        logger.error("❌ SOME VALIDATIONS FAILED - Please review the issues above")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
        logger.error(f"Validation failed with error: {e}")
        return False
    
    # Summary
    logger.info("\n" + "="*60)
    logger.info("DATABASE VALIDATION SUMMARY")
    logger.info("="*60)
    
    all_passed = True
    for test_name, passed in validation_results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        logger.info(f"{test_name.replace('_', ' ').title()}: {status}")
        if not passed:
            all_passed = False
    
    logger.info("="*60)
    
    if all_passed:n_pooling()
        
        # Validate spatial functions
        validation_results['spatial_functions'] = await validate_spatial_functions()
        
        # Run performance tests
        await validate_performance()
        
        # Run comprehensive health check
        health_status = await comprehensive_health_check()
        validation_results['health_check'] = health_status['overall_healthy']
        
        logger.info(f"Health check details: {health_status}")
        
    except Exception as e:stgresql_version()
        
        # Validate PostGIS version
        validation_results['postgis_version'] = await validate_postgis_version()
        
        # Validate spatial tables
        validation_results['spatial_tables'] = await validate_spatial_tables()
        
        # Validate spatial indexes
        validation_results['spatial_indexes'] = await validate_spatial_indexes()
        
        # Validate connection pooling
        validation_results['connection_pooling'] = await validate_connectio:
    """Run comprehensive database validation."""
    logger.info("Starting comprehensive database validation...")
    
    validation_results = {
        'postgresql_version': False,
        'postgis_version': False,
        'spatial_tables': False,
        'spatial_indexes': False,
        'connection_pooling': False,
        'spatial_functions': False,
        'health_check': False
    }
    
    try:
        # Validate PostgreSQL version
        validation_results['postgresql_version'] = await validate_pood performance)
                plan_text = '\n'.join([str(row[0]) for row in plan])
                if 'Index Scan' in plan_text or 'Bitmap Index Scan' in plan_text:
                    logger.info(f"✓ Performance test {i}: Using spatial index")
                else:
                    logger.warning(f"⚠ Performance test {i}: May not be using spatial index optimally")
                    
            except Exception as e:
                logger.error(f"✗ Performance test {i} failed: {e}")


async def main()       
        # Test distance query performance
        """
        EXPLAIN (ANALYZE, BUFFERS)
        SELECT COUNT(*) FROM points_of_interest 
        WHERE ST_DWithin(geom, ST_Point(72.5, 23.0), 0.01)
        """
    ]
    
    async with engine.begin() as conn:
        for i, query in enumerate(performance_tests, 1):
            try:
                result = await conn.execute(text(query))
                plan = result.fetchall()
                
                # Check if index scan is used (indicates go  all_valid = False
            except Exception as e:
                logger.error(f"✗ {description} failed: {e}")
                all_valid = False
    
    return all_valid


async def validate_performance():
    """Run basic performance tests on spatial operations."""
    performance_tests = [
        # Test spatial index usage
        """
        EXPLAIN (ANALYZE, BUFFERS) 
        SELECT COUNT(*) FROM demographic_zones 
        WHERE ST_Intersects(geom, ST_Buffer(ST_Point(72.5, 23.0), 0.01))
        """,
 T_Point(72.5, 23.0), 0.01))", "ST_Area and ST_Buffer functions"),
    ]
    
    all_valid = True
    
    async with engine.begin() as conn:
        for query, description in test_queries:
            try:
                result = await conn.execute(text(query))
                value = result.scalar()
                if value is not None:
                    logger.info(f"✓ {description} working correctly")
                else:
                    logger.error(f"✗ {description} returned null")
                  eturn False


async def validate_spatial_functions():
    """Validate custom spatial functions are working."""
    test_queries = [
        # Test distance calculation function
        ("SELECT distance_km(ST_Point(72.5, 23.0), ST_Point(72.6, 23.1))", "distance_km function"),
        
        # Test study area validation function  
        ("SELECT is_within_study_area(ST_Point(72.5, 23.0))", "is_within_study_area function"),
        
        # Test basic PostGIS functions
        ("SELECT ST_Area(ST_Buffer(Sar()
    
    # Create 10 concurrent connections to test pooling
    for _ in range(10):
        tasks.append(test_connection())
    
    try:
        results = await asyncio.gather(*tasks)
        if all(r == 1 for r in results):
            logger.info("✓ Connection pooling working correctly")
            return True
        else:
            logger.error("✗ Connection pooling test failed")
            return False
    except Exception as e:
        logger.error(f"✗ Connection pooling test failed: {e}")
        r")
    
    if index_info['missing_indexes']:
        for missing in index_info['missing_indexes']:
            logger.error(f"✗ {missing}")
            all_valid = False
    
    return all_valid


async def validate_connection_pooling():
    """Validate connection pooling configuration."""
    # Test multiple concurrent connections
    tasks = []
    
    async def test_connection():
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            return result.scal    'demographic_zones', 'road_network', 'points_of_interest',
        'land_use_zones', 'environmental_risks', 'candidate_sites'
    ]
    
    all_valid = True
    
    for table in required_tables:
        if table in index_info['indexes_by_table']:
            logger.info(f"✓ Spatial indexes found for {table}")
        else:
            logger.error(f"✗ No spatial indexes found for {table}")
            all_valid = False
    
    logger.info(f"Total spatial indexes: {index_info['total_spatial_indexes']}xpected_geom_type:
                logger.info(f"✓ Table {table_name} has correct geometry type: {geom_type}")
            else:
                logger.error(f"✗ Table {table_name} geometry type mismatch. Expected: {expected_geom_type}, Found: {geom_type}")
                all_valid = False
    
    return all_valid


async def validate_spatial_indexes():
    """Validate all spatial indexes are created and functional."""
    index_info = await verify_spatial_indexes(engine)
    
    required_tables = [
    
                continue
            
            # Check geometry column
            result = await conn.execute(
                text("""
                    SELECT type FROM geometry_columns 
                    WHERE f_table_schema = 'public' 
                    AND f_table_name = :table_name 
                    AND f_geometry_column = 'geom'
                """),
                {"table_name": table_name}
            )
            
            geom_type = result.scalar()
            if geom_type == eCheck table exists
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