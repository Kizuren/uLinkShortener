'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/contexts/ToastContext';
import styles from './AdminDashboard.module.css';
import type { User } from '@/types/user';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRecreatingStats, setIsRecreatingStats] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user?.isAdmin)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchUsers();
    }
  }, [session]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = users.filter(
      user =>
        user.account_id.toLowerCase().includes(term) ||
        user.created_at.toLocaleString().toLowerCase().includes(term) ||
        (user.is_admin ? 'admin' : 'user').includes(term)
    );

    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();

      if (data.success) {
        const processedUsers = data.users.map((user: User) => ({
          account_id: user.account_id,
          is_admin: user.is_admin,
          created_at: new Date(user.created_at),
        }));

        setUsers(processedUsers);
        setFilteredUsers(processedUsers);
      } else {
        showToast(data.message || 'Failed to load users', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account_id: userToDelete }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('User deleted successfully', 'success');
        setUsers(prevUsers => prevUsers.filter(user => user.account_id !== userToDelete));
      } else {
        showToast(data.message || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    } finally {
      setUserToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const confirmDeleteUser = (accountId: string) => {
    setUserToDelete(accountId);
    setIsDeleteModalOpen(true);
  };

  const handleRecreateStatistics = async () => {
    try {
      setIsRecreatingStats(true);
      const response = await fetch('/api/admin/statistics/rebuild', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Statistics recreated successfully', 'success');
      } else {
        showToast(data.message || 'Failed to recreate statistics', 'error');
      }
    } catch (error) {
      console.error('Error recreating statistics:', error);
      showToast('Failed to recreate statistics', 'error');
    } finally {
      setIsRecreatingStats(false);
    }
  };

  const handleToggleAdminStatus = async (accountId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${accountId}/admin`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast(data.message, 'success');
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.account_id === accountId ? { ...user, is_admin: data.is_admin } : user
          )
        );
      } else {
        showToast(data.message || 'Failed to toggle admin status', 'error');
      }
    } catch (error) {
      console.error('Error toggling admin status:', error);
      showToast('Failed to toggle admin status', 'error');
    }
  };

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user?.isAdmin)) {
    return null;
  }

  return (
    <div className={styles.adminContainer}>
      <header className={styles.adminHeader}>
        <h1 className={styles.adminTitle}>Admin Dashboard</h1>
        <div className={styles.actionButtons}>
          <Link href='/dashboard'>
            <button className={styles.dashboardButton}>Back to Dashboard</button>
          </Link>
          <button
            className={styles.statsButton}
            onClick={handleRecreateStatistics}
            disabled={isRecreatingStats}
          >
            {isRecreatingStats ? 'Recreating...' : 'Recreate Statistics'}
          </button>
        </div>
      </header>

      <section className={styles.usersSection}>
        <div className={styles.sectionHeader}>
          <h2>Manage Users</h2>
          <div className={styles.searchContainer}>
            <input
              type='text'
              placeholder='Search users...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                className={styles.clearSearchButton}
                onClick={() => setSearchTerm('')}
                title='Clear search'
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className={styles.noResults}>
            {searchTerm ? 'No users match your search' : 'No users available'}
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>Account ID</th>
                  <th>Created</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.account_id}>
                    <td>{user.account_id}</td>
                    <td>{user.created_at.toLocaleString()}</td>
                    <td>{user.is_admin ? 'Admin' : 'User'}</td>
                    <td className={styles.actions}>
                      <Link href={`/admin/user/${user.account_id}`}>
                        <button className={styles.viewButton}>View Details</button>
                      </Link>

                      {user.account_id !== session?.user?.accountId && (
                        <button
                          className={
                            user.is_admin ? styles.removeAdminButton : styles.makeAdminButton
                          }
                          onClick={() => handleToggleAdminStatus(user.account_id)}
                        >
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      )}

                      {!user.is_admin && (
                        <button
                          className={styles.deleteButton}
                          onClick={() => confirmDeleteUser(user.account_id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title='Delete User'
        message='Are you sure you want to delete this user? This will permanently remove their account and all associated data including links and analytics. This action cannot be undone.'
        onConfirm={handleDeleteUser}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
