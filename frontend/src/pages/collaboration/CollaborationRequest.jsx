import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Handshake,
  Building2,
  Pill,
  Hash,
  MessageSquare,
  Send,
} from 'lucide-react';
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
          ...(state.quantity != null && state.quantity !== '' && { quantity: state.quantity }),
        }));
      })
      .catch(() => {
        setPartners([]);
        setMedicines([]);
      });
  }, [state.medicineId, state.quantity]);

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
    <div className={styles.requestPage}>
      <button
        type="button"
        className={styles.requestBack}
        onClick={() => navigate('/collaboration/requests')}
      >
        <ArrowLeft size={18} strokeWidth={2} aria-hidden />
        Back to collaboration
      </button>

      <header className={styles.requestHero}>
        <div className={styles.requestHeroIcon} aria-hidden>
          <Handshake size={28} strokeWidth={1.75} />
        </div>
        <h1 className={styles.requestTitle}>Partner stock request</h1>
        <p className={styles.requestSubtitle}>
          When your batches do not cover the quantity you need, ask a linked organization to supply the
          difference. They will see this in their inbox.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.requestShell}>
        <div className={styles.requestBody}>
          <div className={styles.requestField}>
            <label className={styles.requestLabel} htmlFor="partner-org">
              <Building2 size={14} className={styles.requestLabelIcon} aria-hidden />
              Partner organization
              <span className={styles.reqMark}>*</span>
            </label>
            <select
              id="partner-org"
              value={form.toOrganizationId}
              onChange={(e) =>
                setForm((f) => ({ ...f, toOrganizationId: e.target.value }))
              }
              required
              className={styles.requestInput}
            >
              <option value="">Select partner</option>
              {partners.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            {partners.length === 0 && (
              <p className={styles.requestHint}>No partner organizations linked yet.</p>
            )}
          </div>

          <div className={styles.requestField}>
            <label className={styles.requestLabel} htmlFor="partner-med">
              <Pill size={14} className={styles.requestLabelIcon} aria-hidden />
              Medicine
              <span className={styles.reqMark}>*</span>
            </label>
            <select
              id="partner-med"
              value={form.medicineId}
              onChange={(e) =>
                setForm((f) => ({ ...f, medicineId: e.target.value }))
              }
              required
              className={styles.requestInput}
            >
              <option value="">Select medicine</option>
              {medicines.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                  {m.currentStock !== undefined ? ` · your stock ${m.currentStock}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.requestField}>
            <label className={styles.requestLabel} htmlFor="partner-qty">
              <Hash size={14} className={styles.requestLabelIcon} aria-hidden />
              Quantity needed
              <span className={styles.reqMark}>*</span>
            </label>
            <input
              id="partner-qty"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
              }
              required
              className={styles.requestInput}
            />
          </div>

          <div className={styles.requestField}>
            <label className={styles.requestLabel} htmlFor="partner-msg">
              <MessageSquare size={14} className={styles.requestLabelIcon} aria-hidden />
              Message
              <span className={styles.optionalMark}>(optional)</span>
            </label>
            <textarea
              id="partner-msg"
              value={form.message}
              onChange={(e) =>
                setForm((f) => ({ ...f, message: e.target.value }))
              }
              rows={4}
              placeholder="Urgency, delivery preference, or batch preferences…"
              className={styles.requestTextarea}
            />
          </div>

          {error && (
            <div className={styles.requestError} role="alert">
              {error}
            </div>
          )}
        </div>

        <footer className={styles.requestFooter}>
          <button
            type="button"
            onClick={() => navigate('/collaboration/requests')}
            className={styles.requestBtnGhost}
          >
            Cancel
          </button>
          <button type="submit" className={styles.requestBtnPrimary} disabled={loading}>
            <Send size={18} strokeWidth={2} aria-hidden />
            {loading ? 'Sending…' : 'Send request'}
          </button>
        </footer>
      </form>
    </div>
  );
};
