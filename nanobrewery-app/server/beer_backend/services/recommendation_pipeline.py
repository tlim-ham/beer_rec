"""
services/recommendation_pipeline.py
-------------------------------------
Orchestrates the full recommendation flow:
  1. ModelService  – classify flavor profile → beer categories
  2. BeerService   – look up matching beers in the CSV database

This flow now returns the top beer recommendations directly without an LLM chat session.
"""

import logging
import uuid

from ..services.model_service import ModelService
from ..services.beer_service import BeerService

logger = logging.getLogger(__name__)


class RecommendationPipeline:
    """End-to-end beer recommendation orchestrator."""

    def __init__(
        self,
        model_service: ModelService,
        beer_service: BeerService,
    ):
        self._model = model_service
        self._beers = beer_service

    # ------------------------------------------------------------------
    # Step 1+2+3  — called once per user to kick off a new recommendation
    # ------------------------------------------------------------------

    def start_recommendation(self, flavor_profile: dict, selected_beer_name: str | None = None) -> dict:
        classification = self._model.classify(flavor_profile, top_n=3)
        clus_name    = classification["clus_name"]  
        style_simple  = classification["Style_simple"]

        # 1. Get more than 10 beers so we have 'backups' for any nan/Unknown rows
        beers = self._beers.get_beers_by_categories(
            clus_name=clus_name,
            style_simple=style_simple,
            limit=20, # Explicitly ask for more
            exclude_beer_name=selected_beer_name
        )
        
        # 2. Filter and build the list of exactly 10 valid names
        valid_display_names = []
        valid_beer_objects = [] # We need this for the LLM context later

        for beer in beers:
            # Use name_fixed as the primary source
            name = beer.get('name_fixed') or beer.get('Name')
            
            # Skip if name is empty, nan, or Unknown
            if not name or str(name).lower() in ['nan', 'unknown', 'none', '']:
                continue
                
            valid_display_names.append(name)
            valid_beer_objects.append(beer)
            
            # STOP as soon as we have 10
            if len(valid_display_names) >= 10:
                break

        # 3. Create the numbered string for the intro message
        beer_names_text = "\n".join([f"{i+1}. {name}" for i, name in enumerate(valid_display_names)])

        session_id = str(uuid.uuid4())
        return {
            "session_id": session_id,
            "clus_name": clus_name,
            "Style_simple": style_simple,
            "category_scores": classification["scores"],
            "beers_found": valid_beer_objects,
        }
