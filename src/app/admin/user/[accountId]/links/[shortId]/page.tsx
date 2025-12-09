'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AnalyticsTable from '@/components/ui/dashboard/link/AnalyticsTable';
import Graph from '@/components/ui/Graph';
import styles from './AdminLinkDetail.module.css';
import type { Link as LinkType } from '@/types/link';
import type { Analytics } from '@/types/analytics';
import type { StatItem } from '@/types/statistics';

export default function AdminLinkDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const accountId = params.accountId as string;
  const shortId = params.shortId as string;

  const [link, setLink] = useState<LinkType | null>(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allAnalytics, setAllAnalytics] = useState<Analytics[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [totalAnalytics, setTotalAnalytics] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [analyticsToDelete, setAnalyticsToDelete] = useState<string>('');
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const isRedirecting = useRef(false);

  // Stats data
  const [browserStats, setBrowserStats] = useState<StatItem[]>([]);
  const [osStats, setOsStats] = useState<StatItem[]>([]);
  const [countryStats, setCountryStats] = useState<StatItem[]>([]);
  const [ipVersionStats, setIpVersionStats] = useState<StatItem[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user?.isAdmin)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  function isValidUrl(urlStr: string): boolean {
    if (urlStr.trim() === '') {
      return false;
    }

    try {
      const parsedUrl = new URL(urlStr);
      return parsedUrl.protocol !== '' && parsedUrl.hostname !== '';
    } catch {
      return false;
    }
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isEditing]);

  useEffect(() => {
    if (isRedirecting.current || status !== 'authenticated' || !session?.user?.isAdmin) return;

    async function fetchLinkData() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/users/${accountId}/links/${shortId}`);
        if (!response.ok) {
          showToast('Failed to load link details', 'error');
          isRedirecting.current = true;
          router.push(`/admin/user/${accountId}`);
          return;
        }

        const data = await response.json();
        if (data.success && data.link) {
          setLink(data.link);
          setTargetUrl(data.link.target_url);
        } else {
          showToast(data.message || 'Link not found', 'error');
          isRedirecting.current = true;
          router.push(`/admin/user/${accountId}`);
        }
      } catch {
        showToast('An error occurred while loading link details', 'error');
        isRedirecting.current = true;
        router.push(`/admin/user/${accountId}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLinkData();
  }, [shortId, accountId, router, showToast, session, status]);

  useEffect(() => {
    if (!link || status !== 'authenticated' || !session?.user?.isAdmin) return;

    async function fetchAllAnalytics() {
      try {
        const response = await fetch(
          `/api/admin/users/${accountId}/links/${shortId}/analytics?all=true`
        );
        if (!response.ok) {
          showToast('Failed to load complete analytics data', 'error');
          return;
        }

        const data = await response.json();
        if (data.success) {
          setAllAnalytics(data.analytics);
          setTotalAnalytics(data.pagination.total);
        }
      } catch {
        showToast('An error occurred while loading complete analytics data', 'error');
      }
    }

    fetchAllAnalytics();
  }, [link, shortId, accountId, showToast, session, status]);

  useEffect(() => {
    if (!link || status !== 'authenticated' || !session?.user?.isAdmin) return;

    async function fetchPaginatedAnalytics() {
      try {
        const response = await fetch(
          `/api/admin/users/${accountId}/links/${shortId}/analytics?page=${page}&limit=${limit}`
        );
        if (!response.ok) {
          showToast('Failed to load analytics page', 'error');
          return;
        }

        const data = await response.json();
        if (data.success) {
          setAnalytics(data.analytics);
        }
      } catch {
        showToast('An error occurred while loading analytics page', 'error');
      }
    }

    fetchPaginatedAnalytics();
  }, [link, shortId, accountId, page, limit, showToast, session, status]);

  useEffect(() => {
    if (!link || allAnalytics.length === 0) return;

    async function generateStats() {
      setIsLoadingStats(true);
      try {
        // Browser stats
        const browsers = allAnalytics.reduce((acc: Record<string, number>, item) => {
          const browser = item.browser || 'Unknown';
          acc[browser] = (acc[browser] || 0) + 1;
          return acc;
        }, {});

        // OS stats
        const oses = allAnalytics.reduce((acc: Record<string, number>, item) => {
          const os = item.platform || 'Unknown';
          acc[os] = (acc[os] || 0) + 1;
          return acc;
        }, {});

        // Country stats
        const countries = allAnalytics.reduce((acc: Record<string, number>, item) => {
          const country = item.country || 'Unknown';
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        }, {});

        // IP version stats
        const ipVersions = allAnalytics.reduce((acc: Record<string, number>, item) => {
          const ipVersion = item.ip_version || 'Unknown';
          acc[ipVersion] = (acc[ipVersion] || 0) + 1;
          return acc;
        }, {});

        // Convert to StatItem[] and sort by count
        setBrowserStats(
          Object.entries(browsers)
            .map(([id, count]) => ({ id, count }))
            .sort((a, b) => b.count - a.count)
        );

        setOsStats(
          Object.entries(oses)
            .map(([id, count]) => ({ id, count }))
            .sort((a, b) => b.count - a.count)
        );

        setCountryStats(
          Object.entries(countries)
            .map(([id, count]) => ({ id, count }))
            .sort((a, b) => b.count - a.count)
        );

        setIpVersionStats(
          Object.entries(ipVersions)
            .map(([id, count]) => ({ id, count }))
            .sort((a, b) => b.count - a.count)
        );
      } catch {
        showToast('An error occurred while processing analytics data', 'error');
      } finally {
        setIsLoadingStats(false);
      }
    }

    generateStats();
  }, [allAnalytics, link, showToast]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleEditLink = async () => {
    if (!isValidUrl(targetUrl)) {
      showToast('Please enter a valid URL', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${accountId}/links/${shortId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_url: targetUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('Link updated successfully', 'success');
        setIsEditing(false);
        if (link) {
          setLink({
            ...link,
            target_url: targetUrl,
            last_modified: new Date(),
          });
        }
      } else {
        showToast(data.message || 'Failed to update link', 'error');
      }
    } catch {
      showToast('An error occurred while updating the link', 'error');
    }
  };

  const handleDeleteAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/users/${accountId}/links/${shortId}/analytics`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analytics_id: analyticsToDelete,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('Analytics entry deleted successfully', 'success');

        setAnalytics(analytics.filter(item => item._id?.toString() !== analyticsToDelete));

        setTotalAnalytics(prev => prev - 1);
      } else {
        showToast(data.message || 'Failed to delete analytics entry', 'error');
      }
    } catch {
      showToast('An error occurred while deleting the analytics entry', 'error');
    } finally {
      setShowDeleteModal(false);
      setAnalyticsToDelete('');
    }
  };

  const handleDeleteAllAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/users/${accountId}/links/${shortId}/analytics`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delete_all: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('All analytics entries deleted successfully', 'success');

        setAnalytics([]);
        setTotalAnalytics(0);
        setBrowserStats([]);
        setOsStats([]);
        setCountryStats([]);
        setIpVersionStats([]);
      } else {
        showToast(data.message || 'Failed to delete all analytics entries', 'error');
      }
    } catch {
      showToast('An error occurred while deleting all analytics entries', 'error');
    } finally {
      setShowDeleteAllModal(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading link details...</p>
      </div>
    );
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user?.isAdmin)) {
    return null;
  }

  if (!link) {
    return (
      <div className={styles.error}>
        Link not found or you don&apos;t have permission to view it.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Admin Link Management</h1>
          <div className={styles.breadcrumbs}>
            <Link href='/admin' className={styles.breadcrumbLink}>
              Admin
            </Link>{' '}
            &gt;
            <Link href={`/admin/user/${accountId}`} className={styles.breadcrumbLink}>
              User
            </Link>{' '}
            &gt;
            <span className={styles.breadcrumbCurrent}>Link {shortId}</span>
          </div>
        </div>
        <Link href={`/admin/user/${accountId}`} className={styles.backLink}>
          Back to User
        </Link>
      </div>

      <div className={styles.userInfo}>
        <span className={styles.label}>Managing link for User ID:</span>
        <span className={styles.value}>{accountId}</span>
      </div>

      <div className={styles.linkInfo}>
        <div className={styles.linkCard}>
          <h2>Link Information</h2>
          <div className={styles.linkDetails}>
            <div className={styles.linkDetailItem}>
              <span className={styles.label}>Short ID:</span>
              <span className={styles.value}>{shortId}</span>
            </div>

            <div className={styles.targetUrlHeader}>
              <div className={styles.linkDetailItem}>
                <span className={styles.label}>Short URL:</span>
                <a
                  href={`${window.location.origin}/l/${shortId}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={styles.shortUrl}
                >
                  {`${window.location.origin}/l/${shortId}`}
                </a>
              </div>
              <button
                className={styles.defaultButton}
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/l/${shortId}`);
                  showToast('URL copied to clipboard', 'success');
                }}
              >
                Copy
              </button>
            </div>

            <div className={styles.linkDetailItem}>
              <span className={styles.label}>Created:</span>
              <span className={styles.value}>
                {link.created_at instanceof Date
                  ? link.created_at.toLocaleString()
                  : new Date(link.created_at).toLocaleString()}
              </span>
            </div>

            <div className={styles.linkDetailItem}>
              <span className={styles.label}>Last Modified:</span>
              <span className={styles.value}>
                {link.last_modified instanceof Date
                  ? link.last_modified.toLocaleString()
                  : new Date(link.last_modified).toLocaleString()}
              </span>
            </div>

            <div className={styles.targetUrlSection}>
              <div className={styles.targetUrlHeader}>
                <span className={styles.label}>Target URL:</span>
                {!isEditing && (
                  <button className={styles.editButton} onClick={() => setIsEditing(true)}>
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleEditLink();
                  }}
                  className={styles.editForm}
                >
                  <input
                    ref={inputRef}
                    type='url'
                    value={targetUrl}
                    onChange={e => setTargetUrl(e.target.value)}
                    className={styles.urlInput}
                    placeholder='https://example.com'
                  />
                  <div className={styles.editActions}>
                    <button
                      type='button'
                      className={styles.cancelButton}
                      onClick={() => {
                        setIsEditing(false);
                        setTargetUrl(link?.target_url || '');
                      }}
                    >
                      Cancel
                    </button>
                    <button type='submit' className={styles.saveButton}>
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <a
                  href={link.target_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={styles.targetUrl}
                >
                  {link.target_url}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.analyticsSection}>
        <div className={styles.analyticsHeader}>
          <h2>Analytics</h2>
          <span className={styles.totalClicks}>Total Clicks: {totalAnalytics}</span>
          {totalAnalytics > 0 && (
            <button className={styles.deleteAllButton} onClick={() => setShowDeleteAllModal(true)}>
              Delete All Analytics
            </button>
          )}
        </div>

        {totalAnalytics > 0 ? (
          <>
            <div className={styles.graphs}>
              <div className={styles.graphCard}>
                <h3>Browsers</h3>
                <Graph type='doughnut' data={browserStats} loading={isLoadingStats} height={200} />
              </div>

              <div className={styles.graphCard}>
                <h3>Operating Systems</h3>
                <Graph type='doughnut' data={osStats} loading={isLoadingStats} height={200} />
              </div>

              <div className={styles.graphCard}>
                <h3>Countries</h3>
                <Graph type='doughnut' data={countryStats} loading={isLoadingStats} height={200} />
              </div>

              <div className={styles.graphCard}>
                <h3>IP Versions</h3>
                <Graph
                  type='doughnut'
                  data={ipVersionStats}
                  loading={isLoadingStats}
                  height={200}
                />
              </div>
            </div>

            <AnalyticsTable
              analytics={analytics}
              allAnalytics={allAnalytics}
              totalItems={totalAnalytics}
              currentPage={page}
              itemsPerPage={limit}
              onPageChange={handlePageChange}
              onDeleteClick={id => {
                setAnalyticsToDelete(id);
                setShowDeleteModal(true);
              }}
            />
          </>
        ) : (
          <div className={styles.noAnalytics}>
            <p>No clicks recorded yet for this link.</p>
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title='Delete Analytics Entry'
        message='Are you sure you want to delete this analytics entry? This action cannot be undone.'
        confirmLabel='Delete'
        cancelLabel='Cancel'
        onConfirm={handleDeleteAnalytics}
        onCancel={() => {
          setShowDeleteModal(false);
          setAnalyticsToDelete('');
        }}
      />

      {/* Confirm Delete All Modal */}
      <ConfirmModal
        isOpen={showDeleteAllModal}
        title='Delete All Analytics'
        message='Are you sure you want to delete all analytics for this link? This action cannot be undone.'
        confirmLabel='Delete All'
        cancelLabel='Cancel'
        onConfirm={handleDeleteAllAnalytics}
        onCancel={() => setShowDeleteAllModal(false)}
      />
    </div>
  );
}
