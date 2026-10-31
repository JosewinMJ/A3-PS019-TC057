export type DataClass = 
  | 'person_name'
  | 'email_address'
  | 'phone_number'
  | 'government_id'
  | 'date_of_birth';

export type MetadataStatus = 
  | 'Complete metadata'
  | 'Missing purpose'
  | 'Missing retention'
  | 'Missing both'
  | 'Ambiguous metadata match'
  | 'Pending human review';

export type ReviewStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface Dataset {
  id: string;
  name: string;
  source_type: 'csv' | 'sqlite';
  file_path: string;
  row_count: number;
  table_count: number;
  created_at: string;
}

export interface ColumnInfo {
  name: string;
  data_type: string;
  non_null_count: number;
  sample_values: string[];
}

export interface TableInfo {
  table_name: string;
  row_count: number;
  columns: ColumnInfo[];
}

export interface ScanJob {
  id: string;
  dataset_id: string;
  dataset_name: string;
  source_type: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  total_tables: number;
  total_columns: number;
  candidate_count: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface InventoryRecord {
  id: string;
  scan_id: string;
  dataset_id: string;
  dataset_name: string;
  source_type: string;
  table_name: string;
  column_name: string;
  candidate_class: DataClass;
  confidence_score: number;
  evidence_summary: string;
  signals_breakdown: {
    column_matched?: boolean;
    column_score?: number;
    negative_column_match?: boolean;
    value_match_ratio?: number;
    validator_pass_ratio?: number;
    samples_evaluated?: number;
    samples_matched?: number;
    weights?: {
      column: number;
      value: number;
      validator: number;
    };
  };
  sampled_count: number;
  match_count: number;
  sample_values_masked: string[];
  review_status: ReviewStatus;
  reviewer_notes?: string;
  reviewed_at?: string;
  declared_purpose?: string;
  retention_period?: string;
  metadata_owner?: string;
  metadata_status: MetadataStatus;
  created_at: string;
}

export interface MetadataRecord {
  id: string;
  dataset_name: string;
  table_name?: string;
  column_name: string;
  data_class?: string;
  declared_purpose?: string;
  retention_period?: string;
  metadata_owner?: string;
  last_reviewed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  total_datasets: number;
  total_tables: number;
  total_candidates: number;
  class_counts: Record<string, number>;
  missing_purpose: number;
  missing_retention: number;
  missing_both: number;
  confidence_distribution: Record<string, number>;
  review_status_counts: Record<string, number>;
  recent_scans: ScanJob[];
  evaluation_summary?: {
    run_name: string;
    overall_precision: number;
    overall_recall: number;
    overall_f1: number;
    total_evaluated: number;
    executed_at: string;
  };
}

export interface ClassMetric {
  data_class: string;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  true_negatives: number;
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface EvaluationRun {
  id: string;
  run_name: string;
  test_set_name: string;
  total_evaluated: number;
  overall_precision: number;
  overall_recall: number;
  overall_f1: number;
  per_class_metrics: Record<string, ClassMetric>;
  predictions_breakdown: Array<{
    index: number;
    column_name: string;
    sample_value: string;
    true_class: string;
    predicted_class: string;
    confidence: number;
    is_correct: boolean;
  }>;
  executed_at: string;
}

export interface EvidenceGapReport {
  generated_at: string;
  statistics: {
    total_candidate_fields: number;
    missing_purpose_count: number;
    missing_retention_count: number;
    missing_both_count: number;
    ambiguous_mapping_count: number;
    unreviewed_candidate_count: number;
    low_confidence_count: number;
  };
  gap_records: InventoryRecord[];
  limitations: string[];
}
