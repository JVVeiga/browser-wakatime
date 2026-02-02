# Browser WakaTime - Documentação do Projeto

## Visão Geral

Browser WakaTime é uma extensão de navegador para rastreamento automático de tempo que se integra com o serviço WakaTime. A extensão monitora a atividade do usuário em várias plataformas de desenvolvimento web e registra o tempo gasto em codificação, revisão, design e tarefas de comunicação.

**Versão:** 4.1.0
**Licença:** MIT
**Navegadores Suportados:** Chrome (Manifest V3), Firefox (Manifest V2), Edge (Manifest V3)

## Índice da Documentação

### 📚 Documentos Principais

1. **[Arquitetura do Projeto](architecture.md)**
   - Visão geral da arquitetura
   - Padrões de design utilizados
   - Estrutura de diretórios
   - Fluxo de controle

2. **[Stack Tecnológica](technology-stack.md)**
   - Tecnologias principais
   - Frameworks e bibliotecas
   - Ferramentas de build e desenvolvimento
   - Testing e qualidade de código

3. **[Componentes](components.md)**
   - Componentes React
   - Módulos principais
   - Utilitários e helpers
   - Redux store e reducers

4. **[Fluxo de Dados e APIs](data-flow.md)**
   - Integração com WakaTime API
   - Browser APIs utilizadas
   - Protocolo de mensagens internas
   - Fluxo de heartbeats

5. **[Build e Deploy](build-and-deploy.md)**
   - Configuração do Webpack
   - Scripts de build
   - Processo de empacotamento
   - Desenvolvimento local

## Funcionalidades Principais

- ✅ Rastreamento automático de tempo de navegação
- ✅ Suporte para múltiplos navegadores
- ✅ Integração com API WakaTime
- ✅ Preferências de logging customizáveis (listas de inclusão/exclusão)
- ✅ Suporte para 13+ plataformas conhecidas (GitHub, GitLab, Slack, Zoom, etc.)
- ✅ Fila de heartbeats offline com IndexedDB
- ✅ Autenticação e gerenciamento de sessão
- ✅ Configurações e opções
- ✅ Painel DevTools

## Quick Start

```bash
# Instalar dependências
npm install

# Desenvolvimento com watch mode
npm run dev

# Build de produção
npm run build

# Executar testes
npm test

# Lint
npm run lint
```

## Estrutura de Diretórios

```
browser-wakatime/
├── src/                    # Código fonte
│   ├── components/         # Componentes React
│   ├── core/              # Lógica de negócio principal
│   ├── config/            # Configuração
│   ├── types/             # Definições TypeScript
│   ├── reducers/          # Redux reducers
│   ├── stores/            # Redux store
│   ├── utils/             # Utilitários
│   ├── html/              # Páginas HTML
│   ├── manifests/         # Manifestos por navegador
│   └── [entry points]     # background.ts, popup.tsx, etc.
├── public/                # Assets estáticos
├── dist/                  # Build output
├── docs/                  # Documentação
├── tests/                 # Testes
├── webpack.config.ts      # Configuração Webpack
└── package.json           # Dependências
```

## Conceitos Fundamentais

### Heartbeats

Um **heartbeat** é um registro de atividade que contém:
- URL ou domínio sendo acessado
- Timestamp da atividade
- Categoria (coding, browsing, designing, etc.)
- Informações extraídas do site (projeto, linguagem, etc.)
- Tipo de entidade (domain, app)

### Site Parsers

Módulos especializados que extraem metadados de plataformas conhecidas:
- **GitHub**: linguagem, projeto, detecção de PRs
- **GitLab/BitBucket**: extração de projeto
- **Figma/Canva**: ferramentas de design
- **Slack/Zoom/Teams**: comunicação
- **Stack Overflow**: desenvolvimento

### WakaTimeCore

Singleton que gerencia todas as operações de heartbeat:
- Captura de atividade do navegador
- Construção de heartbeats
- Fila e rate limiting
- Envio para API

## Arquitetura em Alto Nível

```
Browser Events
    ↓
background.ts (Service Worker)
    ↓
WakaTimeCore (Business Logic)
    ↓
IndexedDB Queue
    ↓
WakaTime API
    ↓
Dashboard

UI Layer:
popup.tsx / options.tsx
    ↓
Redux Store
    ↓
Settings/User APIs
```

## Contribuindo

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Faça commit das alterações
4. Execute os testes: `npm test`
5. Execute o lint: `npm run lint`
6. Envie um Pull Request

## Links Úteis

- [Repositório GitHub](https://github.com/wakatime/browser-wakatime)
- [WakaTime API Documentation](https://wakatime.com/developers)
- [WebExtension API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)

## Suporte

- Issues: [GitHub Issues](https://github.com/wakatime/browser-wakatime/issues)
- WakaTime: [wakatime.com/support](https://wakatime.com/support)

---

**Última atualização:** 2026-02-02
**Baseado na versão:** 4.1.0
