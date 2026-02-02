# Build e Deploy

## Configuração do Webpack

### Overview

O projeto usa **Webpack 5** para bundling, com configuração multi-target que gera builds separados para Chrome, Firefox e Edge.

**Arquivo:** [webpack.config.ts](../webpack.config.ts)

### Entry Points (5 builds)

```typescript
entry: {
  background: './src/background.ts',
  popup: './src/popup.tsx',
  options: './src/options.tsx',
  wakatimeScript: './src/wakatimeScript.ts',
  devtools: './src/devtools.ts'
}
```

**Output:**
```
dist/{browser}/
  ├── background.js
  ├── popup.js
  ├── options.js
  ├── wakatimeScript.js
  └── devtools.js
```

### Loaders

#### Babel Loader

```typescript
{
  test: /\.(ts|tsx|js|jsx)$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
        '@babel/preset-typescript'
      ]
    }
  }
}
```

**Transforma:**
- TypeScript → JavaScript
- JSX → React.createElement()
- ES6+ → ES5 (compatibilidade)

### Plugins

#### 1. CopyPlugin

Copia assets estáticos para diretório de build.

```typescript
new CopyWebpackPlugin({
  patterns: [
    // CSS
    { from: 'public/css', to: 'css' },

    // Fonts
    { from: 'public/fonts', to: 'fonts' },

    // Graphics
    { from: 'graphics', to: 'assets/graphics' },

    // HTML
    { from: 'src/html', to: 'html' },

    // Manifest (browser-specific)
    {
      from: `src/manifests/${browser}.json`,
      to: 'manifest.json'
    },

    // Browser polyfill
    { from: 'public/js/browser-polyfill.min.js', to: 'js' }
  ]
})
```

#### 2. DefinePlugin

Injeta variáveis de ambiente no código.

```typescript
new webpack.DefinePlugin({
  'process.env.API_URL': JSON.stringify(API_URL),
  'process.env.CURRENT_USER_API_URL': JSON.stringify(CURRENT_USER_API_URL),
  'process.env.HEARTBEAT_API_URL': JSON.stringify(HEARTBEAT_API_URL),
  'process.env.LOGOUT_USER_URL': JSON.stringify(LOGOUT_USER_URL),
  'process.env.SUMMARIES_API_URL': JSON.stringify(SUMMARIES_API_URL),
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
})
```

**Usage no código:**
```typescript
const apiUrl = process.env.API_URL;
```

### Multi-Browser Build

```typescript
const browsers = ['chrome', 'firefox', 'edge'];

module.exports = browsers.map(browser => ({
  ...commonConfig,
  output: {
    path: path.resolve(__dirname, `dist/${browser}`),
    filename: '[name].js'
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: `src/manifests/${browser}.json`, to: 'manifest.json' }
      ]
    })
  ]
}));
```

**Output:**
```
dist/
├── chrome/
│   ├── manifest.json  (Chrome MV3)
│   └── ...
├── firefox/
│   ├── manifest.json  (Firefox MV2)
│   └── ...
└── edge/
    ├── manifest.json  (Edge MV3)
    └── ...
```

### Source Maps

```typescript
devtool: 'source-map'
```

**Desenvolvimento:**
- Inline source maps para debugging
- Mapeamento completo linha por linha

**Produção:**
- Source maps externos (.js.map)
- Úteis para análise de errors em produção

## Scripts NPM

### Instalação

```bash
npm install
```

**Dependências:**
- Runtime: React, Redux, Axios, etc.
- Dev: Webpack, Babel, Jest, ESLint, etc.

**Post-install:**
```bash
npm run postinstall
```
- Prepara ambiente de build
- Verifica dependências

### Build Scripts

#### Build de Produção

```bash
npm run build
```

**Processo:**
1. Limpa diretório `dist/`
2. Compila SCSS → CSS
3. Executa Webpack build (production mode)
4. Copia assets para cada browser
5. Cria pacotes `.zip` com web-ext

**Output:**
```
dist/
├── chrome/
│   ├── [arquivos da extensão]
│   └── chrome.zip  ← Pronto para upload
├── firefox/
│   ├── [arquivos da extensão]
│   └── firefox.zip  ← Pronto para upload
└── edge/
    ├── [arquivos da extensão]
    └── edge.zip  ← Pronto para upload
```

**Otimizações aplicadas:**
- Minificação de JavaScript
- Tree shaking (dead code elimination)
- Source maps de produção
- Redux Logger desabilitado

#### Build por Browser

```bash
npm run chrome:build   # Apenas Chrome
npm run firefox:build  # Apenas Firefox
npm run edge:build     # Apenas Edge
```

### Desenvolvimento

#### Watch Mode

```bash
npm run watch
```

**Comportamento:**
- Webpack watch mode
- Recompila automaticamente ao detectar mudanças
- Sem hot reload de navegador (requer recarga manual)

**Recomendado para:**
- Desenvolvimento rápido de features
- Testing local de mudanças

