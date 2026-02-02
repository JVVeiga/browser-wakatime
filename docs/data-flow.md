# Fluxo de Dados e APIs

## Visão Geral

O Browser WakaTime gerencia três fluxos principais de dados:

1. **Heartbeat Flow**: Captura de atividade → Fila → Envio para API
2. **User Data Flow**: Autenticação → Fetch de dados → Armazenamento no Redux
3. **Settings Flow**: UI → browser.storage.sync → Leitura em tempo de execução

## Fluxo de Heartbeats

### Diagrama Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    User Activity                             │
│              (click, keypress, tab switch)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Content Script (wakatimeScript.ts)              │
│  - Detecta atividade na página                              │
│  - Debounce: 1 min mínimo, 5 min máximo                    │
│  - Passive vs Active activity                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ browser.runtime.sendMessage()
                         │ { task: 'handleActivity' }
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Background Script (background.ts)               │
│  - Recebe mensagem via onMessage listener                   │
│  - Identifica tab ativa                                      │
│  - Delega para WakaTimeCore                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ handleActivity(tabId)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  WakaTimeCore.handleActivity()               │
│  1. Busca dados da tab (URL, título)                       │
│  2. Tenta parsing específico do site                        │
│  3. Constrói objeto heartbeat                               │
│  4. Valida contra allow/deny lists                          │
│  5. Verifica rate limiting (2 min)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Site-Specific Parsing (Optional)              │
│                                                              │
│  getSite(url) → HeartbeatParser?                            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  GitHub      │  │  GitLab      │  │  Figma       │     │
│  │  Parser      │  │  Parser      │  │  Parser      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Returns: { project, language, category, ... }              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Build Heartbeat Object                       │
│                                                              │
│  {                                                           │
│    entity: "github.com/owner/repo" | "example.com",        │
│    timestamp: 1234567890.123,                               │
│    type: "domain" | "app" | "file",                        │
│    category: "coding" | "browsing" | "designing", ...      │
│    project: "owner/repo",                                   │
│    language: "TypeScript",                                  │
│    is_write: true | false                                   │
│  }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Validation Checks                           │
│                                                              │
│  1. canSendHeartbeat() - Allow/Deny list check             │
│  2. shouldSendHeartbeat() - Rate limiting (2 min)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ (if valid)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   IndexedDB Queue                            │
│                                                              │
│  db.add('heartbeats', { ...heartbeat, id: uuid() })        │
│                                                              │
│  Queue persiste offline até envio bem-sucedido             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ (aguarda alarme periódico)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Periodic Alarm (2 minutos)                      │
│                                                              │
│  browser.alarms.onAlarm → sendHeartbeats()                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              WakaTimeCore.sendHeartbeats()                   │
│                                                              │
│  1. Busca todos heartbeats da fila (getHeartbeatsFromQueue)│
│  2. Agrupa em batch (max 100)                               │
│  3. Envia POST para /heartbeats.bulk                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ POST /users/current/heartbeats.bulk
                         │ Body: [{ entity, timestamp, ... }]
                         │ Params: { api_key: "waka_..." }
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    WakaTime API                              │
│                                                              │
│  Response:                                                   │
│  - 201 Created (sucesso)                                    │
│  - 202 Accepted (processamento assíncrono)                  │
│  - 401 Unauthorized (API key inválida)                     │
│  - 400 Bad Request (dados inválidos)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Handle Response                             │
│                                                              │
│  Success (201/202):                                         │
│    - Remove heartbeats da fila                              │
│    - Atualiza lastHeartbeatByEntity cache                   │
│                                                              │
│  Error (4xx/5xx):                                           │
│    - Mantém heartbeats na fila                              │
│    - Retry no próximo alarme                                │
│    - Log error para debugging                               │
└─────────────────────────────────────────────────────────────┘
```

### Detalhes por Etapa

#### 1. Detecção de Atividade

**Eventos Monitados:**
- `click` em qualquer elemento da página
- `keypress` em inputs/textareas
- `tabs.onActivated` (troca de tab)
- `windows.onFocusChanged` (mudança de janela)

**Debouncing:**
- **Mínimo**: 1 minuto entre heartbeats de atividade ativa
- **Máximo**: 5 minutos de inatividade força passive heartbeat

```typescript
// wakatimeScript.ts
let lastActivityTime = 0;

