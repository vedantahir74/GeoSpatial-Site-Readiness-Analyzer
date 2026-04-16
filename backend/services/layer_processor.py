from typing import Dict, Any, List, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import engine
import json


class LayerProcessor:
    async def get_demographics_layer(self) -> Dict[str, Any]:
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT 
                    ST_AsGeoJSON(geom) as geojson,
                    zone_id, name, population, population_density,
                    median_income, median_age, working_age_pct, household_count
                FROM demographic_zones
            """))
            
            features = []
            for row in result:
                features.append({
                    "type": "Feature",
                    "geometry": json.loads(row[0]),
                    "properties": {
                        "zone_id": row[1],
                        "name": row[2],
                        "population": row[3],
                        "population_density": row[4],
                        "median_income": row[5],
                        "median_age": row[6],
                        "working_age_pct": row[7],
                        "household_count": row[8]
                    }
                })
            
            return {
                "type": "FeatureCollection",
                "features": features
            }
    
    async def get_roads_layer(self) -> Dict[str, Any]:
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT 
                    ST_AsGeoJSON(ST_Simplify(geom, 0.001)) as geojson,
                    osm_id, road_type, name, lanes, max_speed, is_highway
                FROM road_network
            """))
            
            features = []
            for row in result:
                features.append({
                    "type": "Feature",
                    "geometry": json.loads(row[0]),
                    "properties": {
                        "osm_id": str(row[1]),
                        "road_type": row[2],
                        "name": row[3],
                        "lanes": row[4],
                        "max_speed": row[5],
                        "is_highway": row[6]
                    }
                })
            
            return {
                "type": "FeatureCollection",
                "features": features
            }
    
    async def get_poi_layer(self, category: Optional[str] = None) -> Dict[str, Any]:
        query = """
            SELECT 
                ST_AsGeoJSON(geom) as geojson,
                poi_id, name, category, subcategory, brand,
                is_competitor, is_anchor, rating, review_count
            FROM points_of_interest
        """
        
        if category:
            query += f" WHERE category = '{category}'"
        
        async with engine.begin() as conn:
            result = await conn.execute(text(query))
            
            features = []
            for row in result:
                features.append({
                    "type": "Feature",
                    "geometry": json.loads(row[0]),
                    "properties": {
                        "poi_id": row[1],
                        "name": row[2],
                        "category": row[3],
                        "subcategory": row[4],
                        "brand": row[5],
                        "is_competitor": row[6],
                        "is_anchor": row[7],
                        "rating": row[8],
                        "review_count": row[9]
                    }
                })
            
            return {
                "type": "FeatureCollection",
                "features": features
            }
    
    async def get_land_use_layer(self) -> Dict[str, Any]:
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT 
                    ST_AsGeoJSON(geom) as geojson,
                    zone_code, zone_type, description,
                    allows_retail, allows_warehouse, floor_area_ratio, max_building_height
                FROM land_use_zones
            """))
            
            features = []
            for row in result:
                features.append({
                    "type": "Feature",
                    "geometry": json.loads(row[0]),
                    "properties": {
                        "zone_code": row[1],
                        "zone_type": row[2],
                        "description": row[3],
                        "allows_retail": row[4],
                        "allows_warehouse": row[5],
                        "floor_area_ratio": row[6],
                        "max_building_height": row[7]
                    }
                })
            
            return {
                "type": "FeatureCollection",
                "features": features
            }
    
    async def get_environmental_layer(self) -> Dict[str, Any]:
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT 
                    ST_AsGeoJSON(geom) as geojson,
                    risk_id, risk_type, severity,
                    flood_zone_code, earthquake_pga, air_quality_index
                FROM environmental_risks
            """))
            
            features = []
            for row in result:
                features.append({
                    "type": "Feature",
                    "geometry": json.loads(row[0]),
                    "properties": {
                        "risk_id": row[1],
                        "risk_type": row[2],
                        "severity": row[3],
                        "flood_zone_code": row[4],
                        "earthquake_pga": row[5],
                        "air_quality_index": row[6]
                    }
                })
            
            return {
                "type": "FeatureCollection",
                "features": features
            }


layer_processor = LayerProcessor()