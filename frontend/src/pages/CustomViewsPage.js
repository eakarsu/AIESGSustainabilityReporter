import React from 'react';
import EsgScoreTrendChart from '../components/EsgScoreTrendChart';
import MetricHeatmap from '../components/MetricHeatmap';
import AnnualReportDownload from '../components/AnnualReportDownload';
import FrameworkRulesEditor from '../components/FrameworkRulesEditor';

export default function CustomViewsPage() {
  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, color: '#1a2e1a' }}>ESG Views</h1>
        <p style={{ marginTop: 4, color: '#5b6b5b' }}>
          Custom visualizations and tools layered on top of your ESG data.
        </p>
      </header>

      <EsgScoreTrendChart />
      <MetricHeatmap />
      <AnnualReportDownload />
      <FrameworkRulesEditor />
    </div>
  );
}
