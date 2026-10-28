import {
  Dataset, TableInfo, ScanJob, InventoryRecord,
  MetadataRecord, DashboardMetrics, EvaluationRun, EvidenceGapReport
} from '../types';

const BASE_URL = '/api';

export const api = {
  // Health
  getHealth: async () => {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  // Datasets
  getDatasets: async (): Promise<Dataset[]> => {
    const res = await fetch(`${BASE_URL}/datasets`);
    if (!res.ok) throw new Error('Failed to fetch datasets');
    return res.json();
  },

  uploadCsv: async (file: File): Promise<Dataset> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/datasets/csv`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to upload CSV');
    }
    return res.json();
  },

  uploadSqlite: async (file: File): Promise<Dataset> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/datasets/sqlite`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to upload SQLite database');
    }
    return res.json();
  },

  deleteDataset: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/datasets/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete dataset');
  },

  getDatasetTables: async (datasetId: string): Promise<TableInfo[]> => {
    const res = await fetch(`${BASE_URL}/datasets/${datasetId}/tables`);
    if (!res.ok) throw new Error('Failed to fetch dataset tables');
    return res.json();
  },

  // Scans
  triggerScan: async (datasetId: string, tableNames?: string[]): Promise<ScanJob> => {
    const res = await fetch(`${BASE_URL}/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: datasetId, table_names: tableNames })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to trigger scan');
    }
    return res.json();
  },

  getScans: async (): Promise<ScanJob[]> => {
    const res = await fetch(`${BASE_URL}/scans`);
    if (!res.ok) throw new Error('Failed to fetch scans');
    return res.json();
  },

  // Inventory
  getInventory: async (params?: {
    dataset_name?: string;
    data_class?: string;
    review_status?: string;
    metadata_status?: string;
    min_confidence?: number;
    search?: string;
  }): Promise<InventoryRecord[]> => {
    const url = new URL(`${BASE_URL}/inventory`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.append(k, String(v));
        }
      });
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
  },

  updateReview: async (
    recordId: string,
    reviewStatus: 'CONFIRMED' | 'REJECTED' | 'PENDING',
    notes?: string
  ): Promise<InventoryRecord> => {
    const res = await fetch(`${BASE_URL}/inventory/${recordId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_status: reviewStatus, reviewer_notes: notes })
    });
    if (!res.ok) throw new Error('Failed to update review status');
    return res.json();
  },

  // Metadata
  getMetadata: async (): Promise<MetadataRecord[]> => {
    const res = await fetch(`${BASE_URL}/metadata`);
    if (!res.ok) throw new Error('Failed to fetch metadata');
    return res.json();
  },

  createOrUpdateMetadata: async (data: Partial<MetadataRecord>): Promise<MetadataRecord> => {
    const res = await fetch(`${BASE_URL}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to save metadata');
    return res.json();
  },

  importMetadataCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/metadata/import`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to import metadata CSV');
    return res.json();
  },

  // Evidence Gaps
  getGaps: async (): Promise<EvidenceGapReport> => {
    const res = await fetch(`${BASE_URL}/gaps`);
    if (!res.ok) throw new Error('Failed to fetch evidence gaps');
    return res.json();
  },

  // Evaluation
  runEvaluation: async (runName?: string): Promise<EvaluationRun> => {
    const url = new URL(`${BASE_URL}/evaluation`, window.location.origin);
    if (runName) url.searchParams.append('run_name', runName);
    const res = await fetch(url.toString(), { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Evaluation failed');
    }
    return res.json();
  },

  getEvaluationHistory: async (): Promise<EvaluationRun[]> => {
    const res = await fetch(`${BASE_URL}/evaluation`);
    if (!res.ok) throw new Error('Failed to fetch evaluation history');
    return res.json();
  },

  // Dashboard
  getDashboard: async (): Promise<DashboardMetrics> => {
    const res = await fetch(`${BASE_URL}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return res.json();
  },

  // Rules
  getRules: async (): Promise<{ yaml_content: string; classes: string[]; threshold: number }> => {
    const res = await fetch(`${BASE_URL}/rules`);
    if (!res.ok) throw new Error('Failed to fetch rules');
    return res.json();
  },

  updateRules: async (yamlContent: string): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yaml_content: yamlContent })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update rules');
    }
    return res.json();
  }
};
