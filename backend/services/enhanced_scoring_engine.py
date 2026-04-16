"""
Enhanced Site Scoring Engine with Location-Based Analysis
Includes business-specific intelligence for retail/clothes shops
"""

import math
from typing import Dict, List, Optional, Any
from sqlalchemy import text
from core.database import engine


class EnhancedScoringEngine:
    """Enhanced scoring engine with real distance calculations and business intelligence."""
    
    def __init__(self):
        self.default_weights = {
            "demographics": 0.35,
            "transport": 0.25,
            "poi": 0.20,
            "land_use": 0.10,
            "environment": 0.10,
        }

    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points using Haversine formula (in km)."""
        R = 6371  # Earth's radius in km
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = (math.sin(delta_lat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c

    async def get_nearby_demographics(self, lat: float, lng: float, radius_km: float = 3.0) -> Dict[str, Any]:
        """Get demographic data for nearby areas."""
        async with engine.begin() as conn:
            result = await conn.execute(
                text("""
                    SELECT 
                        population_density,
                        median_income,
                        working_age_pct,
                        population,
                        latitude,
                        longitude
                    FROM demographic_zones
                """)
            )
            all_zones = result.fetchall()
        
        # Filter by distance and calculate weighted averages
        nearby_zones = []
        total_weight = 0
        weighted_density = 0
        weighted_income = 0
        weighted_working_age = 0
        total_population = 0
        
        for zone in all_zones:
            zone_lat, zone_lng = zone[4], zone[5]
            distance = self.calculate_distance(lat, lng, zone_lat, zone_lng)
            
            if distance <= radius_km:
                # Distance decay weight (closer = more weight)
                weight = 1 / (1 + distance)
                population = zone[3] or 0
                
                nearby_zones.append({
                    'distance_km': round(distance, 2),
                    'population': population,
                    'density': zone[0] or 0,
                    'income': zone[1] or 0,
                    'working_age_pct': zone[2] or 0
                })
                
                weighted_density += (zone[0] or 0) * weight
                weighted_income += (zone[1] or 0) * weight
                weighted_working_age += (zone[2] or 0) * weight
                total_population += population
                total_weight += weight
        
        if total_weight > 0:
            avg_density = weighted_density / total_weight
            avg_income = weighted_income / total_weight
            avg_working_age = weighted_working_age / total_weight
        else:
            avg_density = avg_income = avg_working_age = 0
        
        # Determine income level
        if avg_income > 60000:
            income_level = "High Income (Rich)"
            income_score = 90
        elif avg_income > 40000:
            income_level = "Middle Income"
            income_score = 70
        else:
            income_level = "Low Income (Poor)"
            income_score = 40
        
        # Calculate demographic score
        density_score = min(100, (avg_density / 10000) * 100)  # Normalize to 100
        working_age_score = avg_working_age
        
        demo_score = (density_score * 0.4 + income_score * 0.4 + working_age_score * 0.2)
        
        return {
            'score': round(demo_score, 2),
            'total_population': total_population,
            'avg_income': round(avg_income, 2),
            'income_level': income_level,
            'avg_density': round(avg_density, 2),
            'working_age_pct': round(avg_working_age, 2),
            'zones_analyzed': len(nearby_zones)
        }

    async def get_nearby_shops(self, lat: float, lng: float, radius_km: float = 2.0) -> Dict[str, Any]:
        """Get information about nearby shops, especially clothes shops."""
        async with engine.begin() as conn:
            result = await conn.execute(
                text("""
                    SELECT 
                        category,
                        subcategory,
                        name,
                        is_competitor,
                        is_anchor,
                        rating,
                        latitude,
                        longitude
                    FROM points_of_interest
                """)
            )
            all_pois = result.fetchall()
        
        clothes_shops = []
        retail_shops = []
        competitors = []
        anchor_stores = []
        
        for poi in all_pois:
            poi_lat, poi_lng = poi[6], poi[7]
            distance = self.calculate_distance(lat, lng, poi_lat, poi_lng)
            
            if distance <= radius_km:
                category = (poi[0] or "").lower()
                subcategory = (poi[1] or "").lower()
                
                poi_info = {
                    'name': poi[2],
                    'category': poi[0],
                    'subcategory': poi[1],
                    'distance_km': round(distance, 2),
                    'rating': poi[5] or 0
                }
                
                # Identify clothes/fashion shops
                if 'cloth' in category or 'cloth' in subcategory or 'fashion' in subcategory or 'apparel' in subcategory:
                    clothes_shops.append(poi_info)
                
                # All retail
                if 'retail' in category or poi[3]:  # is_competitor
                    retail_shops.append(poi_info)
                    if poi[3]:  # is_competitor
                        competitors.append(poi_info)
                
                # Anchor stores
                if poi[4]:  # is_anchor
                    anchor_stores.append(poi_info)
        
        # Calculate competition score
        clothes_count = len(clothes_shops)
        if clothes_count == 0:
            competition_level = "No Competition (High Opportunity)"
            competition_score = 85
        elif clothes_count <= 3:
            competition_level = "Low Competition (Good)"
            competition_score = 90
        elif clothes_count <= 8:
            competition_level = "Moderate Competition (Optimal)"
            competition_score = 100
        elif clothes_count <= 15:
            competition_level = "High Competition (Challenging)"
            competition_score = 60
        else:
            competition_level = "Very High Competition (Saturated)"
            competition_score = 30
        
        # Anchor store bonus
        anchor_score = min(100, len(anchor_stores) * 25)
        
        # Overall POI score
        poi_score = (competition_score * 0.6 + anchor_score * 0.4)
        
        return {
            'score': round(poi_score, 2),
            'clothes_shops_nearby': clothes_count,
            'clothes_shops': clothes_shops[:10],  # Top 10 closest
            'total_retail': len(retail_shops),
            'competitors': len(competitors),
            'anchor_stores': len(anchor_stores),
            'competition_level': competition_level,
            'anchor_stores_list': anchor_stores[:5]
        }

    async def get_highway_access(self, lat: float, lng: float, radius_km: float = 5.0) -> Dict[str, Any]:
        """Get highway and road access information."""
        async with engine.begin() as conn:
            result = await conn.execute(
                text("""
                    SELECT 
                        road_type,
                        is_highway,
                        name,
                        lanes,
                        max_speed,
                        latitude,
                        longitude
                    FROM road_network
                """)
            )
            all_roads = result.fetchall()
        
        highways = []
        major_roads = []
        
        for road in all_roads:
            road_lat, road_lng = road[5], road[6]
            distance = self.calculate_distance(lat, lng, road_lat, road_lng)
            
            if distance <= radius_km:
                road_info = {
                    'name': road[2] or 'Unnamed Road',
                    'type': road[0],
                    'distance_km': round(distance, 2),
                    'lanes': road[3] or 2,
                    'max_speed': road[4] or 50
                }
                
                if road[1]:  # is_highway
                    highways.append(road_info)
                elif road[0] in ['primary', 'secondary', 'trunk']:
                    major_roads.append(road_info)
        
        # Find closest highway
        if highways:
            closest_highway = min(highways, key=lambda x: x['distance_km'])
            highway_distance = closest_highway['distance_km']
            highway_name = closest_highway['name']
        else:
            highway_distance = None
            highway_name = "No highway nearby"
        
        # Calculate transport score
        if highway_distance is not None:
            if highway_distance < 1:
                highway_score = 100
                access_level = "Excellent (< 1km)"
            elif highway_distance < 3:
                highway_score = 85
                access_level = "Very Good (1-3km)"
            elif highway_distance < 5:
                highway_score = 70
                access_level = "Good (3-5km)"
            else:
                highway_score = 50
                access_level = "Moderate (> 5km)"
        else:
            highway_score = 30
            access_level = "Poor (No highway nearby)"
        
        major_road_score = min(100, len(major_roads) * 15)
        transport_score = (highway_score * 0.7 + major_road_score * 0.3)
        
        return {
            'score': round(transport_score, 2),
            'closest_highway_km': highway_distance,
            'closest_highway_name': highway_name,
            'highway_access_level': access_level,
            'highways_nearby': len(highways),
            'major_roads_nearby': len(major_roads),
            'highways_list': highways[:5]
        }

    async def get_recommendation(self, composite_score: float, details: Dict) -> Dict[str, str]:
        """Generate business recommendation based on analysis."""
        demo = details['demographics']
        shops = details['shops']
        transport = details['transport']
        
        if composite_score >= 80:
            recommendation = "EXCELLENT LOCATION"
            reason = f"This is an ideal location for a clothes shop. {demo['income_level']} area with {demo['total_population']:,} people nearby, {shops['competition_level'].lower()}, and {transport['highway_access_level'].lower()} highway access."
            action = "Strongly recommended to open shop here."
        elif composite_score >= 65:
            recommendation = "GOOD LOCATION"
            reason = f"This is a good location with {demo['total_population']:,} potential customers. {shops['competition_level']}. Consider the {shops['clothes_shops_nearby']} existing clothes shops as both competition and validation of market demand."
            action = "Recommended with minor considerations."
        elif composite_score >= 50:
            recommendation = "MODERATE LOCATION"
            reason = f"Mixed indicators: {demo['income_level']} area, {shops['competition_level'].lower()}. Highway is {transport['closest_highway_km']:.1f}km away."
            action = "Proceed with caution. Consider market research."
        else:
            recommendation = "POOR LOCATION"
            reason = f"Challenging location: {demo['income_level']} area with {shops['clothes_shops_nearby']} competing clothes shops. Limited accessibility."
            action = "Not recommended. Look for better locations."
        
        return {
            'recommendation': recommendation,
            'reason': reason,
            'action': action
        }

    async def score_location(
        self, 
        lat: float, 
        lng: float, 
        business_type: str = "clothes_shop"
    ) -> Dict[str, Any]:
        """
        Comprehensive location scoring with business intelligence.
        """
        # Get all analysis components
        demographics = await self.get_nearby_demographics(lat, lng)
        shops = await self.get_nearby_shops(lat, lng)
        transport = await self.get_highway_access(lat, lng)
        
        # Calculate composite score (weighted average)
        composite_score = (
            demographics['score'] * 0.40 +  # Demographics most important for retail
            shops['score'] * 0.35 +          # Competition analysis
            transport['score'] * 0.25        # Accessibility
        )
        
        # Generate recommendation
        recommendation = await self.get_recommendation(
            composite_score,
            {'demographics': demographics, 'shops': shops, 'transport': transport}
        )
        
        return {
            'composite_score': round(composite_score, 2),
            'recommendation': recommendation,
            'demographics': demographics,
            'shops': shops,
            'transport': transport,
            'location': {
                'latitude': lat,
                'longitude': lng
            },
            'business_type': business_type
        }


# Global instance
enhanced_scoring_engine = EnhancedScoringEngine()
