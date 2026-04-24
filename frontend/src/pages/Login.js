import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@esgreporter.com');
    setPassword('password123');
    setError('');
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.overlay} />
      <div style={styles.container}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <span style={styles.logoEmoji}>🌱</span>
          </div>
          <h1 style={styles.title}>AI ESG/Sustainability Reporter</h1>
          <p style={styles.subtitle}>
            Intelligent Environmental, Social & Governance Analytics Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>!</span>
              {error}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={styles.input}
              autoComplete="email"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={styles.input}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.signInButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={fillDemoCredentials}
            style={styles.demoButton}
          >
            Fill Demo Credentials
          </button>
        </form>

        <p style={styles.footer}>
          Powered by AI &middot; Built for Sustainability
        </p>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0d4f2b 0%, #1a7a4a 30%, #22945a 60%, #2ecc71 100%)',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  container: {
    width: '100%',
    maxWidth: 420,
    margin: '0 20px',
    background: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 16,
    boxShadow:
      '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    padding: '40px 36px 32px',
    position: 'relative',
    zIndex: 1,
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: 'linear-gradient(135deg, #1a7a4a, #2ecc71)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    boxShadow: '0 4px 14px rgba(46, 204, 113, 0.4)',
  },
  logoEmoji: {
    fontSize: 32,
    lineHeight: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1a2e1a',
    margin: '0 0 8px 0',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7c6b',
    margin: 0,
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#b91c1c',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  errorIcon: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#ef4444',
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374937',
  },
  input: {
    padding: '11px 14px',
    border: '1.5px solid #d1ddd1',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    background: '#f8faf8',
    color: '#1a2e1a',
  },
  signInButton: {
    padding: '12px 0',
    background: 'linear-gradient(135deg, #1a7a4a, #22945a)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 14px rgba(26, 122, 74, 0.35)',
    marginTop: 4,
  },
  demoButton: {
    padding: '10px 0',
    background: 'transparent',
    color: '#1a7a4a',
    border: '1.5px solid #1a7a4a',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#a0b0a0',
    marginTop: 24,
    marginBottom: 0,
  },
};

export default Login;
