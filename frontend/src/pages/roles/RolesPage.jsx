import { useState, useEffect } from 'react';
import { rolesApi } from '../../api/rolesApi';
import { useUI } from '../../contexts/UIContext';
import {
  MODULE_PERMISSION_OPTIONS,
  normalizeRolePermissions,
  permissionLabel,
} from '../../utils/permissions';
import styles from './RolesPage.module.css';

export const RolesPage = () => {
  const SYSTEM_ROLES = ['Owner', 'Admin', 'Pharmacist', 'Staff', 'Viewer'];
  const { showToast, confirm } = useUI();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
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

  const fullAccessSelected = (form.permissions || []).includes('*');

  const setFullAccess = (checked) => {
    setForm((p) => ({
      ...p,
      permissions: checked ? ['*'] : [],
    }));
  };

  const toggleModule = (id) => {
    setForm((p) => {
      let perms = [...(p.permissions || [])];
      if (perms.includes('*')) perms = [];
      if (perms.includes(id)) {
        perms = perms.filter((x) => x !== id);
      } else {
        perms.push(id);
      }
      return { ...p, permissions: normalizeRolePermissions(perms) };
    });
  };

  const openCreateModal = () => {
    setForm({ name: '', permissions: [], description: '' });
    setShowCreate(true);
  };

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
      },
    });
  };

  const startEdit = (role) => {
    setEditing(role);
    setForm({
      name: role.name,
      permissions: normalizeRolePermissions(role.permissions || []),
      description: role.description || '',
    });
  };

  const PermissionPicker = () => (
    <div className={styles.permissionPicker}>
      <label className={styles.fullAccessRow}>
        <input
          type="checkbox"
          checked={fullAccessSelected}
          onChange={(e) => setFullAccess(e.target.checked)}
        />
        <span>
          <strong>Full access</strong>
          <span className={styles.fullAccessHint}>All modules (same as Owner/Admin scope)</span>
        </span>
      </label>
      <p className={styles.moduleLegend}>Or choose specific modules (permission id <code>medicines</code> covers the medicine catalog):</p>
      <div className={styles.moduleGrid}>
        {MODULE_PERMISSION_OPTIONS.map((opt) => (
          <label
            key={opt.id}
            className={`${styles.moduleCard} ${fullAccessSelected ? styles.moduleCardDisabled : ''}`}
          >
            <input
              type="checkbox"
              checked={fullAccessSelected || (form.permissions || []).includes(opt.id)}
              disabled={fullAccessSelected}
              onChange={() => toggleModule(opt.id)}
            />
            <span className={styles.moduleCardBody}>
              <span className={styles.moduleLabel}>{opt.label}</span>
              <span className={styles.moduleHint}>{opt.hint}</span>
              <code className={styles.moduleId}>{opt.id}</code>
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderRolePermissions = (perms) => {
    const list = normalizeRolePermissions(perms || []);
    if (list.includes('*')) {
      return (
        <span className={styles.permBadgeFull}>Full access</span>
      );
    }
    if (list.length === 0) {
      return <span className={styles.muted}>None</span>;
    }
    return list.map((p) => (
      <span key={p} className={styles.permBadge}>
        {permissionLabel(p)}
      </span>
    ));
  };

  if (loading) return <div className={styles.loading}>Loading roles...</div>;

  return (
    <div className="page-container">
      <header className={styles.header}>
        <h1>Roles & Permissions</h1>
        <button type="button" className={styles.addBtn} onClick={openCreateModal}>
          Create Role
        </button>
      </header>

      <div className={styles.grid}>
        {roles.map((r) => (
          <article key={r._id} className={styles.roleCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.roleTitle}>
                {r.name}
                {SYSTEM_ROLES.includes(r.name) && (
                  <span className={styles.systemRole}>System</span>
                )}
              </h3>
              <div className={styles.cardActions}>
                <button type="button" className={styles.smallBtn} onClick={() => startEdit(r)}>
                  Edit
                </button>
                {!SYSTEM_ROLES.includes(r.name) && (
                  <button
                    type="button"
                    className={`${styles.smallBtn} ${styles.danger}`}
                    onClick={() => handleDelete(r._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            {r.description && <p className={styles.desc}>{r.description}</p>}
            <div className={styles.permissionsBlock}>
              <span className={styles.permTitle}>Permissions</span>
              <div className={styles.permTags}>{renderRolePermissions(r.permissions)}</div>
            </div>
          </article>
        ))}
      </div>

      {showCreate && (
        <div className={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div className={`${styles.modal} glass`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Create Role</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setShowCreate(false)}>
                &times;
              </button>
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
                <PermissionPicker />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Role
                </button>
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
              <button type="button" className={styles.closeBtn} onClick={() => setEditing(null)}>
                &times;
              </button>
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
                <PermissionPicker />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
