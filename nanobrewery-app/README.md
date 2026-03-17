# Nanobrewery Beer Recommendation App

A full-stack web application for beer recommendations using XGBoost ML models and Gemini AI chat integration.

## Project Structure

```
nanobrewery-app/
├── server/              # FastAPI backend
│   └── beer_backend/    
│       ├── main.py      # Application entry point
│       ├── config.py    # Configuration settings
│       ├── dependencies.py
│       ├── routes/      # API endpoints
│       ├── services/    # Business logic
│       └── utils/       # Utilities & schemas
├── client/              # React + Vite frontend
│   └── nano-beer/
│       ├── src/
│       ├── package.json
│       └── vite.config.js
├── models/              # Trained ML models
│   ├── beer_multioutput_classifier.pkl   # XGBoost classifier
│   └── label_encoders.pkl
├── data/                # Data files
│   └── Beer_data.xlsx   # Beer database
├── config/              # Configuration files
└── docs/                # Documentation
```

## Quick Start

### Backend Setup

```bash
cd server/beer_backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Run server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8002
```

Server runs on: `http://localhost:8002`

### Frontend Setup

```bash
cd client/nano-beer

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs on: `http://localhost:5175`

## API Endpoints

- `POST /api/v1/recommend` - Get beer recommendations based on flavor profile
- `POST /api/v1/chat` - Send message in recommendation chat session
- `GET /api/v1/beers` - Get list of all available beers
- `GET /health` - Health check endpoint

## Features

- **Flavor Profile Selection** - Users define their beer preferences across 10 flavor dimensions
- **ML-Based Recommendations** - XGBoost model predicts beer cluster and style
- **Conversational Chat** - Gemini AI assists with follow-up questions about recommendations
- **Beer Database** - 3,197+ beers with comprehensive attributes
- **Browser History** - Back button navigation works seamlessly
- **Hover Tooltips** - Educational descriptions for flavor dimensions

## Technology Stack

- **Backend**: FastAPI, Pydantic, XGBoost, Scikit-learn, Google Gemini API
- **Frontend**: React 18, Vite, JavaScript
- **ML/Data**: Pandas, NumPy, Pickle
- **Server**: Uvicorn ASGI

## Environment Variables

Create a `.env` file in `server/beer_backend/`:

```
GEMINI_API_KEY=your_api_key_here
MODEL_PATH=./models/beer_multioutput_classifier.pkl
BEER_XLSX_PATH=/path/to/Beer_data.xlsx
HOST=0.0.0.0
PORT=8002
LOG_LEVEL=info
```

## Development

### Adding Features

1. **Backend Routes** - Add new endpoints in `server/beer_backend/routes/`
2. **Services** - Implement business logic in `server/beer_backend/services/`
3. **Frontend** - Modify React components in `client/nano-beer/src/`

### Running Tests

```bash
cd server/beer_backend
pytest tests/
```

## Deployment

See `docs/DEPLOYMENT.md` for production deployment instructions.

## License

Proprietary - Hamilton College Nanobrewery Project
