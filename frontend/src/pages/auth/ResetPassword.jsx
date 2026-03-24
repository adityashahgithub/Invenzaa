import { useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { Logo } from '../../components/brand/Logo';
import styles from './Auth.module.css';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = useMemo(() => searchParams.get('email') || '', [searchParams]);
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !token) {
      setError('Reset link is invalid. Please request a new one.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ email, token, newPassword });
      setMessage('Password updated successfully. Redirecting to sign in…');
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Please request a new link.');
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
          <h2>Reset password</h2>

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

          <label className={styles.label}>New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={styles.input}
            placeholder="Min 8 characters"
            autoComplete="new-password"
            required
          />

          <label className={styles.label}>Confirm new password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={styles.input}
            placeholder="Re-enter password"
            autoComplete="new-password"
            required
          />

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>

        <p className={styles.footer}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
};

