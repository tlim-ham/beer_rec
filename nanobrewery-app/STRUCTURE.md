# Project Structure Overview

## Industry-Standard Organization

This project follows the **full-stack application** pattern commonly used in production environments.

### Root Level
```
nanobrewery-app/
├── README.md           # Main project documentation
├── QUICKSTART.md       # Getting started guide
├── STRUCTURE.md        # This file
├── Makefile            # Development shortcuts
├── docker-compose.yml  # Container orchestration
└── .env.example        # Environment template
```

## Directory Organization

### `/server` - Backend Services
The FastAPI backend responsible for ML predictions and API endpoints.

```
server/beer_backend/
├── main.py                          # Application entry point
├── config.py                        # Configuration & settings
├── dependencies.py                  # Dependency injection
├── requirements.txt                 # Python dependencies
├── .env                             # Environment config (create from .env.example)
├── routes/
│   └── recommendation.py            # API endpoints
├── services/
│   ├── model_service.py            # XGBoost model wrapper
│   ├── beer_service.py             # Beer database queries
│   ├── llm_service.py              # Gemini API integration
│   └── recommendation_pipeline.py   # Orchestration logic
├── utils/
│   └── schemas.py                  # Pydantic models
├── models/                          # ML model files (symlink)
└── data/                            # Data files (symlink)
```

**Key Responsibilities:**
- API routing and request validation
- ML model inference
- Beer database management
- LLM chat integration
- Session management

### `/client` - Frontend Application
React + Vite frontend for user interaction.

```
client/nano-beer/
├── src/
│   ├── App.jsx                     # Main component (entire app)
│   ├── main.jsx                    # React entry point
│   └── App.css                     # Styling
├── public/
│   └── vite.svg                    # Assets
├── package.json                    # NPM dependencies
├── vite.config.js                  # Vite configuration
├── index.html                      # HTML template
└── node_modules/                   # Dependencies (generated)
```

**Key Features:**
- Flavor profile selection (10 dimensions)
- Real-time slider interaction
- Chat interface for recommendations
- Browser history integration
- Hover tooltips for education

### `/models` - Machine Learning
Pre-trained XGBoost models for beer classification.

```
models/
├── beer_multioutput_classifier.pkl                  # Multi-task XGBoost classifier
│                                   # Predicts: cluster + style
├── label_encoders.pkl              # Label encoding mappings
└── beer_multioutput_classifier.pkl # Legacy model (backup)
```

**Model Details:**
- **Type:** XGBoost MultiOutputClassifier
- **Inputs:** 10 flavor dimensions (0-100 scale)
- **Outputs:** 
  - clus_name (beer cluster/group)
  - Style_simple (beer style category)
- **Training Data:** 3,197 beers

### `/data` - Datasets
Beer database and reference data.

```
data/
├── Beer_data (1).xlsx              # Main beer database
│                                   # 3,197 beers × 30 attributes
├── 2024_Electoral_College.csv      # Electoral map data (other project)
└── example.csv                     # Example data file
```

**Beer Database Columns:**
- Name, Style, Brewery
- ABV, IBU, Astringency
- Flavor profiles (Body, Alcohol, Bitter, etc.)
- Review scores and count
- UMAP coordinates, cluster assignments

### `/config` - Configuration
(Ready for additional config files)

```
config/
├── production.env
├── development.env
└── staging.env
```

### `/docs` - Documentation
(Ready for deployment and API docs)

```
docs/
├── DEPLOYMENT.md                   # Production setup
├── API.md                          # API reference
├── ARCHITECTURE.md                 # System design
└── TROUBLESHOOTING.md              # Common issues
```

## File Relationships

### Dependency Flow
```
Frontend (React)
    ↓
API Requests (HTTP)
    ↓
Backend (FastAPI)
    ├→ Model Service (XGBoost)
    ├→ Beer Service (Excel/Pandas)
    └→ LLM Service (Gemini API)
```

### Data Flow for Recommendations
```
User Input (10 flavor dimensions)
    ↓
InputPage validates input
    ↓
API call to /recommend
    ↓
Model Service predicts beer cluster
    ↓
Beer Service retrieves 3 beers
    ↓
Response returned to ChatPage
    ↓
LLM generates personalized message
    ↓
Browser History pushes new state
```

## Configuration Files

### `.env` (Backend)
Located in `server/beer_backend/.env`

```
GEMINI_API_KEY=your_key_here
MODEL_PATH=./models/beer_multioutput_classifier.pkl
BEER_XLSX_PATH=./data/Beer_data (1).xlsx
HOST=0.0.0.0
PORT=8002
```

### `vite.config.js` (Frontend)
Handles React/Vite build configuration

### `package.json` (Frontend)
- React 18
- Vite build tool
- Development dependencies

### `requirements.txt` (Backend)
- FastAPI / Uvicorn
- XGBoost / Scikit-learn
- Pandas / NumPy
- Google Generative AI SDK

## Execution Paths

### Starting the Application

**Terminal 1 - Backend:**
```bash
cd nanobrewery-app/server/beer_backend
python -m uvicorn main:app --reload --port 8002
```

**Terminal 2 - Frontend:**
```bash
cd nanobrewery-app/client/nano-beer
npm run dev
```

### Request Flow Example

1. User adjusts flavor sliders and clicks "Generate"
2. React calls `handleGenerate()` in App.jsx
3. POST request to `http://localhost:8002/api/v1/recommend`
4. FastAPI receives request in `recommendation.py`
5. `ModelService.classify()` predicts beer cluster
6. `BeerService.get_beers_by_cluster()` retrieves 3 beers
7. `LLMService.create_recommendation()` generates message
8. Response returned to frontend
9. React renders `ChatPage` with results
10. Browser history updated (enables back button)

## Deployment Scenarios

### Local Development
- No Docker needed
- Direct Python/Node execution
- Live reload enabled
- See QUICKSTART.md

### Docker Deployment
- Run `docker-compose up --build`
- All services in containers
- Production-ready setup
- See docker-compose.yml

### Kubernetes Deployment
- Create separate Docker images for server/client
- Use ConfigMaps for .env
- Mount volumes for models/data
- Deploy via Helm charts
- See docs/DEPLOYMENT.md

## Adding New Features

### Adding an API Endpoint
1. Create route in `server/beer_backend/routes/`
2. Define request schema in `utils/schemas.py`
3. Implement service logic in `services/`
4. Test with curl or Postman

### Adding Frontend Page
1. Create new React component in `client/nano-beer/src/`
2. Add to conditional render in App.jsx
3. Update navigation in `handleGenerate()` / `handleBackToInput()`
4. Rebuild with `npm run build`

### Updating ML Model
1. Train new model with same input/output format
2. Save to `models/beer_multioutput_classifier.pkl`
3. Update `model_service.py` if output format changed
4. Test with sample request to `/api/v1/recommend`

## Important Notes

✅ **Original files preserved** - All files remain in original locations:
- `/app/beer_backend` - Original backend
- `/nano-beer` - Original frontend
- `/data` - Original data
- `/ml_model` - Original models

🔗 **This is a copy** - `nanobrewery-app/` is a well-organized copy for development and deployment.

📝 **Symlinks possible** - You can create symlinks instead of copies for models/data to save space:
```bash
ln -s ../../data nanobrewery-app/data
ln -s ../../ml_model nanobrewery-app/models
```

---

For quick start, see **QUICKSTART.md**  
For full documentation, see **README.md**
