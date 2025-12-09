'use client';

import { useToast } from '@/contexts/ToastContext';
import styles from './Toast.module.css';

export default function Toast() {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]} ${styles.toastShow}`}
          onClick={() => hideToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
