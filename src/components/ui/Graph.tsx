"use client";

import { useEffect, useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import styles from './Graph.module.css';
import LoadingIcon from './LoadingIcon';
import type { StatItem } from '@/types/statistics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export type GraphType = 'bar' | 'line' | 'doughnut';

interface GraphProps {
  title?: string;
  type: GraphType;
  data: StatItem[];
  loading?: boolean;
  height?: number;
  maxItems?: number;
  colors?: string[];
}

const defaultColors = [
  '#6366f1', // Indigo
  '#4f46e5', // Darker indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#14b8a6', // Teal
];

export default function Graph({
  title,
  type,
  data,
  loading = false,
  height = 200,
  maxItems = 8,
  colors = defaultColors
}: GraphProps) {
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartValues, setChartValues] = useState<number[]>([]);
  const [chartColors, setChartColors] = useState<string[]>([]);
  const chartRef = useRef<ChartJS | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process data and update state
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Limit data to maxItems and group the rest as "Others"
    const processedData = [...data];
    let labels: string[] = [];
    let values: number[] = [];
    
    if (processedData.length > maxItems) {
      const topItems = processedData.slice(0, maxItems - 1);
      const others = processedData.slice(maxItems - 1);
      
      labels = topItems.map(item => item.id);
      values = topItems.map(item => item.count);
      
      const othersSum = others.reduce((sum, item) => sum + item.count, 0);
      labels.push('Others');
      values.push(othersSum);
    } else {
      labels = processedData.map(item => item.id);
      values = processedData.map(item => item.count);
    }

    setChartLabels(labels);
    setChartValues(values);
    setChartColors(colors.slice(0, labels.length));
  }, [data, maxItems, colors]);

  // Handle resize and respond to container size changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current) {
        chartRef.current.update();
      }
    });
    
    const currentContainer = containerRef.current;
  
    if (currentContainer) {
      resizeObserver.observe(currentContainer);
    }
    
    // Also handle window resize
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.update();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (currentContainer) {
        resizeObserver.unobserve(currentContainer);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: type === 'doughnut',
          position: 'bottom' as const,
          labels: {
            color: 'white',
            font: {
              size: 10
            },
            boxWidth: 12,
            padding: 10
          }
        },
        tooltip: {
          backgroundColor: 'var(--card-bg)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'var(--border-color)',
          borderWidth: 1,
          padding: 8,
          boxWidth: 10,
          boxHeight: 10
        }
      },
      color: 'white'
    };

    // Only add scales for bar and line charts
    if (type !== 'doughnut') {
      return {
        ...baseOptions,
        scales: {
          x: {
            ticks: {
              color: 'white',
              font: {
                size: 10
              },
              maxRotation: 45,
              minRotation: 45,
              autoSkip: true,
              maxTicksLimit: 10
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              border: {
                display: false
              }
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: 'white',
              font: {
                size: 10
              },
              precision: 0
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              border: {
                display: false
              }
            }
          }
        }
      };
    }
    
    return baseOptions;
  };

  // Create properly typed data objects for each chart type
  const getBarData = () => ({
    labels: chartLabels,
    datasets: [
      {
        label: title || 'Data',
        data: chartValues,
        backgroundColor: chartColors,
        borderColor: chartColors,
        borderWidth: 1,
        borderRadius: 4
      },
    ],
  });

  const getLineData = () => ({
    labels: chartLabels,
    datasets: [
      {
        label: title || 'Data',
        data: chartValues,
        backgroundColor: chartColors[0],
        borderColor: chartColors[0],
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5
      },
    ],
  });

  const getDoughnutData = () => ({
    labels: chartLabels,
    datasets: [
      {
        label: title || 'Data',
        data: chartValues,
        backgroundColor: chartColors,
        borderColor: chartColors,
        borderWidth: 1,
        hoverOffset: 5
      },
    ],
  });

  return (
    <div ref={containerRef} className={styles.graphContainer} style={{ height: `${height}px` }}>
      {loading ? (
        <div className={styles.loadingContainer}>
          <LoadingIcon size={40} />
        </div>
      ) : data && data.length > 0 ? (
        <>
          {type === 'bar' && (
            <Bar 
              data={getBarData()} 
              options={getOptions()} 
              ref={(ref) => {
                if (ref) chartRef.current = ref;
              }}
            />
          )}
          {type === 'line' && (
            <Line 
              data={getLineData()} 
              options={getOptions()} 
              ref={(ref) => {
                if (ref) chartRef.current = ref;
              }}
            />
          )}
          {type === 'doughnut' && (
            <Doughnut 
              data={getDoughnutData()} 
              options={getOptions()} 
              ref={(ref) => {
                if (ref) chartRef.current = ref;
              }}
            />
          )}
        </>
      ) : (
        <div className={styles.noData}>No data available</div>
      )}
    </div>
  );
}