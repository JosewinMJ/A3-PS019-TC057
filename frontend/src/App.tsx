import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { ScanPage } from './pages/ScanPage';
import { InventoryPage } from './pages/InventoryPage';
import { MetadataPage } from './pages/MetadataPage';
import { EvidenceGapsPage } from './pages/EvidenceGapsPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { ReviewCenterPage } from './pages/ReviewCenterPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';

const TAB_CONFIGS: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Overview',
    subtitle: 'High-level telemetry, discovery metrics, and privacy evidence posture'
  },
  datasources: {
    title: 'Data Sources Management',
    subtitle: 'Upload CSV datasets, connect SQLite databases, and safely inspect schemas'
  },
  scandata: {
    title: 'Personal-Data Scanner',
    subtitle: 'Execute multi-signal discovery across schemas and sampled data values'
  },
  inventory: {
    title: 'Privacy Evidence Inventory',
    subtitle: 'Searchable, filterable catalog linking detected candidate fields to declared metadata'
  },
  purposeretention: {
    title: 'Purpose & Retention Register',
    subtitle: 'Declared business purpose justification and statutory retention period registry'
  },
  evidencegaps: {
    title: 'Technical Evidence Gaps',
    subtitle: 'Audit discrepancies, missing metadata, unreviewed detections, and limitations'
  },
  evaluation: {
    title: 'Evaluation & Benchmark Metrics',
    subtitle: 'Transparent precision, recall, and F1 calculations from labelled synthetic test sets'
  },
  reviewcenter: {
    title: 'Human Review & Triage Center',
    subtitle: 'Human-in-the-loop decision center to confirm or reject candidate detections'
  },
  settings: {
    title: 'Detection Rules & Configuration',
    subtitle: 'Inspect and customize YAML regex patterns, confidence weights, and validators'
  }
};

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedScanDatasetId, setSelectedScanDatasetId] = useState<string | undefined>(undefined);
  const [backendHealthy, setBackendHealthy] = useState<boolean>(true);

  // Check health periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const h = await api.getHealth();
        setBackendHealthy(h.status === 'healthy');
      } catch {
        setBackendHealthy(false);
      }
    };
    checkHealth();
    const timer = setInterval(checkHealth, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectDatasetForScan = (datasetId: string) => {
    setSelectedScanDatasetId(datasetId);
  };

  const currentTabConfig = TAB_CONFIGS[currentTab] || {
    title: 'PrivacyLens',
    subtitle: 'Personal-Data Discovery & Privacy Evidence Inventory'
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900">
      {/* Persistent Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        backendHealthy={backendHealthy}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title={currentTabConfig.title}
          subtitle={currentTabConfig.subtitle}
        />

        <main className="flex-1">
          {currentTab === 'dashboard' && (
            <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />
          )}

          {currentTab === 'datasources' && (
            <DataSourcesPage
              onNavigate={(tab) => setCurrentTab(tab)}
              onSelectDatasetForScan={handleSelectDatasetForScan}
            />
          )}

          {currentTab === 'scandata' && (
            <ScanPage
              selectedDatasetId={selectedScanDatasetId}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'inventory' && <InventoryPage />}

          {currentTab === 'purposeretention' && <MetadataPage />}

          {currentTab === 'evidencegaps' && <EvidenceGapsPage />}

          {currentTab === 'evaluation' && <EvaluationPage />}

          {currentTab === 'reviewcenter' && <ReviewCenterPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default App;
