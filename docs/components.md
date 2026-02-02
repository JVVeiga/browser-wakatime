# Componentes e Módulos

## Componentes React

### Popup Components

#### WakaTime.tsx

**Localização:** [src/components/WakaTime.tsx](../src/components/WakaTime.tsx)

**Responsabilidade:** Container principal do popup da extensão

**Features:**
- Gerencia estado da URL da tab atual
- Exibe alertas de status
- Renderiza componentes filhos (NavBar, MainList)
- Verifica estado de autenticação

**Estrutura:**
```tsx
<div className="container">
  <NavBar />
  <Alert />
  <MainList currentPageUrl={url} />
</div>
```

**State:**
- `currentPageUrl`: URL da tab ativa
- `showAlert`: Controla exibição de alertas

#### NavBar.tsx

**Localização:** [src/components/NavBar.tsx](../src/components/NavBar.tsx)

**Responsabilidade:** Barra de navegação com informações do usuário

**Features:**
- Exibe "Signed in as [username]"
- Link para dashboard WakaTime
- Link para regras customizadas
- Dropdown "About" com links úteis:
  - GitHub repository
  - Report issues
  - WakaTime website

**Redux Integration:**
```typescript
const user = useSelector((state: RootState) => state.currentUser.user);
```

**Links:**
- Dashboard: `https://wakatime.com/dashboard`
- Custom Rules: `https://wakatime.com/settings/preferences`
- GitHub: `https://github.com/wakatime/browser-wakatime`

#### MainList.tsx

**Localização:** [src/components/MainList.tsx](../src/components/MainList.tsx)

**Responsabilidade:** Conteúdo principal do popup

**Features:**
- Exibe tempo total logado hoje
- Botão "Ignore current site" (quick action)
- Botão Login/Logout
- Toggle Enable/Disable logging
- Link para página de opções

**Props:**
```typescript
interface Props {
  currentPageUrl: string;
}
```

**Actions:**
- `handleIgnoreSite()`: Adiciona site à deny list
- `handleLogin()`: Redireciona para login WakaTime
- `handleLogout()`: Remove API key e desloga
- `handleToggleLogging()`: Enable/disable tracking

**Redux Integration:**
```typescript
const { loggingEnabled, totalTimeLoggedToday } = useSelector(
  (state: RootState) => state.configReducer
);
```

#### Alert.tsx

**Localização:** [src/components/Alert.tsx](../src/components/Alert.tsx)

**Responsabilidade:** Componente de alerta reutilizável

**Props:**
```typescript
interface AlertProps {
  show: boolean;
  type: 'success' | 'danger';
  message: string;
  onClick?: () => void;
}
```

**Styling:** Bootstrap alerts com classes `alert-success` e `alert-danger`

### Options Components

#### Options.tsx

**Localização:** [src/components/Options.tsx](../src/components/Options.tsx)

**Responsabilidade:** Página de configurações completa

**Sections:**

1. **API Key**
   - Input para WakaTime API key
   - Validação e salvamento
   - Fetch automático via cookies

2. **Logging Style**
   - Radio buttons:
     - "All except excluded" (default)
     - "Only allowed"

3. **Logging Type**
   - Radio buttons:
     - "Domain" (example.com)
     - "Full URL" (example.com/path)

4. **Theme**
   - Select dropdown:
     - Light
     - Dark

5. **Hostname**
   - Input para identificação da máquina

6. **API URL**
   - Input para servidor customizado
   - Default: `https://api.wakatime.com/api/v1`

7. **Custom Project Names**
   - Mapeamento URL pattern → Project name
   - Component: `CustomProjectNameList`

8. **Sites Lists**
   - Allow list / Deny list (baseado no logging style)
   - Social media sites toggle
   - Component: `SitesList`

**State Management:**
```typescript
const [settings, setSettings] = useState<UserSettings>({
  apiKey: '',
  loggingEnabled: true,
  loggingStyle: 'allow',
  loggingType: 'domain',
  theme: 'light',
  hostname: '',
  apiUrl: API_URL,
  allowList: '',
  denyList: '',
  socialMediaSites: '',
  trackSocialMedia: false,
  customProjectNames: []
});
```

**Persistence:**
```typescript
await saveSettings(settings);
```

#### SitesList.tsx

**Localização:** [src/components/SitesList.tsx](../src/components/SitesList.tsx)

**Responsabilidade:** Editor de lista de sites (allow/deny)

**Props:**
```typescript
interface SitesListProps {
  sites: string;
  onChange: (sites: string) => void;
  label: string;
  placeholder: string;
}
```

