import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CrudPage from './pages/CrudPage';
import AIPage from './pages/AIPage';
import AINewPage from './pages/AINewPage';
import { login as apiLogin } from './services/api';

import Batch03Features from './pages/Batch03Features';
import CustomViewsPage from './pages/CustomViewsPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setIsAuthenticated(true);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogin = async (email, password) => {
    const data = await apiLogin(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setIsAuthenticated(true);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/batch03" element={<Batch03Features />} />
          <Route path="/custom-views" element={<CustomViewsPage />} />
          <Route path="/" element={<Dashboard />} />

          {/* CRUD Pages */}
          <Route path="/esg-reports" element={<CrudPage title="ESG Reports" resource="esg-reports" />} />
          <Route path="/carbon-footprints" element={<CrudPage title="Carbon Footprints" resource="carbon-footprints" />} />
          <Route path="/sustainability-metrics" element={<CrudPage title="Sustainability Metrics" resource="sustainability-metrics" />} />
          <Route path="/regulatory-compliance" element={<CrudPage title="Regulatory Compliance" resource="regulatory-compliance" />} />
          <Route path="/supply-chain" element={<CrudPage title="Supply Chain ESG" resource="supply-chain" />} />
          <Route path="/risk-assessments" element={<CrudPage title="Risk Assessments" resource="risk-assessments" />} />
          <Route path="/greenwashing" element={<CrudPage title="Greenwashing Detector" resource="greenwashing" />} />
          <Route path="/stakeholder-reports" element={<CrudPage title="Stakeholder Reports" resource="stakeholder-reports" />} />
          <Route path="/data-validations" element={<CrudPage title="Data Validations" resource="data-validations" />} />
          <Route path="/climate-scenarios" element={<CrudPage title="Climate Scenarios" resource="climate-scenarios" />} />
          <Route path="/biodiversity" element={<CrudPage title="Biodiversity Impact" resource="biodiversity" />} />
          <Route path="/water-usage" element={<CrudPage title="Water Usage" resource="water-usage" />} />
          <Route path="/energy-audits" element={<CrudPage title="Energy Audits" resource="energy-audits" />} />
          <Route path="/social-impact" element={<CrudPage title="Social Impact" resource="social-impact" />} />
          <Route path="/governance" element={<CrudPage title="Governance Compliance" resource="governance" />} />

          {/* AI Analysis Pages */}
          <Route path="/ai/esg-report" element={<AIPage type="analyze-esg-report" title="AI ESG Report Analysis" />} />
          <Route path="/ai/carbon" element={<AIPage type="analyze-carbon" title="AI Carbon Analysis" />} />
          <Route path="/ai/sustainability" element={<AIPage type="analyze-sustainability" title="AI Sustainability Analysis" />} />
          <Route path="/ai/compliance" element={<AIPage type="check-compliance" title="AI Compliance Check" />} />
          <Route path="/ai/supply-chain" element={<AIPage type="analyze-supply-chain" title="AI Supply Chain Analysis" />} />
          <Route path="/ai/risk" element={<AIPage type="assess-risk" title="AI Risk Assessment" />} />
          <Route path="/ai/greenwashing" element={<AIPage type="detect-greenwashing" title="AI Greenwashing Detection" />} />
          <Route path="/ai/stakeholder" element={<AIPage type="build-stakeholder-report" title="AI Stakeholder Report" />} />
          <Route path="/ai/data-validation" element={<AIPage type="validate-data" title="AI Data Validation" />} />
          <Route path="/ai/climate" element={<AIPage type="analyze-climate" title="AI Climate Analysis" />} />
          <Route path="/ai/biodiversity" element={<AIPage type="track-biodiversity" title="AI Biodiversity Tracking" />} />
          <Route path="/ai/water" element={<AIPage type="optimize-water" title="AI Water Optimization" />} />
          <Route path="/ai/energy" element={<AIPage type="audit-energy" title="AI Energy Audit" />} />
          <Route path="/ai/social" element={<AIPage type="measure-social" title="AI Social Measurement" />} />
          <Route path="/ai/governance" element={<AIPage type="monitor-governance" title="AI Governance Monitoring" />} />
          <Route path="/ai/advanced" element={<AINewPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
