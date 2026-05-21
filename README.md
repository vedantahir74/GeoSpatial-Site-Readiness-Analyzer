# GeoSpatial-Site-Readiness-Analyzer
# 🗺️ Gujarat Site Analyzer

A comprehensive web application for analyzing business site readiness across Gujarat, India. Get detailed insights on demographics, competition, and accessibility to make informed location decisions.

![Gujarat Site Analyzer](https://img.shields.io/badge/Status-Active-brightgreen)
![React](https://img.shields.io/badge/React-18.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Python](https://img.shields.io/badge/Python-3.x-yellow)

## 🌟 Features

### 📊 **Comprehensive Site Analysis**
- **Demographics Score**: Population density, income levels, working age percentage
- **Competition Analysis**: Nearby businesses, market saturation, anchor stores
- **Transport Access**: Highway proximity, road connectivity, accessibility ratings
- **Smart Recommendations**: AI-powered location suggestions based on business type

### 📱 **Responsive Design**
- **Desktop**: Full-featured side-by-side layout
- **Tablet**: Optimized stacked layout
- **Mobile**: Touch-friendly compact interface

### 🎯 **Business Intelligence**
- Multiple business types (Retail, Office, Warehouse, Restaurant, etc.)
- Real-time scoring algorithm
- Visual score breakdowns with progress bars
- Detailed location insights and recommendations

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Modern web browser

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/gujarat-site-analyzer.git
cd gujarat-site-analyzer
```

### 2. Start the Backend Server
```bash
cd backend
python simple_server.py
```
✅ Backend will run on `http://localhost:8000`

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend will run on `http://localhost:3000`

### 4. Open Your Browser
Navigate to `http://localhost:3000` and start analyzing sites!

## 🎮 How to Use

### 🖱️ **Interactive Map**
1. **Click anywhere** on the map to analyze that location
2. **Enter coordinates** manually in the sidebar
3. **Select business type** from the dropdown
4. **View detailed results** with comprehensive scoring

### 📍 **Sample Locations to Try**
- **Ahmedabad**: `23.0225, 72.5714`
- **Surat**: `21.1702, 72.8311`
- **Vadodara**: `22.3072, 73.1812`
- **Rajkot**: `22.3039, 70.8022`

### 📊 **Understanding Scores**
- **80-100**: Excellent location 
- **65-79**: Good location 
- **50-64**: Moderate location 
- **Below 50**: Poor location 


## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **MapLibre GL** - Interactive maps
- **Tailwind CSS** - Utility-first styling

### Backend
- **Python 3** - Server-side logic
- **HTTP Server** - Lightweight API server
- **JSON API** - RESTful data exchange
- **CORS Support** - Cross-origin requests



## 🎯 Business Use Cases

| Business Type | Key Factors | Ideal Score |
|--------------|-------------|-------------|
| 🏪 **Retail** | Demographics, Competition, Foot Traffic | 75+ |
| 🏢 **Office** | Transport, Infrastructure, Talent Pool | 70+ |
| 🏭 **Warehouse** | Highway Access, Land Cost, Logistics | 65+ |
| 🍽️ **Restaurant** | Demographics, Competition, Visibility | 80+ |
| 🏠 **Residential** | Schools, Safety, Amenities | 70+ |

## 🚨 Troubleshooting

### Backend Not Starting?
```bash
# Check if port 8000 is free
netstat -an | findstr :8000

# Try different port
python simple_server.py --port 8001
```

### Frontend Build Issues?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Map Not Loading?
- Check internet connection for online map tiles
- Switch to offline mode using the toggle button
- Ensure coordinates are within Gujarat bounds (20.0-24.8 lat, 68.0-74.6 lng)

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 🙏 Acknowledgments

- **OpenStreetMap** for map tiles
- **MapLibre GL** for mapping library
- **React Community** for excellent documentation
- **Gujarat Government** for geographic inspiration

</div>
