import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userApi } from '../api/userApi';
import { rolesApi } from '../api/rolesApi';
import styles from './Users.module.css';

const PermissionBadge = ({ role, roles }) => {
  const r = roles?.find((x) => x.name === role);
  if (!r) return <span className={styles.roleText}>{role}</span>;
  const perms = r.permissions?.length ? r.permissions : ['(no permissions)'];
  const hasAll = perms.includes('*');
  return (
    <span className={styles.permissionWrap} title={hasAll ? 'Full access' : perms.join(', ')}>
      <span className={styles.roleText}>{role}</span>
      <span className={styles.permHint}>ⓘ</span>
    </span>
  );
};

export const Users = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: '',
  });

  const q = searchParams.get('q') || '';

  const fetchUsers = async () => {
    try {
      const { data } = await userApi.getAllUsers({ q: q || undefined });
      setUsers(data.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await rolesApi.getAll();
      setRoles(data.data.roles || []);
    } catch {
      setRoles([]);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (search.trim()) params.set('q', search.trim());
      else params.delete('q');
      navigate({ pathname: '/users', search: params.toString() }, { replace: true });
    }, 350);
    return () => clearTimeout(timeout);
  }, [search, navigate, searchParams]);

  useEffect(() => {
    if (search !== q) setSearch(q);
  }, [q]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchRoles()]);
      setLoading(false);
    };
    load();
  }, [q]);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setError('');
    setNotice(null);
    try {
      const { data } = await userApi.createUser(addForm);
      setShowAddModal(false);
      setAddForm({ email: '', firstName: '', lastName: '', role: '' });

      const invite = data?.data?.invite;
      if (invite?.emailSent) {
        setNotice({
          type: 'success',
          message: data?.message || 'User created and invite email sent.',
        });
      } else {
        const fallback = invite?.inviteUrl ? ` Temporary invite link: ${invite.inviteUrl}` : '';
        setNotice({
          type: 'warning',
          message: (data?.message || 'User created, but invite email was not sent.') + fallback,
        });
      }

      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add user');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const { data } = await userApi.updateUserStatus(id, status);
      setUsers((prev) => prev.map((u) => (u._id === id ? data.data.user : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRoleAssign = async (userId, role) => {
    if (!role) return;
    try {
      const { data } = await rolesApi.assign(userId, role);
      setUsers((prev) => prev.map((u) => (u._id === userId ? data.data.user : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign role');
    }
  };

  if (loading) return <div className={styles.loading}>Loading users...</div>;

  return (
    <div className="page-container">
      <header className="section-header">
        <div>
          <h1>Team & Users</h1>
          <p style={{ color: 'var(--color-text-dim)' }}>Manage and track your pharmacy staff members.</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          + Add User
        </button>
      </header>

      {error && (
        <div className={styles.error} onAnimationEnd={() => setError('')}>
          {error}
        </div>
      )}
      {notice && (
        <div
          className={notice.type === 'success' ? styles.success : styles.warning}
          onAnimationEnd={() => setNotice(null)}
        >
          {notice.message}
        </div>
      )}
      <div className={styles.searchRow}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or role..."
          className={styles.input}
        />
        {q && (
          <button type="button" className={styles.clearBtn} onClick={() => setSearch('')}>
            Clear
          </button>
        )}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>
                  {u.firstName} {u.lastName}
                </td>
                <td>{u.email}</td>
                <td>
                  {u.role === 'Owner' ? (
                    <PermissionBadge role={u.role} roles={roles} />
                  ) : roles.length > 0 ? (
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleAssign(u._id, e.target.value)}
                      className={styles.roleSelect}
                    >
                      {roles.map((r) => (
                        <option key={r._id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <PermissionBadge role={u.role} roles={roles} />
                  )}
                </td>
                <td>
                  <span className={styles[`status_${u.status}`]}>{u.status}</span>
                </td>
                <td>
                  {u.role !== 'Owner' && u.status === 'active' && (
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleStatusChange(u._id, 'inactive')}
                    >
                      Deactivate
                    </button>
                  )}
                  {u.role !== 'Owner' && u.status !== 'active' && (
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleStatusChange(u._id, 'active')}
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Add Staff</h2>
            <p className={styles.modalHint}>An invite email with a secure password setup link will be sent to this user.</p>
            <form onSubmit={handleAddStaff}>
              <div className={styles.formRow}>
                <label>First name</label>
                <input
                  type="text"
                  value={addForm.firstName}
                  onChange={(e) => setAddForm((p) => ({ ...p, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>Last name</label>
                <input
                  type="text"
                  value={addForm.lastName}
                  onChange={(e) => setAddForm((p) => ({ ...p, lastName: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>Role</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm((p) => ({ ...p, role: e.target.value }))}
                  required
                >
                  <option value="">Select role</option>
                  {roles.filter((r) => r.name !== 'Owner').map((r) => (
                    <option key={r._id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
