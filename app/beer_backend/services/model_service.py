"""
services/model_service.py
--------------------------
Loads the beer category classifier from a pickle file and exposes
a clean inference interface to the rest of the application.
"""

import pickle
import logging
from functools import lru_cache
from pathlib import Path

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Supported flavor dimensions the frontend should collect
# ---------------------------------------------------------------------------
FLAVOR_DIMS = [
    "bitter",
    "sweet",
    "sour",
    "salty",
    "hoppy",
    "malty",
    "fruity",
    "roasted",
    "spicy",
    "light",
]


@lru_cache(maxsize=1)
def _load_model(model_path: str):
    """Load and cache the classifier from disk (loaded once per process)."""
    path = Path(model_path)
    if not path.exists():
        raise FileNotFoundError(
            f"Model file not found at '{model_path}'. "
            "Run models/placeholder_model.py to generate the placeholder, "
            "or provide your trained model at this path."
        )
    with open(path, "rb") as f:
        model = pickle.load(f)
    logger.info("Beer classifier loaded from %s", model_path)
    return model


class ModelService:
    """
    Wraps the pickled classifier and validates inputs/outputs.

    Swap in your real trained model by pointing MODEL_PATH to the new .pkl file.
    The model object must expose:
        .predict(flavor_profile: dict) -> list[tuple[str, float]]
        .get_top_categories(flavor_profile: dict, top_n: int) -> list[str]
    """

    MODEL_PATH = "models/beer_classifier.pkl"

    def __init__(self, model_path: str | None = None):
        self._model_path = model_path or self.MODEL_PATH
        self._model = _load_model(self._model_path)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    # def classify(self, flavor_profile: dict, top_n: int = 3) -> dict:
    #     """
    #     Returns top predicted clus_names AND Style_simples separately.
    #     Your real model should output both label types.
    #     """
    #     sanitised = self._sanitise(flavor_profile)
    #     all_scores: list[tuple[str, float]] = self._model.predict(sanitised)
        
    #     # Real model should return predictions split by label type.
    #     # Placeholder splits arbitrarily — replace with actual model output.
    #     top_clus_names   = [cat for cat, _ in all_scores[:top_n]]
    #     top_style_simples = [cat for cat, _ in all_scores[:top_n]]

    #     return {
    #         "clus_name":     top_clus_names,
    #         "style_simple":  top_style_simples,
    #         "scores":         dict(all_scores),
    #         "flavor_profile": sanitised,
    #     }
    def classify(self, flavor_profile: dict, top_n: int = 3) -> dict:
        """Temporary hardcoded output for LLM testing — replace when real model arrives."""
        return {
            "style_simple": ["IPA", "Pale Ale", "Stout"],
            "clus_names":   ["Hoppy / Dry", "Malty / Smooth"],
            "scores":       {"IPA": 0.85, "Pale Ale": 0.72, "Stout": 0.61},
            "flavor_profile": flavor_profile,
    }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _sanitise(flavor_profile: dict) -> dict:
        """Clamp values to [0, 1] and drop unknown dimensions."""
        sanitised = {}
        for dim in FLAVOR_DIMS:
            raw = flavor_profile.get(dim)
            if raw is not None:
                sanitised[dim] = max(0.0, min(1.0, float(raw)))
        return sanitised
