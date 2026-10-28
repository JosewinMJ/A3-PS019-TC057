import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Tuple
import pandas as pd

class SQLiteConnector:
    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)

    def validate(self) -> None:
        if not self.db_path.exists():
            raise FileNotFoundError(f"Database file not found: {self.db_path.name}")
        if self.db_path.stat().st_size < 100:
            raise ValueError("File is too small to be a valid SQLite database")

        # Validate header magic bytes
        with open(self.db_path, "rb") as f:
            header = f.read(16)
            if not header.startswith(b"SQLite format 3\x00"):
                raise ValueError("File is not a valid SQLite database format")

    def get_connection(self) -> sqlite3.Connection:
        self.validate()
        # Open in read-only mode to prevent write modifications
        uri = f"file:{self.db_path.resolve().as_posix()}?mode=ro"
        conn = sqlite3.connect(uri, uri=True)
        conn.row_factory = sqlite3.Row
        return conn

    def list_tables(self) -> List[str]:
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            """)
            tables = [row["name"] for row in cursor.fetchall()]
            return tables
        finally:
            conn.close()

    def inspect_table(self, table_name: str, max_sample_rows: int = 100) -> Tuple[int, List[Dict[str, Any]], pd.DataFrame]:
        allowed_tables = self.list_tables()
        if table_name not in allowed_tables:
            raise ValueError(f"Table '{table_name}' does not exist in database")

        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            # Get row count safely
            # Since table_name is strictly verified against sqlite_master, quoting is safe
            cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
            row_count = cursor.fetchone()[0]

            # Get schema info
            cursor.execute(f'PRAGMA table_info("{table_name}")')
            columns_info = cursor.fetchall()

            # Read sample values using pandas with parameterized query
            query = f'SELECT * FROM "{table_name}" LIMIT {int(max_sample_rows)}'
            df_sample = pd.read_sql_query(query, conn)

            column_metadata = []
            for col in columns_info:
                col_name = col["name"]
                col_type = col["type"] or "TEXT"
                sample_vals = []
                non_null_count = 0
                if col_name in df_sample.columns:
                    series = df_sample[col_name].dropna()
                    non_null_count = len(series)
                    sample_vals = [str(v) for v in series.head(10).tolist()]

                column_metadata.append({
                    "name": col_name,
                    "data_type": col_type,
                    "non_null_count": non_null_count,
                    "sample_values": sample_vals
                })

            return row_count, column_metadata, df_sample
        finally:
            conn.close()
