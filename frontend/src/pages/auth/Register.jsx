import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../../components/brand/Logo';
import styles from './Auth.module.css';

export const Register = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    organizationName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
          <h2>Create account</h2>
          {error && <div className={styles.error}>{error}</div>}

          <label className={styles.label}>Organization name</label>
          <input
            type="text"
            name="organizationName"
            value={form.organizationName}
            onChange={handleChange}
            className={styles.input}
            placeholder="Your Pharmacy"
            required
          />

          <div className={styles.row}>
            <div>
              <label className={styles.label}>First name</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className={styles.input}
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className={styles.label}>Last name</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className={styles.input}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <label className={styles.label}>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={styles.input}
            placeholder="you@pharmacy.com"
            required
            autoComplete="email"
          />

          <label className={styles.label}>Password</label>
          <div className={styles.passwordWrap}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              className={styles.input}
              placeholder="Min 8 chars, letters & numbers"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              className={styles.passToggle}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
