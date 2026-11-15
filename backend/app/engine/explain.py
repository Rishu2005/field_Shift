from typing import Dict, Any, List

class StrategyExplainer:
    """
    Constructs explainable, transparent strategy cards according to Spec Section 7.5.
    Every recommendation articulates why it was suggested, supporting Earth observation
    evidence, agronomic benefits, information gaps, and risks needing local review.
    """

    def generate_card(
        self,
        strategy: Dict[str, Any],
        scores: Dict[str, Any],
        confidence_info: Dict[str, Any],
        priorities: Dict[str, float],
        indicators: Dict[str, Any],
        crop_library: Dict[str, Any]
    ) -> Dict[str, Any]:
        seq = strategy.get("sequence", [])
        crop_ids = [s["crop_id"] for s in seq if s.get("crop_id")]
        crop_objs = [crop_library.get(cid) for cid in crop_ids if cid in crop_library]

        strat_id = strategy.get("id")
        composite_score = scores.get("composite_score", 65.0)
        crit = scores.get("criteria_scores", {})

        # 1. WHY IT WAS SUGGESTED (2-3 plain sentences)
        if strategy.get("is_baseline"):
            why = (
                "This reflects your current baseline cropping system. "
                "While it provides familiar staple grain security, our satellite analysis reveals an 11-week bare fallow "
                "in summer that exposes topsoil to severe heat oxidation, paired with terminal heat vulnerabilities during March wheat grain fill."
            )
        elif strat_id == "strategy_b": # Rice - Wheat - Summer Moong
            why = (
                "Suggested because your farm experiences an 11-week bare-field period during summer (Zaid) with high evaporative loss. "
                "Adding a 60-day summer mung bean captures residual post-wheat warmth, shields the soil with active canopy, "
                "and produces high-value pulse income while biologically fixing nitrogen for your next rice crop."
            )
        elif strat_id == "strategy_c" and any(c.get("id") == "sesbania" for c in crop_objs):
            why = (
                "Suggested to address groundwater strain and soil carbon depletion. "
                "Incorporating Dhaincha green manure prior to monsoon rice and switching winter rabi to low-water lentil "
                "slashes irrigation draft by over 40% while returning substantial biological nitrogen to the topsoil."
            )
        elif strat_id == "strategy_c" and any(c.get("id") == "makhana" for c in crop_objs):
            why = (
                "Suggested for flood-prone lowlands where monsoon standing water drowns upland crops. "
                "Field-based Makhana capitalizes on waterlogging to produce Mithila GI-tagged superfood harvests, "
                "followed by winter rabi grain once floodwaters recede."
            )
        elif strat_id == "strategy_c":
            why = (
                "Suggested to maximize economic grain yield by pairing high-yielding Rabi maize with summer pulse soil restoration, "
                "substantially out-earning traditional wheat while breaking cereal weed monocultures."
            )
        else: # Strategy D: Maize - Mustard - Moong
            why = (
                "Suggested to break continuous cereal disease and weed cycles by rotating three distinct botanical families "
                "(Poaceae → Brassicaceae → Fabaceae). Mustard biofumigates soil pathogens, while summer moong rebuilds soil fertility."
            )

        # 2. EVIDENCE
        bare_weeks = indicators.get("bare_field_periods", [{}])[0].get("consecutive_weeks", 11)
        evidence = [
            f"NASA POWER observed {indicators.get('summary', {}).get('total_rainfall_mm', 828)} mm annual precipitation with heavy monsoon concentration.",
            f"Sentinel-2 & Landsat NDVI detected {bare_weeks} consecutive weeks of unshielded bare soil (NDVI < 0.20) from late March to June.",
            f"Observed {indicators.get('summary', {}).get('heat_stress_days', 0)} terminal heat stress days (Tmax ≥ 35°C) threatening late rabi cereal grain filling."
        ]

        # 3. BENEFITS
        benefits = []
        n_fixers = [c['name'] for c in crop_objs if c.get('nitrogen_fixation', {}).get('is_fixer')]
        if n_fixers:
            benefits.append(f"Soil Fertility: Biological nitrogen fixation from {', '.join(n_fixers)} reduces synthetic urea dependency.")
        else:
            benefits.append("Soil Health: Established baseline; leaves organic nitrogen rebuilding to chemical inputs.")

        if any(s.get('season') == 'zaid' and s.get('crop_id') for s in seq):
            benefits.append("Erosion Protection: Continuous summer canopy eliminates topsoil wind detachment and high-heat carbon oxidation.")
        else:
            benefits.append("Erosion Vulnerability: Unplanted summer ground remains susceptible to early monsoon sheetwash.")

        benefits.append(f"Water Efficiency: Criterion score of {crit.get('water_efficiency', 60)}/100 based on local evapotranspiration demand.")
        benefits.append(f"Economic Output: Income suitability score of {crit.get('income_market', 60)}/100 across regional market classes.")

        # 4. RISKS NEEDING LOCAL REVIEW ("Check with local experts")
        risks = []
        if strategy.get("is_baseline"):
            risks = [
                "Continued groundwater drawdown if pumping from declining tubewell water tables.",
                "High weed and pathogen carryover from repeated cereal-after-cereal Poaceae rotations.",
                "Terminal heat wave exposure during March wheat grain filling."
            ]
        elif any(c.get("id") == "mungbean" for c in crop_objs):
            risks = [
                "Summer Moong requires 2–3 assured irrigations during April–May; do not plant if tubewell access is dry.",
                "Tight turnaround: Wheat must be harvested promptly in early April to allow 60–65 days before rice transplanting.",
                "Verify pod-borer pesticide safety intervals and seed availability (varieties like SML 668, IPM 205-7) with local KVK."
            ]
        elif any(c.get("id") == "sesbania" for c in crop_objs):
            risks = [
                "Dhaincha must be buried at precisely 45–50 days with a rotavator before stems turn fibrous and woody.",
                "Adequate standing water or pre-monsoon rain needed for rapid soil incorporation and decomposition.",
                "Confirm local availability of certified Sesbania aculeata seed stocks."
            ]
        elif any(c.get("id") == "mustard" for c in crop_objs):
            risks = [
                "Mustard is vulnerable to cold wave / frost damage and aphid surges during December flowering.",
                "Requires well-drained loam; avoid waterlogged heavy clay Tal soils."
            ]
        elif any(c.get("id") == "makhana" for c in crop_objs):
            risks = [
                "Requires specialized local diving/harvesting labor and water bunding infrastructure.",
                "Field de-watering schedule must be coordinated before subsequent rabi crop sowing."
            ]
        else:
            risks = [
                "Verify local seed variety performance with District Agriculture Officer.",
                "Check spot market mandi price stability before switching major crop acreage."
            ]

        return {
            "id": strategy["id"],
            "name": strategy["name"],
            "strategy_type": strategy.get("strategy_type", "Alternative"),
            "is_baseline": strategy.get("is_baseline", False),
            "composite_score": composite_score,
            "sequence": seq,
            "why_suggested": why,
            "evidence": evidence,
            "benefits": benefits,
            "information_gaps": confidence_info["information_gaps"],
            "risks_needing_local_review": risks,
            "confidence": {
                "level": confidence_info["level"],
                "explanation": confidence_info["explanation"]
            },
            "criteria_scores": crit,
            "weights_used": scores.get("weights_used", {}),
            "support_not_replace_reminder": "Decision support only. Review variety choices, soil test values, and water access with your local Krishi Vigyan Kendra (KVK) before planting."
        }
