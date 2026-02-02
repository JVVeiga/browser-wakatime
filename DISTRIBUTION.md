# Como Distribuir a Extensão

Este guia é para quem vai preparar a extensão para distribuição aos desenvolvedores.

## Preparação

### 1. Build da extensão

```bash
npm run build
```

Este comando irá:
- Compilar todo o código TypeScript
- Gerar as versões para Chrome, Firefox e Edge
- Criar os arquivos .zip em:
  - `dist/chrome/web-ext-artifacts/wakatime-4.1.0.zip` (Chrome/Edge)
  - `dist/firefox/web-ext-artifacts/wakatime-4.1.0.zip` (Firefox)

### 2. Arquivos para distribuir

Compartilhe com seus desenvolvedores:

**Para usuários Chrome/Edge:**
- `dist/chrome/web-ext-artifacts/wakatime-4.1.0.zip`
- `INSTALL.md` (guia de instalação)

**Para usuários Firefox:**
- `dist/firefox/web-ext-artifacts/wakatime-4.1.0.zip`
- `INSTALL.md` (guia de instalação)

## Métodos de Distribuição

### Opção 1: Email / Slack / Teams

Envie os arquivos diretamente:
1. Arquivo .zip apropriado (Chrome ou Firefox)
2. Arquivo INSTALL.md com instruções

### Opção 2: Repositório interno / Servidor de arquivos

1. Crie uma pasta no servidor (ex: `extensions/wakatime/v4.1.0/`)
2. Coloque os arquivos:
   ```
   extensions/wakatime/v4.1.0/
   ├── chrome/
   │   └── wakatime-4.1.0.zip
   ├── firefox/
   │   └── wakatime-4.1.0.zip
   └── INSTALL.md
   ```
3. Compartilhe o link com os desenvolvedores

### Opção 3: Google Drive / Dropbox / OneDrive

1. Crie uma pasta compartilhada
2. Faça upload dos arquivos
3. Compartilhe o link com permissão de leitura

## Versionamento

Os arquivos seguem a versão do `manifest.json`:
- Versão atual: **4.1.0**
- Arquivos: `wakatime-4.1.0.zip`

Para atualizar a versão:
1. Edite `src/manifests/chrome.json`, `firefox.json` e `edge.json`
2. Atualize o campo `"version"`
3. Execute `npm run build`
4. Os novos arquivos .zip serão gerados com a nova versão

## Checklist de Distribuição

Antes de distribuir, verifique:

- [ ] Build executado com sucesso (`npm run build`)
- [ ] Arquivos .zip gerados em `dist/*/web-ext-artifacts/`
- [ ] INSTALL.md está atualizado com a versão correta
- [ ] Testou a instalação localmente (pelo menos uma vez)
- [ ] API Key de teste funciona
- [ ] Sites monitorados carregam da API corretamente

## Notas

- **Não é necessário publicar na Chrome Web Store** pois é um fork customizado
- **A extensão não atualiza automaticamente** - novas versões precisam ser distribuídas manualmente
- **Configurações dos usuários são preservadas** ao atualizar (recarregar a extensão)
- **Para empresas grandes**, considere usar políticas do Chrome para deploy automático
