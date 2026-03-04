# 🍺 Beer Recommendation Backend

A FastAPI backend that recommends craft beers by combining an ML classifier, a static CSV database, and Gemini-powered conversational AI.

---

## Architecture

```
Frontend (flavor profile)
        │
        ▼
POST /api/v1/recommend
        │
        ├─► ModelService          ← pickle classifier → beer categories
        ├─► BeerService           ← CSV database lookup
        └─► LLMService (Gemini)   ← prompt-engineered chatbot session
                │
                ▼
        Returns: session_id + intro message
        
Follow-up turns:
POST /api/v1/chat  { session_id, message }  →  { reply }
```

---

## Project Structure

```
beer_backend/
├── main.py                          # FastAPI app + health check
├── config.py                        # Settings via env vars / .env
├── dependencies.py                  # DI providers (singleton services)
│
├── routes/
│   └── recommendation.py            # /recommend, /chat, /session endpoints
│
├── services/
│   ├── model_service.py             # Loads pickle → classifies flavor profile
│   ├── beer_service.py              # Queries beers.csv database
│   ├── llm_service.py               # Gemini SDK wrapper + session/budget management
│   └── recommendation_pipeline.py  # Orchestrates the full pipeline
│
├── utils/
│   └── schemas.py                   # Pydantic request/response models
│
├── models/
│   ├── placeholder_model.py         # Generates placeholder beer_classifier.pkl
│   └── beer_classifier.pkl          # ← replace with your trained model
│
└── data/
    └── beers.csv                    # Static beer database
```

---

## Quickstart

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY
```

### 3. Generate the placeholder model (first time only)
```bash
python models/placeholder_model.py
```

### 4. Run the server
```bash
uvicorn main:app --reload --port 8000
# or
python main.py
```

API docs available at **http://localhost:8000/docs**

---

## API Reference

### `POST /api/v1/recommend`
Start a recommendation session.

**Request:**
```json
{
  "flavor_profile": {
    "bitter": 0.8,
    "hoppy": 0.9,
    "sweet": 0.1,
    "fruity": 0.4,
    "roasted": 0.0,
    "sour": 0.0,
    "salty": 0.0,
    "malty": 0.2,
    "spicy": 0.1,
    "light": 0.3
  }
}
```

**Response:**
```json
{
  "session_id": "uuid-...",
  "categories": ["hoppy", "light", "fruity"],
  "category_scores": { "hoppy": 0.93, "light": 0.41, ... },
  "beers_found": [ { "name": "Cascade IPA", ... } ],
  "intro_message": "Here are some beers I think you'll love...",
  "tokens_used": 312
}
```

---

### `POST /api/v1/chat`
Follow-up message in an existing session.

**Request:**
```json
{
  "session_id": "uuid-...",
  "message": "Tell me more about the first beer"
}
```

**Response:**
```json
{
  "reply": "The Cascade IPA is brewed by...",
  "tokens_used": 587,
  "over_budget": false
}
```

---

### `GET /api/v1/session/{session_id}`
Get session metadata (turns used, token usage, budget status).

### `DELETE /api/v1/session/{session_id}`
Clean up a session from memory.

### `GET /health`
Returns model load status and number of beers in the database.

---

## Swapping in Your Real Model

1. Train your classifier so that it accepts a `dict[str, float]` (flavor profile) and exposes:
   - `.predict(flavor_profile) -> list[tuple[str, float]]`
   - `.get_top_categories(flavor_profile, top_n) -> list[str]`
2. Serialize it: `pickle.dump(model, open("models/beer_classifier.pkl", "wb"))`
3. Point `MODEL_PATH` in `.env` to your new file — no other changes needed.

---

## Cost & Budget Controls

| Setting | Default | Location |
|---|---|---|
| Max output tokens per turn | 512 | `llm_service.py` |
| History window (turns kept) | 6 | `llm_service.py` |
| Token budget per session | 8,000 | `llm_service.py` |
| Max beers sent to LLM | 10 | `beer_service.py` |

When a session exceeds its budget the chatbot returns a friendly "start a new session" message instead of making another API call.

---

## Adding More Beers

Edit `data/beers.csv`. Columns required:

| Column | Description |
|---|---|
| `beer_id` | Unique integer |
| `name` | Beer name |
| `brewery` | Brewery name |
| `style` | Specific style (e.g. "American IPA") |
| `category` | Broad category matching classifier output |
| `abv` | Alcohol by volume (%) |
| `ibu` | International Bitterness Units |
| `description` | 1-2 sentence description |
| `flavor_tags` | Comma-separated flavor keywords |
