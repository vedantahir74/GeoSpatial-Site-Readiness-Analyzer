from typing import Dict, Any, List
import json
from shapely.geometry import Point, Polygon
from shapely.ops import transform
import math
from sqlalchemy import text
from core.database import engine


class IsochroneService:
    WALK_SPEED_KPH = 5
    URBAN_DRIVE_SPEED_KPH = 30
    HIGHWAY_DRIVE_SPEED_KPH = 60
    
    def create_buffer(self, lat: float, lng: float, radius_km: float) -> Polygon:
        point = Point(lng, lat)
        return point.buffer(radius_km / 111)
    
    async def compute_isochrone(
        self, 
        lat: float, 
        lng: float, 
        mode: str, 
        minutes: int
    ) -> Polygon:
        
        if mode == "walk":
            speed = self.WALK_SPEED_KPH
        elif mode == "drive":
            speed = self.URBAN_DRIVE_SPEED_KPH
        
        radius_km = (speed * minutes) / 60
        
        buffer = self.create_buffer(lat, lng, radius_km)
        
        return buffer
    
    async def compute_catchment_population(
        self, 
        isochrone: Polygon,
        lat: float,
        lng: float
    ) -> int:
        
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT SUM(population)::int as total_pop
                FROM demographic_zones 
                WHERE ST_Intersects(geom, ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326))
            """), {"geojson": json.dumps({
                "type": "Polygon",
                "coordinates": [list(isochrone.exterior.coords)]
            })})
            
            total_pop = result.scalar() or 0
        
        return int(total_pop)
    
    async def get_isochrones(
        self, 
        lat: float, 
        lng: float, 
        modes: List[str] = ["drive"],
        minutes_list: List[int] = [10, 20, 30]
    ) -> Dict[str, Any]:
        
        results = {
            "isochrones": [],
            "catchment_population": {}
        }
        
        for mode in modes:
            for minutes in minutes_list:
                isochrone = await self.compute_isochrone(lat, lng, mode, minutes)
                
                catchment = await self.compute_catchment_population(isochrone, lat, lng)
                
                key = f"{mode}_{minutes}min"
                results["catchment_population"][key] = catchment
                
                results["isochrones"].append({
                    "mode": mode,
                    "minutes": minutes,
                    "polygon": {
                        "type": "Polygon",
                        "coordinates": [list(isochrone.exterior.coords)]
                    }
                })
        
        return results


isochrone_service = IsochroneService()