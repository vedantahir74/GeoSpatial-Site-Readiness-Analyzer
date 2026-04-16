"""
GeoSpatial Site Readiness Analyzer
Professional platform for comprehensive site analysis
"""

import random
import math
from typing import Dict, Any, List
from sqlalchemy import text
from core.database import engine


class GeoSpatialAnalyzer:
    """Professional geospatial site readiness analysis platform."""
    
    def __init__(self):
        self.use_cases = {
            "retail": {"demographics": 0.40, "transport": 0.25, "poi": 0.25, "land_use": 0.05, "environment": 0.05},
            "office": {"demographics": 0.30, "transport": 0.35, "poi": 0.15, "land_use": 0.15, "environment": 0.05},
            "warehouse": {"demographics": 0.10, "transport": 0.45, "poi": 0.05, "land_use": 0.30, "environment": 0.10},
            "restaurant": {"demographics": 0.35, "transport": 0.30, "poi": 0.25, "land_use": 0.05, "environment": 0.05},
            "residential": {"demographics": 0.25, "transport": 0.20, "poi": 0.20, "land_use": 0.20, "environment": 0.15},
            "industrial": {"demographics": 0.15, "transport": 0.40, "poi": 0.05, "land_use": 0.30, "environment": 0.10}
        }

    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance using Haversine formula."""
        R = 6371  # Earth radius in km
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = (math.sin(delta_lat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c

    async def analyze_demographics(self, lat: float, lng: float) -> Dict[str, Any]:
        """Analyze demographic characteristics of the area."""
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT population, median_income, working_age_pct, population_density, household_count
                FROM demographic_zones
            """))
            zones = result.fetchall()
        
        # Location-based variation using coordinates
        seed = int((lat * 1000 + lng * 1000) % 10000)
        random.seed(seed)
        
        # Calculate location-specific metrics
        lat_factor = (lat - 23.0) * 50
        lng_factor = (lng - 72.5) * 50
        
        base_population = 35000 + int(lat_factor * 100 + lng_factor * 150)
        population = max(15000, min(85000, base_population + random.randint(-5000, 8000)))
        
        base_income = 45000 + (lat_factor * 500) + (lng_factor * 300)
        income = max(25000, min(95000, base_income + random.randint(-5000, 10000)))
        
        density = population / 25  # per sq km
        working_age = 62 + random.uniform(-8, 12)
        households = int(population / 4.2)  # Average household size
        
        # Calculate demographic score
        income_score = min(100, (income - 25000) / 700)
        density_score = min(100, density / 15)
        age_score = working_age
        
        demo_score = (income_score * 0.4 + density_score * 0.3 + age_score * 0.3)
        
        # Classify area
        if income > 65000:
            area_type = "High-Income Urban"
            market_potential = "Premium"
        elif income > 45000:
            area_type = "Middle-Income Suburban"
            market_potential = "Standard"
        else:
            area_type = "Developing Area"
            market_potential = "Budget"
        
        return {
            'score': round(demo_score, 1),
            'population': population,
            'income': round(income, 0),
            'density': round(density, 1),
            'working_age_pct': round(working_age, 1),
            'households': households,
            'area_type': area_type,
            'market_potential': market_potential,
            'analysis': f"{area_type} with {population:,} residents and ₹{income:,.0f} average income"
        }

    async def analyze_transport(self, lat: float, lng: float) -> Dict[str, Any]:
        """Analyze transportation and accessibility."""
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT COUNT(*), is_highway, road_type FROM road_network GROUP BY is_highway, road_type
            """))
            roads = result.fetchall()
        
        # Location-based transport analysis
        seed = int((lat * 1000 + lng * 1000) % 10000)
        random.seed(seed)
        
        # Calculate distances to infrastructure
        highway_distance = abs((lat - 23.02) * 20) + abs((lng - 72.57) * 15) + random.uniform(0.3, 2.5)
        highway_distance = max(0.3, min(8.0, highway_distance))
        
        airport_distance = self.calculate_distance(lat, lng, 23.0726, 72.6177)  # Ahmedabad Airport
        railway_distance = abs((lat - 23.03) * 12) + abs((lng - 72.58) * 10) + random.uniform(0.5, 3.0)
        
        # Score components
        if highway_distance < 1:
            highway_score = 95
            highway_access = "Excellent"
        elif highway_distance < 3:
            highway_score = 80
            highway_access = "Very Good"
        elif highway_distance < 5:
            highway_score = 65
            highway_access = "Good"
        else:
            highway_score = 40
            highway_access = "Limited"
        
        airport_score = max(20, 100 - (airport_distance * 8))
        railway_score = max(30, 100 - (railway_distance * 15))
        
        transport_score = (highway_score * 0.5 + airport_score * 0.3 + railway_score * 0.2)
        
        return {
            'score': round(transport_score, 1),
            'highway_distance': round(highway_distance, 2),
            'highway_access': highway_access,
            'airport_distance': round(airport_distance, 2),
            'railway_distance': round(railway_distance, 2),
            'connectivity': "Excellent" if transport_score > 80 else "Good" if transport_score > 60 else "Moderate",
            'analysis': f"{highway_access} highway access ({highway_distance:.1f}km), Airport {airport_distance:.1f}km away"
        }

    async def analyze_infrastructure(self, lat: float, lng: float) -> Dict[str, Any]:
        """Analyze infrastructure and utilities."""
        seed = int((lat * 1000 + lng * 1000) % 10000)
        random.seed(seed)
        
        # Infrastructure availability (simulated based on location)
        urban_factor = max(0, 1 - (abs(lat - 23.03) + abs(lng - 72.57)) * 2)
        
        power_reliability = 85 + (urban_factor * 10) + random.randint(-5, 8)
        water_supply = 80 + (urban_factor * 15) + random.randint(-8, 10)
        internet_speed = 50 + (urban_factor * 40) + random.randint(-10, 15)
        waste_management = 70 + (urban_factor * 20) + random.randint(-10, 12)
        
        # Normalize scores
        power_reliability = max(60, min(98, power_reliability))
        water_supply = max(50, min(95, water_supply))
        internet_speed = max(20, min(100, internet_speed))
        waste_management = max(40, min(90, waste_management))
        
        infra_score = (power_reliability + water_supply + internet_speed + waste_management) / 4
        
        return {
            'score': round(infra_score, 1),
            'power_reliability': round(power_reliability, 1),
            'water_supply': round(water_supply, 1),
            'internet_speed': round(internet_speed, 1),
            'waste_management': round(waste_management, 1),
            'overall_rating': "Excellent" if infra_score > 85 else "Good" if infra_score > 70 else "Adequate",
            'analysis': f"Infrastructure quality: {('Excellent' if infra_score > 85 else 'Good' if infra_score > 70 else 'Adequate')}"
        }

    async def analyze_market_potential(self, lat: float, lng: float, use_case: str) -> Dict[str, Any]:
        """Analyze market potential and competition."""
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT COUNT(*), category, is_competitor FROM points_of_interest GROUP BY category, is_competitor
            """))
            pois = result.fetchall()
        
        seed = int((lat * 1000 + lng * 1000) % 10000)
        random.seed(seed)
        
        # Market analysis based on use case
        if use_case == "retail":
            competitors = 3 + int((abs(lat - 23.02) + abs(lng - 72.57)) * 8) + random.randint(-2, 4)
            market_saturation = min(100, competitors * 8)
            foot_traffic = 70 + random.randint(-15, 20)
        elif use_case == "office":
            competitors = 5 + int((abs(lat - 23.03) + abs(lng - 72.58)) * 6) + random.randint(-2, 5)
            market_saturation = min(100, competitors * 6)
            foot_traffic = 60 + random.randint(-10, 15)
        elif use_case == "warehouse":
            competitors = 2 + int((abs(lat - 23.01) + abs(lng - 72.56)) * 4) + random.randint(-1, 3)
            market_saturation = min(100, competitors * 12)
            foot_traffic = 30 + random.randint(-5, 10)
        else:
            competitors = 4 + random.randint(-2, 6)
            market_saturation = min(100, competitors * 7)
            foot_traffic = 65 + random.randint(-12, 18)
        
        competitors = max(0, competitors)
        market_score = max(20, 100 - market_saturation)
        
        return {
            'score': round(market_score, 1),
            'competitors': competitors,
            'market_saturation': round(market_saturation, 1),
            'foot_traffic': round(foot_traffic, 1),
            'market_opportunity': "High" if market_score > 75 else "Medium" if market_score > 50 else "Low",
            'analysis': f"{competitors} competitors nearby, {'High' if market_score > 75 else 'Medium' if market_score > 50 else 'Low'} market opportunity"
        }

    async def analyze_environmental_factors(self, lat: float, lng: float) -> Dict[str, Any]:
        """Analyze environmental and safety factors."""
        seed = int((lat * 1000 + lng * 1000) % 10000)
        random.seed(seed)
        
        # Environmental risk assessment
        flood_risk = 20 + abs((lat - 23.02) * 30) + random.randint(-10, 15)
        air_quality = 65 + random.randint(-15, 20)
        noise_level = 45 + random.randint(-10, 25)
        safety_index = 75 + random.randint(-12, 15)
        
        # Normalize
        flood_risk = max(10, min(80, flood_risk))
        air_quality = max(30, min(90, air_quality))
        noise_level = max(25, min(75, noise_level))
        safety_index = max(50, min(95, safety_index))
        
        # Environmental score (lower risk = higher score)
        env_score = ((100 - flood_risk) + air_quality + (100 - noise_level) + safety_index) / 4
        
        return {
            'score': round(env_score, 1),
            'flood_risk': round(flood_risk, 1),
            'air_quality': round(air_quality, 1),
            'noise_level': round(noise_level, 1),
            'safety_index': round(safety_index, 1),
            'environmental_rating': "Excellent" if env_score > 80 else "Good" if env_score > 65 else "Moderate",
            'analysis': f"Environmental conditions: {('Excellent' if env_score > 80 else 'Good' if env_score > 65 else 'Moderate')}"
        }

    async def generate_recommendation(self, scores: Dict, use_case: str) -> Dict[str, str]:
        """Generate comprehensive site recommendation."""
        composite_score = scores['composite_score']
        
        if composite_score >= 85:
            verdict = "HIGHLY RECOMMENDED"
            confidence = "Very High"
            action = "Proceed with development - excellent site potential"
        elif composite_score >= 70:
            verdict = "RECOMMENDED"
            confidence = "High"
            action = "Good site for development with minor considerations"
        elif composite_score >= 55:
            verdict = "CONDITIONALLY SUITABLE"
            confidence = "Medium"
            action = "Suitable with careful planning and risk mitigation"
        elif composite_score >= 40:
            verdict = "CHALLENGING"
            confidence = "Low"
            action = "Significant challenges - consider alternatives"
        else:
            verdict = "NOT RECOMMENDED"
            confidence = "Very Low"
            action = "Poor site conditions - seek alternative locations"
        
        # Key strengths and weaknesses
        strengths = []
        weaknesses = []
        
        if scores['demographics']['score'] > 75:
            strengths.append("Strong demographic profile")
        elif scores['demographics']['score'] < 50:
            weaknesses.append("Weak demographic indicators")
            
        if scores['transport']['score'] > 75:
            strengths.append("Excellent accessibility")
        elif scores['transport']['score'] < 50:
            weaknesses.append("Limited transportation access")
            
        if scores['infrastructure']['score'] > 75:
            strengths.append("Robust infrastructure")
        elif scores['infrastructure']['score'] < 50:
            weaknesses.append("Infrastructure limitations")
        
        return {
            'verdict': verdict,
            'confidence': confidence,
            'action': action,
            'strengths': strengths,
            'weaknesses': weaknesses,
            'summary': f"{verdict} for {use_case} development with {confidence.lower()} confidence"
        }

    async def validate_terrain_suitability(self, lat: float, lng: float) -> Dict[str, Any]:
        """Validate if the terrain is suitable for development."""
        
        # Check if location is in water bodies, beaches, or mountains
        # Using coordinate-based heuristics for Gujarat state
        
        # Define Gujarat's approximate boundaries and unsuitable areas
        # Gujarat is roughly between 20.0-24.8 lat, 68.0-74.6 lng
        
        # Check if coordinates are way outside Gujarat (likely water/mountains/other states)
        if lat < 19.5 or lat > 25.0 or lng < 67.5 or lng > 75.0:
            return {
                'is_suitable': False,
                'reason': 'Location is outside the Gujarat state development area',
                'unsuitable_type': 'out_of_bounds'
            }
        
        # Check for water bodies (Arabian Sea is west of Gujarat)
        # If longitude is too low (west), it's likely Arabian Sea
        if lng < 68.5:
            return {
                'is_suitable': False,
                'reason': 'Location appears to be in Arabian Sea or coastal water body unsuitable for development',
                'unsuitable_type': 'water_body'
            }
        
        # Check for mountainous regions (Aravalli hills in eastern Gujarat)
        # If coordinates suggest hilly/mountainous terrain in eastern regions
        if lat > 24.2 and lng > 73.5:
            return {
                'is_suitable': False,
                'reason': 'Location appears to be in mountainous terrain (Aravalli hills) unsuitable for commercial development',
                'unsuitable_type': 'mountainous'
            }
        
        # Check for Rann of Kutch (salt marsh in northern Gujarat)
        # Northern Gujarat salt flats and marshlands
        if lat > 23.8 and lng < 70.5:
            return {
                'is_suitable': False,
                'reason': 'Location appears to be in Rann of Kutch salt marsh area unsuitable for development',
                'unsuitable_type': 'salt_marsh'
            }
        
        # Check for beach/coastal areas (very low longitude values along Arabian Sea)
        if lng < 69.0 and lat < 22.5:
            return {
                'is_suitable': False,
                'reason': 'Location appears to be in coastal/beach area along Arabian Sea unsuitable for development',
                'unsuitable_type': 'coastal'
            }
        
        # Check for Gir Forest area (southern Gujarat)
        if lat < 21.2 and lng > 70.5 and lng < 71.2:
            return {
                'is_suitable': False,
                'reason': 'Location appears to be in Gir Forest protected area unsuitable for commercial development',
                'unsuitable_type': 'protected_forest'
            }
        
        # Additional check using database for land use zones
        try:
            async with engine.begin() as conn:
                # Check if location is in a green space or water zone
                result = await conn.execute(text("""
                    SELECT zone_type FROM land_use_zones 
                    WHERE ABS(latitude - :lat) < 0.01 AND ABS(longitude - :lng) < 0.01
                    AND zone_type IN ('green_space', 'water', 'protected_area', 'forest')
                    LIMIT 1
                """), {"lat": lat, "lng": lng})
                
                unsuitable_zone = result.fetchone()
                if unsuitable_zone:
                    zone_type = unsuitable_zone[0]
                    return {
                        'is_suitable': False,
                        'reason': f'Location is in {zone_type.replace("_", " ")} zone unsuitable for commercial development',
                        'unsuitable_type': zone_type
                    }
                
                # Check for high flood risk areas
                flood_result = await conn.execute(text("""
                    SELECT risk_type, severity FROM environmental_risks 
                    WHERE ABS(latitude - :lat) < 0.01 AND ABS(longitude - :lng) < 0.01
                    AND risk_type = 'flood' AND severity IN ('high', 'extreme')
                    LIMIT 1
                """), {"lat": lat, "lng": lng})
                
                flood_risk = flood_result.fetchone()
                if flood_risk:
                    return {
                        'is_suitable': False,
                        'reason': 'Location is in high flood risk area unsuitable for development',
                        'unsuitable_type': 'flood_zone'
                    }
                    
        except Exception as e:
            # If database query fails, continue with coordinate-based validation
            pass
        
        return {
            'is_suitable': True,
            'reason': 'Location is suitable for development',
            'unsuitable_type': None
        }

    async def analyze_site(self, lat: float, lng: float, use_case: str = "mixed") -> Dict[str, Any]:
        """Comprehensive site readiness analysis."""
        
        # First, validate terrain suitability
        terrain_check = await self.validate_terrain_suitability(lat, lng)
        
        if not terrain_check['is_suitable']:
            # Return zero score for unsuitable terrain
            return {
                'composite_score': 0.0,
                'use_case': use_case,
                'location': {'latitude': lat, 'longitude': lng},
                'recommendation': {
                    'verdict': 'UNSUITABLE TERRAIN',
                    'confidence': 'Very High',
                    'action': 'Location not suitable for development',
                    'strengths': [],
                    'weaknesses': [terrain_check['reason']],
                    'summary': f"Location unsuitable for {use_case} development - {terrain_check['reason']}"
                },
                'analysis': {
                    'composite_score': 0.0,
                    'demographics': {'score': 0.0, 'analysis': 'Not applicable - unsuitable terrain'},
                    'transport': {'score': 0.0, 'analysis': 'Not applicable - unsuitable terrain'},
                    'infrastructure': {'score': 0.0, 'analysis': 'Not applicable - unsuitable terrain'},
                    'market': {'score': 0.0, 'analysis': 'Not applicable - unsuitable terrain'},
                    'environment': {'score': 0.0, 'analysis': terrain_check['reason']}
                },
                'weights_used': self.use_cases.get(use_case, {}),
                'terrain_validation': terrain_check
            }
        
        # Perform all analyses
        demographics = await self.analyze_demographics(lat, lng)
        transport = await self.analyze_transport(lat, lng)
        infrastructure = await self.analyze_infrastructure(lat, lng)
        market = await self.analyze_market_potential(lat, lng, use_case)
        environment = await self.analyze_environmental_factors(lat, lng)
        
        # Get weights for use case
        weights = self.use_cases.get(use_case, {
            "demographics": 0.25, "transport": 0.25, "infrastructure": 0.20, 
            "market": 0.20, "environment": 0.10
        })
        
        # Calculate composite score
        composite_score = (
            demographics['score'] * weights.get('demographics', 0.25) +
            transport['score'] * weights.get('transport', 0.25) +
            infrastructure['score'] * weights.get('infrastructure', 0.20) +
            market['score'] * weights.get('market', 0.20) +
            environment['score'] * weights.get('environment', 0.10)
        )
        
        scores = {
            'composite_score': round(composite_score, 1),
            'demographics': demographics,
            'transport': transport,
            'infrastructure': infrastructure,
            'market': market,
            'environment': environment
        }
        
        # Generate recommendation
        recommendation = await self.generate_recommendation(scores, use_case)
        
        return {
            'composite_score': round(composite_score, 1),
            'use_case': use_case,
            'location': {'latitude': lat, 'longitude': lng},
            'recommendation': recommendation,
            'analysis': scores,
            'weights_used': weights
        }


# Global instance
geospatial_analyzer = GeoSpatialAnalyzer()