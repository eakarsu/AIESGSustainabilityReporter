import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const crudLinks = [
  { path: '/esg-reports', label: 'ESG Reports' },
  { path: '/carbon-footprints', label: 'Carbon Footprints' },
  { path: '/sustainability-metrics', label: 'Sustainability Metrics' },
  { path: '/regulatory-compliance', label: 'Regulatory Compliance' },
  { path: '/supply-chain', label: 'Supply Chain' },
  { path: '/risk-assessments', label: 'Risk Assessments' },
  { path: '/greenwashing', label: 'Greenwashing' },
  { path: '/stakeholder-reports', label: 'Stakeholder Reports' },
  { path: '/data-validations', label: 'Data Validations' },
  { path: '/climate-scenarios', label: 'Climate Scenarios' },
  { path: '/biodiversity', label: 'Biodiversity' },
  { path: '/water-usage', label: 'Water Usage' },
  { path: '/energy-audits', label: 'Energy Audits' },
  { path: '/social-impact', label: 'Social Impact' },
  { path: '/governance', label: 'Governance' },
];

const aiLinks = [
  { path: '/ai/esg-report', label: 'ESG Report Analysis' },
  { path: '/ai/carbon', label: 'Carbon Analysis' },
  { path: '/ai/sustainability', label: 'Sustainability Analysis' },
  { path: '/ai/compliance', label: 'Compliance Check' },
  { path: '/ai/supply-chain', label: 'Supply Chain Analysis' },
  { path: '/ai/risk', label: 'Risk Assessment' },
  { path: '/ai/greenwashing', label: 'Greenwashing Detection' },
  { path: '/ai/stakeholder', label: 'Stakeholder Report' },
  { path: '/ai/data-validation', label: 'Data Validation' },
  { path: '/ai/climate', label: 'Climate Analysis' },
  { path: '/ai/biodiversity', label: 'Biodiversity Tracking' },
  { path: '/ai/water', label: 'Water Optimization' },
  { path: '/ai/energy', label: 'Energy Audit' },
  { path: '/ai/social', label: 'Social Measurement' },
  { path: '/ai/governance', label: 'Governance Monitoring' },
];

export default function Layout({ user, onLogout, children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `layout-nav-link ${isActive(path) ? 'active' : ''}`;

  return (
    <div className="layout">
      {/* Mobile toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? '\u2715' : '\u2630'}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" onClick={() => setSidebarOpen(false)}>
            <span className="sidebar-logo">ESG</span>
            <span className="sidebar-title">ESG Reporter</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/"
            className={linkClass('/')}
            onClick={() => setSidebarOpen(false)}
          >
            Dashboard
          </Link>

          <div className="nav-section">
            <span className="nav-section-title">ESG Tools</span>
            {crudLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={linkClass(link.path)}
                onClick={() => setSidebarOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="nav-section">
            <span className="nav-section-title">AI Analytics</span>
            {aiLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={linkClass(link.path)}
                onClick={() => setSidebarOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              <span className="sidebar-user-name">{user.name || user.email}</span>
              <button className="btn-logout" onClick={onLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">{children}</main>
    </div>
  );
}
