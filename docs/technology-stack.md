# Stack Tecnológica

## Tecnologias Principais

### TypeScript

**Versão:** 5.5.4

- Linguagem principal do projeto
- Strict mode habilitado
- Tipagem completa em todos os módulos
- Interfaces e types para estruturas de dados

**Configuração:** [tsconfig.json](../tsconfig.json)

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### React

**Versão:** 18.3.1

- Framework UI para popup e páginas de opções
- Componentes funcionais com Hooks
- React Testing Library para testes

**Entry Points:**
- [src/popup.tsx](../src/popup.tsx)
- [src/options.tsx](../src/options.tsx)

### Redux

**Versão:** @reduxjs/toolkit 2.2.7

- State management centralizado
- Redux Toolkit para boilerplate reduzido
- Redux batching para performance
- Redux Logger para debugging

**Store:** [src/stores/createStore.ts](../src/stores/createStore.ts)

**Reducers:**
- [src/reducers/configReducer.ts](../src/reducers/configReducer.ts)
- [src/reducers/currentUser.ts](../src/reducers/currentUser.ts)

## Frameworks e Bibliotecas

### UI & Styling

#### Bootstrap

**Versão:** 5.3.3

- Framework CSS responsivo
- Componentes de UI (buttons, forms, alerts)
- Grid system

#### Bootswatch

**Versão:** 5.3.3

- Temas Bootstrap customizados
- Light/Dark mode support

#### Font Awesome

**Versão:** 4.7.0

- Ícones vetoriais
- Usados no popup e opções

#### SCSS/Sass

**Versão:** 1.77.8

- Preprocessador CSS
- Fonte: [assets/sass/app.scss](../assets/sass/app.scss)
- Compilado para: `public/css/app.css`

### WebExtension

#### webextension-polyfill

**Versão:** 0.10.0

- API unificada para Chrome, Firefox, Edge
- Promises ao invés de callbacks
- Namespace `browser.*` consistente

```typescript
import Browser from 'webextension-polyfill';

// Funciona em todos os navegadores
const tabs = await Browser.tabs.query({ active: true });
```

### HTTP & API

#### Axios

**Versão:** 1.7.5

- Cliente HTTP para requisições à WakaTime API
- Suporte a interceptors
- Tratamento de erros

```typescript
import axios from 'axios';

await axios.post(HEARTBEAT_API_URL, heartbeats, {
  params: { api_key: apiKey }
});
```

### Storage

#### idb (IndexedDB Wrapper)

**Versão:** 8.0.0

- Wrapper baseado em Promises para IndexedDB
- Usado para fila de heartbeats offline
- API simplificada

```typescript
import { openDB } from 'idb';

const db = await openDB('wakatime', 1, {
  upgrade(db) {
    db.createObjectStore('heartbeats', { keyPath: 'id' });
  }
});
```

### Utilitários

#### Moment.js

**Versão:** 2.30.1

- Manipulação de datas e horários
- Formatação de timestamps
- Cálculos de tempo

#### UUID

**Versão:** 10.0.0

- Geração de IDs únicos
- Usado para identificação de heartbeats

#### node-html-parser

**Versão:** 6.1.13

- Parsing de HTML
- Extração de metadados de páginas

## Build & Development

### Webpack

**Versão:** 5.94.0

- Module bundler principal
- Multi-target build (Chrome, Firefox, Edge)
- 5 entry points separados

**Configuração:** [webpack.config.ts](../webpack.config.ts)

**Plugins:**
- **CopyPlugin**: Copia assets (CSS, fonts, graphics, HTML, manifests)
- **DefinePlugin**: Injeta variáveis de ambiente (API URLs)

**Loaders:**
- **babel-loader**: Transpilação TS/JS/JSX/TSX
- **sass-loader**: Compilação SCSS

### Babel

**Versão:** 7.25.2

- Transpilação JavaScript
- Suporte a JSX/TSX
- Presets:
  - `@babel/preset-env`
  - `@babel/preset-react`
  - `@babel/preset-typescript`

### Task Runner

#### @xarc/run

**Versão:** 1.0.4

- Task runner framework
- Scripts de build customizados

**Configuração:** [xclap.ts](../xclap.ts)

**Tasks principais:**
- `build`: Build de produção + empacotamento
- `dev`: Watch mode com hot reload
- `watch`: Webpack watch mode
- `chrome:build`, `firefox:build`, `edge:build`: Builds específicos

#### web-ext

**Versão:** 8.2.0

- CLI oficial para WebExtensions
- Desenvolvimento local com hot reload
- Empacotamento `.zip` para publicação

```bash
# Firefox
web-ext run --source-dir=dist/firefox

# Chrome
web-ext run --target=chromium --source-dir=dist/chrome
```

## Testing & Quality

### Jest

**Versão:** 29.3.1

- Framework de testes unitários
- Test runner
- Mocking e assertions

**Configuração:** [jest.config.ts](../jest.config.ts)

```bash
npm test
npm run test:coverage
```

### React Testing Library

**Versão:** 16.0.1

- Testes de componentes React
- User-centric testing
- Queries e matchers

```typescript
import { render, screen } from '@testing-library/react';

test('renders component', () => {
  render(<WakaTime />);
  expect(screen.getByText('WakaTime')).toBeInTheDocument();
});
```

### Testing Utilities

