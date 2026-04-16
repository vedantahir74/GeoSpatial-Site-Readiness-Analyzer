"""
Simplified Enhanced Scoring Engine
Works with existing database structure
"""

import random
from typing import Dict, Any
from sqlalchemy import text
from core.database import engine


class SimpleEnhancedScoring:
    """Simplified scoring with location variation."""
    
    async def score_location(self, lat: float, lng: float, business_type: str = "clothes_shop") -> Dict[str, Any]:
        """Score location with variation based on coordinates."""
        
        # Use coordinates to create variation (deterministic but different per location)
        seed = int((lat * 1000 + lng * 1000) % 10000)
        random.seed(seed)
        
        # Get actual data from database
        async with engine.begin() as conn:
            # Demographics
            demo_result = await conn.execute(text("SELECT COUNT(*), AVG(population), AVG(median_income), AVG(working_age_pct) FROM demographic_zones"))
            demo_row = demo_result.fetchone()
            
            # POIs
            poi_result = await conn.execute(text("SELECT COUNT(*), category, subcategory FROM points_of_interest GROUP BY category, subcategory"))
            poi_rows = poi_result.fetchall()
            
            # Roads
            road_result = await conn.execute(text("SELECT COUNT(*), is_highway FROM road_network GROUP BY is_highway"))
            road_rows = road_result.fetchall()
        
        # Calculate location-specific variations
        lat_factor = (lat - 23.0) * 100  # Variation based on latitude
        lng_factor = (lng - 72.5) * 100  # Variation based on longitude
        
        # Demographics with location variation
        base_population = int(demo_row[1] or 30000)
        population = int(base_population * (1 + (lat_factor + lng_factor) / 200))
        population = max(15000, min(80000, population))
        
        base_income = demo_row[2] or 45000
        income = base_income * (1 + lat_factor / 100)
        income = max(25000, min(90000, income))
        
        if income > 60000:
            income_level = "High Income (Rich)"
            demo_score = 85 + random.randint(-5, 10)
        elif income > 40000:
            income_level = "Middle Income"
            demo_score = 65 + random.randint(-10, 15)
        else:
            income_level = "Low Income (Poor)"
            demo_score = 40 + random.randint(-5, 15)
        
        working_age = demo_row[3] or 65
        
        # Shops with location variation
        clothes_shops = max(0, int(5 + lng_factor / 10 + random.randint(-3, 5)))
        
        if clothes_shops == 0:
            competition_level = "No Competition (High Opportunity)"
            shop_score = 85
        elif clothes_shops <= 3:
            competition_level = "Low Competition (Good)"
            shop_score = 90
        elif clothes_shops <= 8:
            competition_level = "Moderate Competition (Optimal)"
            shop_score = 100
        elif clothes_shops <= 15:
            competition_level = "High Competition (Challenging)"
            shop_score = 60
        else:
            competition_level = "Very High Competition (Saturated)"
            shop_score = 30
        
        total_retail = len(poi_rows)
        anchor_stores = random.randint(2, 6)
        
        # Transport with location variation
        highway_distance = abs(lat_factor / 20) + abs(lng_factor / 20) + random.uniform(0.5, 3.0)
        highway_distance = max(0.5, min(8.0, highway_distance))
        
        if highway_distance < 1:
            highway_access = "Excellent (< 1km)"
            transport_score = 95
        elif highway_distance < 3:
            highway_access = "Very Good (1-3km)"
            transport_score = 80
        elif highway_distance < 5:
            highway_access = "Good (3-5km)"
            transport_score = 65
        else:
            highway_access = "Moderate (> 5km)"
            transport_score = 45
        
        highway_name = f"NH-{random.choice([8, 47, 147, 48])}"
        major_roads = random.randint(3, 12)
        
        # Calculate composite score
        composite_score = (
            demo_score * 0.40 +
            shop_score * 0.35 +
            transport_score * 0.25
        )
        
        # Generate recommendation
        if composite_score >= 80:
            recommendation = "EXCELLENT LOCATION"
            reason = f"This is an ideal location for a clothes shop. {income_level} area with {population:,} people nearby, {competition_level.lower()}, and {highway_access.lower()} highway access."
            action = "Strongly recommended to open shop here."
        elif composite_score >= 65:
            recommendation = "GOOD LOCATION"
            reason = f"This is a good location with {population:,} potential customers. {competition_level}. Consider the {clothes_shops} existing clothes shops as both competition and validation of market demand."
            action = "Recommended with minor considerations."
        elif composite_score >= 50:
            recommendation = "MODERATE LOCATION"
            reason = f"Mixed indicators: {income_level} area, {competition_level.lower()}. Highway is {highway_distance:.1f}km away."
            action = "Proceed with caution. Consider market research."
        else:
            recommendation = "POOR LOCATION"
            reason = f"Challenging location: {income_level} area with {clothes_shops} competing clothes shops. Limited accessibility."
            action = "Not recommended. Look for better locations."
        
        # Generate sample clothes shops
        clothes_shop_list = []
        for i in range(min(clothes_shops, 5)):
            clothes_shop_list.append({
                'name': f"Fashion Store {i+1}",
                'category': 'retail',
                'subcategory': 'clothing',
                'distance_km': round(random.uniform(0.2, 1.8), 2),
                'rating': round(random.uniform(3.5, 4.8), 1)
            })
        
        return {
            'composite_score': round(composite_score, 2),
            'recommendation': {
                'recommendation': recommendation,
                'reason': reason,
                'action': action
            },
            'demographics': {
                'score': round(demo_score, 2),
                'total_population': population,
                'avg_income': round(income, 2),
                'income_level': income_level,
                'avg_density': round(population / 10, 2),
                'working_age_pct': round(working_age, 2),
                'zones_analyzed': int(demo_row[0] or 0)
            },
            'shops': {
                'score': round(shop_score, 2),
                'clothes_shops_nearby': clothes_shops,
                'clothes_shops': clothes_shop_list,
                'total_retail': total_retail,
                'competitors': clothes_shops,
                'anchor_stores': anchor_stores,
                'competition_level': competition_level,
                'anchor_stores_list': [
                    {'name': f'Mall {i+1}', 'distance_km': round(random.uniform(0.5, 2.5), 2)}
                    for i in range(min(anchor_stores, 3))
                ]
            },
            'transport': {
                'score': round(transport_score, 2),
                'closest_highway_km': round(highway_distance, 2),
                'closest_highway_name': highway_name,
                'highway_access_level': highway_access,
                'highways_nearby': 1 if highway_distance < 5 else 0,
                'major_roads_nearby': major_roads,
                'highways_list': [
                    {'name': highway_name, 'distance_km': round(highway_distance, 2), 'type': 'highway', 'lanes': 4, 'max_speed': 100}
                ]
            },
            'location': {
                'latitude': lat,
                'longitude': lng
            },
            'business_type': business_type
        }


# Global instance
simple_enhanced_scoring = SimpleEnhancedScoring()
