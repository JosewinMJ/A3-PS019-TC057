import pytest
from pathlib import Path
from backend.app.connectors.csv_connector import CSVConnector
from backend.app.connectors.sqlite_connector import SQLiteConnector

def test_csv_connector_synthetic_customers():
    csv_path = Path("sample_data/synthetic_customers.csv")
    connector = CSVConnector(csv_path)
    total_rows, cols, df_sample = connector.inspect()
    assert total_rows >= 10
    col_names = [c["name"] for c in cols]
    assert "full_name" in col_names
    assert "email_address" in col_names
    assert "mobile_number" in col_names

def test_csv_connector_empty_file(tmp_path):
    empty_file = tmp_path / "empty.csv"
    empty_file.write_text("")
    connector = CSVConnector(empty_file)
    with pytest.raises(ValueError, match="empty"):
        connector.inspect()

def test_sqlite_connector_tables():
    db_path = Path("sample_data/sample_enterprise.db")
    connector = SQLiteConnector(db_path)
    tables = connector.list_tables()
    assert "customers" in tables
    assert "employees" in tables
    assert "orders" in tables

def test_sqlite_connector_schema_and_sampling():
    db_path = Path("sample_data/sample_enterprise.db")
    connector = SQLiteConnector(db_path)
    row_count, cols, df = connector.inspect_table("customers", max_sample_rows=5)
    assert row_count >= 8
    assert len(df) == 5
    col_names = [c["name"] for c in cols]
    assert "full_name" in col_names
    assert "aadhaar_no" in col_names

def test_sqlite_connector_rejects_arbitrary_table():
    db_path = Path("sample_data/sample_enterprise.db")
    connector = SQLiteConnector(db_path)
    with pytest.raises(ValueError, match="does not exist"):
        connector.inspect_table("non_existent_table; DROP TABLE users;")
