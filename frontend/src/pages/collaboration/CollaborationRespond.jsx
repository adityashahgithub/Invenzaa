import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
          form.status === 'accepted' && form.quantityOffered
            ? Number(form.quantityOffered)
            : undefined,
      });
      // After submit, go back to the request list (there is no dedicated
      // `/collaboration/requests/:id` route in this app).
      navigate('/collaboration/requests');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  if (error && !request) return <div className={styles.error}>{error}</div>;
  if (!request) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>
      <h1>Partner Response</h1>
      <p className={styles.subtitle}>
        Respond to the collaboration request from {request.fromOrganization?.name}
      </p>

      <div className={styles.requestSummary}>
        <p>
          <strong>{request.medicine?.name}</strong> — Quantity requested: {request.quantity}
        </p>
        {request.message && <p className={styles.muted}>{request.message}</p>}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Response *</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="accepted">Accept</option>
            <option value="declined">Decline</option>
          </select>
        </div>

        {form.status === 'accepted' && (
          <div className={styles.field}>
            <label>Quantity offered</label>
            <input
              type="number"
              min={0}
              max={request.quantity}
              value={form.quantityOffered}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantityOffered: e.target.value }))
              }
              placeholder={request.quantity}
            />
          </div>
        )}

        <div className={styles.field}>
          <label>Message (optional)</label>
          <textarea
            value={form.message}
            onChange={(e) =>
              setForm((f) => ({ ...f, message: e.target.value }))
            }
            rows={3}
            placeholder="Add a note for the requester"
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => navigate('/collaboration/requests')}
            className={styles.btnSecondary}
          >
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Response'}
          </button>
        </div>
      </form>
    </div>
  );
};