const handleActivity = () => {
  const now = Date.now();
  const timeSince = now - lastActivityTime;

  if (timeSince > 60000) { // 1 min
    sendHeartbeat(false); // is_write = true
    lastActivityTime = now;
  }
};

// Passive check
setInterval(() => {
  if (activityDetected) {
    sendHeartbeat(true); // is_write = false
    activityDetected = false;
  }
}, 300000); // 5 min
```

#### 2. Construção do Heartbeat

**Dados Extraídos:**

```typescript
interface Heartbeat {
  entity: string;          // URL, domínio, ou identificador
  timestamp: number;       // Unix timestamp (segundos)
  type: EntityType;        // "domain" | "app" | "file"
  category: Category;      // "coding" | "browsing" | etc.
  project?: string;        // Nome do projeto (se detectado)
  language?: string;       // Linguagem de programação
  is_write: boolean;       // true = ativo, false = passivo
}
```

**Categorias Disponíveis:**

```typescript
enum Category {
  CODING = 'coding',
  BROWSING = 'browsing',
  BUILDING = 'building',
  INDEXING = 'indexing',
  DEBUGGING = 'debugging',
  RUNNING_TESTS = 'running tests',
  WRITING_TESTS = 'writing tests',
  MANUAL_TESTING = 'manual testing',
  WRITING_DOCS = 'writing docs',
  CODE_REVIEWING = 'code reviewing',
  COMMUNICATING = 'communicating',
  DESIGNING = 'designing',
  LEARNING = 'learning'
}
```

#### 3. Rate Limiting

**Regras:**
- Mínimo 2 minutos entre heartbeats para mesma entidade
- Cache em memória: `Map<entity, lastTimestamp>`

```typescript
private shouldSendHeartbeat(heartbeat: Heartbeat): boolean {
  const last = this.lastHeartbeatByEntity.get(heartbeat.entity);

  if (!last) return true;

  const diff = heartbeat.timestamp - last.timestamp;
  return diff >= 120; // 2 minutos
}
```

#### 4. Fila IndexedDB

**Schema:**

```typescript
Database: 'wakatime'
Version: 1

Object Store: 'heartbeats'
  keyPath: 'id' (auto-increment)

Record:
  {
    id: number,
    entity: string,
    timestamp: number,
    type: string,
    category: string,
    project?: string,
    language?: string,
    is_write: boolean
  }
```

**Operations:**

```typescript
// Adicionar
await db.add('heartbeats', heartbeat);

// Buscar todos
const all = await db.getAll('heartbeats');

// Remover
await db.delete('heartbeats', id);

// Limpar fila
await db.clear('heartbeats');
```

## WakaTime API Integration

### Base URL

```
https://api.wakatime.com/api/v1
```

**Customizável via settings:** `apiUrl`

### Endpoints

#### 1. POST /users/current/heartbeats.bulk

**Purpose:** Enviar batch de heartbeats

**Authentication:** API key via query parameter

**Request:**
```http
POST /users/current/heartbeats.bulk?api_key=waka_xxx
Content-Type: application/json

