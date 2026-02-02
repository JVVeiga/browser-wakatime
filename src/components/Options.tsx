import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import config, { SuccessOrFailType } from '../config/config';
import apiKeyInvalid from '../utils/apiKey';
import { IS_CHROME } from '../utils/operatingSystem';
import { getSettings, saveSettings, Settings } from '../utils/settings';
import { logUserIn } from '../utils/user';

interface State extends Settings {
  alertText: string;
  alertType: SuccessOrFailType;
  loading: boolean;
  refreshing: boolean;
}

export default function Options(): JSX.Element {
  const [state, setState] = useState<State>({
    alertText: config.alert.success.text,
    alertType: config.alert.success.type,
    allowList: [],
    apiKey: '',
    apiUrl: config.apiUrl,
    customProjectNames: [],
    extensionStatus: 'allGood',
    hostname: '',
    loading: false,
    loggingEnabled: true,
    loggingStyle: config.loggingStyle,
    loggingType: config.loggingType,
    refreshing: false,
    theme: config.theme,
  });

  const isApiKeyValid = useMemo(() => apiKeyInvalid(state.apiKey) === '', [state.apiKey]);

  const restoreSettings = useCallback(async () => {
    const settings = await getSettings();
    setState((oldState) => ({
      ...oldState,
      ...settings,
    }));

    // Auto-fetch if API Key exists and data is stale (> 5 minutes)
    if (settings.apiKey) {
      const fiveMinutes = 5 * 60 * 1000;
      const isStale =
        !settings.lastMonitoredSitesFetch ||
        Date.now() - settings.lastMonitoredSitesFetch > fiveMinutes;

      if (isStale) {
        try {
          const { updateMonitoredSites } = await import('../utils/settings');
          await updateMonitoredSites(settings.apiKey, settings.apiUrl);
          const updated = await getSettings();
          setState((oldState) => ({ ...oldState, ...updated }));
        } catch (error) {
          // Fail silently on page load
        }
      }
    }
  }, []);

  useEffect(() => {
    void restoreSettings();
  }, [restoreSettings]);

  const handleSubmit = async () => {
    if (state.loading) return;
    setState((oldState) => ({ ...oldState, loading: true }));

    // Check if API Key or URL changed
    const oldSettings = await getSettings();
    const apiKeyChanged = oldSettings.apiKey !== state.apiKey;
    const apiUrlChanged = oldSettings.apiUrl !== state.apiUrl;

    // Save basic settings first
    await saveSettings({
      allowList: state.allowList,
      apiKey: state.apiKey,
      apiUrl: state.apiUrl,
      customProjectNames: state.customProjectNames,
      extensionStatus: state.extensionStatus,
      hostname: state.hostname,
      lastMonitoredSitesFetch: state.lastMonitoredSitesFetch,
      loggingEnabled: state.loggingEnabled,
      loggingStyle: state.loggingStyle,
      loggingType: state.loggingType,
      monitoredSitesError: state.monitoredSitesError,
      theme: state.theme,
    });

    // If API credentials changed, fetch monitored sites
    if ((apiKeyChanged || apiUrlChanged) && state.apiKey) {
      try {
        const { updateMonitoredSites } = await import('../utils/settings');
        await updateMonitoredSites(state.apiKey, state.apiUrl);
        const updatedSettings = await getSettings();
        setState((old) => ({ ...old, ...updatedSettings }));
      } catch (error) {
        // Error already handled in updateMonitoredSites
        const updatedSettings = await getSettings();
        setState((old) => ({ ...old, ...updatedSettings }));
      }
    }

    await logUserIn(state.apiKey);
    setState((old) => ({ ...old, loading: false }));
    if (IS_CHROME) {
      window.close();
    }
  };

  const handleRefreshMonitoredSites = useCallback(async () => {
    if (!state.apiKey) return;

    setState((old) => ({ ...old, refreshing: true }));

    try {
      const { updateMonitoredSites } = await import('../utils/settings');
      await updateMonitoredSites(state.apiKey, state.apiUrl);
      const updatedSettings = await getSettings();
      setState((old) => ({
        ...old,
        ...updatedSettings,
        refreshing: false,
      }));
    } catch (error) {
      setState((old) => ({
        ...old,
        monitoredSitesError: (error as Error).message,
        refreshing: false,
      }));
    }
  }, [state.apiKey, state.apiUrl]);

  const updateTheme = useCallback((theme: string) => {
    setState((oldState) => ({
      ...oldState,
      theme: theme === 'light' ? 'light' : 'dark',
    }));
  }, []);

  const monitoredSitesDisplay = useMemo(() => {
    return (
      <div className="form-group mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <label className="form-label mb-0">Monitored Sites</label>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={handleRefreshMonitoredSites}
            disabled={!state.apiKey || state.refreshing}
          >
            {state.refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {state.monitoredSitesError && (
          <div className="alert alert-danger" role="alert">
            {state.monitoredSitesError}
          </div>
        )}

        <div className="list-group">
          {state.customProjectNames.length === 0 ? (
            <div className="alert alert-warning">
              No monitored sites configured.{' '}
              {state.apiKey ? 'Click Refresh to load from API.' : 'Please enter an API Key first.'}
            </div>
          ) : (
            state.customProjectNames.map((site, index) => (
              <div key={index} className="list-group-item">
                <strong>{site.projectName}</strong>
                <br />
                <small className="text-muted">{site.url}</small>
              </div>
            ))
          )}
        </div>

        {state.lastMonitoredSitesFetch && (
          <small className="text-muted">
            Last updated: {new Date(state.lastMonitoredSitesFetch).toLocaleString()}
          </small>
        )}
      </div>
    );
  }, [
    handleRefreshMonitoredSites,
    state.apiKey,
    state.customProjectNames,
    state.lastMonitoredSitesFetch,
    state.monitoredSitesError,
    state.refreshing,
  ]);

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-12">
          <form className="form-horizontal">
            <div className="form-group mb-4">
              <label htmlFor="apiKey" className="form-label mb-0">
                API Key
              </label>
              <input
                id="apiKey"
                autoFocus={true}
                type="text"
                className={`form-control ${isApiKeyValid ? '' : 'is-invalid'}`}
                placeholder="API key"
                value={state.apiKey}
                onChange={(e) => setState({ ...state, apiKey: e.target.value })}
              />
            </div>

            {monitoredSitesDisplay}

            <div className="form-group mb-4">
              <label htmlFor="selectTheme" className="form-label mb-0">
                Theme
              </label>
              <select
                id="selectTheme"
                className="form-control"
                value={state.theme}
                onChange={(e) => updateTheme(e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className="form-group mb-4">
              <label htmlFor="selectHost" className="form-label mb-0">
                Hostname
              </label>
              <input
                id="selectHost"
                type="text"
                className="form-control"
                value={state.hostname}
                onChange={(e) => setState({ ...state, hostname: e.target.value })}
              />
              <span className="text-secondary">
                Optional name of local machine. By default &apos;Unknown Hostname&apos;.
              </span>
            </div>

            <div className="form-group mb-4">
              <label htmlFor="apiUrl" className="form-label mb-0">
                API Url
              </label>

              <input
                id="apiUrl"
                type="text"
                className="form-control"
                value={state.apiUrl}
                onChange={(e) => setState({ ...state, apiUrl: e.target.value })}
                placeholder="https://api.wakatime.com/api/v1"
              />
              <span className="help-block">https://api.wakatime.com/api/v1</span>
            </div>

            <div className="form-group mb-4">
              <div className="d-grid gap-2 col-6 ">
                <button
                  type="button"
                  className={`btn btn-primary ${state.loading ? 'disabled' : ''}`}
                  disabled={state.loading}
                  data-loading-text="Loading..."
                  onClick={handleSubmit}
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