#### Dev Mode com Hot Reload

```bash
npm run dev
```

**Processo:**
1. Inicia Webpack em watch mode
2. Lança Firefox com `web-ext run`
3. Lança Chrome com `web-ext run --target=chromium`
4. Hot reload habilitado em ambos

**Features:**
- Extensão recarrega automaticamente ao salvar
- Console logs visíveis no terminal
- Debugging facilitado

**Atalhos:**
- `Ctrl+C` para parar

#### Dev por Browser

```bash
npm run dev:firefox  # Apenas Firefox
npm run dev:chrome   # Apenas Chrome
```

### Testing

#### Run All Tests

```bash
npm test
```

**Executa:**
- Jest test runner
- Todos arquivos `*.test.ts(x)`
- Mostra coverage summary

**Example output:**
```
PASS  src/components/WakaTime.test.tsx
PASS  src/utils/getDomainFromUrl.test.ts

Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        3.456s
```

#### Watch Mode

```bash
npm run test:watch
```

**Comportamento:**
- Re-executa testes ao detectar mudanças
- Interactive CLI para filtrar testes

#### Coverage Report

```bash
npm run test:coverage
```

**Output:**
```
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   78.5  |   65.2   |   82.1  |   79.3  |
 components/        |   85.3  |   72.4   |   88.9  |   86.1  |
  WakaTime.tsx      |   90.0  |   80.0   |  100.0  |   91.7  |
  Options.tsx       |   82.5  |   68.2   |   85.7  |   83.9  |
 core/              |   72.1  |   58.3   |   75.0  |   73.6  |
  WakaTimeCore.ts   |   72.1  |   58.3   |   75.0  |   73.6  |
--------------------|---------|----------|---------|---------|
```

**HTML Report:** `coverage/lcov-report/index.html`

### Linting

#### ESLint

```bash
npm run lint
```

**Verifica:**
- Problemas de sintaxe
- Padrões de código
- Best practices
- TypeScript type issues

**Rules:**
- ESLint recommended
- React recommended
- TypeScript recommended
- Custom project rules

#### Auto-fix

```bash
npm run lint:fix
```

**Corrige automaticamente:**
- Formatação
- Imports não usados
- Ordenação de imports
- Outros problemas simples

#### Prettier

```bash
npm run format
```

**Formata:**
- Todos arquivos em `src/`
- Consistência de estilo
- Indentação, quotes, semicolons, etc.

### Packaging

#### web-ext Build

```bash
npm run package
```

**Cria arquivos `.zip`:**
- `dist/chrome/chrome-{version}.zip`
- `dist/firefox/firefox-{version}.zip`
- `dist/edge/edge-{version}.zip`

**Validações:**
- Verifica manifest.json
- Valida estrutura de arquivos
- Checa permissões

**Comando interno:**
```bash
web-ext build --source-dir=dist/chrome --artifacts-dir=dist/chrome
```

## Task Runner (xclap)

### Configuração

**Arquivo:** [xclap.ts](../xclap.ts)

### Tasks Disponíveis

```bash
npm run xclap <task>
```

#### build

```bash
npm run xclap build
```

**Steps:**
1. `clean` - Limpa dist/
2. `compile:scss` - Compila SCSS → CSS
3. `webpack:build` - Build de produção
4. `package` - Cria .zip files

#### dev

```bash
npm run xclap dev
```

**Steps:**
1. `build` - Build inicial
2. `watch` - Webpack watch mode
3. `firefox:run` + `chrome:run` - Lança browsers

#### clean

```bash
npm run xclap clean
```

**Remove:**
- `dist/` directory
- `coverage/` directory
- `*.log` files

#### compile:scss

```bash
npm run xclap compile:scss
```

**Compila:**
- `assets/sass/app.scss` → `public/css/app.css`
- Inclui Bootstrap e customizações

## Manifests por Browser

### Chrome (Manifest V3)

**Arquivo:** [src/manifests/chrome.json](../src/manifests/chrome.json)

```json
{
  "manifest_version": 3,
  "name": "WakaTime",
  "version": "4.1.0",
  "description": "Automatic time tracking",

  "background": {
    "service_worker": "background.js"
  },

  "action": {
    "default_popup": "html/popup.html",
    "default_icon": {
      "16": "assets/graphics/wakatime-logo-16.png",
      "48": "assets/graphics/wakatime-logo-48.png",
      "128": "assets/graphics/wakatime-logo-128.png"
    }
  },

  "permissions": [
    "tabs",
    "storage",
    "alarms"
  ],

  "host_permissions": [
    "<all_urls>"
  ],

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["wakatimeScript.js"],
      "run_at": "document_idle"
    }
  ],

  "devtools_page": "html/devtools.html"
}
```

**Diferenças MV3:**
- `background.service_worker` (não `background.scripts`)
- `action` (não `browser_action`)
- `host_permissions` separado de `permissions`

### Firefox (Manifest V2)

**Arquivo:** [src/manifests/firefox.json](../src/manifests/firefox.json)

