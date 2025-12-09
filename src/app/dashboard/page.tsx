'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LinkTable from '@/components/ui/dashboard/LinkTable';
import styles from './Dashboard.module.css';
import { useToast } from '@/contexts/ToastContext';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.accountId) {
      fetchLinks();
    }
  }, [session]);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/links');

      if (!response.ok) {
        throw new Error('Failed to fetch links');
      }

      const data = await response.json();
      if (data.success) {
        setLinks(data.links);
      } else {
        showToast(data.message || 'Failed to load links', 'error');
      }
    } catch (error) {
      console.error('Error fetching links:', error);
      showToast('Failed to load links', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>Dashboard</h1>
        <div className={styles.actionButtons}>
          <Link href='/dashboard/security'>
            <button className={styles.securityButton}>Security Settings</button>
          </Link>

          {session?.user?.isAdmin && (
            <Link href='/admin'>
              <button className={styles.adminButton}>Admin Dashboard</button>
            </Link>
          )}
        </div>
      </header>

      <section className={styles.urlShortener}>
        <h2>Create New Short Link</h2>
        <CreateLinkForm onLinkCreated={fetchLinks} />
      </section>

      <section className={styles.linksSection}>
        <h2>Your Shortened Links</h2>
        {loading ? (
          <div className={styles.loading}>Loading your links...</div>
        ) : links.length === 0 ? (
          <div className={styles.noLinks}>
            You haven&apos;t created any links yet. Create your first short link above!
          </div>
        ) : (
          <LinkTable links={links} onLinkDeleted={fetchLinks} />
        )}
      </section>
    </div>
  );
}

interface CreateLinkFormProps {
  onLinkCreated: () => void;
}

function CreateLinkForm({ onLinkCreated }: CreateLinkFormProps) {
  const [url, setUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!url.trim()) {
      showToast('Please enter a URL', 'error');
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target_url: url }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Link created successfully!', 'success');
        setUrl('');
        if (onLinkCreated) onLinkCreated();
      } else {
        showToast(data.message || 'Failed to create link', 'error');
      }
    } catch (error) {
      console.error('Error creating link:', error);
      showToast('Failed to create link', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.createForm}>
      <div className={styles.inputGroup}>
        <input
          type='url'
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder='Enter URL to shorten'
          className={styles.urlInput}
          required
        />
        <button type='submit' className={styles.createButton} disabled={creating}>
          {creating ? 'Creating...' : 'Create Short Link'}
        </button>
      </div>
    </form>
  );
}
