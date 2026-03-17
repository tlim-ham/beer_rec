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
import pandas as pd

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Exact feature columns the model was trained on (order matters for XGBoost)
# ---------------------------------------------------------------------------
FLAVOR_DIMS = [
    "Body",
    "Alcohol",
    "Bitter",
    "Sweet",
    "Sour",
    "Salty",
    "Fruits",
    "Hoppy",
    "Spices",
    "Malty",
]


@lru_cache(maxsize=1)
def _load_model(model_path: str):
    """Load and cache the classifier from disk (loaded once per process)."""
    path = Path(model_path)
    if not path.exists():
        raise FileNotFoundError(
            f"Model file not found at '{model_path}'. "
            "Provide your trained model at this path."
        )
    with open(path, "rb") as f:
        model = pickle.load(f)
    logger.info("Beer classifier loaded from %s", model_path)
    return model


@lru_cache(maxsize=1)
def _load_encoders(encoders_path: str):
    """Load and cache the label encoders from disk."""
    path = Path(encoders_path)
    if not path.exists():
        raise FileNotFoundError(
            f"Encoders file not found at '{encoders_path}'. "
            "Make sure the label encoders are saved alongside the model."
        )
    with open(path, "rb") as f:
        encoders = pickle.load(f)
    logger.info("Label encoders loaded from %s", encoders_path)
    return encoders


class ModelService:
    """
    Wraps the pickled multi-output classifier and validates inputs/outputs.
    The model predicts both clus_name and Style_simple from flavor profile.
    """

    MODEL_PATH = str(Path(__file__).parent.parent.parent.parent / "models" / "beer_multioutput_classifier.pkl")
    ENCODERS_PATH = str(Path(__file__).parent.parent.parent.parent / "models" / "label_encoders.pkl")

    def __init__(self, model_path: str | None = None, encoders_path: str | None = None):
        self._model_path = model_path or self.MODEL_PATH
        self._encoders_path = encoders_path or self.ENCODERS_PATH
        self._model = _load_model(self._model_path)
        self._encoders = _load_encoders(self._encoders_path)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def classify(self, flavor_profile: dict, top_n: int = 3) -> dict:
        """
        Run the classifier on a user's flavor profile.

        Parameters
        ----------
        flavor_profile : dict
            Keys must match FLAVOR_DIMS exactly; values are floats [0, 100].
        top_n : int
            Reserved for when probability scores are added.

        Returns
        -------
        dict with keys:
            clus_name     : list[str]  – predicted cluster name
            Style_simple   : list[str]  – predicted style
            scores         : dict       – confidence scores (empty for now)
            flavor_profile : dict       – sanitised input
        """
        sanitised = self._sanitise(flavor_profile)
        features_df = pd.DataFrame([sanitised])

        predictions_encoded = self._model.predict(features_df)

        clus_name_pred = self._encoders['clus_name'].inverse_transform(
            [predictions_encoded[0][0]]
        )[0]
        style_simple_pred = self._encoders['Style_simple'].inverse_transform(
            [predictions_encoded[0][1]]
        )[0]

        logger.info("Predicted clus_name=%s style_simple=%s", clus_name_pred, style_simple_pred)

        return {
            "clus_name":    [clus_name_pred],
            "Style_simple":  [style_simple_pred],
            "scores":        {},
            "flavor_profile": sanitised,
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _sanitise(flavor_profile: dict) -> dict:
        """Keep only model features and clamp values to [0, 100]."""
        sanitised = {}
        for dim in FLAVOR_DIMS:
            raw = flavor_profile.get(dim, 0.0)
            sanitised[dim] = max(0.0, min(100.0, float(raw)))
        return sanitised