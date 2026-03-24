import { useState, useEffect } from 'react';
import styles from './Toast.module.css';

export const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`${styles.toast} ${styles[type]} glass animate-fade-in`}>
            <div className={styles.icon}>
                {type === 'success' && '✓'}
                {type === 'error' && '✕'}
                {type === 'warning' && '⚠'}
                {type === 'info' && 'ℹ'}
            </div>
            <div className={styles.message}>{message}</div>
            <button className={styles.close} onClick={onClose}>&times;</button>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className={styles.container}>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};
