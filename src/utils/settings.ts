import browser from 'webextension-polyfill';
import config, { ExtensionStatus, LoggingStyle, LoggingType, Theme } from '../config/config';

export interface ProjectName {
  projectName: string;
  url: string;
}

export interface Settings {
  allowList: string[];
  apiKey: string;
  apiUrl: string;
  customProjectNames: ProjectName[];
  extensionStatus: ExtensionStatus;
  hostname: string;
  lastMonitoredSitesFetch?: number;
  loggingEnabled: boolean;
  loggingStyle: LoggingStyle;
  loggingType: LoggingType;
  monitoredSitesError?: string | null;
  theme: Theme;
}

export const getSettings = async (): Promise<Settings> => {
  const settings = (await browser.storage.sync.get({
    allowList: [],
    apiKey: config.apiKey,
    apiUrl: config.apiUrl,
    customProjectNames: [],
    hostname: config.hostname,
    lastMonitoredSitesFetch: undefined,
    loggingEnabled: config.loggingEnabled,
    loggingStyle: config.loggingStyle,
    loggingType: config.loggingType,
    monitoredSitesError: null,
    theme: config.theme,
    whitelist: null,
  })) as Settings & {
    whitelist?: string;
  };

  // backwards compatibility
  if (typeof settings.whitelist === 'string') {
    settings.allowList = settings.whitelist.trim().split('\n');
    await browser.storage.sync.set({ allowList: settings.allowList });
    await browser.storage.sync.remove('whitelist');
  }

  return {
    allowList: settings.allowList,
    apiKey: settings.apiKey,
    apiUrl: settings.apiUrl,
    customProjectNames: settings.customProjectNames,
    extensionStatus: settings.extensionStatus,
    hostname: settings.hostname,
    lastMonitoredSitesFetch: settings.lastMonitoredSitesFetch,
    loggingEnabled: settings.loggingEnabled,
    loggingStyle: 'allow',
    loggingType: 'domain',
    monitoredSitesError: settings.monitoredSitesError,
    theme: settings.theme,
  };
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  // permissions.request must be the first await, not after the browser.storage.sync.set
  // See https://stackoverflow.com/a/47729896/12601364
  await browser.permissions.request({
    origins: [`${settings.apiUrl}/*`],
  });
  await browser.storage.sync.set(settings);
};

export const ignoreSite = async (site: string): Promise<void> => {
  const settings = await getSettings();
  // Always in allow mode: remove from allowList
  settings.allowList = settings.allowList.filter((regex) => {
    const re = new RegExp(regex.replace(/\*/g, '.*'));
    return !re.test(site);
  });
  await saveSettings(settings);
};

export const getApiUrl = async () => {
  const settings = await browser.storage.sync.get({
    apiUrl: config.apiUrl,
  });
  let apiUrl = (settings.apiUrl as string) || config.apiUrl;
  const suffixes = ['/', '.bulk', '/users/current/heartbeats', '/heartbeats', '/heartbeat'];
  for (const suffix of suffixes) {
    if (apiUrl.endsWith(suffix)) {
      apiUrl = apiUrl.slice(0, -suffix.length);
    }
  }
  return apiUrl;
};

export const getWebsiteUrl = async () => {
  return (await getApiUrl()).replace('/api/v1', '').replace('://api.', '://');
};

export const updateMonitoredSites = async (apiKey: string, apiUrl?: string): Promise<void> => {
  const { fetchMonitoredSites, mapToAllowList, mapToCustomProjectNames } = await import(
    './monitoredSites'
  );

  try {
    const data = await fetchMonitoredSites(apiKey, apiUrl);

    const settings = await getSettings();
    settings.allowList = mapToAllowList(data.sites);
    settings.customProjectNames = mapToCustomProjectNames(data.sites);
    settings.lastMonitoredSitesFetch = Date.now();
    settings.monitoredSitesError = null;

    await saveSettings(settings);
  } catch (error) {
    // On error: clear everything
    const settings = await getSettings();
    settings.allowList = [];
    settings.customProjectNames = [];
    settings.monitoredSitesError =
      (error as Error).message || 'Failed to fetch monitored sites';

    await saveSettings(settings);
    throw error;
  }
};
