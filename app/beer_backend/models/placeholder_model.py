"""
placeholder_model.py
--------------------
Generates a placeholder beer category classifier pickle file for development.
Replace this with your actual trained model when available.

The real model should:
  - Accept a flavor profile dict (intensities 0-1 for flavor dimensions)
  - Return a list of predicted beer categories with confidence scores
"""

import pickle
import numpy as np
from pathlib import Path


class PlaceholderBeerClassifier:
    """
    Stand-in for the real trained classifier.

    Expected input:  dict with flavor dimension keys (see FLAVOR_DIMS)
    Expected output: list of (category, confidence) tuples, sorted descending

    Replace this class with your actual model loaded from the real .pkl file.
    """

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

    CATEGORIES = [
        "hoppy",
        "dark",
        "sour",
        "light",
        "fruity",
        "belgian",
        "malty",
        "wheat",
        "seasonal",
    ]

    # Simple rule-based mapping for placeholder logic
    # Real model will learn these from training data
    _RULES = {
        "hoppy":   {"hoppy": 0.6, "bitter": 0.5},
        "dark":    {"roasted": 0.6, "malty": 0.4},
        "sour":    {"sour": 0.6, "fruity": 0.3},
        "light":   {"light": 0.6, "sweet": 0.2},
        "fruity":  {"fruity": 0.6, "sweet": 0.3},
        "belgian": {"spicy": 0.4, "fruity": 0.3, "sweet": 0.3},
        "malty":   {"malty": 0.6, "sweet": 0.3},
        "wheat":   {"light": 0.3, "fruity": 0.2, "sweet": 0.2},
        "seasonal":{"spicy": 0.3, "sweet": 0.4, "malty": 0.3},
    }

    def predict(self, flavor_profile: dict) -> list[tuple[str, float]]:
        """
        Returns list of (category, confidence) sorted by confidence desc.

        flavor_profile: dict mapping flavor dimension -> float [0.0, 1.0]
        """
        scores = {}
        for category, weights in self._RULES.items():
            score = 0.0
            for dim, weight in weights.items():
                score += flavor_profile.get(dim, 0.0) * weight
            scores[category] = round(min(score, 1.0), 4)

        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        # Return top results with score > 0
        return [(cat, conf) for cat, conf in sorted_scores if conf > 0]

    def get_top_categories(self, flavor_profile: dict, top_n: int = 3) -> list[str]:
        """Convenience method — returns just the category names."""
        results = self.predict(flavor_profile)
        return [cat for cat, _ in results[:top_n]]


def generate_placeholder_pickle(output_path: str = "models/beer_classifier.pkl"):
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    model = PlaceholderBeerClassifier()
    with open(output_path, "wb") as f:
        pickle.dump(model, f)
    print(f"Placeholder model saved to: {output_path}")
    return model


if __name__ == "__main__":
    generate_placeholder_pickle()
