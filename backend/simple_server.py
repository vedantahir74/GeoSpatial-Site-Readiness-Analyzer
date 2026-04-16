#!/usr/bin/env python3
"""
Simple HTTP Server for Gujarat Site Analyzer with Mock Data
"""
import json
import random
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

class CORSHTTPRequestHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            response = {
                "message": "Gujarat Site Analyzer API",
                "version": "1.0.0",
                "status": "running",
                "note": "Using mock data for demonstration"
            }
            self.wfile.write(json.dumps(response).encode())
        
        elif parsed_path.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            response = {"status": "healthy", "service": "gujarat-site-analyzer"}
            self.wfile.write(json.dumps(response).encode())
        
        else:
            self.send_response(404)
            self._set_cors_headers()
            self.end_headers()
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/v1/enhanced/score':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
                
                lat = float(request_data.get('lat', 0))
                lng = float(request_data.get('lng', 0))
                use_case = request_data.get('use_case', 'retail')
                
                # Validate coordinates
                if not (20.0 <= lat <= 24.8 and 68.0 <= lng <= 74.6):
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self._set_cors_headers()
                    self.end_headers()
                    error = {"detail": "Coordinates must be within Gujarat bounds (Lat: 20.0-24.8, Lng: 68.0-74.6)"}
                    self.wfile.write(json.dumps(error).encode())
                    return
                
                # Generate mock data
                result = self.generate_mock_score_data(lat, lng, use_case)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                error = {"detail": f"Internal server error: {str(e)}"}
                self.wfile.write(json.dumps(error).encode())
        
        else:
            self.send_response(404)
            self._set_cors_headers()
            self.end_headers()
    
    def generate_mock_score_data(self, lat, lng, use_case):
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

def run_server():
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, CORSHTTPRequestHandler)
    print("🚀 Starting Gujarat Site Analyzer API Server...")
    print("📍 Serving enhanced site scoring for Gujarat locations")
    print("🌐 API available at: http://localhost:8000")
    print("⚠️  Note: Using mock data for demonstration purposes")
    print("🔄 Server running... Press Ctrl+C to stop")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.server_close()

if __name__ == "__main__":
    run_server()