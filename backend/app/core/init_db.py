import shutil
from pathlib import Path
from backend.app.core.config import UPLOADS_DIR
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.models.models import Dataset
from backend.app.connectors.csv_connector import CSVConnector
from backend.app.connectors.sqlite_connector import SQLiteConnector
from backend.app.metadata.manager import MetadataManager
from backend.app.scanner.scanner_engine import scanner_engine

def seed_demo_data():
    """Populates initial sample datasets and metadata register for immediate demo usability."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Load purpose & retention metadata register
        meta_file = Path("sample_data/purpose_retention.csv")
        if meta_file.exists():
            with open(meta_file, "r", encoding="utf-8") as f:
                content = f.read()
            MetadataManager.import_from_csv(db, content)
            print("Imported initial purpose & retention metadata register.")

        # 2. Check if datasets already seeded
        existing_datasets = db.query(Dataset).count()
        if existing_datasets == 0:
            # Seed CSV 1: synthetic_customers.csv
            cust_src = Path("sample_data/synthetic_customers.csv")
            if cust_src.exists():
                dest_csv = UPLOADS_DIR / "demo_synthetic_customers.csv"
                shutil.copyfile(cust_src, dest_csv)
                conn = CSVConnector(dest_csv)
                rows, cols, _ = conn.inspect()
                d1 = Dataset(
                    id="demo-customers-csv",
                    name="synthetic_customers.csv",
                    source_type="csv",
                    file_path=str(dest_csv),
                    row_count=rows,
                    table_count=1
                )
                db.add(d1)

            # Seed CSV 2: synthetic_employees.csv
            emp_src = Path("sample_data/synthetic_employees.csv")
            if emp_src.exists():
                dest_emp = UPLOADS_DIR / "demo_synthetic_employees.csv"
                shutil.copyfile(emp_src, dest_emp)
                conn = CSVConnector(dest_emp)
                rows, cols, _ = conn.inspect()
                d2 = Dataset(
                    id="demo-employees-csv",
                    name="synthetic_employees.csv",
                    source_type="csv",
                    file_path=str(dest_emp),
                    row_count=rows,
                    table_count=1
                )
                db.add(d2)

            # Seed SQLite: sample_enterprise.db
            db_src = Path("sample_data/sample_enterprise.db")
            if db_src.exists():
                dest_db = UPLOADS_DIR / "demo_sample_enterprise.db"
                shutil.copyfile(db_src, dest_db)
                conn = SQLiteConnector(dest_db)
                tables = conn.list_tables()
                total_r = sum(conn.inspect_table(t, 1)[0] for t in tables)
                d3 = Dataset(
                    id="demo-enterprise-sqlite",
                    name="sample_enterprise.db",
                    source_type="sqlite",
                    file_path=str(dest_db),
                    row_count=total_r,
                    table_count=len(tables)
                )
                db.add(d3)

            db.commit()
            print("Successfully pre-seeded demo datasets in PrivacyLens storage.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
