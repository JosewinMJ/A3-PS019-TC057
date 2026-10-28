# PrivacyLens — Testing Strategy & Verification Report

## 1. Automated Test Suite Summary

The PrivacyLens automated test suite contains **25 test cases** spanning unit, integration, and end-to-end API validations. All tests run automatically via `pytest`.

```bash
python -m pytest backend/tests -v
```

### Test Suite Execution Output
```text
backend/tests/test_api.py::test_api_health PASSED                        [  4%]
backend/tests/test_api.py::test_api_datasets_list PASSED                 [  8%]
backend/tests/test_api.py::test_api_dashboard_metrics PASSED             [ 12%]
backend/tests/test_api.py::test_api_scan_and_inventory_flow PASSED       [ 16%]
backend/tests/test_api.py::test_api_reports_csv_and_pdf PASSED           [ 20%]
backend/tests/test_connectors.py::test_csv_connector_synthetic_customers PASSED [ 24%]
backend/tests/test_connectors.py::test_csv_connector_empty_file PASSED   [ 28%]
backend/tests/test_connectors.py::test_sqlite_connector_tables PASSED    [ 32%]
backend/tests/test_connectors.py::test_sqlite_connector_schema_and_sampling PASSED [ 36%]
backend/tests/test_connectors.py::test_sqlite_connector_rejects_arbitrary_table PASSED [ 40%]
backend/tests/test_metadata_and_eval.py::test_metadata_exact_matching PASSED [ 44%]
backend/tests/test_metadata_and_eval.py::test_metadata_missing_purpose_flagged PASSED [ 48%]
backend/tests/test_metadata_and_eval.py::test_metadata_missing_retention_flagged PASSED [ 52%]
backend/tests/test_metadata_and_eval.py::test_metadata_missing_both_flagged PASSED [ 56%]
backend/tests/test_metadata_and_eval.py::test_accuracy_evaluator_on_test_set PASSED [ 60%]
backend/tests/test_scanner.py::test_person_name_detection PASSED         [ 64%]
backend/tests/test_scanner.py::test_email_address_detection PASSED       [ 68%]
backend/tests/test_scanner.py::test_indian_phone_number_detection PASSED [ 72%]
backend/tests/test_scanner.py::test_aadhaar_candidate_detection PASSED   [ 76%]
backend/tests/test_scanner.py::test_pan_candidate_detection PASSED       [ 80%]
backend/tests/test_scanner.py::test_dob_detection PASSED                 [ 84%]
backend/tests/test_scanner.py::test_negative_controls_not_flagged PASSED [ 88%]
backend/tests/test_scanner.py::test_created_at_timestamp_not_flagged_as_dob PASSED [ 92%]
backend/tests/test_scanner.py::test_future_date_rejected_by_dob_validator PASSED [ 96%]
backend/tests/test_scanner.py::test_dummy_phone_rejected_by_validator PASSED [100%]

======================= 25 passed in 2.46s =======================
```

---

## 2. Test Category Breakdown

### A. Detection Engine Tests (`backend/tests/test_scanner.py`)
- **Five Configurable Classes:** Validates `person_name`, `email_address`, `phone_number` (+91 and 10-digit), `government_id` (Aadhaar 12-digit and PAN alphanumeric), and `date_of_birth`.
- **Negative Controls:** Verifies non-personal fields (`product_id`, `order_total`, `item_quantity`, `shipping_status`, `company_name`) do NOT trigger false positives (confidence score < 0.50).
- **Date/Timestamp Disambiguation:** Verifies `created_at` timestamps are not misclassified as dates of birth.
- **Plausibility Validators:** Verifies rejection of future dates (e.g. `2099-01-01`) and dummy repetitive phone sequences (e.g. `1111111111`).
- **Memory Redaction:** Verifies that raw PII values are redacted and never retained in plaintext inside candidate previews.

### B. Connector & Input Validation Tests (`backend/tests/test_connectors.py`)
- **CSV Parsing:** Verifies encoding tolerance (UTF-8, Latin-1), header deduplication, and non-null sample extraction.
- **Empty File Handling:** Verifies that empty CSV uploads raise explicit errors rather than crashing.
- **SQLite Table Discovery:** Discovers user tables (`customers`, `employees`, `orders`) while excluding internal `sqlite_%` tables.
- **Safe SQL Sampling:** Verifies read-only mode and rejection of malicious arbitrary table injection strings.

### C. Governance & Evaluation Tests (`backend/tests/test_metadata_and_eval.py`)
- **Compound Metadata Mapping:** Verifies exact triple matching `(dataset, table, column)`.
- **Missing Purpose Flagging:** Identifies records with defined retention but blank declared purpose.
- **Missing Retention Flagging:** Identifies records with declared purpose but blank retention rules.
- **Missing Both Flagging:** Identifies discovered candidate fields unregistered in the governance register.
- **Evaluation Accuracy:** Evaluates ground-truth test set, calculating TP, FP, FN, Precision, Recall, and F1 with explicit zero-division guards.

### D. End-to-End API Integration Tests (`backend/tests/test_api.py`)
- **Health Check:** `GET /api/health` returns healthy status and service version.
- **Datasets:** `GET /api/datasets` lists registered data sources.
- **Full Discovery Workflow:** Initiates scan via `POST /api/scans`, verifies completion, queries `GET /api/inventory`, and executes human review status update via `PATCH /api/inventory/{id}/review`.
- **Reports Export:** Validates CSV export and binary `%PDF` document generation via ReportLab.

---

## 3. Manual Mentor Demonstration Checklist

For a live mentor evaluation, follow this verified demonstration walkthrough:

| Step | Action | Expected Mentor Result |
| :--- | :--- | :--- |
| **1** | Open Dashboard (`http://localhost:5173`) | Telemetry cards show real dataset counts, personal data distribution bar chart, confidence donut chart, and recent scan logs. |
| **2** | Navigate to **Data Sources** | View pre-seeded `synthetic_customers.csv`, `synthetic_employees.csv`, and `sample_enterprise.db`. Click "Inspect Schema" to demonstrate safe sampling. |
| **3** | Upload New CSV or SQLite File | Upload a custom CSV or SQLite database; verify file validation and instant schema extraction. |
| **4** | Navigate to **Scan Data** | Select `sample_enterprise.db`. Choose target tables (`customers`, `employees`, `orders`). Click "Execute Scan". Engine completes scan in < 1 second. |
| **5** | Inspect **Evidence Inventory** | Search for `aadhaar_no` or filter by `phone_number`. Click "Evidence" to demonstrate transparent signal breakdown and redacted values (`XXXX-XXXX-9102`). |
| **6** | Navigate to **Evidence Gaps** | Click "Missing Purpose" or "Missing Retention" filter tabs. Demonstrate that fields without registered purposes are cleanly flagged. |
| **7** | Navigate to **Review Center** | Select an unreviewed candidate field. Click "Confirm PII" or "Reject". Verify state transitions from `PENDING` to `CONFIRMED` or `REJECTED`. |
| **8** | Navigate to **Evaluation & Accuracy** | Click "Execute Live Evaluation". View benchmark calculation across 50+ labelled samples showing real Precision, Recall, and F1 scores. |
| **9** | Navigate to **Configurable Rules** | Review `rules.yaml` in the live editor. Demonstrate that scoring weights or regex patterns can be modified and validated on the fly. |
| **10** | Export Reports | Click "Inventory CSV", "Gaps CSV", or "Export PDF" in the header. Inspect the generated PDF report with formal disclaimer. |