[
  {
    "entity": "github.com/owner/repo",
    "timestamp": 1234567890.123,
    "type": "domain",
    "category": "coding",
    "project": "owner/repo",
    "language": "TypeScript",
    "is_write": true
  },
  ...
]
```

**Response (201):**
```json
{
  "responses": [
    [201, { "id": "...", "message": "created" }],
    [201, { "id": "...", "message": "created" }]
  ]
}
```

**Error Codes:**
- `401`: API key inválida ou expirada
- `400`: Dados inválidos (timestamp, entity vazio, etc.)
- `429`: Rate limit excedido
- `500`: Erro no servidor

#### 2. GET /users/current

**Purpose:** Buscar dados do usuário logado

**Request:**
```http
GET /users/current?api_key=waka_xxx
```

**Response (200):**
```json
{
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "username",
    "full_name": "User Name",
    "photo": "https://...",
    "created_at": "2020-01-01T00:00:00Z",
    "timezone": "America/Los_Angeles"
  }
}
```

#### 3. GET /users/current/summaries

**Purpose:** Buscar sumário de tempo logado

**Request:**
```http
GET /users/current/summaries?api_key=waka_xxx&start=2026-02-01&end=2026-02-02
```

**Response (200):**
```json
{
  "data": [
    {
      "grand_total": {
        "digital": "2:30:45",
        "hours": 2,
        "minutes": 30,
        "seconds": 45,
        "total_seconds": 9045
      },
      "range": {
        "start": "2026-02-01T00:00:00Z",
        "end": "2026-02-02T00:00:00Z"
      },
      "categories": [...],
      "projects": [...],
      "languages": [...]
    }
  ]
}
```

#### 4. POST /users/current/get_api_key

**Purpose:** Obter API key usando cookies de sessão (browser login)

**Request:**
```http
POST /users/current/get_api_key
Cookie: <wakatime session cookies>
```

**Response (200):**
```json
{
  "data": {
    "api_key": "waka_xxx...",
    "created_at": "2020-01-01T00:00:00Z"
  }
}
```

**Usage:** Permite login via OAuth no browser sem copiar API key manualmente

## Browser APIs

### Storage API

#### browser.storage.sync

**Purpose:** Armazenamento sincronizado entre dispositivos

**Used for:**
- API key
- User settings (logging style, logging type)
- Allow/Deny lists
- Custom project names
- Theme preference
- Hostname

**Operations:**

```typescript
// Salvar
await browser.storage.sync.set({
  apiKey: 'waka_xxx',
  loggingEnabled: true,
  theme: 'dark'
});

// Buscar
const data = await browser.storage.sync.get();
// { apiKey: 'waka_xxx', loggingEnabled: true, theme: 'dark' }

// Buscar específico
const { apiKey } = await browser.storage.sync.get('apiKey');

// Remover
await browser.storage.sync.remove('apiKey');

// Limpar tudo
await browser.storage.sync.clear();
```

**Limits:**
- Max 100KB total
- Max 8KB por item
- Max 512 items

### Tabs API

```typescript
// Buscar tab ativa
const [tab] = await browser.tabs.query({
  active: true,
  currentWindow: true
});

// Buscar tab por ID
const tab = await browser.tabs.get(tabId);

// Enviar mensagem para content script
const response = await browser.tabs.sendMessage(tabId, {
  task: 'getHeartbeatFromPage',
  url: tab.url
});

// Event listeners
browser.tabs.onActivated.addListener(({ tabId }) => {
  handleActivity(tabId);
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    handleActivity(tabId);
  }
});
```

### Alarms API

```typescript
// Criar alarme periódico
await browser.alarms.create('heartbeats', {
  periodInMinutes: 2
});

// Criar alarme único
await browser.alarms.create('check-user', {
  delayInMinutes: 0.5
});

// Listener
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'heartbeats') {
    sendHeartbeats();
  }
});

// Buscar alarmes
const alarms = await browser.alarms.getAll();

// Limpar alarme
await browser.alarms.clear('heartbeats');
```

### Runtime API

```typescript
// Enviar mensagem (content → background)
browser.runtime.sendMessage({
  task: 'handleActivity',
  isPassiveActivity: false
});

// Listener (background)
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.task === 'handleActivity') {
    handleActivity(sender.tab.id, message.isPassiveActivity);
  }

  // Async response
  (async () => {
    const result = await processMessage(message);
    sendResponse(result);
  })();

  return true; // Indica resposta assíncrona
});

