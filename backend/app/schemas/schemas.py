import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict

# Dataset Schemas
class DatasetBase(BaseModel):
    name: str
    source_type: str

class DatasetResponse(DatasetBase):
    id: str
    file_path: str
    row_count: int
    table_count: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ColumnInfo(BaseModel):
    name: str
    data_type: str
    non_null_count: int
    sample_values: list[str] = []

class TableInfoResponse(BaseModel):
    table_name: str
    row_count: int
    columns: list[ColumnInfo]

# Scan Schemas
class ScanCreateRequest(BaseModel):
    dataset_id: str
    table_names: Optional[list[str]] = None

class ScanJobResponse(BaseModel):
    id: str
    dataset_id: str
    dataset_name: str
    source_type: str
    status: str
    total_tables: int
    total_columns: int
    candidate_count: int
    started_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ScanResultResponse(BaseModel):
    id: str
    scan_id: str
    dataset_id: str
    dataset_name: str
    source_type: str
    table_name: str
    column_name: str
    candidate_class: str
    confidence_score: float
    evidence_summary: str
    signals_breakdown: dict[str, Any]
    sampled_count: int
    match_count: int
    sample_values_masked: list[str]
    review_status: str
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ReviewUpdateRequest(BaseModel):
    review_status: str = Field(..., pattern="^(CONFIRMED|REJECTED|PENDING)$")
    reviewer_notes: Optional[str] = None

# Metadata Schemas
class MetadataRecordCreate(BaseModel):
    dataset_name: str
    table_name: Optional[str] = ""
    column_name: str
    data_class: Optional[str] = None
    declared_purpose: Optional[str] = None
    retention_period: Optional[str] = None
    metadata_owner: Optional[str] = None
    last_reviewed_date: Optional[str] = None
    notes: Optional[str] = None

class MetadataRecordResponse(MetadataRecordCreate):
    id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# Combined Inventory Record
class InventoryRecordResponse(BaseModel):
    id: str
    scan_id: str
    dataset_id: str
    dataset_name: str
    source_type: str
    table_name: str
    column_name: str
    candidate_class: str
    confidence_score: float
    evidence_summary: str
    signals_breakdown: dict[str, Any]
    sampled_count: int
    match_count: int
    sample_values_masked: list[str]
    review_status: str
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[datetime.datetime] = None
    # Metadata fields
    declared_purpose: Optional[str] = None
    retention_period: Optional[str] = None
    metadata_owner: Optional[str] = None
    metadata_status: str  # Complete metadata, Missing purpose, Missing retention, Missing both, Ambiguous metadata match, Pending human review
    created_at: datetime.datetime

# Evidence Gaps Schemas
class GapStatistics(BaseModel):
    total_candidate_fields: int
    missing_purpose_count: int
    missing_retention_count: int
    missing_both_count: int
    ambiguous_mapping_count: int
    unreviewed_candidate_count: int
    low_confidence_count: int

class EvidenceGapReportResponse(BaseModel):
    generated_at: datetime.datetime
    statistics: GapStatistics
    gap_records: list[InventoryRecordResponse]
    limitations: list[str]

# Dashboard Schemas
class DashboardMetricsResponse(BaseModel):
    total_datasets: int
    total_tables: int
    total_candidates: int
    class_counts: dict[str, int]
    missing_purpose: int
    missing_retention: int
    missing_both: int
    confidence_distribution: dict[str, int]  # e.g., '0.50-0.69', '0.70-0.84', '0.85-1.00'
    review_status_counts: dict[str, int]
    recent_scans: list[ScanJobResponse]
    evaluation_summary: Optional[dict[str, Any]] = None

# Evaluation Schemas
class ClassMetric(BaseModel):
    data_class: str
    true_positives: int
    false_positives: int
    false_negatives: int
    true_negatives: int
    precision: float
    recall: float
    f1_score: float
    support: int

class EvaluationRunResponse(BaseModel):
    id: str
    run_name: str
    test_set_name: str
    total_evaluated: int
    overall_precision: float
    overall_recall: float
    overall_f1: float
    per_class_metrics: dict[str, ClassMetric]
    predictions_breakdown: list[dict[str, Any]]
    executed_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
