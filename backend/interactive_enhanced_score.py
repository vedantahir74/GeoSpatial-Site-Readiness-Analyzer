#!/usr/bin/env python3
"""
Interactive Enhanced Score Runner
"""
import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def interactive_enhanced_score():
    """Interactive enhanced score analysis"""
    try:
        from services.geospatial_analyzer import geospatial_analyzer
        from api.routes.enhanced_score import EnhancedScoreRequest
        
        print("🎯 INTERACTIVE ENHANCED SCORE ANALYZER")
        print("=" * 50)
        
        # Default test coordinates for Ahmedabad
        lat = 23.0225
        lng = 72.5714
        use_case = "retail"
        
        print(f"📍 Using coordinates: {lat}, {lng}")
        print(f"🏢 Use case: {use_case}")
        print("\n🔄 Running analysis...")
        
        # Run the analysis
        result = await geospatial_analyzer.analyze_site(
            lat=lat,
            lng=lng,
            use_case=use_case
        )
        
        print("\n" + "=" * 50)
        print("📊 ENHANCED SCORE RESULTS")
        print("=" * 50)
        print(f"🎯 Composite Score: {result['composite_score']}/100")
        print(f"📍 Location: {result['location']['latitude']}, {result['location']['longitude']}")
        print(f"🏢 Use Case: {result['use_case'].upper()}")
        
        recommendation = result['recommendation']
        print(f"\n✅ Recommendation: {recommendation['verdict']}")
        print(f"🔒 Confidence: {recommendation['confidence']}")
        print(f"💡 Action: {recommendation['action']}")
        print(f"📝 Summary: {recommendation['summary']}")
        
        # Show detailed analysis
        analysis = result['analysis']
        print(f"\n📈 DETAILED ANALYSIS:")
        print(f"   Demographics Score: {analysis.get('demographics', {}).get('score', 'N/A')}")
        print(f"   Transport Score: {analysis.get('transport', {}).get('score', 'N/A')}")
        print(f"   Infrastructure Score: {analysis.get('infrastructure', {}).get('score', 'N/A')}")
        print(f"   Market Score: {analysis.get('market', {}).get('score', 'N/A')}")
        print(f"   Environment Score: {analysis.get('environment', {}).get('score', 'N/A')}")
        
        # Show weights
        weights = result['weights_used']
        print(f"\n⚖️  WEIGHTS USED:")
        for factor, weight in weights.items():
            print(f"   {factor.capitalize()}: {weight}")
        
        print("\n" + "=" * 50)
        print("✅ ENHANCED SCORE CODE RUNNING SUCCESSFULLY!")
        print("=" * 50)
        
        return result
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = asyncio.run(interactive_enhanced_score())
    if result:
        print("\n🎉 Success! Enhanced Score code is working perfectly!")
    else:
        print("\n💥 Failed to run Enhanced Score code!")