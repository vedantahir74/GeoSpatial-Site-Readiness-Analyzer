<<<<<<< HEAD
# 🌍 GeoSpatial Site Readiness Analyzer

A professional AI-powered location intelligence platform for commercial real estate and infrastructure site selection. Analyze any location in Ahmedabad, Gujarat, India and get comprehensive site readiness scores based on demographics, transport, infrastructure, market potential, and environmental factors.

![Project Status](https://img.shields.io/badge/Status-Ready%20to%20Run-brightgreen)
![Backend](https://img.shields.io/badge/Backend-FastAPI%20Python-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20TypeScript-blue)
![Database](https://img.shields.io/badge/Database-SQLite-lightgrey)

## 🚀 Quick Start

### Option 1: Automated Setup (Windows)
1. Double-click `run_project.bat`
2. Wait for setup to complete
3. Browser will open automatically at `http://localhost:3000`

### Option 2: Automated Setup (Linux/Mac)
```bash
chmod +x run_project.sh
./run_project.sh
```

### Option 3: Manual Setup
See detailed instructions in [SETUP_AND_RUN_GUIDE.md](SETUP_AND_RUN_GUIDE.md)

## 🎯 How to Use

1. **Open the application** at `http://localhost:3000`
2. **Click anywhere on the map** to analyze that location
3. **View comprehensive results** including:
   - Overall site readiness score (0-100)
   - Professional recommendation
   - Detailed analysis across 5 categories
4. **Test different locations** to see score variations

## ✨ Features

- 🗺️ **Interactive Map**: Click-to-analyze any location in Ahmedabad
- 📊 **Comprehensive Scoring**: 5-category analysis system
- 🎯 **Multiple Use Cases**: Retail, office, warehouse, restaurant, residential, industrial
- ⚡ **Real-time Analysis**: Instant results with professional recommendations
- 🎨 **Professional UI**: Clean, responsive interface
- 📈 **Location Variation**: Different coordinates return different scores

## 🏗️ Architecture

- **Backend**: FastAPI (Python) with SQLite database
- **Frontend**: React + TypeScript + Vite
- **Map**: MapLibre GL JS with OpenStreetMap tiles
- **Analysis**: 5-dimensional scoring algorithm with location-based variation

## 📊 Scoring Categories

1. **Demographics (40%)**: Population, income, age distribution
2. **Transport (25%)**: Highway access, airport/railway connectivity
3. **Infrastructure (20%)**: Power, water, internet, waste management
4. **Market (20%)**: Competition analysis, market opportunity
5. **Environment (10%)**: Flood risk, air quality, safety factors

## 🎯 Use Cases

- **Retail**: Optimized for foot traffic and demographics
- **Office**: Focused on transport and infrastructure
- **Warehouse**: Emphasizes transport and land use
- **Restaurant**: Balances demographics and accessibility
- **Residential**: Considers environment and amenities
- **Industrial**: Prioritizes transport and land use

## 🔧 Requirements

- Python 3.8+
- Node.js 16+
- Modern web browser
- Internet connection (for map tiles)

## 📁 Project Structure

```
Test-2_kiro/
├── 🚀 run_project.bat          # Windows auto-setup
├── 🚀 run_project.sh           # Linux/Mac auto-setup
├── 📖 SETUP_AND_RUN_GUIDE.md   # Detailed setup guide
├── backend/                     # Python FastAPI backend
│   ├── main.py                 # Application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── services/               # Business logic
│   └── api/                    # REST API routes
└── frontend/                   # React TypeScript frontend
    ├── src/                    # Source code
    ├── package.json            # Node.js dependencies
    └── public/                 # Static assets
```

## 🌟 Sample Results

**High Score Location (80+)**:
- Verdict: "HIGHLY RECOMMENDED"
- Strong demographics and excellent transport access
- Low competition with good infrastructure

**Medium Score Location (50-79)**:
- Verdict: "RECOMMENDED" or "CONDITIONALLY SUITABLE"
- Good potential with some considerations
- Balanced across multiple factors

**Low Score Location (<50)**:
- Verdict: "CHALLENGING" or "NOT RECOMMENDED"
- Significant limitations in key areas
- Consider alternative locations

## 🔍 API Endpoints

- `GET /health` - System health check
- `POST /api/v1/enhanced/score` - Analyze location
- `GET /docs` - Interactive API documentation

## 🛠️ Troubleshooting

**Map not loading?**
- Check internet connection
- Ensure both servers are running
- Check browser console for errors

**No scores appearing?**
- Verify backend is running on port 8000
- Check API health at `http://localhost:8000/health`
- Look for CORS errors in browser console

**Setup issues?**
- See detailed troubleshooting in [SETUP_AND_RUN_GUIDE.md](SETUP_AND_RUN_GUIDE.md)

## 🎉 Success Indicators

✅ Backend running: `http://localhost:8000/health` returns "healthy"  
✅ Frontend running: `http://localhost:3000` loads the map  
✅ System working: Clicking map shows analysis results  
✅ Location variation: Different coordinates return different scores  

## 📞 Support

If you encounter issues:
1. Check the [SETUP_AND_RUN_GUIDE.md](SETUP_AND_RUN_GUIDE.md) for detailed troubleshooting
2. Verify all prerequisites are installed
3. Check terminal/console logs for error messages
4. Ensure both backend and frontend servers are running

---

**Ready to analyze geospatial site readiness? Run the application and start exploring! 🌍📊**
=======
# GeoSpatial-Site-Readiness-Analyzer
>>>>>>> 7c3821a1d279f2f34f8b8023fa86b1148d41458c
