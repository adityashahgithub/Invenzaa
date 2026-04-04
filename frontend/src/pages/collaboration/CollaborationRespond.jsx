import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Reply,
  Building2,
  Pill,
  Hash,
  MessageSquare,
  GitBranch,
  SendHorizontal,
} from 'lucide-react';
import { collaborationApi } from '../../api/collaborationApi';
import styles from './Collaboration.module.css';

export const CollaborationRespond = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [form, setForm] = useState({
    status: 'accepted',
    message: '',
    quantityOffered: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    collaborationApi
      .getRequestById(id)
      .then(({ data }) => {
        setRequest(data.data.request);
        if (data.data.request) {
          setForm((f) => ({
            ...f,
            quantityOffered: data.data.request.quantity,
          }));
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Request not found'));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await collaborationApi.createResponse({
        requestId: id,
        status: form.status,
        message: form.message || undefined,
        quantityOffered:
          form.status === 'accepted' && form.quantityOffered !== ''
            ? Number(form.quantityOffered)
            : undefined,
      });
      navigate('/collaboration/requests');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  if (error && !request) {
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
        <div className={styles.requestError} role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className={styles.requestPage}>
        <p className={styles.respondLoading}>Loading request…</p>
      </div>
    );
  }

  const isAccept = form.status === 'accepted';

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
          <Reply size={28} strokeWidth={1.75} />
        </div>
        <h1 className={styles.requestTitle}>Partner response</h1>
        <p className={styles.requestSubtitle}>
          Review the request below and accept (if you can supply stock) or decline. Accepting runs a stock
          check against your inventory.
        </p>
      </header>

      <div className={styles.respondInboxCard}>
        <div className={styles.respondFromRow}>
          <Building2 size={16} className={styles.respondFromIcon} aria-hidden />
          <span>
            From <strong>{request.fromOrganization?.name || 'Partner'}</strong>
          </span>
        </div>
        <div className={styles.respondSummaryGrid}>
          <div className={styles.respondSummaryItem}>
            <Pill size={14} className={styles.respondMiniIcon} aria-hidden />
            <span className={styles.respondSummaryLabel}>Medicine</span>
            <strong className={styles.respondSummaryValue}>{request.medicine?.name || '—'}</strong>
          </div>
          <div className={styles.respondSummaryItem}>
            <Hash size={14} className={styles.respondMiniIcon} aria-hidden />
            <span className={styles.respondSummaryLabel}>Requested qty</span>
            <strong className={styles.respondSummaryValue}>{request.quantity}</strong>
          </div>
        </div>
        {request.message ? (
          <div className={styles.respondRequestNote}>
            <MessageSquare size={14} className={styles.respondMiniIcon} aria-hidden />
            <div>
              <span className={styles.respondSummaryLabel}>Their message</span>
              <p className={styles.respondNoteText}>{request.message}</p>
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className={styles.requestShell}>
        <div className={styles.requestBody}>
          <div className={styles.requestField}>
            <label className={styles.requestLabel} htmlFor="respond-status">
              <GitBranch size={14} className={styles.requestLabelIcon} aria-hidden />
              Your decision
              <span className={styles.reqMark}>*</span>
            </label>
            <select
              id="respond-status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className={styles.requestInput}
            >
              <option value="accepted">Accept — I can supply stock</option>
              <option value="declined">Decline — I cannot fulfill</option>
            </select>
          </div>

          {isAccept && (
            <div className={styles.requestField}>
              <label className={styles.requestLabel} htmlFor="respond-qty">
                <Hash size={14} className={styles.requestLabelIcon} aria-hidden />
                Quantity you can offer
                <span className={styles.reqMark}>*</span>
              </label>
              <input
                id="respond-qty"
                type="number"
                min={1}
                max={request.quantity}
                value={form.quantityOffered}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantityOffered: e.target.value }))
                }
                required={isAccept}
                className={styles.requestInput}
              />
              <p className={styles.requestHint}>
                Max {request.quantity} (requested). Must not exceed your available non-expired stock.
              </p>
            </div>
          )}

          <div className={styles.requestField}>
            <label className={styles.requestLabel} htmlFor="respond-msg">
              <MessageSquare size={14} className={styles.requestLabelIcon} aria-hidden />
              Message to requester
              <span className={styles.optionalMark}>(optional)</span>
            </label>
            <textarea
              id="respond-msg"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              rows={4}
              placeholder="e.g. dispatch window, batch preference, or reason if declining…"
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
            <SendHorizontal size={18} strokeWidth={2} aria-hidden />
            {loading ? 'Sending…' : 'Submit response'}
          </button>
        </footer>
      </form>
    </div>
  );
};
