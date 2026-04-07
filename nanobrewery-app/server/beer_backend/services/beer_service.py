"""
services/beer_service.py
-------------------------
Loads the beers XLSX and exposes query methods used by the recommendation
pipeline. The XLSX acts as the static beer database.
"""

import logging
from functools import lru_cache
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)

XLSX_PATH = str(Path(__file__).parent.parent.parent.parent / "data" / "Beer_data (1).xlsx")
MAX_BEERS_PER_RECOMMENDATION = 10  # cap before sending to LLM


@lru_cache(maxsize=1)
def _load_beers(xlsx_path: str) -> list[dict]:
    """Load and cache the full beer list from XLSX."""
    path = Path(xlsx_path)
    if not path.exists():
        raise FileNotFoundError(f"Beer database not found at '{xlsx_path}'.")
    df = pd.read_excel(path)
    beers = df.to_dict(orient="records")
    logger.info("Loaded %d beers from %s", len(beers), xlsx_path)
    return beers


class BeerService:
    """Queries the static beer XLSX database."""

    def __init__(self, xlsx_path: str | None = None):
        self._xlsx_path = xlsx_path or XLSX_PATH
        self._beers = _load_beers(self._xlsx_path)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_beers_by_categories(
        self,
        clus_name: list[str],
        style_simple: list[str],
        limit: int = MAX_BEERS_PER_RECOMMENDATION,
    ) -> list[dict]:
        """
        Return up to `limit` beers matching predicted clus_name AND Style_simple.
        Beers matching both score higher than those matching only one.
        """
        clus_set = set(c.lower() for c in clus_name)
        style_set = set(s.lower() for s in style_simple)

        scored: list[tuple[int, dict]] = []
        for beer in self._beers:
            beer_clus = str(beer.get("clus_name", "")).lower()
            beer_style = str(beer.get("Style_simple", "")).lower()

            matches_clus  = beer_clus in clus_set
            matches_style = beer_style in style_set

            if matches_clus and matches_style:
                priority = 0   # best — matches both
            elif matches_clus:
                priority = 1
            elif matches_style:
                priority = 2
            else:
                continue

            scored.append((priority, beer))

        scored.sort(key=lambda x: (x[0], str(x[1].get("Name", ""))))
        results = [beer for _, beer in scored[:limit]]

        logger.info(
            "Found %d beers for clus_name=%s style_simple=%s",
            len(results), clus_name, style_simple,
        )
        return results
    def format_for_prompt(self, beers: list[dict]) -> str:
        """
        Serialise a list of beer dicts into a compact, readable string
        suitable for inclusion in an LLM prompt.
        """
        if not beers:
            return "No beers found."

        lines = []
        for b in beers:
            ibu_range = f"{b.get('Min.IBU', '?')}-{b.get('Max.IBU', '?')}"
            flavor_summary = (
                f"Bitter={b.get('Bitter', 0)}, Sweet={b.get('Sweet', 0)}, "
                f"Sour={b.get('Sour', 0)}, Hoppy={b.get('Hoppy', 0)}, "
                f"Malty={b.get('Malty', 0)}, Fruits={b.get('Fruits', 0)}, "
                f"Spices={b.get('Spices', 0)}"
            )
            lines.append(
                f"- {str(b.get('Name', 'Unknown'))} by {str(b.get('Brewery', 'Unknown Brewery'))} "
                f"({b.get('Style', '?')}, {b.get('ABV', '?')}% ABV, IBU {ibu_range}): "
                f"{str(b.get('Description', '')).strip()[:200]} "
                f"[{flavor_summary}]"
            )
        return "\n".join(lines)

    def get_all_categories(self) -> list[str]:
        """Return the distinct list of categories present in the database."""
        return sorted({str(b["category"]) for b in self._beers if b.get("category")})