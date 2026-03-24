import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { Logo } from '../../components/brand/Logo';
import styles from './Auth.module.css';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setMessage('If the email exists, a reset link will be sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.topNav}>
          <Link to="/" className={styles.backLink}>Back to Home</Link>
        </div>
        <div className={styles.header}>
          <span className={styles.logo}><Logo size={44} /></span>
          <h1>Invenzaa</h1>
          <p>Medicine Inventory Management</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <h2>Forgot password</h2>
          {error && <div className={styles.error}>{error}</div>}
          {message && (
            <div
              className={styles.error}
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                borderColor: 'var(--color-success)',
                color: 'var(--color-success)',
              }}
            >
              {message}
            </div>
          )}

          <label className={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="you@pharmacy.com"
            required
          />

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className={styles.footer}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
};
