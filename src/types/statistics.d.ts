export interface Stats {
  total_links: number;
  total_clicks: number;
  chart_data: ChartData;
  last_updated: Date;
}

export interface ChartData {
  ip_versions: StatItem[];
  os_stats: StatItem[];
  country_stats: StatItem[];
  isp_stats: StatItem[];
}

export interface StatItem {
  id: string;
  count: number;
}
