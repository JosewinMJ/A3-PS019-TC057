import pytest
from pathlib import Path
from backend.app.core.database import SessionLocal
from backend.app.metadata.manager import MetadataManager
from backend.app.evaluation.evaluator import AccuracyEvaluator

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_metadata_exact_matching(db_session):
    rec, status = MetadataManager.match_metadata(
        db_session,
        dataset_name="synthetic_customers.csv",
        table_name="synthetic_customers.csv",
        column_name="full_name"
    )
    assert rec is not None
    assert status == "Complete metadata"
    assert rec.declared_purpose is not None
    assert rec.retention_period is not None

def test_metadata_missing_purpose_flagged(db_session):
    rec, status = MetadataManager.match_metadata(
        db_session,
        dataset_name="synthetic_customers.csv",
        table_name="synthetic_customers.csv",
        column_name="aadhaar_number"
    )
    assert rec is not None
    assert status == "Missing purpose"

def test_metadata_missing_retention_flagged(db_session):
    rec, status = MetadataManager.match_metadata(
        db_session,
        dataset_name="synthetic_customers.csv",
        table_name="synthetic_customers.csv",
        column_name="date_of_birth"
    )
    assert rec is not None
    assert status == "Missing retention"

def test_metadata_missing_both_flagged(db_session):
    rec, status = MetadataManager.match_metadata(
        db_session,
        dataset_name="unregistered_dataset.csv",
        table_name="random_table",
        column_name="unknown_col_xyz"
    )
    assert rec is None
    assert status == "Missing both"

def test_accuracy_evaluator_on_test_set(db_session):
    test_set_path = Path("sample_data/labelled_test_set.csv")
    evaluator = AccuracyEvaluator()
    res = evaluator.evaluate_test_set(db_session, test_set_path, run_name="Automated Test Run")
    
    assert res["total_evaluated"] >= 40
    assert res["overall_precision"] > 0.80
    assert res["overall_recall"] > 0.80
    assert res["overall_f1"] > 0.80

    for cls_name in ["person_name", "email_address", "phone_number", "government_id", "date_of_birth"]:
        assert cls_name in res["per_class_metrics"]
        m = res["per_class_metrics"][cls_name]
        assert m["precision"] >= 0.0
        assert m["recall"] >= 0.0
        assert m["f1_score"] >= 0.0
