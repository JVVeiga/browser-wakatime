import axios from 'axios';
import { getApiUrl } from './settings';
import { ProjectName } from './settings';

export interface MonitoredSite {
  url: string;
  label: string;
}

export interface MonitoredSitesResponse {
  total: number;
  sites: MonitoredSite[];
}

export async function fetchMonitoredSites(
  apiKey: string,
  apiUrl?: string,
): Promise<MonitoredSitesResponse> {
  const baseUrl = apiUrl || (await getApiUrl());

  try {
    const response = await axios.get<MonitoredSitesResponse>(`${baseUrl}/monitored-sites`, {
      params: { api_key: apiKey },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to fetch monitored sites:', error);
    throw error;
  }
}

export function mapToAllowList(sites: MonitoredSite[]): string[] {
  return sites.map((site) => {
    try {
      const url = new URL(site.url);
      return url.hostname;
    } catch {
      return site.url;
    }
  });
}

export function mapToCustomProjectNames(sites: MonitoredSite[]): ProjectName[] {
  return sites.map((site) => ({
    url: site.url,
    projectName: site.label,
  }));
}
