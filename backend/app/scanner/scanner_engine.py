import re
import pandas as pd
from typing import List, Dict, Any, Optional
from backend.app.scanner.rules_engine import rules_engine
from backend.app.scanner.validators import VALIDATOR_MAP, mask_sample_value

class DetectionCandidate:
    def __init__(
        self,
        column_name: str,
        candidate_class: str,
        confidence_score: float,
        evidence_summary: str,
        signals_breakdown: Dict[str, Any],
        sampled_count: int,
        match_count: int,
        sample_values_masked: List[str]
    ):
        self.column_name = column_name
        self.candidate_class = candidate_class
        self.confidence_score = confidence_score
        self.evidence_summary = evidence_summary
        self.signals_breakdown = signals_breakdown
        self.sampled_count = sampled_count
        self.match_count = match_count
        self.sample_values_masked = sample_values_masked

    def to_dict(self) -> Dict[str, Any]:
        return {
            "column_name": self.column_name,
            "candidate_class": self.candidate_class,
            "confidence_score": round(self.confidence_score, 3),
            "evidence_summary": self.evidence_summary,
            "signals_breakdown": self.signals_breakdown,
            "sampled_count": self.sampled_count,
            "match_count": self.match_count,
            "sample_values_masked": self.sample_values_masked
        }

class ScannerEngine:
    def __init__(self, engine=None):
        self.rules = engine or rules_engine

    def scan_column(
        self,
        column_name: str,
        sample_series: pd.Series
    ) -> Optional[DetectionCandidate]:
        """
        Scans a single column across all 5 candidate personal-data classes.
        Calculates transparent confidence score from multiple signals.
        Returns the highest-scoring candidate if above threshold.
        """
        # Clean and extract valid non-null string samples
        non_null_samples = [
            str(val).strip() for val in sample_series.dropna().tolist()
            if str(val).strip().lower() not in ("nan", "none", "null", "")
        ]

        total_sampled = len(non_null_samples)
        classes_def = self.rules.get_classes()
        threshold = self.rules.get_candidate_threshold()

        best_candidate: Optional[DetectionCandidate] = None
        highest_score = 0.0

        for class_name, c_def in classes_def.items():
            scoring = c_def.get("scoring", {})
            w_col = scoring.get("column_weight", 0.35)
            w_val = scoring.get("value_weight", 0.45)
            w_val_bonus = scoring.get("validator_bonus", 0.20)

            # 1. Column Signal
            col_match = False
            col_matched_pat = ""
            for pat in self.rules.compiled_column_patterns.get(class_name, []):
                if pat.search(column_name):
                    col_match = True
                    col_matched_pat = pat.pattern
                    break

            neg_col_match = False
            for n_pat in self.rules.compiled_negative_column_patterns.get(class_name, []):
                if n_pat.search(column_name):
                    neg_col_match = True
                    break

            col_score = 1.0 if col_match else 0.0
            if neg_col_match:
                col_score = max(0.0, col_score - 0.70)

            # 2. Value Pattern Matching Signal
            val_patterns = self.rules.compiled_value_patterns.get(class_name, [])
            val_matches = 0
            if total_sampled > 0 and val_patterns:
                for sample in non_null_samples:
                    if any(vp.search(sample) for vp in val_patterns):
                        val_matches += 1
                val_ratio = val_matches / total_sampled
            else:
                val_ratio = 0.0

            # 3. Format Validator Signal
            val_name = c_def.get("validator")
            validator_func = VALIDATOR_MAP.get(val_name) if val_name else None
            valid_count = 0
            validator_notes = []

            if validator_func and total_sampled > 0:
                for sample in non_null_samples:
                    is_valid, note = validator_func(sample)
                    if is_valid:
                        valid_count += 1
                valid_ratio = valid_count / total_sampled
                validator_note_summary = f"{valid_count}/{total_sampled} samples passed format validation"
            else:
                # If no validator configured, neutral bonus if values matched
                valid_ratio = val_ratio if val_ratio > 0 else 0.0
                validator_note_summary = "No domain-specific validator configured"

            # 4. Transparent Confidence Calculation
            # Base combination
            combined_score = (col_score * w_col) + (val_ratio * w_val) + (valid_ratio * w_val_bonus)

            # Strict guardrails against false positives:
            # - If negative column pattern matched, invalidate column score and cap confidence
            if neg_col_match:
                col_score = 0.0
                combined_score = min(combined_score, 0.35)

            # - A column match alone with 0% matching values should NOT be marked as high confidence
            if total_sampled >= 3 and val_ratio == 0.0 and col_score > 0:
                combined_score = min(combined_score, 0.40)  # Below threshold

            # - If zero column match and low value ratio (<0.5), do not flag
            if col_score == 0 and val_ratio < 0.50:
                combined_score = min(combined_score, 0.45)

            if combined_score >= threshold and combined_score > highest_score:
                highest_score = combined_score

                # Formulate human-readable evidence summary
                evidence_parts = []
                if col_match:
                    evidence_parts.append(f"Column name '{column_name}' matched pattern")
                if neg_col_match:
                    evidence_parts.append("Negative column indicator detected (penalized)")
                if total_sampled > 0:
                    evidence_parts.append(f"{val_matches}/{total_sampled} sampled values ({val_ratio*100:.1f}%) matched format rules")
                    if validator_func:
                        evidence_parts.append(f"{valid_count}/{total_sampled} ({valid_ratio*100:.1f}%) passed {val_name}")
                else:
                    evidence_parts.append("No non-null sample values available; classification based on schema")

                evidence_summary = "; ".join(evidence_parts)

                # Mask sample values for secure privacy preview
                masked_samples = [
                    mask_sample_value(class_name, val)
                    for val in non_null_samples[:5]
                ]

                signals_breakdown = {
                    "column_matched": col_match,
                    "column_score": round(col_score, 2),
                    "negative_column_match": neg_col_match,
                    "value_match_ratio": round(val_ratio, 3),
                    "validator_pass_ratio": round(valid_ratio, 3),
                    "samples_evaluated": total_sampled,
                    "samples_matched": val_matches,
                    "weights": {
                        "column": w_col,
                        "value": w_val,
                        "validator": w_val_bonus
                    }
                }

                best_candidate = DetectionCandidate(
                    column_name=column_name,
                    candidate_class=class_name,
                    confidence_score=combined_score,
                    evidence_summary=evidence_summary,
                    signals_breakdown=signals_breakdown,
                    sampled_count=total_sampled,
                    match_count=val_matches,
                    sample_values_masked=masked_samples
                )

        return best_candidate

    def scan_dataframe(
        self,
        df: pd.DataFrame
    ) -> List[DetectionCandidate]:
        """Scans all columns in a pandas DataFrame and returns candidate detections."""
        candidates = []
        for col in df.columns:
            candidate = self.scan_column(str(col), df[col])
            if candidate:
                candidates.append(candidate)
        return candidates

scanner_engine = ScannerEngine()
