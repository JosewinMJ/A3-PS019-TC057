from pathlib import Path
import pandas as pd
from typing import Tuple, List, Dict, Any

class CSVConnector:
    def __init__(self, file_path: Path):
        self.file_path = Path(file_path)

    def validate(self) -> None:
        if not self.file_path.exists():
            raise FileNotFoundError(f"File not found: {self.file_path.name}")
        if self.file_path.stat().st_size == 0:
            raise ValueError(f"Uploaded CSV is empty: {self.file_path.name}")

    def inspect(self, max_sample_rows: int = 100) -> Tuple[int, List[Dict[str, Any]], pd.DataFrame]:
        self.validate()

        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
        df_sample = None
        total_rows = 0

        for enc in encodings:
            try:
                # Count total rows safely
                with open(self.file_path, "r", encoding=enc, errors="replace") as f:
                    total_rows = max(0, sum(1 for _ in f) - 1)

                # Read sample
                df_sample = pd.read_csv(
                    self.file_path,
                    encoding=enc,
                    nrows=max_sample_rows,
                    on_bad_lines="skip"
                )
                break
            except Exception:
                continue

        if df_sample is None:
            raise ValueError(f"Unable to parse CSV file with supported encodings: {self.file_path.name}")

        # Deduplicate column names if needed
        cols = []
        col_counts: Dict[str, int] = {}
        for c in df_sample.columns:
            c_str = str(c).strip()
            if not c_str:
                c_str = "unnamed_column"
            if c_str in col_counts:
                col_counts[c_str] += 1
                c_str = f"{c_str}_{col_counts[c_str]}"
            else:
                col_counts[c_str] = 0
            cols.append(c_str)
        df_sample.columns = cols

        column_metadata = []
        for col_name in df_sample.columns:
            series = df_sample[col_name].dropna()
            non_null_count = len(series)
            sample_vals = [str(v) for v in series.head(10).tolist()]
            column_metadata.append({
                "name": col_name,
                "data_type": str(df_sample[col_name].dtype),
                "non_null_count": non_null_count,
                "sample_values": sample_vals
            })

        return total_rows, column_metadata, df_sample
