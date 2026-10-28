import uuid
import datetime
import pandas as pd
from typing import Dict, Any, List, Optional
from pathlib import Path
from sqlalchemy.orm import Session
from backend.app.scanner.scanner_engine import ScannerEngine, scanner_engine
from backend.app.models.models import EvaluationRun

REQUIRED_CLASSES = [
    "person_name",
    "email_address",
    "phone_number",
    "government_id",
    "date_of_birth"
]

class AccuracyEvaluator:
    def __init__(self, scanner: Optional[ScannerEngine] = None):
        self.scanner = scanner or scanner_engine

    def evaluate_test_set(
        self,
        db: Session,
        test_set_path: Path,
        run_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs evaluation on a labelled test dataset containing columns:
        'column_name', 'sample_value', 'true_class'.
        Calculates per-class TP, FP, FN, Precision, Recall, and F1 score.
        """
        if not test_set_path.exists():
            raise FileNotFoundError(f"Labelled test set not found at: {test_set_path}")

        df = pd.read_csv(test_set_path)
        if "column_name" not in df.columns or "sample_value" not in df.columns or "true_class" not in df.columns:
            raise ValueError("Test set CSV must contain columns: 'column_name', 'sample_value', 'true_class'")

        total_evaluated = len(df)
        predictions = []

        # Counters per class
        metrics_by_class: Dict[str, Dict[str, int]] = {
            c: {"tp": 0, "fp": 0, "fn": 0, "tn": 0, "support": 0}
            for c in REQUIRED_CLASSES
        }

        for idx, row in df.iterrows():
            col_name = str(row["column_name"])
            val = str(row["sample_value"]) if pd.notna(row["sample_value"]) else ""
            true_cls = str(row["true_class"]).strip().lower()

            # Create a 1-element series to run scanner
            sample_series = pd.Series([val])
            candidate = self.scanner.scan_column(col_name, sample_series)
            pred_cls = candidate.candidate_class if candidate else "non_personal"
            conf = candidate.confidence_score if candidate else 0.0

            predictions.append({
                "index": int(idx),
                "column_name": col_name,
                "sample_value": val[:30],  # mask/truncate for review table
                "true_class": true_cls,
                "predicted_class": pred_cls,
                "confidence": round(conf, 3),
                "is_correct": (true_cls == pred_cls)
            })

            # Update per-class metrics
            for c in REQUIRED_CLASSES:
                is_true = (true_cls == c)
                is_pred = (pred_cls == c)

                if is_true:
                    metrics_by_class[c]["support"] += 1

                if is_true and is_pred:
                    metrics_by_class[c]["tp"] += 1
                elif not is_true and is_pred:
                    metrics_by_class[c]["fp"] += 1
                elif is_true and not is_pred:
                    metrics_by_class[c]["fn"] += 1
                else:
                    metrics_by_class[c]["tn"] += 1

        # Calculate Precision, Recall, F1
        per_class_results = {}
        sum_prec = 0.0
        sum_rec = 0.0
        sum_f1 = 0.0

        for c in REQUIRED_CLASSES:
            tp = metrics_by_class[c]["tp"]
            fp = metrics_by_class[c]["fp"]
            fn = metrics_by_class[c]["fn"]
            tn = metrics_by_class[c]["tn"]
            support = metrics_by_class[c]["support"]

            # Explicit zero denominator handling (sklearn zero_division=0 convention)
            prec = (tp / (tp + fp)) if (tp + fp) > 0 else 0.0
            rec = (tp / (tp + fn)) if (tp + fn) > 0 else 0.0
            f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

            per_class_results[c] = {
                "data_class": c,
                "true_positives": tp,
                "false_positives": fp,
                "false_negatives": fn,
                "true_negatives": tn,
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "support": support
            }

            sum_prec += prec
            sum_rec += rec
            sum_f1 += f1

        macro_precision = round(sum_prec / len(REQUIRED_CLASSES), 4)
        macro_recall = round(sum_rec / len(REQUIRED_CLASSES), 4)
        macro_f1 = round(sum_f1 / len(REQUIRED_CLASSES), 4)

        run_id = str(uuid.uuid4())
        name = run_name or f"Evaluation Run {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}"

        eval_record = EvaluationRun(
            id=run_id,
            run_name=name,
            test_set_name=test_set_path.name,
            total_evaluated=total_evaluated,
            overall_precision=macro_precision,
            overall_recall=macro_recall,
            overall_f1=macro_f1,
            per_class_metrics=per_class_results,
            predictions_breakdown=predictions,
            executed_at=datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        )
        db.add(eval_record)
        db.commit()
        db.refresh(eval_record)

        return {
            "id": run_id,
            "run_name": name,
            "test_set_name": test_set_path.name,
            "total_evaluated": total_evaluated,
            "overall_precision": macro_precision,
            "overall_recall": macro_recall,
            "overall_f1": macro_f1,
            "per_class_metrics": per_class_results,
            "predictions_breakdown": predictions,
            "executed_at": eval_record.executed_at
        }