**Features:**
- Textarea com lista de domínios (um por linha)
- Preview de sites parseados
- Validação básica

**Format:**
```
example.com
*.github.com
subdomain.site.org
```

#### CustomProjectNameList.tsx

**Localização:** [src/components/CustomProjectNameList.tsx](../src/components/CustomProjectNameList.tsx)

**Responsabilidade:** Gerenciamento de mapeamento URL → Project

**State:**
```typescript
interface CustomProjectName {
  pattern: string;
  projectName: string;
}
```

**Features:**
- Adicionar novos mapeamentos
- Editar existentes
- Remover mapeamentos
- Validação de padrões

**Example:**
```
Pattern: *.figma.com/file/abc123/*
Project: My Design Project
```

## Core Modules

### WakaTimeCore.ts

**Localização:** [src/core/WakaTimeCore.ts](../src/core/WakaTimeCore.ts)

**Pattern:** Singleton

**Responsabilidade:** Lógica principal de heartbeats

#### Principais Métodos

##### handleActivity(tabId: number)

Captura atividade do navegador e cria heartbeat.

```typescript
public async handleActivity(tabId: number, isPassiveActivity = false): Promise<void> {
  const tab = await browser.tabs.get(tabId);
  const heartbeat = await this.buildHeartbeat(tab, isPassiveActivity);

  if (this.canSendHeartbeat(heartbeat) && this.shouldSendHeartbeat(heartbeat)) {
    await this.addHeartbeatToQueue(heartbeat);
  }
}
```

##### buildHeartbeat(tab, isPassiveActivity)

Constrói objeto heartbeat a partir de dados da tab.

```typescript
private async buildHeartbeat(
  tab: Tabs.Tab,
  isPassiveActivity: boolean
): Promise<Heartbeat> {
  // 1. Extrai URL e domínio
  const url = tab.url || '';
  const domain = getDomainFromUrl(url);

  // 2. Tenta parsing específico do site
  const optionalHeartbeat = await this.getHeartbeatFromPage(tab.id, url);

  // 3. Determina categoria
  const category = this.determineCategory(url, optionalHeartbeat);

  // 4. Constrói heartbeat final
  return {
    entity: optionalHeartbeat?.entity || domain,
    timestamp: Date.now() / 1000,
    type: optionalHeartbeat?.type || 'domain',
    category,
    project: optionalHeartbeat?.project,
    language: optionalHeartbeat?.language,
    is_write: !isPassiveActivity
  };
}
```

##### canSendHeartbeat(heartbeat)

Valida heartbeat contra allow/deny lists.

```typescript
private canSendHeartbeat(heartbeat: Heartbeat): boolean {
  const settings = await getSettings();
  const { loggingStyle, allowList, denyList } = settings;

  if (loggingStyle === 'allow') {
    return isInList(heartbeat.entity, allowList);
  } else {
    return !isInList(heartbeat.entity, denyList);
  }
}
```

##### shouldSendHeartbeat(heartbeat)

Rate limiting: mínimo 2 minutos entre heartbeats.

```typescript
private shouldSendHeartbeat(heartbeat: Heartbeat): boolean {
  const lastHeartbeat = this.lastHeartbeatByEntity.get(heartbeat.entity);

  if (!lastHeartbeat) return true;

  const timeDiff = heartbeat.timestamp - lastHeartbeat.timestamp;
  return timeDiff >= 120; // 2 minutos
}
```

##### sendHeartbeats()

Envia batch de heartbeats para API.

```typescript
public async sendHeartbeats(): Promise<void> {
  const settings = await getSettings();
  const heartbeats = await this.getHeartbeatsFromQueue();

  if (heartbeats.length === 0) return;

  try {
    const response = await axios.post(
      HEARTBEAT_API_URL,
      heartbeats,
      { params: { api_key: settings.apiKey } }
    );

    if (response.status === 201 || response.status === 202) {
      await this.removeHeartbeatsFromQueue(heartbeats);
    }
  } catch (error) {
    console.error('Failed to send heartbeats:', error);
    // Re-queue automático (heartbeats permanecem na fila)
  }
}
```

##### db()

Gerencia conexão IndexedDB.

```typescript
private async db(): Promise<IDBPDatabase> {
  if (!this.dbInstance) {
    this.dbInstance = await openDB('wakatime', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('heartbeats')) {
          db.createObjectStore('heartbeats', {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      }
    });
  }
  return this.dbInstance;
}
```

## Redux Store

### createStore.ts

