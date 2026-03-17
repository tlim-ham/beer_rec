# Quick Start Guide

## Directory Layout

The reorganized `nanobrewery-app` folder follows industry-standard structure:

```
nanobrewery-app/
├── server/              ← FastAPI Backend
├── client/              ← React Frontend  
├── models/              ← ML Models
├── data/                ← Beer Database
├── README.md            ← Full Documentation
├── Makefile             ← Common Commands
├── docker-compose.yml   ← Docker Setup
└── .env.example         ← Environment Template
```

## Getting Started (5 minutes)

### 1. Setup Environment

```bash
cd nanobrewery-app

# Copy environment template
cp .env.example server/beer_backend/.env

# Edit .env and add your Gemini API key
```

### 2. Start Backend

```bash
cd server/beer_backend

# Create virtual environment (first time only)
python -m venv venv
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8002
```

Backend ready at: **http://localhost:8002**

### 3. Start Frontend (new terminal)

```bash
cd nanobrewery-app/client/nano-beer

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

Frontend ready at: **http://localhost:5175**

## Common Tasks

### Using Make (macOS/Linux)

```bash
cd nanobrewery-app

make help          # Show all commands
make setup         # Install all dependencies
make backend       # Start backend only
make frontend      # Start frontend only
make dev           # Start both (requires 2 terminals)
make clean         # Remove cache/node_modules
```

### File Paths to Update

If you move the `nanobrewery-app` folder, update paths in:

1. `server/beer_backend/.env`
   - `MODEL_PATH` - path to `beer_multioutput_classifier.pkl`
   - `ENCODERS_PATH` - path to `label_encoders.pkl`
   - `BEER_XLSX_PATH` - path to `Beer_data (1).xlsx`

2. `client/nano-beer/src/App.jsx`
   - `API_BASE` - set to your backend URL

## Project Structure Explanation

### `/server` - Backend API
- **main.py** - FastAPI app entry point
- **routes/** - API endpoints (recommend, chat, beers)
- **services/** - Business logic (models, LLM, beer database)
- **utils/schemas.py** - Request/response validation
- **config.py** - Settings and environment config

### `/client` - Frontend UI
- **src/App.jsx** - Main React component with all pages
- **package.json** - NPM dependencies
- **public/** - Static assets

### `/models` - ML Models
- **beer_multioutput_classifier.pkl** - XGBoost MultiOutputClassifier
- **label_encoders.pkl** - Label encoders for predictions

### `/data` - Datasets
- **Beer_data (1).xlsx** - 3,197 beers with 30 attributes

## API Quick Reference

```bash
# Get recommendations
curl -X POST http://localhost:8002/api/v1/recommend \
  -H "Content-Type: application/json" \
  -d '{"flavor_profile":{"Body":60,"Alcohol":40,...}}'

# Chat about recommendations
curl -X POST http://localhost:8002/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id":"abc123","message":"Tell me more"}'

# Get all beers
curl http://localhost:8002/api/v1/beers

# Health check
curl http://localhost:8002/health
```

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (should be 3.8+)
- Verify `requirements.txt` installed: `pip list | grep fastapi`
- Check port 8002 isn't in use: `lsof -i :8002`

### Frontend won't start
- Check Node version: `node --version` (should be 14+)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules && npm install`

### API connection errors
- Ensure backend is running on port 8002
- Check `API_BASE` in `client/nano-beer/src/App.jsx`
- CORS should be enabled in FastAPI backend

## Next Steps

1. Read full `README.md` for comprehensive documentation
2. Check `server/beer_backend/main.py` to understand API structure
3. Explore `client/nano-beer/src/App.jsx` for frontend logic
4. Review `DEPLOYMENT.md` when ready for production

---

**All original files are still in their original locations** (`/app`, `/nano-beer`, `/data`, `/ml_model`).  
This `nanobrewery-app` folder is your organized working directory for development and deployment.
