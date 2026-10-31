import io
import sys
import sqlite3
import tempfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_everything():
    print("=== STARTING COMPREHENSIVE END-TO-END FEATURE AUDIT ===")

    # 1. Health
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health failed: {r.text}"
    print("[1/21] Health check: OK")

    # 2. Dashboard
    r = client.get("/api/dashboard")
    assert r.status_code == 200, f"Dashboard failed: {r.text}"
    db_data = r.json()
    assert "total_datasets" in db_data
    assert "class_counts" in db_data
    print("[2/21] Dashboard telemetry: OK")

    # 3. Datasets List
    r = client.get("/api/datasets")
    assert r.status_code == 200, f"Datasets failed: {r.text}"
    datasets = r.json()
    assert len(datasets) > 0, "No datasets returned"
    print(f"[3/21] Datasets listing ({len(datasets)} found): OK")

    # 4. Inspect Tables Schema for each dataset
    for ds in datasets:
        r = client.get(f"/api/datasets/{ds['id']}/tables")
        assert r.status_code == 200, f"Inspect tables failed for {ds['name']}: {r.text}"
        tables = r.json()
        assert len(tables) > 0, f"No tables in {ds['name']}"
    print("[4/21] Schema inspection (CSV & SQLite): OK")

    # 5. Upload New CSV
    csv_content = b"col_name,col_email,col_phone\nJohn Doe,john@example.com,9876543210\n"
    r = client.post(
        "/api/datasets/csv",
        files={"file": ("test_upload.csv", io.BytesIO(csv_content), "text/csv")}
    )
    assert r.status_code == 200, f"CSV upload failed: {r.text}"
    new_csv_id = r.json()["id"]
    print("[5/21] Upload CSV dataset: OK")

    # 6. Upload New SQLite DB
    temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    conn = sqlite3.connect(temp_db.name)
    conn.execute("CREATE TABLE users (id INT, full_name TEXT, email TEXT)")
    conn.execute("INSERT INTO users VALUES (1, 'Rohan Verma', 'rohan@example.com')")
    conn.commit()
    conn.close()
    with open(temp_db.name, "rb") as f:
        r = client.post(
            "/api/datasets/sqlite",
            files={"file": ("test_upload.db", f, "application/octet-stream")}
        )
    assert r.status_code == 200, f"SQLite upload failed: {r.text}"
    new_sqlite_id = r.json()["id"]
    print("[6/21] Upload SQLite dataset: OK")

    # 7. Execute Discovery Scan on Uploaded Datasets
    for test_id in [new_csv_id, new_sqlite_id]:
        r = client.post("/api/scans", json={"dataset_id": test_id})
        assert r.status_code == 200, f"Scan failed for {test_id}: {r.text}"
        scan_job = r.json()
        assert scan_job["status"] == "COMPLETED"
        assert scan_job["candidate_count"] > 0
    print("[7/21] Execute Discovery Scans (Multi-signal engine): OK")

    # 8. Delete Uploaded Test Datasets
    for test_id in [new_csv_id, new_sqlite_id]:
        r = client.delete(f"/api/datasets/{test_id}")
        assert r.status_code == 200, f"Delete failed: {r.text}"
    print("[8/21] Delete datasets: OK")

    # 9. Get Inventory
    r = client.get("/api/inventory")
    assert r.status_code == 200, f"Inventory failed: {r.text}"
    inv = r.json()
    assert len(inv) > 0, "Inventory should contain detections"
    print(f"[9/21] Privacy Evidence Inventory ({len(inv)} items): OK")

    # 10. Review Item (CONFIRMED & REJECTED)
    item_id = inv[0]["id"]
    r = client.patch(
        f"/api/inventory/{item_id}/review",
        json={"review_status": "CONFIRMED", "reviewer_notes": "Verified by security lead"}
    )
    assert r.status_code == 200, f"Review update failed: {r.text}"
    r = client.patch(
        f"/api/inventory/{item_id}/review",
        json={"review_status": "REJECTED", "reviewer_notes": "False positive"}
    )
    assert r.status_code == 200, f"Review update failed: {r.text}"
    r = client.patch(
        f"/api/inventory/{item_id}/review",
        json={"review_status": "PENDING", "reviewer_notes": "Reset to pending"}
    )
    assert r.status_code == 200
    print("[10/21] Human review & triage workflow: OK")

    # 11. Purpose & Retention Register
    r = client.get("/api/metadata")
    assert r.status_code == 200, f"Metadata failed: {r.text}"
    meta_list = r.json()
    print(f"[11/21] Purpose & Retention register listing ({len(meta_list)} entries): OK")

    # 12. Create New Metadata Record
    r = client.post(
        "/api/metadata",
        json={
            "column_name": "test_audit_col",
            "dataset_name": "test_dataset",
            "table_name": "test_table",
            "declared_purpose": "Security Auditing",
            "retention_period": "3 years",
            "metadata_owner": "Chief Privacy Officer"
        }
    )
    assert r.status_code == 200, f"Create metadata failed: {r.text}"
    print("[12/21] Register purpose & retention record: OK")

    # 13. Metadata CSV Import
    csv_data = "column_name,dataset_name,table_name,declared_purpose,retention_period\ncust_email,customers.csv,,Order Notifications,5 years\n"
    r = client.post(
        "/api/metadata/import-csv",
        files={"file": ("meta.csv", io.BytesIO(csv_data.encode()), "text/csv")}
    )
    assert r.status_code == 200, f"Metadata CSV import failed: {r.text}"
    print("[13/21] Purpose & retention CSV import: OK")

    # 14. Evidence Gaps Report
    r = client.get("/api/gaps")
    assert r.status_code == 200, f"Gaps report failed: {r.text}"
    gaps = r.json()
    assert "statistics" in gaps
    assert "gap_records" in gaps
    print(f"[14/21] Evidence gap detection ({len(gaps['gap_records'])} gaps found): OK")

    # 15. Run Evaluation Benchmark
    r = client.post("/api/evaluation", json={"run_name": "Comprehensive Audit Run"})
    assert r.status_code == 200, f"Evaluation run failed: {r.text}"
    eval_run = r.json()
    assert eval_run["total_evaluated"] > 0
    assert eval_run["overall_precision"] > 0
    assert eval_run["overall_recall"] > 0
    print(f"[15/21] Evaluation benchmark execution (P={eval_run['overall_precision']:.2f}, R={eval_run['overall_recall']:.2f}): OK")

    # 16. Evaluation History
    r = client.get("/api/evaluation")
    assert r.status_code == 200, f"Evaluation history failed: {r.text}"
    print("[16/21] Evaluation history: OK")

    # 17. Rules Fetching
    r = client.get("/api/rules")
    assert r.status_code == 200, f"Rules failed: {r.text}"
    rules_data = r.json()
    yaml_txt = rules_data["yaml_content"]
    print("[17/21] Fetch configurable YAML rules: OK")

    # 18. Rules Update (POST and PUT)
    r = client.post("/api/rules", json={"yaml_content": yaml_txt})
    assert r.status_code == 200, f"Rules POST failed: {r.text}"
    r = client.put("/api/rules", json={"yaml_content": yaml_txt})
    assert r.status_code == 200, f"Rules PUT failed: {r.text}"
    print("[18/21] Live rules validation & compilation (POST & PUT): OK")

    # 19. Inventory CSV Export
    r = client.get("/api/reports/inventory.csv")
    assert r.status_code == 200, f"Inventory CSV failed: {r.text}"
    assert "column_name" in r.text
    print("[19/21] Export Inventory CSV report: OK")

    # 20. Gaps CSV Export
    r = client.get("/api/reports/gaps.csv")
    assert r.status_code == 200, f"Gaps CSV failed: {r.text}"
    print("[20/21] Export Evidence Gaps CSV report: OK")

    # 21. Inventory PDF Export
    r = client.get("/api/reports/inventory.pdf")
    assert r.status_code == 200, f"Inventory PDF failed: {r.text}"
    assert r.content.startswith(b"%PDF"), "Response is not a valid PDF binary"
    print(f"[21/21] Export ReportLab PDF report ({len(r.content)} bytes): OK")

    print("\n" + "=" * 60)
    print("ALL 21 WORKFLOWS & BUTTON FUNCTIONS TESTED AND PASSING 100%!")
    print("=" * 60)

if __name__ == "__main__":
    test_everything()
