#!/usr/bin/env python3
"""
Test script to run the enhanced_score functionality directly
"""
import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_enhanced_score():
    """Test the enhanced score functionality"""
    try:
        # Import the required modules
        from services.geospatial_analyzer import geospatial_analyzer
        from api.routes.enhanced_score import EnhancedScoreRequest
        
        print("✓ Successfully imported modules")
        
        # Create a test request
        test_request = EnhancedScoreRequest(
            lat=23.0225,  # Ahmedabad coordinates
            lng=72.5714,
            use_case="retail"
        )
        
        print(f"✓ Created test request: lat={test_request.lat}, lng={test_request.lng}, use_case={test_request.use_case}")
        
        # Call the analyze_site method directly
        result = await geospatial_analyzer.analyze_site(
            lat=test_request.lat,
            lng=test_request.lng,
            use_case=test_request.use_case
        )
        
        print("✓ Successfully executed enhanced score analysis")
        print(f"✓ Composite Score: {result.get('composite_score', 'N/A')}")
        print(f"✓ Recommendation: {result.get('recommendation', {}).get('verdict', 'N/A')}")
        
        return result
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    print("Testing Enhanced Score functionality...")
    print("=" * 50)
    
    result = asyncio.run(test_enhanced_score())
    
    if result:
        print("\n" + "=" * 50)
        print("✓ Enhanced Score code is working correctly!")
        print("✓ You can now run the FastAPI server with:")
        print("  uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
    else:
        print("\n" + "=" * 50)
        print("✗ There was an issue with the enhanced score code")