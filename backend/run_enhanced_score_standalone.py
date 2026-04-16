#!/usr/bin/env python3
"""
Standalone script to run the enhanced_score functionality directly
"""
import asyncio
import sys
import os
import json

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def run_enhanced_score_analysis():
    """Run enhanced score analysis directly"""
    print("=" * 60)
    print("🚀 RUNNING ENHANCED SCORE CODE DIRECTLY")
    print("=" * 60)
    
    try:
        # Import the enhanced score components
        from services.geospatial_analyzer import geospatial_analyzer
        from api.routes.enhanced_score import EnhancedScoreRequest, get_enhanced_score
        
        print("✅ Successfully imported enhanced score modules")
        
        # Test different locations and use cases
        test_cases = [
            {"lat": 23.0225, "lng": 72.5714, "use_case": "retail", "location": "Ahmedabad City Center"},
            {"lat": 23.0300, "lng": 72.5800, "use_case": "office", "location": "Ahmedabad Business District"},
            {"lat": 23.0150, "lng": 72.5600, "use_case": "warehouse", "location": "Ahmedabad Industrial Area"},
            {"lat": 23.0400, "lng": 72.5900, "use_case": "restaurant", "location": "Ahmedabad Commercial Zone"}
        ]
        
        print(f"\n🔍 Running {len(test_cases)} test cases...")
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n--- Test Case {i}: {test_case['location']} ---")
            
            # Create request object
            request = EnhancedScoreRequest(
                lat=test_case["lat"],
                lng=test_case["lng"],
                use_case=test_case["use_case"]
            )
            
            # Call the enhanced score function
            result = await get_enhanced_score(request)
            
            # Display results
            print(f"📍 Location: {test_case['location']}")
            print(f"📊 Use Case: {test_case['use_case'].upper()}")
            print(f"🎯 Composite Score: {result['composite_score']}")
            print(f"✅ Recommendation: {result['recommendation']['verdict']}")
            print(f"🔒 Confidence: {result['recommendation']['confidence']}")
            print(f"💡 Action: {result['recommendation']['action']}")
            
            # Show weights used
            weights = result['weights_used']
            print(f"⚖️  Weights: Demographics({weights['demographics']}) Transport({weights['transport']}) POI({weights['poi']}) Land({weights['land_use']}) Env({weights['environment']})")
            
        print("\n" + "=" * 60)
        print("✅ ENHANCED SCORE CODE EXECUTED SUCCESSFULLY!")
        print("✅ All test cases completed without errors")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Starting Enhanced Score Standalone Execution...")
    success = asyncio.run(run_enhanced_score_analysis())
    
    if success:
        print("\n🎉 Enhanced Score code ran successfully!")
        exit(0)
    else:
        print("\n💥 Enhanced Score code failed to run!")
        exit(1)