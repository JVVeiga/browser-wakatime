# Arquitetura do Projeto

## Visão Geral

O Browser WakaTime segue uma arquitetura modular baseada em WebExtension API, com separação clara entre:
- **Background Scripts**: Lógica de negócio e processamento de heartbeats
- **Content Scripts**: Detecção de atividade nas páginas
- **UI Components**: Popup e páginas de opções em React
- **State Management**: Redux para gerenciamento de estado
- **Storage Layer**: IndexedDB para fila de heartbeats e browser.storage.sync para configurações

## Estrutura de Diretórios

```
/browser-wakatime/
├── src/
│   ├── components/              # Componentes React (UI)
│   │   ├── WakaTime.tsx        # Container principal do popup
│   │   ├── MainList.tsx        # Conteúdo principal (info do usuário, botões)
│   │   ├── NavBar.tsx          # Barra de navegação e info do usuário
│   │   ├── Options.tsx         # Página de configurações
│   │   ├── Alert.tsx           # Componente de alertas
│   │   ├── CustomProjectNameList.tsx
│   │   ├── SitesList.tsx       # UI de lista de sites
│   │   └── *.test.tsx          # Arquivos de teste
│   │
│   ├── core/
│   │   └── WakaTimeCore.ts     # ⭐ Lógica principal de heartbeats
│   │
│   ├── config/
│   │   └── config.ts           # Configuração da extensão
│   │
│   ├── types/                  # Definições TypeScript
│   │   ├── heartbeats.ts       # Interfaces e enums de heartbeats
│   │   ├── user.ts             # Tipos de dados do usuário
│   │   ├── sites.ts            # Tipos de parsers de sites
│   │   ├── summaries.ts        # Tipos de sumários da API
│   │   └── store.ts            # Tipos do Redux store
│   │
│   ├── reducers/               # Redux reducers
│   │   ├── configReducer.ts    # API key e configurações
│   │   └── currentUser.ts      # Dados do usuário
│   │
│   ├── stores/
│   │   └── createStore.ts      # Factory do Redux store
│   │
│   ├── utils/                  # Utilitários
│   │   ├── settings.ts         # Gerenciamento de configurações
│   │   ├── user.ts             # Autenticação e dados do usuário
│   │   ├── sites.ts            # ⭐ Parsers de sites conhecidos
│   │   ├── getDomainFromUrl.ts # Extração de domínio
│   │   ├── changeExtensionStatus.ts # Gerenciamento de ícone/status
│   │   ├── checkCurrentUser.ts # Verificação periódica do usuário
│   │   ├── apiKey.ts           # Validação de API key
│   │   ├── operatingSystem.ts  # Detecção de browser/OS
│   │   └── [outros utilitários]
│   │
│   ├── html/                   # Páginas HTML
│   │   ├── popup.html          # Entry point do popup
│   │   ├── options.html        # Página de opções
│   │   ├── devtools.html       # Painel DevTools
│   │   └── WakatimeDevPanel.html
│   │
│   ├── manifests/              # Manifestos por navegador
│   │   ├── chrome.json         # Chrome manifest (v3)
│   │   ├── firefox.json        # Firefox manifest (v2)
│   │   └── edge.json           # Edge manifest
│   │
│   ├── background.ts           # ⭐ Service worker / background
│   ├── popup.tsx               # ⭐ Entry point do popup React
│   ├── options.tsx             # ⭐ Entry point das opções React
│   ├── devtools.ts             # ⭐ Entry point do DevTools
│   └── wakatimeScript.ts       # ⭐ Content script
│
├── public/
│   ├── css/app.css             # Estilos compilados
│   ├── fonts/                  # Font Awesome
│   └── js/browser-polyfill.min.js
│
├── dist/                       # Build output
│   ├── chrome/
│   ├── firefox/
│   └── edge/
│
├── assets/sass/app.scss        # Fonte dos estilos SCSS
├── graphics/                   # Ícones e logos
├── tests/                      # Testes adicionais
├── webpack.config.ts           # Configuração de build
├── xclap.ts                    # Task runner
├── jest.config.ts              # Configuração de testes
├── tsconfig.json               # Configuração TypeScript
└── package.json                # Dependências
```

## Padrões de Design

### 1. Singleton Pattern

**WakaTimeCore** ([src/core/WakaTimeCore.ts](../src/core/WakaTimeCore.ts))

```typescript
class WakaTimeCore {
  // Única instância gerenciando todas as operações de heartbeat
}

export default new WakaTimeCore();
```

**Responsabilidades:**
- Gerenciamento de heartbeats
- Rate limiting (2 minutos entre heartbeats)
- Fila de heartbeats (IndexedDB)
- Envio para API
- Filtragem de sites

### 2. Redux Pattern

**State Management Centralizado:**

