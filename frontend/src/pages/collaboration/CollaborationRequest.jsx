import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collaborationApi } from '../../api/collaborationApi';
import { medicineApi } from '../../api/medicineApi';
import styles from './Collaboration.module.css';

export const CollaborationRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const [partners, setPartners] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({
    toOrganizationId: '',
    medicineId: state.medicineId || '',
    quantity: state.quantity || 1,
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      collaborationApi.getPartners(),
      medicineApi.list({ limit: 500 }),
    ])
      .then(([partnersRes, medicinesRes]) => {
        setPartners(partnersRes?.data?.data?.partners ?? []);
        setMedicines(medicinesRes?.data?.data?.medicines ?? []);
        setForm((f) => ({
          ...f,
          ...(state.medicineId && { medicineId: state.medicineId }),
          ...(state.quantity && { quantity: state.quantity }),
        }));
      })
      .catch(() => {
        setPartners([]);
        setMedicines([]);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await collaborationApi.createRequest(form);
      navigate('/collaboration/requests');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1>Medicine Availability Request</h1>
      <p className={styles.subtitle}>
        Request stock from a partner organization when you have insufficient supply.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Partner organization *</label>
          <select
            value={form.toOrganizationId}
            onChange={(e) =>
              setForm((f) => ({ ...f, toOrganizationId: e.target.value }))
            }
            required
          >
            <option value="">Select partner</option>
            {partners.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label>Medicine *</label>
          <select
            value={form.medicineId}
            onChange={(e) =>
              setForm((f) => ({ ...f, medicineId: e.target.value }))
            }
            required
          >
            <option value="">Select medicine</option>
            {medicines.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} {m.currentStock !== undefined && `(Stock: ${m.currentStock})`}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label>Quantity needed *</label>
          <input
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) =>
              setForm((f) => ({ ...f, quantity: e.target.value }))
            }
            required
          />
        </div>

        <div className={styles.field}>
          <label>Message (optional)</label>
          <textarea
            value={form.message}
            onChange={(e) =>
              setForm((f) => ({ ...f, message: e.target.value }))
            }
            rows={3}
            placeholder="Additional details for the partner"
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={styles.btnSecondary}
          >
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </form>
    </div>
  );
};
