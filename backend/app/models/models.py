import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def now_utc():
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)  # 'csv' or 'sqlite'
    file_path = Column(String(512), nullable=False)
    row_count = Column(Integer, default=0)
    table_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=now_utc)

    scans = relationship("ScanJob", back_populates="dataset", cascade="all, delete-orphan")


class ScanJob(Base):
    __tablename__ = "scan_jobs"

    id = Column(String(36), primary_key=True, index=True)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False)
    dataset_name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)
    status = Column(String(50), default="PENDING")  # 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
    total_tables = Column(Integer, default=0)
    total_columns = Column(Integer, default=0)
    candidate_count = Column(Integer, default=0)
    started_at = Column(DateTime, default=now_utc)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    dataset = relationship("Dataset", back_populates="scans")
    results = relationship("ScanResult", back_populates="scan", cascade="all, delete-orphan")


class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(String(36), primary_key=True, index=True)
    scan_id = Column(String(36), ForeignKey("scan_jobs.id"), nullable=False)
    dataset_id = Column(String(36), nullable=False)
    dataset_name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)
    table_name = Column(String(255), nullable=False, default="")
    column_name = Column(String(255), nullable=False)
    candidate_class = Column(String(100), nullable=False)
    confidence_score = Column(Float, nullable=False)
    evidence_summary = Column(Text, nullable=False)
    signals_breakdown = Column(JSON, default=dict)
    sampled_count = Column(Integer, default=0)
    match_count = Column(Integer, default=0)
    sample_values_masked = Column(JSON, default=list)
    review_status = Column(String(50), default="PENDING")  # 'PENDING', 'CONFIRMED', 'REJECTED'
    reviewer_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now_utc)

    scan = relationship("ScanJob", back_populates="results")


class PurposeRetentionMetadata(Base):
    __tablename__ = "purpose_retention_metadata"

    id = Column(String(36), primary_key=True, index=True)
    dataset_name = Column(String(255), nullable=False)
    table_name = Column(String(255), nullable=False, default="")
    column_name = Column(String(255), nullable=False)
    data_class = Column(String(100), nullable=True)
    declared_purpose = Column(Text, nullable=True)
    retention_period = Column(String(255), nullable=True)
    metadata_owner = Column(String(255), nullable=True)
    last_reviewed_date = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)


class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id = Column(String(36), primary_key=True, index=True)
    run_name = Column(String(255), nullable=False)
    test_set_name = Column(String(255), nullable=False)
    total_evaluated = Column(Integer, default=0)
    overall_precision = Column(Float, default=0.0)
    overall_recall = Column(Float, default=0.0)
    overall_f1 = Column(Float, default=0.0)
    per_class_metrics = Column(JSON, default=dict)
    predictions_breakdown = Column(JSON, default=list)
    executed_at = Column(DateTime, default=now_utc)
