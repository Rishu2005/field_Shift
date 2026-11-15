import json
from pathlib import Path
from typing import Dict, Any, List, Optional

KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent / "knowledge"

def load_json(name: str) -> Any:
    with open(KNOWLEDGE_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)

class StrategyCandidateGenerator:
    """
    Generates candidate crop-rotation strategies:
    - Strategy A: Farmer's existing rotation (always included as baseline).
    - Strategies B, C, D: Agronomically sound alternatives adapted to farmer
      priorities, constraints, and agroclimatic hazard indicators.
    """

    def __init__(self):
        self.crops = {c["id"]: c for c in load_json("crops.json")}
        self.preset_rotations = {r["id"]: r for r in load_json("rotations.json")}

    def generate_strategies(
        self,
        existing_rotation_id: str,
        priorities: Dict[str, float],
        constraints: Dict[str, Any],
        indicators: Optional[Dict[str, Any]] = None,
        zone: Optional[str] = "Zone IIIB"
    ) -> List[Dict[str, Any]]:
        candidates = []

        # 1. Strategy A: Farmer's Existing Rotation (Dominant Baseline)
        existing = self.preset_rotations.get(existing_rotation_id)
        if not existing:
            # Fallback to dominant rice-wheat if unknown ID
            existing = self.preset_rotations.get("rice-wheat")

        strat_a = {
            "id": "strategy_a",
            "name": f"{existing['name']} (Your Current Practice)",
            "is_baseline": True,
            "strategy_type": "Baseline",
            "sequence": existing["sequence"],
            "suitable_zones": existing.get("suitable_zones", []),
            "baseline_risks": existing.get("risks", []),
            "soil_health_rating": existing.get("soil_health_rating", "Medium"),
            "water_efficiency_rating": existing.get("water_efficiency_rating", "Medium")
        }
        candidates.append(strat_a)

        # Evaluate farmer priorities
        w_water = priorities.get("conserve_water", 0.5)
        w_income = priorities.get("income", 0.5)
        w_n_fix = priorities.get("nitrogen_fixation", 0.5)
        w_erosion = priorities.get("erosion_reduction", 0.5)
        w_soil = priorities.get("organic_matter", 0.5)

        is_flood_prone = constraints.get("flood_prone", False)
        irrigation = constraints.get("irrigation", "limited") # none, limited, reliable

        # 2. Strategy B: Legume / Cover Crop Intensification (covers the Zaid bare-field period)
        # Rice -> Wheat -> Summer Moong
        strat_b = {
            "id": "strategy_b",
            "name": "Rice – Wheat – Summer Moong (Legume Intensification)",
            "is_baseline": False,
            "strategy_type": "Summer Soil Cover & Protein",
            "sequence": [
                { "season": "kharif", "crop_id": "rice" },
                { "season": "rabi", "crop_id": "wheat" },
                { "season": "zaid", "crop_id": "mungbean" }
            ],
            "suitable_zones": ["Zone I", "Zone II", "Zone IIIB"],
            "key_innovation": "Replaces the 11-week bare summer fallow with a 60-day legume, fixing 35 kg N/ha and protecting soil from thermal degradation.",
            "requires_irrigation": True
        }
        candidates.append(strat_b)

        # 3. Strategy C: Low-Water Ecological Soil Building or Resilient Diversification
        if w_water > 0.6 or irrigation == "none" or irrigation == "limited":
            # Sesbania (GM) -> Rice -> Lentil (Paira/zero-till)
            strat_c = {
                "id": "strategy_c",
                "name": "Green Manure (Dhaincha) – Rice – Lentil (Water-Smart)",
                "is_baseline": False,
                "strategy_type": "Water-Smart & Soil Rebuilding",
                "sequence": [
                    { "season": "zaid", "crop_id": "sesbania" },
                    { "season": "kharif", "crop_id": "rice" },
                    { "season": "rabi", "crop_id": "lentil" }
                ],
                "suitable_zones": ["Zone I", "Zone IIIA", "Zone IIIB"],
                "key_innovation": "Saves 40% tubewell water by substituting wheat with residual-moisture lentil, while pre-monsoon green manuring builds 80+ kg natural N/ha."
            }
        elif is_flood_prone or (zone and "Zone II" in zone):
            # Wetland / Flood Adaptation: Makhana -> Rabi Wheat
            strat_c = {
                "id": "strategy_c",
                "name": "Makhana – Rabi Wheat / Lentil (Wetland Adapted)",
                "is_baseline": False,
                "strategy_type": "Wetland Inundation Resilience",
                "sequence": [
                    { "season": "kharif", "crop_id": "makhana" },
                    { "season": "rabi", "crop_id": "wheat" },
                    { "season": "zaid", "crop_id": None, "label": "Early Inundation" }
                ],
                "suitable_zones": ["Zone II", "Zone I"],
                "key_innovation": "Transforms chronic monsoon waterlogging into high-value GI-tagged superfood income followed by winter grain."
            }
        else:
            # High-Yield Cash Diversification: Rice -> Rabi Maize -> Moong
            strat_c = {
                "id": "strategy_c",
                "name": "Rice – Rabi Maize – Summer Moong (High Income)",
                "is_baseline": False,
                "strategy_type": "High Income & Grain Yield",
                "sequence": [
                    { "season": "kharif", "crop_id": "rice" },
                    { "season": "rabi", "crop_id": "maize" },
                    { "season": "zaid", "crop_id": "mungbean" }
                ],
                "suitable_zones": ["Zone I", "Zone II"],
                "key_innovation": "Leverages North/Central Bihar's high rabi maize productivity paired with summer pulse soil restoration."
            }
        candidates.append(strat_c)

        # 4. Strategy D: Cereal-Oilseed-Pulse Break
        strat_d = {
            "id": "strategy_d",
            "name": "Kharif Maize – Mustard – Summer Moong (Pest Break & Low Water)",
            "is_baseline": False,
            "strategy_type": "Multi-Family Pest Break",
            "sequence": [
                { "season": "kharif", "crop_id": "maize" },
                { "season": "rabi", "crop_id": "mustard" },
                { "season": "zaid", "crop_id": "mungbean" }
            ],
            "suitable_zones": ["Zone I", "Zone IIIA", "Zone IIIB"],
            "key_innovation": "Rotates three distinct plant families (Poaceae -> Brassicaceae -> Fabaceae), suppressing weed/nematode cycles and cutting water draft."
        }
        candidates.append(strat_d)

        return candidates
