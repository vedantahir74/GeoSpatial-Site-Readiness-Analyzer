#!/usr/bin/env python3
"""
Simple FastAPI Server for Gujarat Site Analyzer with Mock Data
"""
import random
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Gujarat Site Analyzer API",
    description="Enhanced site scoring and analysis for Gujarat locations",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_mock_score_data(lat: float, lng: float, use_case: str) -> Dict[str, Any]:
    """Generate realistic mock data for site scoring"""
    
    # Base scores with some randomization
    base_demo_score = random.randint(60, 95)
    base_transport_score = random.randint(55, 90)
    base_shops_score = random.randint(45, 85)
    
    # Adjust based on location (rough Gujarat city detection)
    if 23.0 <= lat <= 23.1 and 72.5 <= lng <= 72.6:  # Ahmedabad area
        base_demo_score += 10
        base_transport_score += 15
        base_shops_score += 5
        city_name = "Ahmedabad"
    elif 21.1 <= lat <= 21.2 and 72.8 <= lng <= 72.9:  # Surat area
        base_demo_score += 8
        base_transport_score += 10
        base_shops_score += 8
        city_name = "Surat"
    elif 22.2 <= lat <= 22.4 and 73.1 <= lng <= 73.2:  # Vadodara area
        base_demo_score += 5
        base_transport_score += 8
        base_shops_score += 3
        city_name = "Vadodara"
    else:
        city_name = "Gujarat"
    
    # Cap scores at 100
    demo_score = min(100, base_demo_score)
    transport_score = min(100, base_transport_score)
    shops_score = min(100, base_shops_score)
    
    # Calculate composite score
    composite_score = round((demo_score * 0.40 + shops_score * 0.35 + transport_score * 0.25), 2)
    
    # Generate demographics data
    population = random.randint(50000, 500000)
    avg_income = random.randint(35000, 80000)
    
    if avg_income > 60000:
        income_level = "High Income (Rich)"
    elif avg_income > 40000:
        income_level = "Middle Income"
    else:
        income_level = "Low Income (Poor)"
    
    # Generate shops data
    clothes_shops = random.randint(2, 20)
    total_retail = random.randint(15, 80)
    anchor_stores = random.randint(0, 5)
    
    if clothes_shops <= 3:
        competition_level = "Low Competition (Good)"
    elif clothes_shops <= 8:
        competition_level = "Moderate Competition (Optimal)"
    elif clothes_shops <= 15:
        competition_level = "High Competition (Challenging)"
    else:
        competition_level = "Very High Competition (Saturated)"
    
    # Generate transport data
    highway_distance = round(random.uniform(0.5, 8.0), 1)
    
    if highway_distance < 1:
        access_level = "Excellent (< 1km)"
    elif highway_distance < 3:
        access_level = "Very Good (1-3km)"
    elif highway_distance < 5:
        access_level = "Good (3-5km)"
    else:
        access_level = "Moderate (> 5km)"
    
    # Generate recommendation
    if composite_score >= 80:
        recommendation = "EXCELLENT LOCATION"
        reason = f"This is an ideal location for a {use_case} business. {income_level} area with {population:,} people nearby, {competition_level.lower()}, and {access_level.lower()} highway access."
        action = "Strongly recommended to proceed with this location."
    elif composite_score >= 65:
        recommendation = "GOOD LOCATION"
        reason = f"This is a good location with {population:,} potential customers. {competition_level}. Consider the {clothes_shops} existing clothes shops as both competition and validation of market demand."
        action = "Recommended with minor considerations."
    elif composite_score >= 50:
        recommendation = "MODERATE LOCATION"
        reason = f"Mixed indicators: {income_level} area, {competition_level.lower()}. Highway is {highway_distance}km away."
        action = "Proceed with caution. Consider market research."
    else:
        recommendation = "POOR LOCATION"
        reason = f"Challenging location: {income_level} area with {clothes_shops} competing clothes shops. Limited accessibility."
        action = "Not recommended. Look for better locations."
    
    return {
        "composite_score": composite_score,
        "use_case": use_case,
        "business_type": use_case,
        "location": {
            "latitude": lat,
            "longitude": lng
        },
        "demographics": {
            "score": demo_score,
            "total_population": population,
            "avg_income": avg_income,
            "income_level": income_level,
            "avg_density": random.randint(2000, 15000),
            "working_age_pct": random.randint(55, 75),
            "zones_analyzed": random.randint(3, 8)
        },
        "shops": {
            "score": shops_score,
            "clothes_shops_nearby": clothes_shops,
            "total_retail": total_retail,
            "competitors": random.randint(5, 25),
            "anchor_stores": anchor_stores,
            "competition_level": competition_level
        },
        "transport": {
            "score": transport_score,
            "closest_highway_km": highway_distance,
            "closest_highway_name": f"NH-{random.randint(8, 48)} ({city_name} Highway)",
            "highway_access_level": access_level,
            "highways_nearby": random.randint(1, 4),
            "major_roads_nearby": random.randint(3, 12)
        },
        "recommendation": {
            "recommendation": recommendation,
            "reason": reason,
            "action": action
        }
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Gujarat Site Analyzer API",
        "version": "1.0.0",
        "status": "running",
        "note": "Using mock data for demonstration"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "gujarat-site-analyzer"}

@app.post("/api/v1/enhanced/score")
async def get_enhanced_score(request: dict) -> Dict[str, Any]:
    """
    Get enhanced site score for a location
    """
    try:
        lat = float(request.get("lat", 0))
        lng = float(request.get("lng", 0))
        use_case = request.get("use_case", "retail")
        
        # Validate coordinates are within Gujarat bounds
        if not (20.0 <= lat <= 24.8 and 68.0 <= lng <= 74.6):
            raise HTTPException(
                status_code=400,
                detail="Coordinates must be within Gujarat bounds (Lat: 20.0-24.8, Lng: 68.0-74.6)"
            )
        
        # Generate mock data
        result = generate_mock_score_data(lat, lng, use_case)
        
        return result
        
    except Exception as e:
        print(f"Error in enhanced score endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/v1/score")
async def get_basic_score(request: dict) -> Dict[str, Any]:
    """
    Get basic site score for a location (legacy endpoint)
    """
    try:
        lat = float(request.get("lat", 0))
        lng = float(request.get("lng", 0))
        
        # Use enhanced scoring with default retail use case
        result = generate_mock_score_data(lat, lng, "retail")
        
        # Return simplified format for legacy compatibility
        return {
            "score": result["composite_score"],
            "lat": lat,
            "lng": lng,
            "details": {
                "demographics": result["demographics"]["score"],
                "transport": result["transport"]["score"],
                "competition": result["shops"]["score"]
            }
        }
        
    except Exception as e:
        print(f"Error in basic score endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Gujarat Site Analyzer API Server...")
    print("📍 Serving enhanced site scoring for Gujarat locations")
    print("🌐 API will be available at: http://localhost:8000")
    print("📚 API docs will be available at: http://localhost:8000/docs")
    print("⚠️  Note: Using mock data for demonstration purposes")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )