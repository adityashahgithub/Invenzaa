import { useState, useEffect } from 'react';
import { rolesApi } from '../../api/rolesApi';
import { useUI } from '../../contexts/UIContext';
import styles from './RolesPage.module.css';

export const RolesPage = () => {
  const SYSTEM_ROLES = ['Owner', 'Admin', 'Pharmacist', 'Staff', 'Viewer'];
  const { showToast, confirm, openModal, closeModal } = useUI();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newPermission, setNewPermission] = useState('');
  const [showPermInput, setShowPermInput] = useState(false);
  const [form, setForm] = useState({ name: '', permissions: [], description: '' });

  const fetchRoles = async () => {
    try {
      const { data } = await rolesApi.getAll();
      setRoles(data.data.roles || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await rolesApi.create(form);
      setShowCreate(false);
      setForm({ name: '', permissions: [], description: '' });
      showToast('Role created successfully', 'success');
      await fetchRoles();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create role', 'error');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await rolesApi.update(editing._id, form);
      setEditing(null);
      setForm({ name: '', permissions: [], description: '' });
      showToast('Role updated successfully', 'success');
      await fetchRoles();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const handleDelete = (id) => {
    confirm({
      title: 'Delete Role',
      message: 'Are you sure you want to delete this role? Users with this role must be reassigned first.',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await rolesApi.delete(id);
          showToast('Role deleted successfully', 'success');
          await fetchRoles();
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to delete role', 'error');
        }
      }
    });
  };

  const startEdit = (role) => {
    setEditing(role);
    setForm({
      name: role.name,
      permissions: role.permissions || [],
      description: role.description || '',
    });
  };

  const addPermission = () => {
    if (newPermission.trim()) {
      setForm((p) => ({
        ...p,
        permissions: [...(p.permissions || []), newPermission.trim()],
      }));
      setNewPermission('');
      setShowPermInput(false);
    }
  };

  const removePermission = (idx) => {
    setForm((p) => ({
      ...p,
      permissions: (p.permissions || []).filter((_, i) => i !== idx),
    }));
  };

  if (loading) return <div className={styles.loading}>Loading roles...</div>;

  return (
    <div className="page-container">
      <header className={styles.header}>
        <h1>Roles & Permissions</h1>
        <button className={styles.addBtn} onClick={() => setShowCreate(true)}>
          Create Role
        </button>
      </header>

      <div className={styles.grid}>
        {roles.map((r) => (
          <div key={r._id} className="glass-card animate-fade-in">
            <div className={styles.cardHeader}>
              <h3>
                {r.name}
                {SYSTEM_ROLES.includes(r.name) && <span className={styles.systemRole}>System</span>}
              </h3>
              <div className={styles.cardActions}>
                <button className={styles.smallBtn} onClick={() => startEdit(r)}>
                  Edit
                </button>
                {!SYSTEM_ROLES.includes(r.name) && (
                  <button
                    className={`${styles.smallBtn} ${styles.danger}`}
                    onClick={() => handleDelete(r._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            {r.description && (
              <p className={styles.desc}>{r.description}</p>
            )}
            <div className={styles.permissions}>
              <span className={styles.permTitle}>Permissions:</span>
              <div className={styles.permTags}>
                {(r.permissions || []).map((p, i) => (
                  <span key={i} className={styles.permBadge}>{p === '*' ? 'Full Access' : p}</span>
                ))}
                {(!r.permissions || r.permissions.length === 0) && (
                  <span className={styles.muted}>None</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div className={`${styles.modal} glass`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create Role</h2>
              <button className={styles.closeBtn} onClick={() => setShowCreate(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate} className={styles.modalForm}>
              <div className="form-group">
                <label className="label">Role Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Warehouse Manager"
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  className="input"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What can this user do?"
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label className="label">Permissions</label>
                <div className={styles.permList}>
                  {(form.permissions || []).map((p, i) => (
                    <span key={i} className={styles.permTag}>
                      {p}
                      <button type="button" onClick={() => removePermission(i)}>×</button>
                    </span>
                  ))}
                </div>
                {showPermInput ? (
                  <div className={styles.inlineInput}>
                    <input
                      type="text"
                      className="input"
                      value={newPermission}
                      onChange={(e) => setNewPermission(e.target.value)}
                      placeholder="Permission name..."
                      autoFocus
                    />
                    <button type="button" className="btn-primary" onClick={addPermission}>Add</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowPermInput(false)}>Cancel</button>
                  </div>
                ) : (
                  <button type="button" className={styles.linkBtn} onClick={() => setShowPermInput(true)}>
                    + Add permission
                  </button>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className={styles.modalOverlay} onClick={() => setEditing(null)}>
          <div className={`${styles.modal} glass`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit Role: {editing.name}</h2>
              <button className={styles.closeBtn} onClick={() => setEditing(null)}>&times;</button>
            </div>
            <form onSubmit={handleUpdate} className={styles.modalForm}>
              <div className="form-group">
                <label className="label">Role Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  className="input"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label className="label">Permissions</label>
                <div className={styles.permList}>
                  {(form.permissions || []).map((p, i) => (
                    <span key={i} className={styles.permTag}>
                      {p}
                      <button type="button" onClick={() => removePermission(i)}>×</button>
                    </span>
                  ))}
                </div>
                {showPermInput ? (
                  <div className={styles.inlineInput}>
                    <input
                      type="text"
                      className="input"
                      value={newPermission}
                      onChange={(e) => setNewPermission(e.target.value)}
                      placeholder="Permission name..."
                      autoFocus
                    />
                    <button type="button" className="btn-primary" onClick={addPermission}>Add</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowPermInput(false)}>Cancel</button>
                  </div>
                ) : (
                  <button type="button" className={styles.linkBtn} onClick={() => setShowPermInput(true)}>
                    + Add permission
                  </button>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