```
Actions → Reducers → Store → Components
```

**Reducers:**
- `configReducer`: API key, logging enabled, tempo total
- `currentUser`: Dados do usuário, estado de loading, erros

**Features:**
- Redux batching para múltiplas actions
- Redux Logger para debugging
- Redux DevTools support
- Preloaded state initialization

### 3. Pub-Sub / Event Listener Pattern

**Browser Events:**

```typescript
// background.ts
browser.tabs.onActivated.addListener(handleActivity);
browser.windows.onFocusChanged.addListener(handleActivity);
browser.runtime.onMessage.addListener(handleMessages);
browser.alarms.onAlarm.addListener(sendHeartbeats);
```

**Comunicação entre Scripts:**

```typescript
// wakatimeScript.ts → background.ts
browser.runtime.sendMessage({ task: 'handleActivity' });
```

### 4. Factory Pattern

**Redux Store Factory:**

```typescript
// stores/createStore.ts
export const createStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: {...},
    middleware: [...],
    preloadedState
  });
};
```

**Site Parser Lookup:**

```typescript
// utils/sites.ts
export const getSite = (url: string): HeartbeatParser | null => {
  // Retorna parser apropriado baseado na URL
};
```

### 5. Strategy Pattern

**Múltiplas implementações de `HeartbeatParser`:**

```typescript
interface HeartbeatParser {
  parseFromPage(): OptionalHeartbeat;
}

// Implementações específicas:
- GitHubHeartbeatParser
- GitLabHeartbeatParser
- FigmaHeartbeatParser
- SlackHeartbeatParser
// ... 13+ parsers
```

Seleção dinâmica baseada na URL.

### 6. Queue Pattern

**Fila de Heartbeats:**

```
User Activity
    ↓
Create Heartbeat
    ↓
Add to IndexedDB Queue
    ↓
Periodic Alarm (2 min)
    ↓
Batch Send to API
    ↓
Remove from Queue (on success)
    ↓
Re-queue (on failure)
```

### 7. Decorator/Wrapper Pattern

**Debounce Wrapper:**

```typescript
const debouncedSendHeartbeat = debounce(sendHeartbeat, 60000);
```

**Browser API Polyfill:**

```typescript
import Browser from 'webextension-polyfill';
// Wrapper unificado para APIs do Chrome/Firefox/Edge
```

## Entry Points (5 Builds Separados)

### 1. background.ts → background.js

**Service Worker / Background Page**

```typescript
// Eventos do navegador
browser.tabs.onActivated.addListener();
browser.windows.onFocusChanged.addListener();

// Alarme periódico (2 minutos)
browser.alarms.create('heartbeats', { periodInMinutes: 2 });
browser.alarms.onAlarm.addListener(sendHeartbeats);

// Keep-alive (Manifest V3)
setInterval(() => browser.runtime.getPlatformInfo(), 20000);
```

### 2. popup.tsx → popup.js

**React App para Popup:**

```typescript
ReactDOM.createRoot(root).render(
  <Provider store={store}>
    <WakaTime />
  </Provider>
);
```

### 3. options.tsx → options.js

**React App para Página de Opções:**

```typescript
ReactDOM.createRoot(root).render(
  <Provider store={store}>
    <Options />
  </Provider>
);
```

### 4. wakatimeScript.ts → wakatimeScript.js

**Content Script (Injetado em todas as páginas):**

```typescript
// Detecta atividade do usuário
document.addEventListener('click', handleActivity);
document.addEventListener('keypress', handleActivity);

// Envia mensagem para background
browser.runtime.sendMessage({ task: 'handleActivity' });

// Debounce: 1 min mínimo, 5 min máximo
```

### 5. devtools.ts → devtools.js

**DevTools Panel:**

```typescript
browser.devtools.panels.create(
  'WakaTime',
  'assets/graphics/wakatime-logo-48.png',
  'html/WakatimeDevPanel.html'
);
```

## Fluxo de Controle Principal

### Ciclo de Vida do Heartbeat

```
1. Atividade do Usuário (click/keypress na página)
       ↓
2. wakatimeScript.ts detecta e envia mensagem
       ↓
3. background.ts recebe via onMessage
       ↓
4. WakaTimeCore.handleActivity(tabId)
       ↓
5. Extração de dados da tab (URL, título)
       ↓
6. Parsing específico do site (getSite())
       ↓
7. Construção do objeto heartbeat
       ↓
8. Verificação de rate limiting (shouldSendHeartbeat)
       ↓ (se passou 2+ minutos)
9. Validação contra allow/deny lists (canSendHeartbeat)
       ↓ (se permitido)
10. Adição à fila IndexedDB
       ↓
11. Alarme periódico dispara (2 minutos)
       ↓
12. WakaTimeCore.sendHeartbeats()
       ↓
13. Batch de heartbeats da fila
       ↓
14. POST para /heartbeats.bulk
       ↓
15. Processar resposta (201/202)
       ↓ (sucesso)
16. Remover da fila
       ↓ (falha)
17. Re-queue para retry
```