```json
{
  "manifest_version": 2,
  "name": "WakaTime",
  "version": "4.1.0",

  "background": {
    "scripts": ["js/browser-polyfill.min.js", "background.js"]
  },

  "browser_action": {
    "default_popup": "html/popup.html",
    "default_icon": {
      "16": "assets/graphics/wakatime-logo-16.png",
      "48": "assets/graphics/wakatime-logo-48.png"
    }
  },

  "permissions": [
    "tabs",
    "storage",
    "alarms",
    "<all_urls>"
  ],

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["js/browser-polyfill.min.js", "wakatimeScript.js"]
    }
  ],

  "browser_specific_settings": {
    "gecko": {
      "id": "wakatime@wakatime.com",
      "strict_min_version": "78.0"
    }
  }
}
```

**Diferenças MV2:**
- `background.scripts` array
- `browser_action` (não `action`)
- Permissões não separadas
- Requer polyfill explícito

### Edge (Manifest V3)

**Arquivo:** [src/manifests/edge.json](../src/manifests/edge.json)

- Praticamente idêntico ao Chrome
- Baseado em Chromium
- Suporta MV3 completo

## Processo de Deploy

### 1. Preparação

```bash
# Atualizar versão em package.json e manifests
vim package.json  # "version": "4.2.0"
vim src/manifests/chrome.json  # "version": "4.2.0"
vim src/manifests/firefox.json  # "version": "4.2.0"
vim src/manifests/edge.json  # "version": "4.2.0"

# Commit changes
git add .
git commit -m "bump v4.2.0"
git tag v4.2.0
git push origin master --tags
```

### 2. Build de Produção

```bash
# Limpar builds anteriores
npm run clean

# Build completo
npm run build

# Verificar builds
ls -la dist/chrome/
ls -la dist/firefox/
ls -la dist/edge/
```

### 3. Testing Manual

```bash
# Testar Chrome
cd dist/chrome
web-ext run --target=chromium --source-dir=.

# Testar Firefox
cd dist/firefox
web-ext run --source-dir=.

# Checklist:
# - Login funciona
# - Heartbeats sendo enviados
# - Popup exibe informações
# - Opções salvam corretamente
# - Ícone muda de status
```

### 4. Upload para Stores

#### Chrome Web Store

1. Acesse: [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Selecione a extensão
3. Clique "Upload New Package"
4. Faça upload de `dist/chrome/chrome-4.2.0.zip`
5. Preencha changelog
6. Submit for review

**Tempo de revisão:** 1-3 dias

#### Firefox Add-ons

1. Acesse: [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Selecione a extensão
3. Clique "Upload New Version"
4. Faça upload de `dist/firefox/firefox-4.2.0.zip`
5. Preencha release notes
6. Submit

**Tempo de revisão:** 1-7 dias (dependendo de mudanças)

#### Microsoft Edge Add-ons

1. Acesse: [Edge Add-ons Dashboard](https://partner.microsoft.com/dashboard/microsoftedge)
2. Selecione a extensão
3. Upload `dist/edge/edge-4.2.0.zip`
4. Preencha details
5. Submit

**Tempo de revisão:** 1-3 dias

### 5. Monitoramento

- Verificar aprovação nas stores
- Monitorar reviews e ratings
- Observar issues no GitHub
- Verificar métricas de instalação

## Troubleshooting

### Build Errors

#### "Cannot find module"

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

#### Webpack errors

```bash
# Limpar cache
npm run clean
rm -rf .cache

# Rebuild
npm run build
```

### Runtime Errors

#### "Extension service worker not responding"

- Manifest V3 issue (Chrome)
- Adicionar keep-alive em background.ts

#### "Cannot read property of undefined"

- Verificar Redux store initialization
- Verificar settings defaults

### Testing Issues

#### Tests failing

```bash
# Limpar cache do Jest
npm run test -- --clearCache

# Rodar com verbose
npm run test -- --verbose
```

## Ambiente de Desenvolvimento

### Requisitos

- **Node.js:** 20.18.1 (ver [.nvmrc](../.nvmrc))
- **npm:** 10.x+
- **Browsers:**
  - Chrome 88+
  - Firefox 78+
  - Edge 88+

### Configuração Inicial

```bash
# Clonar repositório
git clone https://github.com/wakatime/browser-wakatime.git
cd browser-wakatime

# Usar versão correta do Node
nvm use

# Instalar dependências
npm install

# Build inicial
npm run build

# Iniciar desenvolvimento
npm run dev
```

### Debugging

#### Chrome DevTools

1. Abra `chrome://extensions/`
2. Habilite "Developer mode"
3. Clique "Inspect views: background page"
4. Console logs e breakpoints disponíveis

#### Firefox DevTools

1. Abra `about:debugging#/runtime/this-firefox`
2. Encontre "WakaTime"
3. Clique "Inspect"
4. Console e debugger disponíveis

---

**Última atualização:** 2026-02-02
