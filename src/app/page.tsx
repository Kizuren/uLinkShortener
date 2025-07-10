"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { useToast } from '@/contexts/ToastContext';
import Graph from '@/components/ui/Graph';
import { StatItem } from '@/types/statistics';
import styles from './Home.module.css';

// Fallback sample data in case API fails (hopefully not)
const sampleData = {
  clicks: [
    { id: 'Mon', count: 25 },
    { id: 'Tue', count: 30 },
    { id: 'Wed', count: 45 },
    { id: 'Thu', count: 35 },
    { id: 'Fri', count: 50 },
    { id: 'Sat', count: 20 },
    { id: 'Sun', count: 15 }
  ],
  geoData: [
    { id: 'United States', count: 120 },
    { id: 'Germany', count: 80 },
    { id: 'United Kingdom', count: 65 },
    { id: 'Canada', count: 45 },
    { id: 'France', count: 40 }
  ],
  deviceData: [
    { id: 'Desktop', count: 210 },
    { id: 'Mobile', count: 180 },
    { id: 'Tablet', count: 50 }
  ]
};

export default function Home() {
  const router = useRouter();
  const { status } = useSession();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // State for real statistics data
  const [ipVersionStats, setIpVersionStats] = useState<StatItem[]>([]);
  const [osStats, setOsStats] = useState<StatItem[]>([]);
  const [countryStats, setCountryStats] = useState<StatItem[]>([]);
  const [ispStats, setIspStats] = useState<StatItem[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalLinks, setTotalLinks] = useState(0);
  
  useEffect(() => {
    async function fetchStats() {
      try {
        setStatsLoading(true);
        const response = await fetch('/api/statistics');
        
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        
        const data = await response.json();
        
        if (data.success && data.stats) {
          const { stats } = data;
          setTotalLinks(stats.total_links || 0);
          setTotalClicks(stats.total_clicks || 0);
          
          if (stats.chart_data) {
            setIpVersionStats(stats.chart_data.ip_versions || []);
            setOsStats(stats.chart_data.os_stats || []);
            setCountryStats(stats.chart_data.country_stats || []);
            setIspStats(stats.chart_data.isp_stats || []);
          }
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setStatsLoading(false);
      }
    }
    
    fetchStats();
  }, []);
  
  const handleGetStarted = async () => {
    if (status === 'authenticated') {
      router.push('/dashboard');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      const data = await response.json();
      
      if (data.success && data.account_id) {
        const signInResult = await signIn('credentials', {
          accountId: data.account_id,
          redirect: false
        });
        
        if (signInResult?.error) {
          throw new Error(signInResult.error);
        }
        
        showToast('Account created successfully!', 'success');
        router.push('/dashboard');
      } else {
        throw new Error(data.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showToast('Failed to create an account. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <main className={styles["default-container"]}>
      {/* Hero Section */}
      <section className={styles["hero-section"]}>
        <h1 className={styles["hero-title"]}>µLinkShortener</h1>
        <p className={styles["hero-description"]}>
          An analytics-driven URL shortening service to track and manage your links.
        </p>
        <button 
          className={styles["hero-cta"]}
          onClick={handleGetStarted}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Get Started'}
        </button>
      </section>

      {/* Stats Summary */}
      <section className={styles["stats-summary"]}>
        <div className={styles["stats-container"]}>
          <div className={styles["stats-card"]}>
            <h3>Total Links</h3>
            <p className={styles["stats-number"]}>{statsLoading ? '...' : totalLinks.toLocaleString()}</p>
          </div>
          <div className={styles["stats-card"]}>
            <h3>Total Clicks</h3>
            <p className={styles["stats-number"]}>{statsLoading ? '...' : totalClicks.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* Graphs Section */}
      <section className={styles["graphs-section"]}>
        <h2 className={styles["graphs-title"]}>Analytics Dashboard</h2>
        <div className={styles["graphs-container"]}>
          <div className={styles["graph-card"]}>
            <h3 className={styles["graph-title"]}>IP Versions</h3>
            <div className={styles["graph-content"]}>
              <Graph 
                type="doughnut" 
                data={ipVersionStats.length > 0 ? ipVersionStats : sampleData.deviceData} 
                loading={statsLoading}
                height={250}
              />
            </div>
          </div>
          
          <div className={styles["graph-card"]}>
            <h3 className={styles["graph-title"]}>Operating Systems</h3>
            <div className={styles["graph-content"]}>
              <Graph 
                type="doughnut" 
                data={osStats.length > 0 ? osStats : sampleData.deviceData} 
                loading={statsLoading}
                height={250}
              />
            </div>
          </div>
          
          <div className={styles["graph-card"]}>
            <h3 className={styles["graph-title"]}>Countries</h3>
            <div className={styles["graph-content"]}>
              <Graph 
                type="doughnut" 
                data={countryStats.length > 0 ? countryStats : sampleData.geoData}
                loading={statsLoading}
                height={250}
              />
            </div>
          </div>
          
          <div className={styles["graph-card"]}>
            <h3 className={styles["graph-title"]}>Internet Service Providers</h3>
            <div className={styles["graph-content"]}>
              <Graph 
                type="doughnut" 
                data={ispStats.length > 0 ? ispStats : sampleData.geoData}
                loading={statsLoading}
                height={250}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}