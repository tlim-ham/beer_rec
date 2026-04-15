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

# Encoding fix mapping for common character issues
ENCODING_FIXES = {
    '√§': 'ä', '√º': 'u', '√∂': 'ö', '√±': 'ñ', '√∏': 'Ø', '√Ω': 'Ω',
    '√Æ': 'Ä', '√ú': 'Ü', '√ñ': 'Ö', '√ü': 'ü', '√°': '°', '√©': 'é',
    '√®': '®', '√™': '™', '√∞': '∞', '√≠': '≠', '√≤': '≤', '√≥': '≥',
    '√µ': 'µ', '√∫': '∫', '√√': '√', '√∑': '∑', '√∆': '∆', '√∏': '∏',
    '√π': 'π', '√•': '•', '√…': '…', '√ ': ' ', '√–': '–', '√—': '—',
    '√"': '"', '√\'': '\'', '√(': '(', '√)': ')', '√[': '[', '√]': ']',
    '√{': '{', '√}': '}', '√|': '|', '√\\': '\\', '√/': '/', '√?': '?',
    '√<': '<', '√>': '>', '√=': '=', '√+': '+', '√-': '-', '√*': '*',
    '√&': '&', '√%': '%', '√$': '$', '√#': '#', '√@': '@', '√!': '!',
    '√^': '^', '√~': '~', '√`': '`', '≈†': '™', '¬∞': '°', '6¬∞': '6°'
}

def _fix_encoding(text: str) -> str:
    """Fix common encoding issues in beer names and brewery names."""
    # Convert to string if it's not already
    if not isinstance(text, str):
        text = str(text)
    
    if not text:
        return text
    
    # Handle special cases first
    result = text.replace('Do√ºble', 'Double')  # Special case for "Double"
    result = result.replace('√º', 'ü')  # Most common case
    result = result.replace('√∂', 'ö')
    result = result.replace('√§', 'ä') 
    result = result.replace('√ú', 'Ü')
    result = result.replace('√ñ', 'Ö')
    result = result.replace('√ü', 'ü')
    result = result.replace('√©', 'é')
    result = result.replace('√®', 'è')
    result = result.replace('√≠', 'í')
    result = result.replace('√±', 'ñ')
    result = result.replace('√∏', 'Ø')
    result = result.replace('√Ω', 'Ω')
    result = result.replace('√Æ', 'Ä')
    result = result.replace('√°', '°')
    result = result.replace('√™', '™')
    result = result.replace('√∞', '∞')
    result = result.replace('≈†', '™')
    result = result.replace('¬∞', '°')
    result = result.replace('6¬∞', '6°')
    
    return result


XLSX_PATH = str(Path(__file__).parent.parent.parent.parent / "data" / "Beer_data (1).xlsx")
MAX_BEERS_PER_RECOMMENDATION = 20  # cap before sending to LLM


@lru_cache(maxsize=1)
def _load_beers(xlsx_path: str) -> list[dict]:
    path = Path(xlsx_path)
    if not path.exists():
        raise FileNotFoundError(f"Beer database not found at '{xlsx_path}'.")
    
    df = pd.read_excel(path)
    
    # --- STEP 1: DELETE GHOST ROWS ---
    # This removes any row where the 'Name' column is empty/NaN.
    # This prevents "Unknown" from appearing in your recommendation list.
    df = df.dropna(subset=['Name'])
    
    # --- STEP 2: FILL REMAINING GAPS ---
    # Now that the empty beers are gone, fill missing Descriptions/Styles with "Unknown"
    df = df.fillna("Unknown")

    # (Keep your flavor capping logic below this...)
    flavor_cols = ['Body', 'Alcohol', 'Bitter', 'Sweet', 'Sour', 'Salty', 'Fruits', 'Hoppy', 'Spices', 'Malty']
    for col in flavor_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).clip(upper=100)
    
    beers = df.to_dict(orient="records")
    return beers


class BeerService:
    """Queries the static beer XLSX database."""

    def __init__(self, xlsx_path: str | None = None):
        self._xlsx_path = xlsx_path or XLSX_PATH
        self._beers = _load_beers(self._xlsx_path)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_beers_by_categories(self, clus_name: list[str], style_simple: list[str], limit: int = MAX_BEERS_PER_RECOMMENDATION, exclude_beer_name: str | None = None,) -> list[dict]:
        """
        Return up to `limit` beers matching predicted clus_name AND Style_simple.
        Optionally exclude a specific beer by name.
        """
        clus_set = set(c.lower() for c in clus_name)
        style_set = set(s.lower() for s in style_simple)
        exclude_name = exclude_beer_name.lower().strip() if exclude_beer_name else None

        logger.info(f"Excluding beer: '{exclude_name}'")  # Debug line

        scored: list[tuple[int, dict]] = []
        for beer in self._beers:
            # beer_name = str(beer.get("Name", "")).lower().strip()
            beer_name = str(beer.get("name_fixed", beer.get("Name", ""))).lower().strip()

            
            # Debug: log the first few beers to see what names look like
            if len(scored) < 5:
                logger.info(f"Checking beer: '{beer_name}' against exclude: '{exclude_name}'")
            
            # Skip the selected beer if provided
            if exclude_name and beer_name == exclude_name:
                logger.info(f"Excluded beer: {beer_name}")
                continue
                
            beer_clus = str(beer.get("clus_name", "")).lower()
            beer_style = str(beer.get("Style_simple", "")).lower()

            matches_clus  = beer_clus in clus_set
            matches_style = beer_style in style_set

            if matches_clus and matches_style:
                priority = 0
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
            "Found %d beers for clus_name=%s style_simple=%s (excluded: %s)",
            len(results), clus_name, style_simple, exclude_name or "none",
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
                f"- {str(b.get('name_fixed', b.get('Name', 'Unknown')))} by {_fix_encoding(str(b.get('Brewery', 'Unknown Brewery')))} "
                f"({b.get('Style', '?')}, {b.get('ABV', '?')}% ABV, IBU {ibu_range}): "
                f"{str(b.get('Description', '')).strip()[:200]} "
                f"[{flavor_summary}]"
            )
        return "\n".join(lines)

    def get_all_categories(self) -> list[str]:
        """Return the distinct list of categories present in the database."""
        return sorted({str(b["category"]) for b in self._beers if b.get("category")})