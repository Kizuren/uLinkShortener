'use client';

import { useState, useEffect } from 'react';
import { Analytics } from '@/types/analytics';
import styles from './AnalyticsTable.module.css';

interface AnalyticsTableProps {
  analytics: Analytics[];
  allAnalytics: Analytics[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onDeleteClick: (id: string) => void;
}

export default function AnalyticsTable({
  analytics,
  allAnalytics,
  totalItems,
  currentPage,
  itemsPerPage,
  onPageChange,
  onDeleteClick,
}: AnalyticsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Analytics[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    const filtered = allAnalytics.filter(item => {
      return (
        // IP and location
        item.ip_address.toLowerCase().includes(query) ||
        item.ip_version.toLowerCase().includes(query) ||
        item.country.toLowerCase().includes(query) ||
        (item.ip_data?.isp && item.ip_data.isp.toLowerCase().includes(query)) ||
        // Device and browser info
        item.platform
          .toLowerCase()
          .includes(query) ||
        item.browser.toLowerCase().includes(query) ||
        item.version.toLowerCase().includes(query) ||
        item.language.toLowerCase().includes(query) ||
        // Additional details
        item.user_agent
          .toLowerCase()
          .includes(query) ||
        item.referrer.toLowerCase().includes(query) ||
        item.remote_port.toLowerCase().includes(query) ||
        item.accept?.toLowerCase().includes(query) ||
        item.accept_language?.toLowerCase().includes(query) ||
        item.accept_encoding?.toLowerCase().includes(query)
      );
    });

    setSearchResults(filtered);
  }, [searchQuery, allAnalytics]);

  const toggleRowExpansion = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);

    if (currentPage !== 1) {
      onPageChange(1);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');

    if (currentPage !== 1) {
      onPageChange(1);
    }
  };

  const displayedAnalytics = isSearching ? searchResults : analytics;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h3 className={styles.tableTitle}>Click Details</h3>
        <div className={styles.searchContainer}>
          <input
            type='text'
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder='Search analytics...'
            className={styles.searchInput}
            aria-label='Search analytics'
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className={styles.clearSearchButton}
              aria-label='Clear search'
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {isSearching && (
        <div className={styles.searchResults}>
          Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.analyticsTable}>
          <thead>
            <tr>
              <th>Time</th>
              <th>IP Address</th>
              <th>Location</th>
              <th>Device</th>
              <th>Browser</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedAnalytics.map(item => {
              const id = item._id?.toString() || '';
              const isExpanded = expandedRows.has(id);

              return (
                <tr key={id} className={isExpanded ? styles.expandedRow : ''}>
                  <td>{new Date(item.timestamp).toLocaleString()}</td>
                  <td>
                    {item.ip_address}
                    <div className={styles.secondaryInfo}>{item.ip_version}</div>
                  </td>
                  <td>
                    {item.country}
                    <div className={styles.secondaryInfo}>
                      ISP: {item.ip_data?.isp || 'Unknown'}
                    </div>
                  </td>
                  <td>{item.platform}</td>
                  <td>
                    {item.browser} {item.version}
                    <div className={styles.secondaryInfo}>Lang: {item.language}</div>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.expandButton}
                        onClick={() => toggleRowExpansion(id)}
                        aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                      >
                        {isExpanded ? '−' : '+'}
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => onDeleteClick(id)}
                        aria-label='Delete entry'
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {displayedAnalytics.length === 0 && (
        <div className={styles.noResults}>
          {isSearching ? `No results found for "${searchQuery}"` : 'No analytics data available'}
        </div>
      )}

      {expandedRows.size > 0 && (
        <div className={styles.expandedDetails}>
          {displayedAnalytics.map(item => {
            const id = item._id?.toString() || '';
            if (!expandedRows.has(id)) return null;

            return (
              <div key={`details-${id}`} className={styles.detailsCard}>
                <h4>Additional Details</h4>
                <div className={styles.detailsGrid}>
                  <div>
                    <strong>User Agent:</strong>
                    <div className={styles.detailValue}>{item.user_agent}</div>
                  </div>
                  <div>
                    <strong>Referrer:</strong>
                    <div className={styles.detailValue}>{item.referrer}</div>
                  </div>
                  <div>
                    <strong>Remote Port:</strong>
                    <div className={styles.detailValue}>{item.remote_port}</div>
                  </div>
                  <div>
                    <strong>Accept:</strong>
                    <div className={styles.detailValue}>{item.accept}</div>
                  </div>
                  <div>
                    <strong>Accept-Language:</strong>
                    <div className={styles.detailValue}>{item.accept_language}</div>
                  </div>
                  <div>
                    <strong>Accept-Encoding:</strong>
                    <div className={styles.detailValue}>{item.accept_encoding}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && !isSearching && (
        <div className={styles.pagination}>
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className={styles.pageButton}
          >
            Previous
          </button>

          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className={styles.pageButton}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
