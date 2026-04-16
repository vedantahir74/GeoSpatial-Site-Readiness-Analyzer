#!/usr/bin/env python3
"""Test script for the scoring engine."""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from services.scoring_engine import scoring_engine


async def test_scoring():
    """Test the scoring engine with sample coordinates."""
    # Test coordinates in Ahmedabad area
    lat, lng = 23.0225, 72.5714
    
    print(f"Testing scoring engine at coordinates: {lat}, {lng}")
    print("=" * 60)
    
    # Test individual layer scoring
    print("Testing individual layers:")
    
    demographics = await scoring_engine.score_demographics(lat, lng)
    print(f"Demographics: {demographics['score']:.1f} (zones: {demographics['zone_count']})")
    
    transport = await scoring_engine.score_transport(lat, lng)
    print(f"Transport: {transport['score']:.1f} (roads: {transport['road_count']})")
    
    poi = await scoring_engine.score_poi(lat, lng)
    print(f"POI: {poi['score']:.1f} (pois: {poi['poi_count']})")
    
    land_use = await scoring_engine.score_land_use(lat, lng)
    print(f"Land Use: {land_use['score']:.1f} (zones: {land_use['zone_count']})")
    
    environment = await scoring_engine.score_environment(lat, lng)
    print(f"Environment: {environment['score']:.1f} (risks: {environment['risk_count']})")
    
    print("\n" + "=" * 60)
    
    # Test composite scoring with different use cases
    print("Testing composite scoring:")
    
    # Default weights
    result = await scoring_engine.score_location(lat, lng)
    print(f"Default: {result['composite_score']:.1f}")
    
    # Industry presets
    for use_case in ["retail", "ev_charging", "warehouse", "telecom"]:
        result = await scoring_engine.score_location(lat, lng, use_case=use_case)
        print(f"{use_case.title()}: {result['composite_score']:.1f}")
    
    print("\n" + "=" * 60)
    print("Scoring engine test completed successfully!")


if __name__ == "__main__":
    asyncio.run(test_scoring())