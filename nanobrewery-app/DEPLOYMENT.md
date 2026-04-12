# Beer Recommender App - Render Deployment

This application consists of a React frontend and FastAPI backend that need to be deployed separately on Render.

## Backend Deployment (FastAPI)

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Name:** beer-recommender-backend
   - **Root Directory:** `server`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn beer_backend.main:app --host 0.0.0.0 --port $PORT`

4. **Environment Variables:**
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   MODEL_PATH=../models/beer_multioutput_classifier.pkl
   ENCODERS_PATH=../models/label_encoders.pkl
   BEER_XLSX_PATH=../data/Beer_data (1).xlsx
   ALLOWED_ORIGINS=["https://your-frontend-app.onrender.com"]
   ```

## Frontend Deployment (React)

1. **Create a new Static Site** on Render
2. **Connect your GitHub repository**
3. **Configure the service:**
   - **Name:** beer-recommender-frontend
   - **Root Directory:** `client/nano-beer`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`

4. **Environment Variables:**
   ```
   VITE_API_BASE_URL=https://your-backend-app.onrender.com
   ```

## Deployment Order

1. Deploy the backend first
2. Get the backend URL from Render
3. Update the frontend's `VITE_API_BASE_URL` environment variable
4. Deploy the frontend

## Local Development

To run locally:
- Backend: `cd server && uvicorn beer_backend.main:app --reload`
- Frontend: `cd client/nano-beer && npm run dev`

## Files Structure

```
nanobrewery-app/
├── client/nano-beer/     # React frontend
├── server/               # FastAPI backend
├── models/               # ML models
├── data/                 # Beer data
└── docs/                 # Documentation
```