import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AppLayout.module.css';

export const AppLayout = () => {
  const { user, logout, isAdmin, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => setShowMobileSidebar(!showMobileSidebar);
  const closeSidebar = () => setShowMobileSidebar(false);
  const can = {
    medicines: hasPermission('medicines'),
    inventory: hasPermission('inventory'),
    sales: hasPermission('sales'),
    purchases: hasPermission('purchases'),
    collaboration: hasPermission('collaboration'),
    reports: hasPermission('reports'),
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Hamburger Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.brandSmall}>
          <span className={styles.brandIconSmall}>◈</span>
          <span>Invenzaa</span>
        </div>
        <button onClick={toggleSidebar} className={styles.hamburger}>
          {showMobileSidebar ? '✕' : '☰'}
        </button>
      </header>

      {/* Mobile Overlay */}
      {showMobileSidebar && (
        <div className={styles.overlay} onClick={closeSidebar} />
      )}

      <aside className={`${styles.sidebar} ${showMobileSidebar ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>◈</span>
          <span>Invenzaa</span>
        </div>
        <nav className={styles.nav}>
          <NavLink
            to="/dashboard"
            onClick={closeSidebar}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
          >
            Dashboard
          </NavLink>
          {can.medicines && (
            <NavLink
              to="/medicines"
              onClick={closeSidebar}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Medicines
            </NavLink>
          )}
          {can.inventory && (
            <NavLink
              to="/inventory"
              onClick={closeSidebar}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Inventory
            </NavLink>
          )}
          {can.sales && (
            <NavLink
              to="/sales"
              onClick={closeSidebar}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Sales
            </NavLink>
          )}
          {can.purchases && (
            <NavLink
              to="/purchases"
              onClick={closeSidebar}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Purchases
            </NavLink>
          )}
          {can.collaboration && (
            <NavLink
              to="/collaboration/requests"
              onClick={closeSidebar}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Collaboration
            </NavLink>
          )}
          {can.reports && (
            <NavLink
              to="/reports"
              onClick={closeSidebar}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Reports
            </NavLink>
          )}

          {(user?.role === 'Admin' || user?.role === 'Owner') && (
            <div className={styles.navSection}>
              <span className={styles.navSectionTitle}>Masters</span>
              <NavLink
                to="/masters/categories"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                }
              >
                Categories
              </NavLink>
              <NavLink
                to="/masters/brands"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                }
              >
                Brands
              </NavLink>
              <NavLink
                to="/masters/sellers"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                }
              >
                Suppliers
              </NavLink>
            </div>
          )}

          {isAdmin() && (
            <div className={styles.navSection}>
              <span className={styles.navSectionTitle}>Admin Control</span>
              <NavLink
                to="/users"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                }
              >
                Team & Users
              </NavLink>
              <NavLink
                to="/roles"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                }
              >
                Roles & Permissions
              </NavLink>
            </div>
          )}
        </nav>
        <div className={styles.sidebarFooter}>
          <NavLink
            to="/profile"
            onClick={closeSidebar}
            className={({ isActive }) =>
              isActive ? `${styles.userInfo} ${styles.userInfoActive}` : styles.userInfo
            }
          >
            <div className={styles.userAvatar}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>
                {user?.firstName} {user?.lastName}
              </span>
              <span className={styles.userRole}>{user?.role}</span>
            </div>
          </NavLink>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
            <span className={styles.logoutIcon}>⏻</span>
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};
