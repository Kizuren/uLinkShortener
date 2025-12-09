'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import SessionManager from '@/components/ui/dashboard/SessionManager';
import ConfirmModal from '@/components/ui/ConfirmModal';
import styles from './Security.module.css';

export default function SecurityPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAccountDeletion = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch('/api/auth/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account_id: session?.user?.accountId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Account deleted successfully', 'success');

        await signOut({ redirect: false });
        router.push('/');
      } else {
        showToast(data.message || 'Failed to delete account', 'error');
        setIsDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('Failed to delete account', 'error');
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Security Settings</h1>
        <Link href='/dashboard' className={styles.backLink}>
          Back to Dashboard
        </Link>
      </header>

      <div className={styles.content}>
        <section className={styles.sessionSection}>
          <SessionManager />
        </section>

        <section className={styles.dangerSection}>
          <h2>Danger Zone</h2>
          <div className={styles.dangerCard}>
            <div className={styles.dangerInfo}>
              <h3>Delete Account</h3>
              <p>
                This will permanently delete your account and all associated data. This action
                cannot be undone.
              </p>
            </div>
            <button
              className={styles.deleteAccountBtn}
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isDeleting}
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title='Delete Account'
        message='Are you sure you want to delete your account? This will permanently remove your account and all your data, including all shortened links. This action cannot be undone.'
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Account'}
        onConfirm={handleAccountDeletion}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