**Localização:** [src/stores/createStore.ts](../src/stores/createStore.ts)

**Responsabilidade:** Factory do Redux store

**Configuration:**
```typescript
export const createStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      configReducer,
      currentUser: currentUserReducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(logger),
    preloadedState: preloadedState as RootState
  });
};
```

**Middleware:**
- Redux Logger (apenas em development)
- Redux Thunk (incluído no toolkit)

### Reducers

#### configReducer.ts

**Localização:** [src/reducers/configReducer.ts](../src/reducers/configReducer.ts)

**State:**
```typescript
interface ConfigState {
  apiKey: string;
  loggingEnabled: boolean;
  totalTimeLoggedToday: number;
}
```

**Actions:**
- `setApiKey(apiKey: string)`
- `setLoggingEnabled(enabled: boolean)`
- `setTotalTimeLoggedToday(time: number)`

**Usage:**
```typescript
dispatch(configActions.setApiKey('waka_...'));
```

#### currentUser.ts

**Localização:** [src/reducers/currentUser.ts](../src/reducers/currentUser.ts)

**State:**
```typescript
interface CurrentUserState {
  user: User | null;
  pending: boolean;
  error: string | null;
}
```

**Async Thunks:**
```typescript
export const fetchCurrentUser = createAsyncThunk(
  'currentUser/fetchCurrentUser',
  async (apiKey: string) => {
    const response = await getCurrentUser(apiKey);
    return response.data;
  }
);
```

**Usage:**
```typescript
dispatch(fetchCurrentUser(apiKey));
```

## Utility Modules

### settings.ts

**Localização:** [src/utils/settings.ts](../src/utils/settings.ts)

**Responsabilidade:** Gerenciamento de configurações persistentes

**Main Functions:**

```typescript
export const getSettings = async (): Promise<UserSettings> => {
  const data = await browser.storage.sync.get();
  return {
    apiKey: data.apiKey || '',
    loggingEnabled: data.loggingEnabled ?? true,
    loggingStyle: data.loggingStyle || 'deny',
    loggingType: data.loggingType || 'domain',
    // ... outros campos com valores default
  };
};

export const saveSettings = async (settings: Partial<UserSettings>): Promise<void> => {
  await browser.storage.sync.set(settings);
};
```

**Backward Compatibility:**
- Migra `whitelist` → `allowList`
- Migra `blacklist` → `denyList`

### user.ts

**Localização:** [src/utils/user.ts](../src/utils/user.ts)

**Responsabilidade:** Autenticação e dados do usuário

**Main Functions:**

```typescript
export const getCurrentUser = async (apiKey: string): Promise<AxiosResponse<User>> => {
  return axios.get(CURRENT_USER_API_URL, {
    params: { api_key: apiKey }
  });
};

export const fetchUserDataFromApi = async (apiKey: string): Promise<void> => {
  const response = await getCurrentUser(apiKey);
  // Atualiza Redux store
  store.dispatch(currentUserActions.setUser(response.data));
};

export const getDailySummary = async (
  apiKey: string,
  date: string
): Promise<DailySummary> => {
  const response = await axios.get(SUMMARIES_API_URL, {
    params: {
      api_key: apiKey,
      start: date,
      end: date
    }
  });
  return response.data;
};
```

### sites.ts

**Localização:** [src/utils/sites.ts](../src/utils/sites.ts)

**Responsabilidade:** Parsers específicos de plataformas conhecidas

**Interface:**
```typescript
export interface HeartbeatParser {
  parseFromPage(): OptionalHeartbeat;
}

export type OptionalHeartbeat = {
  entity?: string;
  type?: EntityType;
  category?: Category;
  project?: string;
  language?: string;
} | null;
```

**Site Parsers:**

#### 1. GitHub
```typescript
class GitHubHeartbeatParser implements HeartbeatParser {
  parseFromPage(): OptionalHeartbeat {
    // Extrai owner/repo da URL
    // Detecta linguagem do arquivo
    // Identifica PRs, issues, etc.
    return {
      project: 'owner/repo',
      language: 'TypeScript',
      category: 'coding'
    };
  }
}
```

#### 2. GitLab
```typescript
class GitLabHeartbeatParser implements HeartbeatParser {
  parseFromPage(): OptionalHeartbeat {
    // Similar ao GitHub
    // Suporta GitLab.com e instâncias self-hosted
  }
}
```

#### 3. Figma
```typescript
class FigmaHeartbeatParser implements HeartbeatParser {
  parseFromPage(): OptionalHeartbeat {
    return {
      category: 'designing',
      project: 'Extracted from page title'
    };
  }
}
```

