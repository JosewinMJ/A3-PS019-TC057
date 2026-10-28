import pytest
import pandas as pd
from backend.app.scanner.scanner_engine import ScannerEngine
from backend.app.scanner.rules_engine import RulesEngine
from backend.app.scanner.validators import (
    person_name_validator, email_address_validator,
    phone_number_validator, government_id_validator, dob_validator
)

@pytest.fixture
def scanner():
    return ScannerEngine()

def test_person_name_detection(scanner):
    series = pd.Series(["Aarav Sharma", "Priya Patel", "Vikram Malhotra", "Sneha Kulkarni"])
    candidate = scanner.scan_column("full_name", series)
    assert candidate is not None
    assert candidate.candidate_class == "person_name"
    assert candidate.confidence_score >= 0.70
    assert "Aarav Sharma" not in candidate.sample_values_masked[0]  # Masked!

def test_email_address_detection(scanner):
    series = pd.Series(["aarav.sharma@example.in", "priya.p@corp.com", "user123@domain.org"])
    candidate = scanner.scan_column("email_address", series)
    assert candidate is not None
    assert candidate.candidate_class == "email_address"
    assert candidate.confidence_score >= 0.80

def test_indian_phone_number_detection(scanner):
    series = pd.Series(["+91 98201 12345", "9876543210", "+91 97654 32109"])
    candidate = scanner.scan_column("mobile_number", series)
    assert candidate is not None
    assert candidate.candidate_class == "phone_number"
    assert candidate.confidence_score >= 0.70

def test_aadhaar_candidate_detection(scanner):
    series = pd.Series(["4512 8734 9102", "2341 5678 9012", "8765 4321 0987"])
    candidate = scanner.scan_column("aadhaar_number", series)
    assert candidate is not None
    assert candidate.candidate_class == "government_id"
    assert candidate.confidence_score >= 0.70

def test_pan_candidate_detection(scanner):
    series = pd.Series(["ABCDE1234F", "BZRPK9821L", "CLQPM4567K"])
    candidate = scanner.scan_column("pan_number", series)
    assert candidate is not None
    assert candidate.candidate_class == "government_id"
    assert candidate.confidence_score >= 0.70

def test_dob_detection(scanner):
    series = pd.Series(["1992-04-15", "1985-11-23", "1998-07-08"])
    candidate = scanner.scan_column("date_of_birth", series)
    assert candidate is not None
    assert candidate.candidate_class == "date_of_birth"
    assert candidate.confidence_score >= 0.70

def test_negative_controls_not_flagged(scanner):
    # Non-personal columns must not produce false positive candidate detections
    non_personal_tests = [
        ("product_id", pd.Series(["PROD-001", "PROD-002", "PROD-003"])),
        ("order_total", pd.Series(["149.50", "3200.00", "59.99"])),
        ("item_quantity", pd.Series(["1", "5", "12"])),
        ("shipping_status", pd.Series(["DELIVERED", "SHIPPED", "PENDING"])),
        ("company_name", pd.Series(["Acme Corp", "Global Logistics LLC", "Tech Inc"])),
    ]
    for col_name, s in non_personal_tests:
        candidate = scanner.scan_column(col_name, s)
        assert candidate is None or candidate.confidence_score < 0.50

def test_created_at_timestamp_not_flagged_as_dob(scanner):
    # Timestamps with negative column name 'created_at' must not be classified as DOB
    series = pd.Series(["2023-01-10 09:30:00", "2023-02-14 11:20:00", "2023-03-22 14:15:00"])
    candidate = scanner.scan_column("created_at", series)
    assert candidate is None or candidate.candidate_class != "date_of_birth"

def test_future_date_rejected_by_dob_validator():
    is_valid, msg = dob_validator("2099-01-01")
    assert not is_valid
    assert "future" in msg.lower()

def test_dummy_phone_rejected_by_validator():
    is_valid, msg = phone_number_validator("1111111111")
    assert not is_valid
    assert "repetitive" in msg.lower()
