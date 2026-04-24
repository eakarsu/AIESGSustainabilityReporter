import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const FEATURES = [
  { key: 'esg_reports', name: 'ESG Report Generator', icon: '\uD83D\uDCCA', desc: 'Generate comprehensive ESG reports', crudPath: '/esg-reports', aiPath: '/ai/esg-report' },
  { key: 'carbon_footprints', name: 'Carbon Footprint Calculator', icon: '\uD83C\uDF0D', desc: 'Calculate and track carbon emissions', crudPath: '/carbon-footprints', aiPath: '/ai/carbon' },
  { key: 'sustainability_metrics', name: 'Sustainability Metrics', icon: '\uD83D\uDCC8', desc: 'Monitor sustainability KPIs', crudPath: '/sustainability-metrics', aiPath: '/ai/sustainability' },
  { key: 'regulatory_compliance', name: 'Regulatory Compliance', icon: '\u2696\uFE0F', desc: 'Track regulatory compliance status', crudPath: '/regulatory-compliance', aiPath: '/ai/compliance' },
  { key: 'supply_chain_esg', name: 'Supply Chain ESG', icon: '\uD83D\uDD17', desc: 'Analyze supply chain ESG performance', crudPath: '/supply-chain', aiPath: '/ai/supply-chain' },
  { key: 'risk_assessments', name: 'Risk Assessment', icon: '\u26A0\uFE0F', desc: 'Assess and manage ESG risks', crudPath: '/risk-assessments', aiPath: '/ai/risk' },
  { key: 'greenwashing_checks', name: 'Greenwashing Detector', icon: '\uD83D\uDD0D', desc: 'Detect and prevent greenwashing', crudPath: '/greenwashing', aiPath: '/ai/greenwashing' },
  { key: 'stakeholder_reports', name: 'Stakeholder Reports', icon: '\uD83D\uDC65', desc: 'Build stakeholder communications', crudPath: '/stakeholder-reports', aiPath: '/ai/stakeholder' },
  { key: 'data_validations', name: 'Data Validator', icon: '\u2705', desc: 'Validate ESG data quality', crudPath: '/data-validations', aiPath: '/ai/data-validation' },
  { key: 'climate_scenarios', name: 'Climate Scenarios', icon: '\uD83C\uDF21\uFE0F', desc: 'Model climate change scenarios', crudPath: '/climate-scenarios', aiPath: '/ai/climate' },
  { key: 'biodiversity_impacts', name: 'Biodiversity Impact', icon: '\uD83E\uDD8B', desc: 'Track biodiversity impacts', crudPath: '/biodiversity', aiPath: '/ai/biodiversity' },
  { key: 'water_usage', name: 'Water Usage', icon: '\uD83D\uDCA7', desc: 'Optimize water consumption', crudPath: '/water-usage', aiPath: '/ai/water' },
  { key: 'energy_audits', name: 'Energy Efficiency', icon: '\u26A1', desc: 'Audit energy efficiency', crudPath: '/energy-audits', aiPath: '/ai/energy' },
  { key: 'social_impacts', name: 'Social Impact', icon: '\uD83E\uDD1D', desc: 'Measure social impact programs', crudPath: '/social-impact', aiPath: '/ai/social' },
  { key: 'governance_compliance', name: 'Governance Compliance', icon: '\uD83C\uDFDB\uFE0F', desc: 'Monitor governance policies', crudPath: '/governance', aiPath: '/ai/governance' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data?.stats || {});
      } catch (err) {
        setError('Failed to load dashboard statistics.');
        console.error('Dashboard stats error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getTotal = (key) => {
    const s = stats[key];
    if (s && s.total !== undefined) return s.total;
    return '--';
  };

  const summaryItems = [
    { label: 'Total Reports', value: getTotal('esg_reports'), color: '#2ecc71' },
    { label: 'Compliance Items', value: getTotal('regulatory_compliance'), color: '#3498db' },
    { label: 'Risk Items', value: getTotal('risk_assessments'), color: '#e67e22' },
    { label: 'Suppliers Tracked', value: getTotal('supply_chain_esg'), color: '#9b59b6' },
  ];

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.headerTitle}>Dashboard</h1>
            <p style={styles.headerSubtitle}>Welcome to the AI ESG/Sustainability Reporter</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBanner}>{error}</div>
      )}

      {/* Stats Summary */}
      <div style={styles.statsRow}>
        {summaryItems.map((item) => (
          <div key={item.label} style={styles.statCard}>
            <div style={{ ...styles.statIndicator, background: item.color }} />
            <div>
              <div style={styles.statValue}>
                {loading ? '...' : item.value}
              </div>
              <div style={styles.statLabel}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Feature Modules</h2>
        <p style={styles.sectionSubtitle}>Manage and track your ESG data across all categories</p>
      </div>
      <div style={styles.grid}>
        {FEATURES.map((f) => (
          <div
            key={f.key}
            style={styles.featureCard}
            onClick={() => navigate(f.crudPath)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
          >
            <div style={styles.featureIconWrap}>
              <span style={styles.featureIcon}>{f.icon}</span>
            </div>
            <h3 style={styles.featureName}>{f.name}</h3>
            <div style={styles.featureStat}>
              {loading ? '...' : getTotal(f.key)}
            </div>
            <p style={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* AI Analytics Cards */}
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>AI Analytics</h2>
        <p style={styles.sectionSubtitle}>Leverage AI-powered insights for deeper ESG analysis</p>
      </div>
      <div style={styles.grid}>
        {FEATURES.map((f) => (
          <div
            key={`ai-${f.key}`}
            style={styles.aiCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(26,122,74,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
          >
            <div style={styles.aiIconWrap}>
              <span style={styles.aiIcon}>{'\uD83E\uDD16'}</span>
            </div>
            <h3 style={styles.aiName}>AI {f.name}</h3>
            <p style={styles.aiDesc}>{f.desc} with AI-powered analysis</p>
            <button
              style={styles.analyzeBtn}
              onClick={(e) => {
                e.stopPropagation();
                navigate(f.aiPath);
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #15633b, #1a7a4a)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #1a7a4a, #22945a)';
              }}
            >
              Analyze
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f4f7f4',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    paddingBottom: 60,
  },
  header: {
    background: 'linear-gradient(135deg, #0d4f2b 0%, #1a7a4a 60%, #22945a 100%)',
    padding: '32px 40px 28px',
    color: '#fff',
  },
  headerContent: {
    maxWidth: 1280,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },
  headerSubtitle: {
    margin: '6px 0 0',
    fontSize: 14,
    opacity: 0.85,
    fontWeight: 400,
  },
  errorBanner: {
    maxWidth: 1280,
    margin: '20px auto 0',
    padding: '12px 20px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    color: '#b91c1c',
    fontSize: 14,
  },
  statsRow: {
    maxWidth: 1280,
    margin: '24px auto 0',
    padding: '0 40px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
  },
  statCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statIndicator: {
    width: 6,
    height: 44,
    borderRadius: 3,
    flexShrink: 0,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1a2e1a',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7c6b',
    fontWeight: 500,
    marginTop: 2,
  },
  sectionHeader: {
    maxWidth: 1280,
    margin: '36px auto 0',
    padding: '0 40px',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1a2e1a',
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7c6b',
    margin: '4px 0 0',
  },
  grid: {
    maxWidth: 1280,
    margin: '16px auto 0',
    padding: '0 40px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16,
  },

  /* Feature Cards */
  featureCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '22px 20px 18px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #e8f5ee, #d4edda)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 22,
    lineHeight: 1,
  },
  featureName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1a2e1a',
    margin: 0,
  },
  featureStat: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1a7a4a',
    lineHeight: 1.2,
  },
  featureDesc: {
    fontSize: 12,
    color: '#6b7c6b',
    margin: 0,
    lineHeight: 1.4,
  },

  /* AI Cards */
  aiCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '22px 20px 18px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    borderTop: '3px solid #1a7a4a',
  },
  aiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #1a7a4a, #2ecc71)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIcon: {
    fontSize: 22,
    lineHeight: 1,
  },
  aiName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1a2e1a',
    margin: 0,
  },
  aiDesc: {
    fontSize: 12,
    color: '#6b7c6b',
    margin: 0,
    lineHeight: 1.4,
    flex: 1,
  },
  analyzeBtn: {
    marginTop: 4,
    padding: '8px 0',
    background: 'linear-gradient(135deg, #1a7a4a, #22945a)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};

export default Dashboard;
