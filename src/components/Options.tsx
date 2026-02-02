import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import config, { SuccessOrFailType } from '../config/config';
import apiKeyInvalid from '../utils/apiKey';
import { IS_CHROME } from '../utils/operatingSystem';
import { getSettings, ProjectName, saveSettings, Settings } from '../utils/settings';
import { logUserIn } from '../utils/user';
import CustomProjectNameList from './CustomProjectNameList';
import SitesList from './SitesList';

interface State extends Settings {
  alertText: string;
  alertType: SuccessOrFailType;
  loading: boolean;
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
    theme: config.theme,
  });

  const isApiKeyValid = useMemo(() => apiKeyInvalid(state.apiKey) === '', [state.apiKey]);

  const restoreSettings = useCallback(async () => {
    const settings = await getSettings();
    setState((oldState) => ({
      ...oldState,
      ...settings,
    }));
  }, []);

  useEffect(() => {
    void restoreSettings();
  }, [restoreSettings]);

  const handleSubmit = async () => {
    if (state.loading) return;
    setState((oldState) => ({ ...oldState, loading: true }));
    await saveSettings({
      allowList: state.allowList.filter((item) => !!item.trim()),
      apiKey: state.apiKey,
      apiUrl: state.apiUrl,
      customProjectNames: state.customProjectNames.filter(
        (item) => !!item.url.trim() && !!item.projectName.trim(),
      ),
      extensionStatus: state.extensionStatus,
      hostname: state.hostname,
      loggingEnabled: state.loggingEnabled,
      loggingStyle: state.loggingStyle,
      loggingType: state.loggingType,
      theme: state.theme,
    });
    setState(state);
    await logUserIn(state.apiKey);
    if (IS_CHROME) {
      window.close();
    }
  };

  const updateAllowListState = useCallback((allowList: string[]) => {
    setState((oldState) => ({
      ...oldState,
      allowList,
    }));
  }, []);

  const updateCustomProjectNamesState = useCallback((customProjectNames: ProjectName[]) => {
    setState((oldState) => ({
      ...oldState,
      customProjectNames,
    }));
  }, []);


  const updateTheme = useCallback((theme: string) => {
    setState((oldState) => ({
      ...oldState,
      theme: theme === 'light' ? 'light' : 'dark',
    }));
  }, []);

  const allowedSitesList = useMemo(() => {
    return (
      <SitesList
        handleChange={updateAllowListState}
        label="Allowed Sites"
        sites={state.allowList}
        projectNamePlaceholder="http://google.com&#10;http://myproject.com/MyProject"
        helpText="Only these sites will be tracked."
      />
    );
  }, [state.allowList, updateAllowListState]);

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

            {allowedSitesList}

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

            <CustomProjectNameList
              sites={state.customProjectNames}
              label="Custom Project Names"
              handleChange={updateCustomProjectNamesState}
              helpText=""
            />

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
