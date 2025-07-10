"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import AdminLinkTable from '@/components/ui/admin/AdminLinkTable';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/contexts/ToastContext';
import styles from './UserDetail.module.css';
import type { User } from '@/types/user';
import type { SessionInfo } from '@/types/session';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const accountId = params.accountId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !session?.user?.isAdmin)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);
  
  useEffect(() => {
    if (status === "authenticated" && session?.user?.isAdmin) {
      fetchUserData();
    }
  }, [status, session, accountId]);
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userResponse = await fetch(`/api/admin/users/${accountId}`);
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user details');
      }
      
      const userData = await userResponse.json();
      if (userData.success) {
        setUser(userData.user);
        
        const linksResponse = await fetch(`/api/admin/users/${accountId}/links`);
        const linksData = await linksResponse.json();
        
        if (linksResponse.ok && linksData.success) {
          setLinks(linksData.links);
        }
        
        const sessionsResponse = await fetch(`/api/admin/users/${accountId}/sessions`);
        const sessionsData = await sessionsResponse.json();
        
        if (sessionsResponse.ok && sessionsData.success) {
          setSessions(sessionsData.sessions);
        }
      } else {
        showToast(userData.message || 'Failed to load user details', 'error');
        router.push('/admin');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showToast('Failed to load user details', 'error');
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevoking(sessionId);
      
      const response = await fetch(`/api/admin/users/${accountId}/sessions/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, accountId })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast('Session revoked successfully', 'success');
        setSessions(prevSessions => 
          prevSessions.filter(s => s.id !== sessionId)
        );
      } else {
        showToast(data.message || 'Failed to revoke session', 'error');
      }
    } catch (error) {
      console.error('Error revoking session:', error);
      showToast('Failed to revoke session', 'error');
    } finally {
      setRevoking(null);
    }
  };
  
  const handleDeleteUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account_id: accountId }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast('User deleted successfully', 'success');
        router.push('/admin');
      } else {
        showToast(data.message || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  if (status === "loading" || loading) {
    return <div className={styles.loading}>Loading user details...</div>;
  }
  
  if (!user) {
    return <div className={styles.error}>User not found</div>;
  }
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>User Details</h1>
        <div className={styles.actionButtons}>
          <Link href="/admin">
            <button className={styles.backButton}>Back to Admin</button>
          </Link>
          {!user.is_admin && (
            <button 
              className={styles.deleteButton}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete User
            </button>
          )}
        </div>
      </header>
      
      <section className={styles.userInfo}>
        <h2>Account Information</h2>
        <div className={styles.infoCard}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Account ID:</span>
            <span className={styles.infoValue}>{user.account_id}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Created:</span>
            <span className={styles.infoValue}>{formatDate(user.created_at)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Role:</span>
            <span className={styles.infoValue}>{user.is_admin ? 'Admin' : 'User'}</span>
          </div>
        </div>
      </section>
      
      <section className={styles.linksSection}>
        <h2>User Links</h2>
        {links.length === 0 ? (
          <div className={styles.noItems}>This user has not created any links yet.</div>
        ) : (
          <AdminLinkTable links={links} accountId={user.account_id} onLinkDeleted={fetchUserData} />
        )}
      </section>
      
      <section className={styles.sessionsSection}>
        <h2>Active Sessions</h2>
        {sessions.length === 0 ? (
          <div className={styles.noItems}>This user has no active sessions.</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.sessionsTable}>
              <thead>
                <tr>
                  <th>Device & Browser</th>
                  <th>IP Address</th>
                  <th>Last Active</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.userAgent.split(' ').slice(0, 3).join(' ')}</td>
                    <td>{s.ipAddress}</td>
                    <td>{formatDate(s.lastActive)}</td>
                    <td>{formatDate(s.createdAt)}</td>
                    <td>
                      <button
                        onClick={() => handleRevokeSession(s.id)}
                        className={styles.revokeButton}
                        disabled={revoking === s.id}
                      >
                        {revoking === s.id ? 'Revoking...' : 'Revoke'}
                      </button>
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
        title="Delete User"
        message={`Are you sure you want to delete user ${accountId}? This will permanently remove their account and all associated data including links and analytics. This action cannot be undone.`}
        onConfirm={handleDeleteUser}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}