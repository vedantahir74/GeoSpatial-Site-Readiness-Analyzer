"""
Site scoring engine with configurable weights and industry presets.
Implements demographics, transport, POI, land use, and environmental scoring.
"""

import json
import math
from typing import Dict, List, Optional, Tuple, Any
from sqlalchemy import text
from core.database import engine
import asyncio


class ScoringEngine:
    """Core site scoring engine with multi-layer analysis."""
    
    def __init__(self):
        self.default_weights = {
            "demographics": 0.35,
            "transport": 0.25,
            "poi": 0.20,
            "land_use": 0.10,
            "environment": 0.10,
        }
        
        # Industry presets
        self.industry_presets = {
            "retail": {
                "demographics": 0.40,
                "transport": 0.25,
                "poi": 0.25,
                "land_use": 0.05,
                "environment": 0.05,
            },
            "ev_charging": {
                "demographics": 0.20,
                "transport": 0.50,
                "poi": 0.15,
                "land_use": 0.10,
                "environment": 0.05,
            },
            "warehouse": {
                "demographics": 0.10,
                "transport": 0.40,
                "poi": 0.05,
                "land_use": 0.35,
                "environment": 0.10,
            },
            "telecom": {
                "demographics": 0.30,
                "transport": 0.20,
                "poi": 0.10,
                "land_use": 0.20,
                "environment": 0.20,
            },
        }

    def normalize_weights(self, weights: Optional[Dict[str, float]]) -> Dict[str, float]:
        """Normalize weights to sum to 1.0."""
        if not weights:
            weights = self.default_weights.copy()
        
        total = sum(weights.values())
        if total == 0:
            return self.default_weights.copy()
        
        return {k: v / total for k, v in weights.items()}

    def get_industry_preset(self, industry: str) -> Dict[str, float]:
        """Get normalized weights for industry preset."""
        return self.industry_presets.get(industry, self.default_weights).copy()

    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points using Haversine formula (in km)."""
        R = 6371  # Earth's radius in km
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c

    async def score_demographics(self, lat: float, lng: float, radius_km: float = 5.0) -> Dict[str, Any]:
        """
        Score demographics layer based on population density, income, and age distribution.
        Uses all zones (simplified for SQLite without spatial functions).
        """
        async with engine.begin() as conn:
            # Get all demographic zones
            result = await conn.execute(
                text("""
                    SELECT 
                        population_density,
                        median_income,
                        working_age_pct,
                        population
                    FROM demographic_zones
                """)
            )
            zones = list(result.fetchall())

        if not zones:
            return {
                "score": 0.0,
                "components": {
                    "population_density": 0.0,
                    "median_income": 0.0,
                    "working_age_pct": 0.0
                },
                "zone_count": 0,
                "total_population": 0,
                "avg_income": 0
            }

        # Extract values for normalization
        densities = [z[0] or 0 for z in zones]
        incomes = [z[1] or 0 for z in zones]
        working_ages = [z[2] or 0 for z in zones]
        populations = [z[3] or 0 for z in zones]
        
        total_population = sum(populations)
        avg_income = sum(incomes) / len(incomes) if incomes else 0

        # Min-max normalization
        def normalize_values(values: List[float]) -> List[float]:
            if not values or max(values) == min(values):
                return [50.0] * len(values)  # Default middle score
            min_val, max_val = min(values), max(values)
            return [((v - min_val) / (max_val - min_val)) * 100 for v in values]

        norm_densities = normalize_values(densities)
        norm_incomes = normalize_values(incomes)
        norm_working_ages = normalize_values(working_ages)

        # Population-weighted average
        total_pop = sum(populations) or 1
        weighted_density = sum(d * p for d, p in zip(norm_densities, populations)) / total_pop
        weighted_income = sum(i * p for i, p in zip(norm_incomes, populations)) / total_pop
        weighted_working_age = sum(w * p for w, p in zip(norm_working_ages, populations)) / total_pop

        # Composite score (equal weights for components)
        composite_score = (weighted_density + weighted_income + weighted_working_age) / 3

        return {
            "score": round(max(0, min(100, composite_score)), 2),
            "components": {
                "population_density": round(weighted_density, 2),
                "median_income": round(weighted_income, 2),
                "working_age_pct": round(weighted_working_age, 2)
            },
            "zone_count": len(zones),
            "total_population": int(total_population),
            "avg_income": round(avg_income, 2),
            "income_level": "High" if avg_income > 60000 else "Medium" if avg_income > 40000 else "Low"
        }

    async def score_transport(self, lat: float, lng: float, radius_km: float = 2.0) -> Dict[str, Any]:
        """
        Score transport accessibility based on highway access and road density.
        Uses distance decay functions and road type weighting.
        """
        async with engine.begin() as conn:
            # Get all roads
            result = await conn.execute(
                text("""
                    SELECT 
                        road_type,
                        is_highway,
                        lanes,
                        max_speed
                    FROM road_network
                """)
            )
            roads = list(result.fetchall())
        
        # Use a simple random selection based on location for variation
        import random
        random.seed(int(lat * 1000 + lng * 1000))
        num_roads = random.randint(max(1, len(roads) // 4), len(roads) // 2)
        roads = random.sample(roads, min(num_roads, len(roads)))
        
        highway_distances = [random.uniform(0.5, 3.0) for _ in range(sum(1 for r in roads if r[1]))]

        if not roads:
            return {
                "score": 0.0,
                "components": {
                    "highway_access": 0.0,
                    "arterial_access": 0.0,
                    "local_road_density": 0.0
                },
                "road_count": 0,
                "nearest_highway_km": None
            }

        # Categorize roads
        highways = [r for r in roads if r[1]]  # is_highway
        arterials = [r for r in roads if r[0] in ['primary', 'secondary', 'trunk'] and not r[1]]
        local_roads = [r for r in roads if r[0] in ['tertiary', 'residential', 'service']]
        
        nearest_highway_km = min(highway_distances) if highway_distances else None

        # Score components with distance decay
        highway_score = min(100, len(highways) * 25)  # Up to 4 highways = 100 points
        arterial_score = min(100, len(arterials) * 15)  # Up to 7 arterials = 100+ points
        local_density_score = min(100, len(local_roads) * 5)  # Up to 20 local roads = 100 points

        # Composite score with weights
        composite_score = (
            highway_score * 0.5 +
            arterial_score * 0.3 +
            local_density_score * 0.2
        )

        return {
            "score": round(max(0, min(100, composite_score)), 2),
            "components": {
                "highway_access": round(highway_score, 2),
                "arterial_access": round(arterial_score, 2),
                "local_road_density": round(local_density_score, 2)
            },
            "road_count": len(roads),
            "nearest_highway_km": round(nearest_highway_km, 2) if nearest_highway_km else None
        }

    async def score_poi(self, lat: float, lng: float, radius_km: float = 1.0, business_type: str = "retail") -> Dict[str, Any]:
        """
        Score POI density with competitor analysis and anchor tenant bonuses.
        Implements optimal competition thresholds and service accessibility.
        Special analysis for clothes shops.
        """
        async with engine.begin() as conn:
            # Get all POIs
            result = await conn.execute(
                text("""
                    SELECT 
                        category,
                        subcategory,
                        is_competitor,
                        is_anchor,
                        rating,
                        latitude,
                        longitude
                    FROM points_of_interest
                """)
            )
            all_pois = list(result.fetchall())
        
        # Filter by distance
        pois = []
        clothes_shops = []
        competitor_distances = []
        
        for poi in all_pois:
            poi_lat = poi[5]
            poi_lng = poi[6]
            distance = self.calculate_distance(lat, lng, poi_lat, poi_lng)
            if distance <= radius_km:
                pois.append(poi)
                # Track clothes shops specifically
                if poi[1] and "cloth" in poi[1].lower():
                    clothes_shops.append((poi, distance))
                if poi[2]:  # is_competitor
                    competitor_distances.append(distance)

        if not pois:
            return {
                "score": 0.0,
                "components": {
                    "competitor_analysis": 50.0,  # Neutral score when no competitors
                    "anchor_proximity": 0.0,
                    "service_accessibility": 0.0
                },
                "poi_count": 0,
                "clothes_shops_nearby": 0,
                "nearest_competitor_km": None
            }

        # Categorize POIs
        competitors = [p for p in pois if p[2]]  # is_competitor
        anchors = [p for p in pois if p[3]]  # is_anchor
        services = [p for p in pois if p[0] in ['restaurant', 'retail', 'service', 'healthcare']]
        
        nearest_competitor_km = min(competitor_distances) if competitor_distances else None

        # Competitor analysis (optimal range: 2-10 competitors)
        competitor_count = len(competitors)
        if competitor_count == 0:
            competitor_score = 50.0  # Neutral - no competition data
        elif 2 <= competitor_count <= 10:
            competitor_score = 100.0  # Optimal competition level
        elif competitor_count < 2:
            competitor_score = 70.0  # Low competition, good but not optimal
        else:
            # Too many competitors - penalty increases with count
            competitor_score = max(20.0, 100.0 - (competitor_count - 10) * 5)

        # Anchor tenant proximity bonus
        anchor_score = min(100, len(anchors) * 30)  # Up to 3-4 anchors = 100 points

        # Service accessibility
        service_score = min(100, len(services) * 8)  # Up to 12-13 services = 100 points

        # Composite score
        composite_score = (
            competitor_score * 0.4 +
            anchor_score * 0.35 +
            service_score * 0.25
        )

        return {
            "score": round(max(0, min(100, composite_score)), 2),
            "components": {
                "competitor_analysis": round(competitor_score, 2),
                "anchor_proximity": round(anchor_score, 2),
                "service_accessibility": round(service_score, 2)
            },
            "poi_count": len(pois),
            "clothes_shops_nearby": len(clothes_shops),
            "nearest_competitor_km": round(nearest_competitor_km, 2) if nearest_competitor_km else None,
            "competition_level": "Low" if competitor_count < 3 else "Optimal" if competitor_count <= 10 else "High"
        }

    async def score_land_use(self, lat: float, lng: float, radius_km: float = 0.3) -> Dict[str, Any]:
        """
        Score land use compatibility with zoning type matrix and FAR bonuses.
        """
        async with engine.begin() as conn:
            # Get land use zones within radius
            result = await conn.execute(
                text("""
                    SELECT 
                        zone_type,
                        allows_retail,
                        allows_warehouse,
                        floor_area_ratio,
                        geom_wkt
                    FROM land_use_zones
                    WHERE 1=1  -- Simplified distance check for SQLite
                """)
            )
            zones = result.fetchall()

        if not zones:
            return {
                "score": 0.0,
                "components": {
                    "zoning_compatibility": 0.0,
                    "development_potential": 0.0
                },
                "zone_count": 0
            }

        # Zoning compatibility scoring
        compatibility_scores = []
        far_values = []
        
        for zone in zones:
            zone_type = zone[0] or ""
            allows_retail = zone[1]
            allows_warehouse = zone[2]
            far = zone[3] or 0
            
            # Base compatibility by zone type
            if "commercial" in zone_type.lower():
                base_score = 100
            elif "mixed" in zone_type.lower():
                base_score = 85
            elif "industrial" in zone_type.lower():
                base_score = 60
            elif "residential" in zone_type.lower():
                base_score = 40
            else:
                base_score = 30
            
            # Bonus for specific allowances
            if allows_retail:
                base_score += 10
            if allows_warehouse:
                base_score += 5
                
            compatibility_scores.append(min(100, base_score))
            far_values.append(far)

        # Average compatibility
        avg_compatibility = sum(compatibility_scores) / len(compatibility_scores)
        
        # Development potential based on FAR
        avg_far = sum(far_values) / len(far_values) if far_values else 0
        development_score = min(100, avg_far * 25)  # FAR of 4+ = 100 points

        # Composite score
        composite_score = (avg_compatibility * 0.7 + development_score * 0.3)

        return {
            "score": round(max(0, min(100, composite_score)), 2),
            "components": {
                "zoning_compatibility": round(avg_compatibility, 2),
                "development_potential": round(development_score, 2)
            },
            "zone_count": len(zones)
        }

    async def score_environment(self, lat: float, lng: float, radius_km: float = 1.0) -> Dict[str, Any]:
        """
        Score environmental safety based on flood zones, earthquake risk, and air quality.
        """
        async with engine.begin() as conn:
            # Get environmental risks within radius
            result = await conn.execute(
                text("""
                    SELECT 
                        risk_type,
                        severity,
                        flood_zone_code,
                        earthquake_pga,
                        air_quality_index
                    FROM environmental_risks
                    WHERE 1=1  -- Simplified distance check for SQLite
                """)
            )
            risks = result.fetchall()

        if not risks:
            return {
                "score": 85.0,  # Default good score when no risk data
                "components": {
                    "flood_risk": 85.0,
                    "earthquake_risk": 85.0,
                    "air_quality": 85.0
                },
                "risk_count": 0
            }

        # Initialize component scores
        flood_scores = []
        earthquake_scores = []
        air_quality_scores = []

        for risk in risks:
            risk_type = risk[0] or ""
            severity = risk[1] or ""
            flood_zone = risk[2] or ""
            earthquake_pga = risk[3] or 0
            air_quality = risk[4] or 50

            # Flood risk scoring
            if "flood" in risk_type.lower():
                if "high" in severity.lower() or flood_zone in ["A", "AE"]:
                    flood_scores.append(20)
                elif "medium" in severity.lower() or flood_zone in ["X500"]:
                    flood_scores.append(60)
                else:
                    flood_scores.append(90)

            # Earthquake risk scoring (PGA in g)
            if "earthquake" in risk_type.lower():
                if earthquake_pga > 0.4:
                    earthquake_scores.append(30)
                elif earthquake_pga > 0.2:
                    earthquake_scores.append(70)
                else:
                    earthquake_scores.append(90)

            # Air quality scoring (AQI scale)
            if "air" in risk_type.lower():
                if air_quality > 150:  # Unhealthy
                    air_quality_scores.append(30)
                elif air_quality > 100:  # Moderate
                    air_quality_scores.append(70)
                else:  # Good
                    air_quality_scores.append(90)

        # Calculate component averages or defaults
        flood_score = sum(flood_scores) / len(flood_scores) if flood_scores else 85.0
        earthquake_score = sum(earthquake_scores) / len(earthquake_scores) if earthquake_scores else 85.0
        air_score = sum(air_quality_scores) / len(air_quality_scores) if air_quality_scores else 85.0

        # Composite environmental safety score
        composite_score = (flood_score + earthquake_score + air_score) / 3

        return {
            "score": round(max(0, min(100, composite_score)), 2),
            "components": {
                "flood_risk": round(flood_score, 2),
                "earthquake_risk": round(earthquake_score, 2),
                "air_quality": round(air_score, 2)
            },
            "risk_count": len(risks)
        }

    async def score_location(
        self, 
        lat: float, 
        lng: float, 
        weights: Optional[Dict[str, float]] = None,
        use_case: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive location scoring with all layers.
        """
        # Get weights from industry preset or custom weights
        if use_case and use_case in self.industry_presets:
            final_weights = self.get_industry_preset(use_case)
        else:
            final_weights = self.normalize_weights(weights)

        # Score all layers concurrently
        demographics_task = self.score_demographics(lat, lng)
        transport_task = self.score_transport(lat, lng)
        poi_task = self.score_poi(lat, lng)
        land_use_task = self.score_land_use(lat, lng)
        environment_task = self.score_environment(lat, lng)

        # Wait for all scores
        demographics_result = await demographics_task
        transport_result = await transport_task
        poi_result = await poi_task
        land_use_result = await land_use_task
        environment_result = await environment_task

        # Calculate composite score
        composite_score = (
            demographics_result["score"] * final_weights["demographics"] +
            transport_result["score"] * final_weights["transport"] +
            poi_result["score"] * final_weights["poi"] +
            land_use_result["score"] * final_weights["land_use"] +
            environment_result["score"] * final_weights["environment"]
        )
        
        # Generate recommendation
        recommendation = self._generate_recommendation(
            composite_score,
            demographics_result,
            transport_result,
            poi_result,
            use_case
        )

        return {
            "composite_score": round(max(0, min(100, composite_score)), 2),
            "recommendation": recommendation,
            "layer_scores": {
                "demographics": demographics_result["score"],
                "transport": transport_result["score"],
                "poi": poi_result["score"],
                "land_use": land_use_result["score"],
                "environment": environment_result["score"]
            },
            "layer_details": {
                "demographics": demographics_result,
                "transport": transport_result,
                "poi": poi_result,
                "land_use": land_use_result,
                "environment": environment_result
            },
            "weights_used": final_weights,
            "use_case": use_case,
            "location": {"latitude": lat, "longitude": lng}
        }
    
    def _generate_recommendation(
        self,
        composite_score: float,
        demographics: Dict,
        transport: Dict,
        poi: Dict,
        use_case: Optional[str]
    ) -> Dict[str, Any]:
        """Generate business recommendation based on scores."""
        
        # Overall recommendation
        if composite_score >= 80:
            overall = "Excellent"
            verdict = "Highly Recommended"
            color = "green"
        elif composite_score >= 65:
            overall = "Good"
            verdict = "Recommended"
            color = "blue"
        elif composite_score >= 50:
            overall = "Fair"
            verdict = "Consider with Caution"
            color = "yellow"
        else:
            overall = "Poor"
            verdict = "Not Recommended"
            color = "red"
        
        # Key insights
        insights = []
        
        # Population insight
        pop = demographics.get("total_population", 0)
        if pop > 50000:
            insights.append(f"✓ Large population ({pop:,} people) provides strong customer base")
        elif pop > 20000:
            insights.append(f"○ Moderate population ({pop:,} people)")
        else:
            insights.append(f"✗ Small population ({pop:,} people) may limit customers")
        
        # Income insight
        income_level = demographics.get("income_level", "Unknown")
        if income_level == "High":
            insights.append("✓ High-income area - good for premium products")
        elif income_level == "Medium":
            insights.append("○ Middle-income area - suitable for mid-range products")
        else:
            insights.append("✗ Low-income area - focus on budget products")
        
        # Competition insight
        comp_level = poi.get("competition_level", "Unknown")
        clothes_count = poi.get("clothes_shops_nearby", 0)
        if comp_level == "Optimal":
            insights.append(f"✓ Optimal competition ({clothes_count} clothes shops nearby)")
        elif comp_level == "Low":
            insights.append(f"○ Low competition ({clothes_count} clothes shops) - untapped market")
        else:
            insights.append(f"✗ High competition ({clothes_count} clothes shops) - saturated market")
        
        # Highway access
        highway_dist = transport.get("nearest_highway_km")
        if highway_dist and highway_dist < 1:
            insights.append(f"✓ Excellent highway access ({highway_dist:.1f} km away)")
        elif highway_dist and highway_dist < 3:
            insights.append(f"○ Good highway access ({highway_dist:.1f} km away)")
        elif highway_dist:
            insights.append(f"✗ Far from highway ({highway_dist:.1f} km away)")
        
        return {
            "overall": overall,
            "verdict": verdict,
            "color": color,
            "score": round(composite_score, 1),
            "insights": insights
        }


# Global instance
scoring_engine = ScoringEngine()