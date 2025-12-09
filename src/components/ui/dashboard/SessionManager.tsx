'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/contexts/ToastContext';
import styles from './SessionManager.module.css';
import type { SessionInfo } from '@/types/session';

export default function SessionManager() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const { showToast } = useToast();

  const isFetchingSessions = useRef(false);

  useEffect(() => {
    if (isFetchingSessions.current) return;

    async function fetchSessions() {
      if (!session?.user?.accountId) return;

      try {
        isFetchingSessions.current = true;
        setLoading(true);

        const response = await fetch('/api/auth/sessions');

        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }

        const data = await response.json();
        if (data.success) {
          setSessions(data.sessions);
          setFilteredSessions(data.sessions);
        } else {
          setError(data.message || 'Failed to load sessions');
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setError('Failed to load sessions');
      } finally {
        setLoading(false);
        isFetchingSessions.current = false;
      }
    }

    fetchSessions();
  }, [session?.user?.accountId]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSessions(sessions);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = sessions.filter(
      s =>
        s.userAgent.toLowerCase().includes(term) ||
        s.ipAddress.toLowerCase().includes(term) ||
        new Date(s.lastActive).toLocaleString().toLowerCase().includes(term) ||
        new Date(s.createdAt).toLocaleString().toLowerCase().includes(term)
    );

    setFilteredSessions(filtered);
  }, [searchTerm, sessions]);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const sessionToRevoke = sessions.find(s => s.id === sessionId);
      if (sessionToRevoke?.isCurrentSession) {
        showToast('You cannot revoke your current session', 'error');
        return;
      }

      setRevoking(sessionId);

      const response = await fetch('/api/auth/sessions/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Session revoked successfully', 'success');
        setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));
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

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className={styles.loading}>Loading sessions...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.sessionManager}>
      <h2>Active Sessions</h2>

      <div className={styles.searchContainer}>
        <input
          type='text'
          placeholder='Search sessions...'
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

      {sessions.length === 0 ? (
        <p className={styles.noSessions}>No active sessions found.</p>
      ) : filteredSessions.length === 0 ? (
        <p className={styles.noSessions}>No sessions match your search.</p>
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
              {filteredSessions.map(s => (
                <tr key={s.id} className={s.isCurrentSession ? styles.currentSession : ''}>
                  <td className={styles.deviceCell}>
                    {s.userAgent.split(' ').slice(0, 3).join(' ')}
                  </td>
                  <td>{s.ipAddress}</td>
                  <td>{formatDate(s.lastActive)}</td>
                  <td>{formatDate(s.createdAt)}</td>
                  <td>
                    {!s.isCurrentSession ? (
                      <button
                        onClick={() => handleRevokeSession(s.id)}
                        className={styles.revokeButton}
                        disabled={revoking === s.id}
                      >
                        {revoking === s.id ? 'Revoking...' : 'Revoke'}
                      </button>
                    ) : (
                      <span className={styles.currentSessionText}>Current Session</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
