"""
utils/schemas.py
-----------------
Pydantic models used for request validation and response serialisation.
"""

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

class FlavorProfile(BaseModel):
    Body:    float = Field(default=0.0, ge=0.0, le=100.0)
    Alcohol: float = Field(default=0.0, ge=0.0, le=100.0)
    Bitter:  float = Field(default=0.0, ge=0.0, le=100.0)
    Sweet:   float = Field(default=0.0, ge=0.0, le=100.0)
    Sour:    float = Field(default=0.0, ge=0.0, le=100.0)
    Salty:   float = Field(default=0.0, ge=0.0, le=100.0)
    Fruits:  float = Field(default=0.0, ge=0.0, le=100.0)
    Hoppy:   float = Field(default=0.0, ge=0.0, le=100.0)
    Spices:  float = Field(default=0.0, ge=0.0, le=100.0)
    Malty:   float = Field(default=0.0, ge=0.0, le=100.0)


class StartRecommendationRequest(BaseModel):
    flavor_profile: FlavorProfile
    top_n_categories: int = Field(default=3, ge=1, le=5)


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1, max_length=1000)


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

class BeerItem(BaseModel):
    beer_id: str
    name: str
    brewery: str
    style: str
    category: str
    abv: str
    ibu: str
    description: str
    flavor_tags: str


class StartRecommendationResponse(BaseModel):
    session_id:      str
    clus_name:      list[str]
    Style_simple:   list[str]
    category_scores: dict[str, float]
    beers_found:     list[dict]
    intro_message:   str
    tokens_used:     int


class ChatResponse(BaseModel):
    reply: str
    tokens_used: int
    over_budget: bool


class SessionInfoResponse(BaseModel):
    session_id: str
    turns: int
    tokens_used: int
    over_budget: bool


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    beers_in_db: int