#### 4. Slack
```typescript
class SlackHeartbeatParser implements HeartbeatParser {
  parseFromPage(): OptionalHeartbeat {
    return {
      category: 'communicating',
      entity: 'Slack',
      type: 'app'
    };
  }
}
```

#### 5. Zoom / Google Meet / Teams
```typescript
class MeetingHeartbeatParser implements HeartbeatParser {
  parseFromPage(): OptionalHeartbeat {
    return {
      category: 'communicating',
      entity: 'Meeting',
      type: 'app'
    };
  }
}
```

**Outros Parsers:**
- BitBucket
- Travis CI
- CircleCI
- Vercel
- Canva
- Stack Overflow
- Azure DevOps

**Lookup Function:**
```typescript
export const getSite = (url: string): HeartbeatParser | null => {
  if (url.includes('github.com')) return new GitHubHeartbeatParser();
  if (url.includes('gitlab.com')) return new GitLabHeartbeatParser();
  if (url.includes('figma.com')) return new FigmaHeartbeatParser();
  // ... outros sites
  return null;
};
```

### changeExtensionStatus.ts

**Localização:** [src/utils/changeExtensionStatus.ts](../src/utils/changeExtensionStatus.ts)

**Responsabilidade:** Gerenciamento de ícone e badge da extensão

**Status Types:**
```typescript
type ExtensionStatus =
  | 'allGood'           // Verde (default)
  | 'trackingDisabled'  // Cinza
  | 'notSignedIn'       // Vermelho
  | 'ignored';          // Amarelo
```

**Function:**
```typescript
export const changeExtensionStatus = async (status: ExtensionStatus): Promise<void> => {
  const iconPath = getIconPath(status);
  const title = getTitle(status);

  await browser.action.setIcon({ path: iconPath });
  await browser.action.setTitle({ title });

  if (status === 'ignored') {
    await browser.action.setBadgeText({ text: '⊘' });
  } else {
    await browser.action.setBadgeText({ text: '' });
  }
};
```

### Other Utilities

#### getDomainFromUrl.ts
```typescript
export const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
};
```

#### apiKey.ts
```typescript
export const isValidApiKey = (apiKey: string): boolean => {
  return /^waka_[a-zA-Z0-9]{32,}$/.test(apiKey);
};
```

#### operatingSystem.ts
```typescript
export const getBrowserName = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edg')) return 'Edge';
  return 'Chrome';
};
```

## Entry Point Scripts

### background.ts

**Localização:** [src/background.ts](../src/background.ts)

**Responsabilidade:** Service worker / Background page

**Event Listeners:**
```typescript
// Tab switches
browser.tabs.onActivated.addListener(handleActivity);

// Window focus changes
browser.windows.onFocusChanged.addListener(handleActivity);

// Messages from content scripts
browser.runtime.onMessage.addListener(handleMessages);

// Periodic alarm
browser.alarms.onAlarm.addListener(sendHeartbeats);
```

**Initialization:**
```typescript
// Create periodic alarm
browser.alarms.create('heartbeats', { periodInMinutes: 2 });

// Keep-alive for Manifest V3
setInterval(() => {
  browser.runtime.getPlatformInfo();
}, 20000);
```

### wakatimeScript.ts

**Localização:** [src/wakatimeScript.ts](../src/wakatimeScript.ts)

**Responsabilidade:** Content script (injetado em páginas)

**Activity Detection:**
```typescript
let activityDetected = false;
let lastActivityTime = 0;

const handleActivity = () => {
  activityDetected = true;

  // Debounce: 1 min mínimo, 5 min máximo
  const now = Date.now();
  const timeSinceLastActivity = now - lastActivityTime;

  if (timeSinceLastActivity > 60000) { // 1 minuto
    sendHeartbeat(false); // Active activity
    lastActivityTime = now;
  }
};

// Event listeners
document.addEventListener('click', handleActivity);
document.addEventListener('keypress', handleActivity);

// Passive activity check (5 min máximo)
setInterval(() => {
  if (activityDetected) {
    sendHeartbeat(true); // Passive activity
    activityDetected = false;
  }
}, 300000); // 5 minutos
```

**Message Handler:**
```typescript
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.task === 'getHeartbeatFromPage') {
    const site = getSite(message.url);
    const heartbeat = site ? site.parseFromPage() : null;
    sendResponse({ heartbeat });
  }
});
```

---

**Última atualização:** 2026-02-02
