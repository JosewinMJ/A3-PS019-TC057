import io
import uuid
import pandas as pd
from typing import Optional, Tuple, Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.models import PurposeRetentionMetadata

class MetadataManager:
    @staticmethod
    def get_all(db: Session) -> List[PurposeRetentionMetadata]:
        return db.query(PurposeRetentionMetadata).order_by(
            PurposeRetentionMetadata.dataset_name,
            PurposeRetentionMetadata.table_name,
            PurposeRetentionMetadata.column_name
        ).all()

    @staticmethod
    def create_or_update(
        db: Session,
        dataset_name: str,
        table_name: str,
        column_name: str,
        data_class: Optional[str] = None,
        declared_purpose: Optional[str] = None,
        retention_period: Optional[str] = None,
        metadata_owner: Optional[str] = None,
        last_reviewed_date: Optional[str] = None,
        notes: Optional[str] = None
    ) -> PurposeRetentionMetadata:
        dataset_name_clean = dataset_name.strip()
        table_name_clean = (table_name or "").strip()
        column_name_clean = column_name.strip()

        # Find existing exact match
        record = db.query(PurposeRetentionMetadata).filter(
            PurposeRetentionMetadata.dataset_name == dataset_name_clean,
            PurposeRetentionMetadata.table_name == table_name_clean,
            PurposeRetentionMetadata.column_name == column_name_clean
        ).first()

        if record:
            if data_class is not None:
                record.data_class = data_class
            if declared_purpose is not None:
                record.declared_purpose = declared_purpose
            if retention_period is not None:
                record.retention_period = retention_period
            if metadata_owner is not None:
                record.metadata_owner = metadata_owner
            if last_reviewed_date is not None:
                record.last_reviewed_date = last_reviewed_date
            if notes is not None:
                record.notes = notes
        else:
            record = PurposeRetentionMetadata(
                id=str(uuid.uuid4()),
                dataset_name=dataset_name_clean,
                table_name=table_name_clean,
                column_name=column_name_clean,
                data_class=data_class,
                declared_purpose=declared_purpose,
                retention_period=retention_period,
                metadata_owner=metadata_owner,
                last_reviewed_date=last_reviewed_date,
                notes=notes
            )
            db.add(record)

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def match_metadata(
        db: Session,
        dataset_name: str,
        table_name: str,
        column_name: str
    ) -> Tuple[Optional[PurposeRetentionMetadata], str]:
        """
        Maps detected field to metadata record using dataset, table, and column identifiers.
        Prevents ambiguous single-column mapping when multiple different records exist.
        Returns: (matched_record, status_string)
        """
        dataset_clean = dataset_name.strip()
        table_clean = (table_name or "").strip()
        col_clean = column_name.strip()

        # 1. Exact triple match: (dataset, table, column)
        exact_query = db.query(PurposeRetentionMetadata).filter(
            PurposeRetentionMetadata.dataset_name == dataset_clean,
            PurposeRetentionMetadata.table_name == table_clean,
            PurposeRetentionMetadata.column_name == col_clean
        ).all()

        if len(exact_query) == 1:
            rec = exact_query[0]
            status = MetadataManager.compute_status(rec)
            return rec, status
        elif len(exact_query) > 1:
            return None, "Ambiguous metadata match"

        # 2. Table + Column match (when dataset name may differ, e.g., table 'customers')
        if table_clean:
            table_col_query = db.query(PurposeRetentionMetadata).filter(
                PurposeRetentionMetadata.table_name == table_clean,
                PurposeRetentionMetadata.column_name == col_clean
            ).all()

            if len(table_col_query) == 1:
                rec = table_col_query[0]
                status = MetadataManager.compute_status(rec)
                return rec, status
            elif len(table_col_query) > 1:
                return None, "Ambiguous metadata match"

        # 3. Column match across global register - ONLY permitted if globally unique!
        col_only_query = db.query(PurposeRetentionMetadata).filter(
            PurposeRetentionMetadata.column_name == col_clean
        ).all()

        if len(col_only_query) == 1 and not col_only_query[0].table_name and not col_only_query[0].dataset_name:
            rec = col_only_query[0]
            status = MetadataManager.compute_status(rec)
            return rec, status
        elif len(col_only_query) > 1:
            # Multiple records with same column name -> ambiguous match
            return None, "Ambiguous metadata match"

        # No metadata record registered for this field
        return None, "Missing both"

    @staticmethod
    def compute_status(record: Optional[PurposeRetentionMetadata]) -> str:
        if not record:
            return "Missing both"

        has_purpose = bool(record.declared_purpose and str(record.declared_purpose).strip())
        has_retention = bool(record.retention_period and str(record.retention_period).strip())

        if has_purpose and has_retention:
            return "Complete metadata"
        elif has_purpose and not has_retention:
            return "Missing retention"
        elif not has_purpose and has_retention:
            return "Missing purpose"
        else:
            return "Missing both"

    @staticmethod
    def import_from_csv(db: Session, csv_content: str) -> Dict[str, Any]:
        """Imports purpose and retention metadata records from CSV content."""
        df = pd.read_csv(io.StringIO(csv_content))
        required_cols = ["column_name"]
        for c in required_cols:
            if c not in df.columns:
                raise ValueError(f"CSV missing mandatory column: '{c}'")

        imported_count = 0
        updated_count = 0

        for _, row in df.iterrows():
            col = str(row.get("column_name", "")).strip()
            if not col or col.lower() in ("nan", "none", "null"):
                continue

            dataset = str(row.get("dataset_name", "")).strip() if "dataset_name" in row else ""
            table = str(row.get("table_name", "")).strip() if "table_name" in row else ""
            d_class = str(row.get("data_class", "")).strip() if "data_class" in row and pd.notna(row["data_class"]) else None
            purpose = str(row.get("declared_purpose", "")).strip() if "declared_purpose" in row and pd.notna(row["declared_purpose"]) else None
            retention = str(row.get("retention_period", "")).strip() if "retention_period" in row and pd.notna(row["retention_period"]) else None
            owner = str(row.get("metadata_owner", "")).strip() if "metadata_owner" in row and pd.notna(row["metadata_owner"]) else None
            reviewed = str(row.get("last_reviewed_date", "")).strip() if "last_reviewed_date" in row and pd.notna(row["last_reviewed_date"]) else None
            notes = str(row.get("notes", "")).strip() if "notes" in row and pd.notna(row["notes"]) else None

            # Clean placeholder text
            if purpose in ("nan", "None", ""): purpose = None
            if retention in ("nan", "None", ""): retention = None
            if dataset in ("nan", "None"): dataset = ""
            if table in ("nan", "None"): table = ""

            existing = db.query(PurposeRetentionMetadata).filter(
                PurposeRetentionMetadata.dataset_name == dataset,
                PurposeRetentionMetadata.table_name == table,
                PurposeRetentionMetadata.column_name == col
            ).first()

            if existing:
                updated_count += 1
            else:
                imported_count += 1

            MetadataManager.create_or_update(
                db=db,
                dataset_name=dataset,
                table_name=table,
                column_name=col,
                data_class=d_class,
                declared_purpose=purpose,
                retention_period=retention,
                metadata_owner=owner,
                last_reviewed_date=reviewed,
                notes=notes
            )

        return {
            "total_rows": len(df),
            "new_imported": imported_count,
            "updated": updated_count
        }

    @staticmethod
    def export_to_csv(db: Session) -> str:
        records = MetadataManager.get_all(db)
        data = []
        for r in records:
            data.append({
                "dataset_name": r.dataset_name,
                "table_name": r.table_name,
                "column_name": r.column_name,
                "data_class": r.data_class or "",
                "declared_purpose": r.declared_purpose or "",
                "retention_period": r.retention_period or "",
                "metadata_owner": r.metadata_owner or "",
                "last_reviewed_date": r.last_reviewed_date or "",
                "notes": r.notes or ""
            })
        df = pd.DataFrame(data)
        return df.to_csv(index=False)
