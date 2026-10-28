import os
import uuid
import datetime
import shutil
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.config import settings, UPLOADS_DIR
from backend.app.core.database import get_db
from backend.app.models.models import Dataset, ScanJob, ScanResult, PurposeRetentionMetadata, EvaluationRun
from backend.app.schemas.schemas import (
    DatasetResponse, TableInfoResponse, ColumnInfo,
    ScanCreateRequest, ScanJobResponse, ScanResultResponse, ReviewUpdateRequest,
    MetadataRecordCreate, MetadataRecordResponse,
    InventoryRecordResponse, EvidenceGapReportResponse, GapStatistics,
    DashboardMetricsResponse, EvaluationRunResponse
)
from backend.app.connectors.csv_connector import CSVConnector
from backend.app.connectors.sqlite_connector import SQLiteConnector
from backend.app.scanner.scanner_engine import scanner_engine
from backend.app.scanner.rules_engine import rules_engine
from backend.app.metadata.manager import MetadataManager
from backend.app.evaluation.evaluator import AccuracyEvaluator
from backend.app.reports.generator import ReportGenerator

router = APIRouter()


def now_utc():
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


# --- Health Check ---
@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": now_utc().isoformat()
    }

# --- Datasets ---
@router.post("/datasets/csv", response_model=DatasetResponse)
async def upload_csv_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported for this endpoint")

    dataset_id = str(uuid.uuid4())
    save_path = UPLOADS_DIR / f"{dataset_id}_{Path(file.filename).name}"

    try:
        with open(save_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        connector = CSVConnector(save_path)
        total_rows, cols, _ = connector.inspect(max_sample_rows=settings.MAX_SAMPLE_ROWS)

        dataset = Dataset(
            id=dataset_id,
            name=file.filename,
            source_type="csv",
            file_path=str(save_path),
            row_count=total_rows,
            table_count=1,
            created_at=now_utc()
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        return dataset
    except Exception as e:
        if save_path.exists():
            save_path.unlink()
        raise HTTPException(status_code=400, detail=f"Failed to process CSV: {str(e)}")

@router.post("/datasets/sqlite", response_model=DatasetResponse)
async def upload_sqlite_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    valid_exts = (".db", ".sqlite", ".sqlite3")
    if not any(file.filename.lower().endswith(ext) for ext in valid_exts):
        raise HTTPException(status_code=400, detail=f"File must have a SQLite extension: {valid_exts}")

    dataset_id = str(uuid.uuid4())
    save_path = UPLOADS_DIR / f"{dataset_id}_{Path(file.filename).name}"

    try:
        with open(save_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        connector = SQLiteConnector(save_path)
        tables = connector.list_tables()
        if not tables:
            raise ValueError("SQLite database contains no user tables")

        total_rows = 0
        for t in tables:
            r_count, _, _ = connector.inspect_table(t, max_sample_rows=1)
            total_rows += r_count

        dataset = Dataset(
            id=dataset_id,
            name=file.filename,
            source_type="sqlite",
            file_path=str(save_path),
            row_count=total_rows,
            table_count=len(tables),
            created_at=now_utc()
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        return dataset
    except Exception as e:
        if save_path.exists():
            save_path.unlink()
        raise HTTPException(status_code=400, detail=f"Invalid SQLite database: {str(e)}")

@router.get("/datasets", response_model=List[DatasetResponse])
def list_datasets(db: Session = Depends(get_db)):
    return db.query(Dataset).order_by(Dataset.created_at.desc()).all()

@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: str, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

@router.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    file_p = Path(dataset.file_path)
    if file_p.exists():
        file_p.unlink()

    db.delete(dataset)
    db.commit()
    return {"message": "Dataset deleted successfully"}

@router.get("/datasets/{dataset_id}/tables", response_model=List[TableInfoResponse])
def get_dataset_tables(dataset_id: str, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    file_path = Path(dataset.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Underlying dataset file missing from storage")

    if dataset.source_type == "csv":
        connector = CSVConnector(file_path)
        row_count, cols, _ = connector.inspect(max_sample_rows=settings.MAX_SAMPLE_ROWS)
        return [TableInfoResponse(
            table_name=dataset.name,
            row_count=row_count,
            columns=[ColumnInfo(**c) for c in cols]
        )]
    elif dataset.source_type == "sqlite":
        connector = SQLiteConnector(file_path)
        tables = connector.list_tables()
        result = []
        for t in tables:
            row_count, cols, _ = connector.inspect_table(t, max_sample_rows=settings.MAX_SAMPLE_ROWS)
            result.append(TableInfoResponse(
                table_name=t,
                row_count=row_count,
                columns=[ColumnInfo(**c) for c in cols]
            ))
        return result
    else:
        raise HTTPException(status_code=400, detail="Unsupported source type")

# --- Scans ---
@router.post("/scans", response_model=ScanJobResponse)
def trigger_scan(req: ScanCreateRequest, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    file_path = Path(dataset.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dataset file missing from storage")

    scan_id = str(uuid.uuid4())
    scan_job = ScanJob(
        id=scan_id,
        dataset_id=dataset.id,
        dataset_name=dataset.name,
        source_type=dataset.source_type,
        status="RUNNING",
        total_tables=0,
        total_columns=0,
        candidate_count=0,
        started_at=now_utc()
    )
    db.add(scan_job)
    db.commit()

    total_tables = 0
    total_columns = 0
    candidates_found = 0

    try:
        if dataset.source_type == "csv":
            connector = CSVConnector(file_path)
            _, cols, df_sample = connector.inspect(max_sample_rows=settings.MAX_SAMPLE_ROWS)
            total_tables = 1
            total_columns = len(df_sample.columns)

            detected = scanner_engine.scan_dataframe(df_sample)
            candidates_found = len(detected)

            for cand in detected:
                res = ScanResult(
                    id=str(uuid.uuid4()),
                    scan_id=scan_id,
                    dataset_id=dataset.id,
                    dataset_name=dataset.name,
                    source_type=dataset.source_type,
                    table_name=dataset.name,
                    column_name=cand.column_name,
                    candidate_class=cand.candidate_class,
                    confidence_score=cand.confidence_score,
                    evidence_summary=cand.evidence_summary,
                    signals_breakdown=cand.signals_breakdown,
                    sampled_count=cand.sampled_count,
                    match_count=cand.match_count,
                    sample_values_masked=cand.sample_values_masked,
                    review_status="PENDING",
                    created_at=now_utc()
                )
                db.add(res)

        elif dataset.source_type == "sqlite":
            connector = SQLiteConnector(file_path)
            all_tables = connector.list_tables()
            target_tables = [t for t in all_tables if not req.table_names or t in req.table_names]
            total_tables = len(target_tables)

            for t in target_tables:
                _, _, df_sample = connector.inspect_table(t, max_sample_rows=settings.MAX_SAMPLE_ROWS)
                total_columns += len(df_sample.columns)
                detected = scanner_engine.scan_dataframe(df_sample)
                candidates_found += len(detected)

                for cand in detected:
                    res = ScanResult(
                        id=str(uuid.uuid4()),
                        scan_id=scan_id,
                        dataset_id=dataset.id,
                        dataset_name=dataset.name,
                        source_type=dataset.source_type,
                        table_name=t,
                        column_name=cand.column_name,
                        candidate_class=cand.candidate_class,
                        confidence_score=cand.confidence_score,
                        evidence_summary=cand.evidence_summary,
                        signals_breakdown=cand.signals_breakdown,
                        sampled_count=cand.sampled_count,
                        match_count=cand.match_count,
                        sample_values_masked=cand.sample_values_masked,
                        review_status="PENDING",
                        created_at=now_utc()
                    )
                    db.add(res)

        scan_job.status = "COMPLETED"
        scan_job.total_tables = total_tables
        scan_job.total_columns = total_columns
        scan_job.candidate_count = candidates_found
        scan_job.completed_at = now_utc()
        db.commit()
        db.refresh(scan_job)
        return scan_job

    except Exception as e:
        scan_job.status = "FAILED"
        scan_job.error_message = str(e)
        scan_job.completed_at = now_utc()
        db.commit()
        raise HTTPException(status_code=500, detail=f"Scan execution failed: {str(e)}")

@router.get("/scans", response_model=List[ScanJobResponse])
def list_scans(db: Session = Depends(get_db)):
    return db.query(ScanJob).order_by(ScanJob.started_at.desc()).all()

@router.get("/scans/{scan_id}")
def get_scan_details(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(ScanJob).filter(ScanJob.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan job not found")
    results = db.query(ScanResult).filter(ScanResult.scan_id == scan_id).all()
    return {
        "scan": scan,
        "results": [r for r in results]
    }

# --- Inventory & Review ---
@router.get("/inventory", response_model=List[InventoryRecordResponse])
def get_inventory(
    dataset_name: Optional[str] = Query(None),
    data_class: Optional[str] = Query(None),
    review_status: Optional[str] = Query(None),
    metadata_status: Optional[str] = Query(None),
    min_confidence: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ScanResult)

    if dataset_name:
        query = query.filter(ScanResult.dataset_name == dataset_name)
    if data_class:
        query = query.filter(ScanResult.candidate_class == data_class)
    if review_status:
        query = query.filter(ScanResult.review_status == review_status)
    if min_confidence is not None:
        query = query.filter(ScanResult.confidence_score >= min_confidence)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (ScanResult.column_name.ilike(search_filter)) |
            (ScanResult.dataset_name.ilike(search_filter)) |
            (ScanResult.table_name.ilike(search_filter))
        )

    results = query.order_by(ScanResult.created_at.desc()).all()
    inventory = []

    for r in results:
        meta, m_status = MetadataManager.match_metadata(
            db, r.dataset_name, r.table_name, r.column_name
        )
        if metadata_status and m_status != metadata_status:
            continue

        inventory.append(InventoryRecordResponse(
            id=r.id,
            scan_id=r.scan_id,
            dataset_id=r.dataset_id,
            dataset_name=r.dataset_name,
            source_type=r.source_type,
            table_name=r.table_name,
            column_name=r.column_name,
            candidate_class=r.candidate_class,
            confidence_score=r.confidence_score,
            evidence_summary=r.evidence_summary,
            signals_breakdown=r.signals_breakdown,
            sampled_count=r.sampled_count,
            match_count=r.match_count,
            sample_values_masked=r.sample_values_masked,
            review_status=r.review_status,
            reviewer_notes=r.reviewer_notes,
            reviewed_at=r.reviewed_at,
            declared_purpose=meta.declared_purpose if meta else None,
            retention_period=meta.retention_period if meta else None,
            metadata_owner=meta.metadata_owner if meta else None,
            metadata_status=m_status,
            created_at=r.created_at
        ))

    return inventory

@router.get("/inventory/{record_id}", response_model=InventoryRecordResponse)
def get_inventory_record(record_id: str, db: Session = Depends(get_db)):
    r = db.query(ScanResult).filter(ScanResult.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    meta, m_status = MetadataManager.match_metadata(db, r.dataset_name, r.table_name, r.column_name)
    return InventoryRecordResponse(
        id=r.id,
        scan_id=r.scan_id,
        dataset_id=r.dataset_id,
        dataset_name=r.dataset_name,
        source_type=r.source_type,
        table_name=r.table_name,
        column_name=r.column_name,
        candidate_class=r.candidate_class,
        confidence_score=r.confidence_score,
        evidence_summary=r.evidence_summary,
        signals_breakdown=r.signals_breakdown,
        sampled_count=r.sampled_count,
        match_count=r.match_count,
        sample_values_masked=r.sample_values_masked,
        review_status=r.review_status,
        reviewer_notes=r.reviewer_notes,
        reviewed_at=r.reviewed_at,
        declared_purpose=meta.declared_purpose if meta else None,
        retention_period=meta.retention_period if meta else None,
        metadata_owner=meta.metadata_owner if meta else None,
        metadata_status=m_status,
        created_at=r.created_at
    )

@router.patch("/inventory/{record_id}/review", response_model=InventoryRecordResponse)
def update_review_status(
    record_id: str,
    req: ReviewUpdateRequest,
    db: Session = Depends(get_db)
):
    r = db.query(ScanResult).filter(ScanResult.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    r.review_status = req.review_status
    if req.reviewer_notes is not None:
        r.reviewer_notes = req.reviewer_notes
    r.reviewed_at = now_utc()
    db.commit()
    db.refresh(r)

    meta, m_status = MetadataManager.match_metadata(db, r.dataset_name, r.table_name, r.column_name)
    return InventoryRecordResponse(
        id=r.id,
        scan_id=r.scan_id,
        dataset_id=r.dataset_id,
        dataset_name=r.dataset_name,
        source_type=r.source_type,
        table_name=r.table_name,
        column_name=r.column_name,
        candidate_class=r.candidate_class,
        confidence_score=r.confidence_score,
        evidence_summary=r.evidence_summary,
        signals_breakdown=r.signals_breakdown,
        sampled_count=r.sampled_count,
        match_count=r.match_count,
        sample_values_masked=r.sample_values_masked,
        review_status=r.review_status,
        reviewer_notes=r.reviewer_notes,
        reviewed_at=r.reviewed_at,
        declared_purpose=meta.declared_purpose if meta else None,
        retention_period=meta.retention_period if meta else None,
        metadata_owner=meta.metadata_owner if meta else None,
        metadata_status=m_status,
        created_at=r.created_at
    )

# --- Metadata Register ---
@router.get("/metadata", response_model=List[MetadataRecordResponse])
def get_all_metadata(db: Session = Depends(get_db)):
    return MetadataManager.get_all(db)

@router.post("/metadata", response_model=MetadataRecordResponse)
def create_metadata_record(req: MetadataRecordCreate, db: Session = Depends(get_db)):
    record = MetadataManager.create_or_update(
        db=db,
        dataset_name=req.dataset_name,
        table_name=req.table_name or "",
        column_name=req.column_name,
        data_class=req.data_class,
        declared_purpose=req.declared_purpose,
        retention_period=req.retention_period,
        metadata_owner=req.metadata_owner,
        last_reviewed_date=req.last_reviewed_date,
        notes=req.notes
    )
    return record

@router.post("/metadata/import")
async def import_metadata_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files can be imported into the metadata register")

    content = await file.read()
    try:
        csv_text = content.decode("utf-8")
    except UnicodeDecodeError:
        csv_text = content.decode("latin-1")

    try:
        summary = MetadataManager.import_from_csv(db, csv_text)
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to import metadata: {str(e)}")

# --- Evidence Gaps ---
@router.get("/gaps", response_model=EvidenceGapReportResponse)
def get_evidence_gaps(db: Session = Depends(get_db)):
    results = db.query(ScanResult).order_by(ScanResult.created_at.desc()).all()
    gap_records = []
    
    missing_purpose = 0
    missing_retention = 0
    missing_both = 0
    ambiguous = 0
    unreviewed = 0
    low_confidence = 0

    for r in results:
        meta, m_status = MetadataManager.match_metadata(db, r.dataset_name, r.table_name, r.column_name)

        is_gap = False
        if m_status == "Missing purpose":
            missing_purpose += 1
            is_gap = True
        elif m_status == "Missing retention":
            missing_retention += 1
            is_gap = True
        elif m_status == "Missing both":
            missing_both += 1
            is_gap = True
        elif m_status == "Ambiguous metadata match":
            ambiguous += 1
            is_gap = True

        if r.review_status == "PENDING":
            unreviewed += 1
            is_gap = True

        if r.confidence_score < 0.70:
            low_confidence += 1
            is_gap = True

        if is_gap:
            gap_records.append(InventoryRecordResponse(
                id=r.id,
                scan_id=r.scan_id,
                dataset_id=r.dataset_id,
                dataset_name=r.dataset_name,
                source_type=r.source_type,
                table_name=r.table_name,
                column_name=r.column_name,
                candidate_class=r.candidate_class,
                confidence_score=r.confidence_score,
                evidence_summary=r.evidence_summary,
                signals_breakdown=r.signals_breakdown,
                sampled_count=r.sampled_count,
                match_count=r.match_count,
                sample_values_masked=r.sample_values_masked,
                review_status=r.review_status,
                reviewer_notes=r.reviewer_notes,
                reviewed_at=r.reviewed_at,
                declared_purpose=meta.declared_purpose if meta else None,
                retention_period=meta.retention_period if meta else None,
                metadata_owner=meta.metadata_owner if meta else None,
                metadata_status=m_status,
                created_at=r.created_at
            ))

    stats = GapStatistics(
        total_candidate_fields=len(results),
        missing_purpose_count=missing_purpose,
        missing_retention_count=missing_retention,
        missing_both_count=missing_both,
        ambiguous_mapping_count=ambiguous,
        unreviewed_candidate_count=unreviewed,
        low_confidence_count=low_confidence
    )

    limitations = [
        "Technical evidence scanner evaluates candidate syntax and patterns; it does not constitute official legal advice.",
        "Indian Aadhaar checks verify structural 12-digit format without online UIDAI server queries.",
        "Sampling inspection examines up to 100 non-null values per column to maintain sub-second scan speeds.",
        "Unlabelled or encrypted columns cannot be decrypted or classified without explicit schema mappings."
    ]

    return EvidenceGapReportResponse(
        generated_at=now_utc(),
        statistics=stats,
        gap_records=gap_records,
        limitations=limitations
    )

# --- Evaluation ---
@router.post("/evaluation", response_model=EvaluationRunResponse)
def run_evaluation(
    test_set_path: Optional[str] = None,
    run_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    target_path = Path(test_set_path) if test_set_path else Path("sample_data/labelled_test_set.csv")
    evaluator = AccuracyEvaluator(scanner_engine)
    try:
        run_data = evaluator.evaluate_test_set(db, target_path, run_name)
        return run_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Evaluation failed: {str(e)}")

@router.get("/evaluation", response_model=List[EvaluationRunResponse])
def get_evaluation_history(db: Session = Depends(get_db)):
    return db.query(EvaluationRun).order_by(EvaluationRun.executed_at.desc()).all()

# --- Dashboard Metrics ---
@router.get("/dashboard", response_model=DashboardMetricsResponse)
@router.get("/dashboard/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    total_datasets = db.query(Dataset).count()
    total_tables = sum(d.table_count for d in db.query(Dataset).all())

    results = db.query(ScanResult).all()
    total_candidates = len(results)

    class_counts = {
        "person_name": 0,
        "email_address": 0,
        "phone_number": 0,
        "government_id": 0,
        "date_of_birth": 0
    }
    confidence_distribution = {
        "0.50-0.69 (Moderate)": 0,
        "0.70-0.84 (High)": 0,
        "0.85-1.00 (Very High)": 0
    }
    review_status_counts = {
        "PENDING": 0,
        "CONFIRMED": 0,
        "REJECTED": 0
    }

    missing_purpose = 0
    missing_retention = 0
    missing_both = 0

    for r in results:
        if r.candidate_class in class_counts:
            class_counts[r.candidate_class] += 1

        conf = r.confidence_score
        if conf >= 0.85:
            confidence_distribution["0.85-1.00 (Very High)"] += 1
        elif conf >= 0.70:
            confidence_distribution["0.70-0.84 (High)"] += 1
        else:
            confidence_distribution["0.50-0.69 (Moderate)"] += 1

        if r.review_status in review_status_counts:
            review_status_counts[r.review_status] += 1

        _, m_status = MetadataManager.match_metadata(db, r.dataset_name, r.table_name, r.column_name)
        if m_status == "Missing purpose":
            missing_purpose += 1
        elif m_status == "Missing retention":
            missing_retention += 1
        elif m_status == "Missing both":
            missing_both += 1

    recent_scans = db.query(ScanJob).order_by(ScanJob.started_at.desc()).limit(5).all()

    latest_eval = db.query(EvaluationRun).order_by(EvaluationRun.executed_at.desc()).first()
    eval_summary = None
    if latest_eval:
        eval_summary = {
            "run_name": latest_eval.run_name,
            "overall_precision": latest_eval.overall_precision,
            "overall_recall": latest_eval.overall_recall,
            "overall_f1": latest_eval.overall_f1,
            "total_evaluated": latest_eval.total_evaluated,
            "executed_at": latest_eval.executed_at.isoformat()
        }

    return DashboardMetricsResponse(
        total_datasets=total_datasets,
        total_tables=total_tables,
        total_candidates=total_candidates,
        class_counts=class_counts,
        missing_purpose=missing_purpose,
        missing_retention=missing_retention,
        missing_both=missing_both,
        confidence_distribution=confidence_distribution,
        review_status_counts=review_status_counts,
        recent_scans=[ScanJobResponse.model_validate(s) for s in recent_scans],
        evaluation_summary=eval_summary
    )

# --- Rules Configuration ---
@router.get("/rules")
def get_rules_configuration():
    with open(settings.RULES_PATH, "r", encoding="utf-8") as f:
        yaml_text = f.read()
    return {
        "yaml_content": yaml_text,
        "classes": list(rules_engine.get_classes().keys()),
        "threshold": rules_engine.get_candidate_threshold()
    }

@router.post("/rules")
def update_rules_configuration(payload: dict):
    yaml_content = payload.get("yaml_content")
    if not yaml_content:
        raise HTTPException(status_code=400, detail="Missing 'yaml_content'")

    try:
        rules_engine.update_rules_content(yaml_content)
        return {"message": "Detection rules updated and compiled successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid rule configuration: {str(e)}")

# --- Reports Export ---
@router.get("/reports/inventory.csv")
@router.get("/reports/inventory/csv")
def download_inventory_csv(db: Session = Depends(get_db)):
    csv_str = ReportGenerator.generate_inventory_csv(db)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=privacylens_inventory.csv"}
    )

@router.get("/reports/gaps.csv")
@router.get("/reports/gaps/csv")
def download_gaps_csv(db: Session = Depends(get_db)):
    csv_str = ReportGenerator.generate_gaps_csv(db)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=privacylens_evidence_gaps.csv"}
    )

@router.get("/reports/inventory.pdf")
@router.get("/reports/inventory/pdf")
@router.get("/reports/pdf")
def download_inventory_pdf(db: Session = Depends(get_db)):
    pdf_bytes = ReportGenerator.generate_inventory_pdf(db)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=privacylens_evidence_inventory.pdf"}
    )
