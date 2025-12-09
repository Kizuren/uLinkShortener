'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ConfirmModal from '@/components/ui/ConfirmModal';
import styles from './LinkTable.module.css';
import { useToast } from '@/contexts/ToastContext';
import type { Link as LinkData } from '@/types/link';

interface LinkTableProps {
  links: LinkData[];
  onLinkDeleted: () => void;
}

export default function LinkTable({ links, onLinkDeleted }: LinkTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLinks, setFilteredLinks] = useState<LinkData[]>(links);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setFilteredLinks(links);
  }, [links]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLinks(links);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = links.filter(
      link =>
        link.short_id.toLowerCase().includes(term) ||
        link.target_url.toLowerCase().includes(term) ||
        new Date(link.created_at).toLocaleString().toLowerCase().includes(term) ||
        new Date(link.last_modified).toLocaleString().toLowerCase().includes(term)
    );

    setFilteredLinks(filtered);
  }, [searchTerm, links]);

  const copyToClipboard = (shortId: string) => {
    const fullUrl = `${window.location.origin}/l/${shortId}`;
    navigator.clipboard
      .writeText(fullUrl)
      .then(() => {
        showToast('Link copied to clipboard!', 'success');
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        showToast('Failed to copy link', 'error');
      });
  };

  const confirmDelete = (shortId: string) => {
    setLinkToDelete(shortId);
    setIsDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setLinkToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteLink = async () => {
    if (!linkToDelete) return;

    try {
      setDeletingId(linkToDelete);
      const response = await fetch('/api/link', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shortId: linkToDelete }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Link deleted successfully!', 'success');
        if (onLinkDeleted) onLinkDeleted();
      } else {
        showToast(data.message || 'Failed to delete link', 'error');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      showToast('Failed to delete link', 'error');
    } finally {
      setDeletingId(null);
      setLinkToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const truncateUrl = (url: string, maxLength: number = 50) => {
    return url.length > maxLength ? `${url.substring(0, maxLength)}...` : url;
  };

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.searchContainer}>
        <input
          type='text'
          placeholder='Search links...'
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

      {filteredLinks.length === 0 && (
        <div className={styles.noResults}>
          {searchTerm ? 'No links match your search' : 'No links available'}
        </div>
      )}

      {filteredLinks.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.linkTable}>
            <thead>
              <tr>
                <th>Short Link</th>
                <th>Target URL</th>
                <th className={styles.hideOnMobile}>Created</th>
                <th className={styles.hideOnMobile}>Last Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map(link => (
                <tr key={link.short_id}>
                  <td className={styles.shortLinkCell}>
                    <Link href={`/dashboard/link/${link.short_id}`} className={styles.shortLink}>
                      {link.short_id}
                    </Link>
                  </td>
                  <td className={styles.targetUrl} title={link.target_url}>
                    <a href={link.target_url} target='_blank' rel='noopener noreferrer'>
                      {truncateUrl(link.target_url)}
                    </a>
                  </td>
                  <td className={styles.hideOnMobile}>{formatDate(link.created_at)}</td>
                  <td className={styles.hideOnMobile}>{formatDate(link.last_modified)}</td>
                  <td className={styles.actions}>
                    <button
                      className={styles.copyButton}
                      onClick={() => copyToClipboard(link.short_id)}
                      title='Copy full short URL to clipboard'
                    >
                      Copy
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => confirmDelete(link.short_id)}
                      disabled={deletingId === link.short_id}
                      title='Delete this link'
                    >
                      {deletingId === link.short_id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title='Delete Link'
        message='Are you sure you want to delete this link? This action cannot be undone.'
        onConfirm={handleDeleteLink}
        onCancel={cancelDelete}
      />
    </div>
  );
}
