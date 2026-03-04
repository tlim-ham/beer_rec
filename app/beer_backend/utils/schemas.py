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
    """
    User's flavor preference vector. Each dimension is a float in [0.0, 1.0]
    where 0 = dislike / not important and 1 = love / very important.
    """
    bitter:  float = Field(default=0.0, ge=0.0, le=1.0)
    sweet:   float = Field(default=0.0, ge=0.0, le=1.0)
    sour:    float = Field(default=0.0, ge=0.0, le=1.0)
    salty:   float = Field(default=0.0, ge=0.0, le=1.0)
    hoppy:   float = Field(default=0.0, ge=0.0, le=1.0)
    malty:   float = Field(default=0.0, ge=0.0, le=1.0)
    fruity:  float = Field(default=0.0, ge=0.0, le=1.0)
    roasted: float = Field(default=0.0, ge=0.0, le=1.0)
    spicy:   float = Field(default=0.0, ge=0.0, le=1.0)
    light:   float = Field(default=0.0, ge=0.0, le=1.0)


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
    style_simple:   list[str]
    category_scores: dict[str, float]
    beers_found:     list[dict]        # flexible — real columns vary
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