// Extension metadata
const manifest = browser.runtime.getManifest();
console.log(manifest.version); // "4.1.0"
```

## Protocolo de Mensagens Internas

### Content Script → Background

#### Message: handleActivity

```typescript
{
  task: 'handleActivity',
  isPassiveActivity?: boolean
}
```

**Purpose:** Notifica background script sobre atividade detectada

**Handler:**
```typescript
// background.ts
browser.runtime.onMessage.addListener((msg, sender) => {
  if (msg.task === 'handleActivity') {
    WakaTimeCore.handleActivity(
      sender.tab.id,
      msg.isPassiveActivity || false
    );
  }
});
```

### Background → Content Script

#### Message: getHeartbeatFromPage

```typescript
{
  task: 'getHeartbeatFromPage',
  url: string
}
```

**Response:**
```typescript
{
  heartbeat: OptionalHeartbeat | null
}
```

**Purpose:** Solicita parsing site-específico via content script

**Handler:**
```typescript
// wakatimeScript.ts
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.task === 'getHeartbeatFromPage') {
    const site = getSite(msg.url);
    const heartbeat = site ? site.parseFromPage() : null;
    sendResponse({ heartbeat });
  }
  return true; // Async response
});
```

## User Data Flow

### Login Flow

```
1. User opens popup
       ↓
2. Clicks "Login" button
       ↓
3. Redirect to https://wakatime.com/oauth/authorize
       ↓
4. User authenticates with WakaTime
       ↓
5. WakaTime redirects back with session cookies
       ↓
6. Extension calls POST /users/current/get_api_key
       ↓
7. Saves API key to browser.storage.sync
       ↓
8. Dispatches fetchCurrentUser(apiKey)
       ↓
9. Redux thunk calls GET /users/current
       ↓
10. User data stored in Redux store
       ↓
11. Popup displays user info
```

### Periodic User Verification

```typescript
// Executa a cada 30 segundos
setInterval(async () => {
  const settings = await getSettings();

  if (settings.apiKey) {
    try {
      const response = await getCurrentUser(settings.apiKey);

      // Atualiza Redux store
      store.dispatch(currentUserActions.setUser(response.data));

      // Atualiza ícone da extensão
      await changeExtensionStatus('allGood');
    } catch (error) {
      if (error.response?.status === 401) {
        // API key inválida
        await changeExtensionStatus('notSignedIn');
        await browser.storage.sync.remove('apiKey');
      }
    }
  }
}, 30000); // 30 segundos
```

## Settings Flow

### Save Settings

```
User edits options page
       ↓
Options.tsx component state updates
       ↓
User clicks "Save"
       ↓
saveSettings(newSettings)
       ↓
browser.storage.sync.set({ ...newSettings })
       ↓
Success notification
       ↓
Background script reads new settings on next heartbeat
```

### Load Settings

```
Component mounts (popup/options)
       ↓
useEffect(() => { loadSettings() }, [])
       ↓
getSettings() → browser.storage.sync.get()
       ↓
Apply defaults for missing values
       ↓
setSettings(loadedSettings)
       ↓
Render UI with settings
```

## Data Persistence Strategy

### What's Stored Where

| Data Type | Storage | Sync? | Lifetime |
|-----------|---------|-------|----------|
| API Key | browser.storage.sync | ✅ Yes | Until logout |
| User Settings | browser.storage.sync | ✅ Yes | Permanent |
| Heartbeat Queue | IndexedDB | ❌ No | Until sent |
| User Data | Redux Store | ❌ No | Session only |
| Extension Status | browser.storage.local | ❌ No | Permanent |
| Last Heartbeat Cache | Memory (Map) | ❌ No | Until restart |

### Offline Support

**Scenario:** Usuário perde conexão com internet

1. **Heartbeats continuam sendo capturados**
   - Adicionados à fila IndexedDB normalmente

2. **Tentativas de envio falham**
   - Alarme periódico tenta enviar
   - Axios lança erro de rede
   - Heartbeats permanecem na fila

3. **Conexão restaurada**
   - Próximo alarme (2 min) envia batch completo
   - Fila é esvaziada gradualmente

**Considerações:**
- Fila pode crescer durante offline prolongado
- Sem limite explícito de tamanho (IndexedDB ~50MB+)
- Rate limiting ainda aplicado (2 min por entidade)

---

**Última atualização:** 2026-02-02