## Camadas da Arquitetura

### Layer 1: Browser Events

- Tab switches
- Window focus changes
- User interactions (clicks, keypresses)
- Periodic alarms

### Layer 2: Event Handlers

- [background.ts](../src/background.ts): Central event processor
- [wakatimeScript.ts](../src/wakatimeScript.ts): Page-level activity detector

### Layer 3: Business Logic

- [WakaTimeCore.ts](../src/core/WakaTimeCore.ts): Heartbeat management
- [sites.ts](../src/utils/sites.ts): Site-specific parsing
- Rate limiting, filtering, queuing

### Layer 4: Storage

- **IndexedDB**: Heartbeat queue (offline support)
- **browser.storage.sync**: User settings (cross-device sync)

### Layer 5: API Integration

- [WakaTime API](https://wakatime.com/api): Heartbeat submission, user data, summaries
- Axios for HTTP requests
- Retry logic on failures

### Layer 6: UI

- **React Components**: Popup, Options page
- **Redux Store**: Centralized state
- **Bootstrap**: Styling

## Comunicação entre Componentes

### Content Script ↔ Background Script

**Mensagem de Atividade:**

```typescript
// wakatimeScript.ts
browser.runtime.sendMessage({
  task: 'handleActivity',
  isPassiveActivity: boolean
});
```

**Requisição de Heartbeat da Página:**

```typescript
// background.ts
const response = await browser.tabs.sendMessage(tabId, {
  task: 'getHeartbeatFromPage',
  url: tab.url
});

// wakatimeScript.ts responde com:
{ heartbeat: OptionalHeartbeat }
```

### UI ↔ Storage

```typescript
// Ler configurações
const settings = await getSettings();

// Salvar configurações
await saveSettings({ apiKey: '...', loggingEnabled: true });
```

### UI ↔ Redux

```typescript
// Dispatch action
dispatch(fetchCurrentUser(apiKey));

// Select state
const user = useSelector((state: RootState) => state.currentUser.user);
```

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser Layer                          │
│  (Tabs, Windows, Events, Storage, Alarms)                   │
└─────────────────────────────┬───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Content Script│   │  Background   │   │   Popup/UI    │
│wakatimeScript │   │  background   │   │ popup/options │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        │  sendMessage()    │                   │
        └──────────────────►│                   │
                            │                   │
                    ┌───────▼───────┐           │
                    │ WakaTimeCore  │           │
                    │   (Singleton) │           │
                    └───────┬───────┘           │
                            │                   │
                    ┌───────▼───────┐           │
                    │  Site Parsers │           │
                    │   (Strategy)  │           │
                    └───────┬───────┘           │
                            │                   │
        ┌───────────────────┴───────────────┐   │
        ▼                                   ▼   │
┌───────────────┐                   ┌───────────────┐
│   IndexedDB   │                   │ Redux Store   │
│ (Heartbeats)  │                   │  (Settings)   │
└───────┬───────┘                   └───────┬───────┘
        │                                   │
        │                                   │
        └───────────────┬───────────────────┘
                        │
                ┌───────▼───────┐
                │  browser.     │
                │  storage.sync │
                └───────┬───────┘
                        │
                ┌───────▼───────┐
                │  WakaTime API │
                │ (External)    │
                └───────────────┘
```

## Considerações de Segurança

### Permissões

- **`tabs`**: Acesso a URLs e títulos das tabs
- **`storage`**: Armazenamento de configurações
- **`alarms`**: Tarefas periódicas
- **`<all_urls>`** ou hosts específicos: Injeção de content script

### Validações

- Validação de API key antes de envio
- Sanitização de URLs e domínios
- Verificação de allow/deny lists
- Rate limiting para prevenir spam

### Dados Sensíveis

- API key armazenada em `browser.storage.sync` (encriptado pelo navegador)
- Heartbeats podem conter URLs privadas (respeitando configurações do usuário)
- Sem armazenamento de senhas ou tokens de terceiros

## Performance

### Otimizações

- **Rate Limiting**: Máximo 1 heartbeat por 2 minutos por site
- **Batch API Calls**: Envio de múltiplos heartbeats em uma requisição
- **IndexedDB**: Armazenamento eficiente de fila offline
- **Debouncing**: Evita múltiplas detecções de atividade
- **Keep-Alive Minimal**: Polling leve para Manifest V3

### Considerações de Memória

- Fila limitada de heartbeats
- Limpeza periódica de heartbeats antigos
- Redux state mínimo
- Lazy loading de componentes

---

**Última atualização:** 2026-02-02
