import { Link } from 'react-router-dom';
import { ShieldCheck, Boxes, Activity, BarChart3, Building2, ClipboardList, ArrowRight } from 'lucide-react';
import { Logo } from '../components/brand/Logo';
import styles from './LandingPage.module.css';

export const LandingPage = () => {
    return (
        <div className={styles.container}>
            <div className={styles.bgGlowTop} />
            <div className={styles.bgGlowBottom} />
            <nav className={styles.nav}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}><Logo size={36} /></div>
                    <span>Invenzaa</span>
                </div>
                <div className={styles.navActions}>
                    <Link to="/login" className={styles.loginBtn}>Login</Link>
                    <Link to="/register" className={styles.registerBtn}>Get Started</Link>
                </div>
            </nav>

            <main className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.badge}>Next Gen Pharmacy Management</div>
                    <h1 className={styles.title}>
                        A Professional Medicine Inventory System <br />
                        <span className={styles.highlight}>Built for Accuracy, Compliance, and Growth</span>
                    </h1>
                    <p className={styles.description}>
                        Invenzaa helps pharmacy teams control stock, avoid expiry losses, streamline purchases and sales,
                        and maintain complete audit visibility. It is designed for daily operations with role-based security,
                        real-time updates, and clear reporting.
                    </p>
                    <div className={styles.ctaGroup}>
                        <Link to="/register" className={styles.primaryCta}>
                            Start Free Trial <ArrowRight size={16} />
                        </Link>
                        <Link to="/login" className={styles.secondaryCta}>Sign In</Link>
                    </div>
                </div>

                <div className={styles.visuals}>
                    <div className={`${styles.statsCard} glass animate-fade-in`}>
                        <div className={styles.statsIcon}><Boxes size={22} /></div>
                        <div>
                            <h3>100+</h3>
                            <p>Medicines Tracked</p>
                        </div>
                    </div>
                    <div className={`${styles.alertCard} glass animate-fade-in`} style={{ animationDelay: '0.2s' }}>
                        <div className={styles.alertIcon}><Activity size={22} /></div>
                        <div>
                            <h3>Smart Alerts</h3>
                            <p>No more expired stock</p>
                        </div>
                    </div>
                    <div className={`${styles.auditCard} glass animate-fade-in`} style={{ animationDelay: '0.35s' }}>
                        <div className={styles.statsIcon}><ShieldCheck size={22} /></div>
                        <div>
                            <h3>Audit Ready</h3>
                            <p>Every stock movement is logged</p>
                        </div>
                    </div>
                </div>
            </main>

            <section className={styles.features}>
                <div className={styles.featureItem}>
                    <div className={styles.featureIcon}><BarChart3 size={28} /></div>
                    <h3>Operational Analytics</h3>
                    <p>Track sales, purchases, low-stock trends, and expiry risk from one reporting workspace.</p>
                </div>
                <div className={styles.featureItem}>
                    <div className={styles.featureIcon}><Building2 size={28} /></div>
                    <h3>Collaboration Network</h3>
                    <p>Coordinate with partner pharmacies to source urgent medicine inventory quickly.</p>
                </div>
                <div className={styles.featureItem}>
                    <div className={styles.featureIcon}><ShieldCheck size={28} /></div>
                    <h3>Secure by Design</h3>
                    <p>Role-based access and complete activity logs to ensure accountability across teams.</p>
                </div>
            </section>

            <section className={styles.about}>
                <div className={styles.aboutCard}>
                    <h2>Why Invenzaa for Pharmacy Operations</h2>
                    <p>
                        Invenzaa is built for pharmacies that need speed without compromising control.
                        It centralizes medicine master data, purchasing, sales billing, inventory status,
                        and expiry intelligence in a single workflow. Teams can act faster during stock
                        shortages, maintain healthier stock levels, and reduce revenue leakage from dead inventory.
                    </p>
                </div>
                <div className={styles.aboutCard}>
                    <h2>What You Can Manage</h2>
                    <ul className={styles.aboutList}>
                        <li>Medicine catalog with category/brand references and minimum stock thresholds.</li>
                        <li>Purchase and sale operations with batch-level tracking and invoice generation.</li>
                        <li>Low-stock and near-expiry monitoring with actionable reports.</li>
                        <li>User, role, and permissions management for secure multi-user operations.</li>
                    </ul>
                </div>
            </section>

            <section className={styles.workflow}>
                <h2>How The System Works</h2>
                <div className={styles.workflowGrid}>
                    <div className={styles.workflowStep}>
                        <span>01</span>
                        <h3>Setup Medicines</h3>
                        <p>Define medicines, stock limits, and master references for standardized operations.</p>
                    </div>
                    <div className={styles.workflowStep}>
                        <span>02</span>
                        <h3>Run Purchases & Sales</h3>
                        <p>Record transactions with batch-level accuracy and keep live stock in sync.</p>
                    </div>
                    <div className={styles.workflowStep}>
                        <span>03</span>
                        <h3>Review Alerts & Reports</h3>
                        <p>Use actionable reports to plan replenishment and reduce expiry-related loss.</p>
                    </div>
                    <div className={styles.workflowStep}>
                        <span>04</span>
                        <h3>Maintain Compliance</h3>
                        <p>Track every critical movement through audit logs and controlled user permissions.</p>
                    </div>
                </div>
            </section>

            <footer className={styles.footer}>
                <p>&copy; {new Date().getFullYear()} Invenzaa Medicine Inventory Management. All rights reserved.</p>
            </footer>
        </div>
    );
};
