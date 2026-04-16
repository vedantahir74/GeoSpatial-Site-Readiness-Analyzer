"""
Property-based tests for database spatial operations.

Tests Property 33: Spatial Index Utilization
Validates: Requirements 10.5
"""

import pytest
import asyncio
from hypothesis import given, strategies as st, settings
from sqlalchemy import text
from core.database import engine, async_session_maker
from core.models import DemographicZone, PointsOfInterest, RoadNetwork


class TestSpatialIndexUtilization:
    """Property tests for spatial index utilization."""

    @pytest.mark.asyncio
    @given(
        lat=st.floats(min_value=22.87, max_value=23.15),
        lng=st.floats(min_value=72.45, max_value=72.75),
        radius=st.floats(min_value=0.001, max_value=0.1)
    )
    @settings(max_examples=50, deadline=5000)
    async def test_spatial_queries_use_gist_indexes(self, lat: float, lng: float, radius: float):
        """
        Property 33: Spatial Index Utilization
        
        For any geospatial query executed by the system, the query execution plan 
        should utilize spatial indexes (GIST indexes) for optimal performance.
        """
        async with async_session_maker() as session:
            # Test point-in-polygon query with demographic zones
            explain_query = text("""
                EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
                SELECT id, zone_id, population 
                FROM demographic_zones 
                WHERE ST_Contains(geom, ST_Point(:lng, :lat))
            """)
            
            result = await session.execute(explain_query, {"lat": lat, "lng": lng})
            explain_result = result.scalar()
            
            # Verify GIST index is used
            plan_str = str(explain_result[0])
            assert "Index Scan" in plan_str or "Bitmap Index Scan" in plan_str, \
                f"Spatial query should use index scan, got: {plan_str}"
            assert "idx_demographic_zones_geom" in plan_str, \
                f"Should use spatial index, got: {plan_str}"

    @pytest.mark.asyncio
    @given(
        lat=st.floats(min_value=22.87, max_value=23.15),
        lng=st.floats(min_value=72.45, max_value=72.75),
        radius=st.floats(min_value=0.001, max_value=0.05)
    )
    @settings(max_examples=30, deadline=5000)
    async def test_distance_queries_use_spatial_indexes(self, lat: float, lng: float, radius: float):
        """Test that distance-based queries utilize spatial indexes."""
        async with async_session_maker() as session:
            # Test distance query with POIs
            explain_query = text("""
                EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
                SELECT id, name, category
                FROM points_of_interest 
                WHERE ST_DWithin(geom, ST_Point(:lng, :lat), :radius)
            """)
            
            result = await session.execute(explain_query, {
                "lat": lat, "lng": lng, "radius": radius
            })
            explain_result = result.scalar()
            
            plan_str = str(explain_result[0])
            # Should use spatial index for distance queries
            assert ("Index Scan" in plan_str or "Bitmap Index Scan" in plan_str), \
                f"Distance query should use spatial index, got: {plan_str}"

    @pytest.mark.asyncio
    async def test_all_spatial_tables_have_gist_indexes(self):
        """Verify all spatial tables have GIST indexes."""
        async with async_session_maker() as session:
            # Check for spatial indexes on all tables
            index_query = text("""
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    indexdef
                FROM pg_indexes 
                WHERE schemaname = 'public' 
                AND indexdef LIKE '%USING gist%'
                ORDER BY tablename, indexname
            """)
            
            result = await session.execute(index_query)
            indexes = result.fetchall()
            
            # Required spatial tables
            required_tables = {
                'demographic_zones', 'road_network', 'points_of_interest',
                'land_use_zones', 'environmental_risks', 'candidate_sites'
            }
            
            indexed_tables = {row.tablename for row in indexes}
            
            # Verify all required tables have spatial indexes
            missing_indexes = required_tables - indexed_tables
            assert not missing_indexes, \
                f"Missing spatial indexes for tables: {missing_indexes}"
            
            # Verify at least 6 spatial indexes exist
            assert len(indexes) >= 6, \
                f"Expected at least 6 spatial indexes, found {len(indexes)}"

    @pytest.mark.asyncio
    @given(
        road_type=st.sampled_from(['highway', 'primary', 'secondary', 'residential'])
    )
    @settings(max_examples=20, deadline=3000)
    async def test_road_network_spatial_queries_optimized(self, road_type: str):
        """Test road network spatial queries use proper indexing."""
        async with async_session_maker() as session:
            # Test road network query with spatial and attribute filters
            explain_query = text("""
                EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
                SELECT id, name, road_type
                FROM road_network 
                WHERE road_type = :road_type
                AND ST_Intersects(geom, ST_MakeEnvelope(72.5, 22.9, 72.6, 23.0, 4326))
            """)
            
            result = await session.execute(explain_query, {"road_type": road_type})
            explain_result = result.scalar()
            
            plan_str = str(explain_result[0])
            
            # Should use either spatial index or combined index strategy
            has_spatial_access = (
                "Index Scan" in plan_str or 
                "Bitmap Index Scan" in plan_str or
                "BitmapOr" in plan_str
            )
            
            assert has_spatial_access, \
                f"Road network query should use optimized access path, got: {plan_str}"

    @pytest.mark.asyncio
    async def test_spatial_index_statistics_updated(self):
        """Verify spatial indexes have updated statistics."""
        async with async_session_maker() as session:
            # Check index usage statistics
            stats_query = text("""
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    idx_scan,
                    idx_tup_read,
                    idx_tup_fetch
                FROM pg_stat_user_indexes 
                WHERE indexname LIKE '%geom%'
                ORDER BY tablename
            """)
            
            result = await session.execute(stats_query)
            stats = result.fetchall()
            
            # Verify we have statistics for spatial indexes
            assert len(stats) >= 6, \
                f"Expected statistics for at least 6 spatial indexes, found {len(stats)}"
            
            # All indexes should be trackable (not necessarily used yet in tests)
            for stat in stats:
                assert stat.idx_scan is not None, \
                    f"Index {stat.indexname} should have scan statistics"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])