#### sinon-chrome

**Versão:** 3.0.1

- Mocking de Chrome/Browser APIs
- Stubs para `browser.*` namespace

#### Mocha & Sinon

- Alternativas de testing utilities
- Usados em testes específicos

### Code Quality

#### ESLint

**Versão:** 8.56.0

- Linter JavaScript/TypeScript
- Regras customizadas
- Integração com Prettier

**Configuração:** [.eslintrc.js](../.eslintrc.js)

```bash
npm run lint
npm run lint:fix
```

#### Prettier

**Versão:** 3.2.4

- Formatação automática de código
- Estilo consistente
- Integração com ESLint

**Configuração:** [.prettierrc.js](../.prettierrc.js)

```bash
npm run format
```

## Dependências por Categoria

### Runtime Dependencies

```json
{
  "axios": "^1.7.5",
  "bootstrap": "^5.3.3",
  "bootswatch": "^5.3.3",
  "idb": "^8.0.0",
  "moment": "^2.30.1",
  "node-html-parser": "^6.1.13",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-redux": "^9.1.2",
  "@reduxjs/toolkit": "^2.2.7",
  "redux-batched-actions": "^0.5.0",
  "redux-logger": "^3.0.6",
  "uuid": "^10.0.0",
  "webextension-polyfill": "^0.10.0"
}
```

### Development Dependencies

```json
{
  "@babel/core": "^7.25.2",
  "@babel/preset-env": "^7.25.3",
  "@babel/preset-react": "^7.24.7",
  "@babel/preset-typescript": "^7.24.7",
  "@testing-library/react": "^16.0.1",
  "@types/jest": "^29.2.5",
  "@types/react": "^18.3.12",
  "@types/react-dom": "^18.3.1",
  "@types/uuid": "^10.0.0",
  "babel-loader": "^9.1.3",
  "copy-webpack-plugin": "^12.0.2",
  "eslint": "^8.56.0",
  "jest": "^29.3.1",
  "prettier": "^3.2.4",
  "sass": "^1.77.8",
  "sinon-chrome": "^3.0.1",
  "typescript": "^5.5.4",
  "web-ext": "^8.2.0",
  "webpack": "^5.94.0",
  "webpack-cli": "^5.1.4"
}
```

## Versões de Node

**Node.js:** 20.18.1 (especificado em [.nvmrc](../.nvmrc))

```bash
# Usar versão correta com nvm
nvm use
```

## Ambientes de Build

### Development

```bash
NODE_ENV=development npm run dev
```

**Características:**
- Source maps habilitados
- Redux Logger ativo
- Hot reload
- Sem minificação

### Production

```bash
NODE_ENV=production npm run build
```

**Características:**
- Código minificado
- Redux Logger desabilitado
- Source maps de produção
- Otimizações de bundle size

## Variáveis de Ambiente

Injetadas via Webpack DefinePlugin:

```typescript
process.env.API_URL              // Base URL da API WakaTime
process.env.CURRENT_USER_API_URL // Endpoint de usuário atual
process.env.HEARTBEAT_API_URL    // Endpoint de heartbeats
process.env.LOGOUT_USER_URL      // URL de logout
process.env.SUMMARIES_API_URL    // Endpoint de summaries
process.env.NODE_ENV             // development | production
```

## Browsers Suportados

### Chrome

**Manifest Version:** 3
**Minimum Version:** 88+

**Características:**
- Service workers (background)
- Declarative net request
- Action API

### Firefox

**Manifest Version:** 2
**Minimum Version:** 78+

**Características:**
- Background pages
- WebRequest API
- Browser action

### Edge

**Manifest Version:** 3
**Minimum Version:** 88+

**Características:**
- Baseado em Chromium
- Compatível com Chrome manifest

## Package Scripts

```json
{
  "scripts": {
    "build": "npm run xclap build",
    "dev": "npm run xclap dev",
    "watch": "webpack --watch",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/",
    "xclap": "xclap"
  }
}
```

## Arquitetura de Build

```
Source Files (src/)
    ↓
TypeScript Compiler (via Babel)
    ↓
Webpack Bundler
    ↓
Multiple Entry Points
    ├── background.js
    ├── popup.js
    ├── options.js
    ├── wakatimeScript.js
    └── devtools.js
    ↓
Copy Assets (CSS, HTML, Manifests, Graphics)
    ↓
Output to dist/
    ├── chrome/
    ├── firefox/
    └── edge/
    ↓
web-ext packaging
    ↓
.zip files para publicação
```

## Considerações de Performance

### Bundle Size

- **Chunking**: Não implementado (5 bundles separados por design)
- **Tree shaking**: Habilitado via Webpack
- **Minification**: Habilitado em produção

### Runtime Performance

- Redux batching para reduzir re-renders
- Debouncing de eventos de atividade
- IndexedDB para operações I/O assíncronas
- Lazy loading não implementado (bundles pequenos)

## Futuras Atualizações

Possíveis melhorias tecnológicas:

- **React 19**: Quando lançado
- **Manifest V3 para Firefox**: Quando estabilizado
- **TypeScript 5.x**: Manter atualizado
- **Webpack 6**: Quando lançado
- **Vitest**: Alternativa ao Jest
- **Tailwind CSS**: Alternativa ao Bootstrap

---

**Última atualização:** 2026-02-02
