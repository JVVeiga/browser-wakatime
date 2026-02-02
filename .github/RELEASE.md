# Como Criar uma Release

Este projeto usa GitHub Actions para automatizar o build e distribuição da extensão.

## Processo de Release

### 1. Atualizar a versão

Primeiro, atualize a versão nos arquivos de manifest:

```bash
# Edite os arquivos:
src/manifests/chrome.json
src/manifests/firefox.json
src/manifests/edge.json

# Altere o campo "version" para a nova versão (ex: "4.1.1")
```

### 2. Commit e push das alterações

```bash
git add src/manifests/
git commit -m "chore: bump version to 4.1.1"
git push origin custom
```

### 3. Criar uma tag

```bash
# Criar tag localmente
git tag -a v4.1.1 -m "Release v4.1.1"

# Enviar tag para o GitHub
git push origin v4.1.1
```

### 4. Criar a Release no GitHub

Há duas formas:

#### Opção A: Via Interface Web

1. Acesse: https://github.com/SEU_USER/browser-wakatime/releases/new
2. Escolha a tag que você acabou de criar (`v4.1.1`)
3. Preencha:
   - **Release title**: `v4.1.1` ou `WakaTime Extension v4.1.1`
   - **Description**: Descreva as mudanças dessa versão
4. Clique em **"Publish release"**

#### Opção B: Via GitHub CLI

```bash
gh release create v4.1.1 \
  --title "v4.1.1" \
  --notes "Descrição das mudanças nesta versão"
```

### 5. Aguardar o Build Automático

A GitHub Action será disparada automaticamente e irá:

1. Fazer checkout do código
2. Instalar dependências (`npm ci`)
3. Executar o build (`npm run build`)
4. Fazer upload dos seguintes arquivos na release:
   - `wakatime-chrome-v4.1.1.zip`
   - `wakatime-firefox-v4.1.1.zip`
   - `wakatime-edge-v4.1.1.zip`
   - `INSTALL.md`

### 6. Verificar a Release

1. Acesse a página da release no GitHub
2. Verifique se os 4 arquivos foram anexados
3. Os arquivos estarão disponíveis para download

## Distribuição

Após a release ser criada:

1. Compartilhe o link da release com seus desenvolvedores
2. Eles podem baixar os arquivos diretamente do GitHub
3. Exemplo de link: `https://github.com/SEU_USER/browser-wakatime/releases/tag/v4.1.1`

## Troubleshooting

### A Action falhou

1. Vá em **Actions** no GitHub
2. Clique no workflow que falhou
3. Verifique os logs de erro
4. Corrija o problema
5. Delete a release e tag
6. Recrie a release

### Os arquivos não foram anexados

Verifique se:
- A tag foi criada corretamente
- A Action tem permissão de escrita (Settings → Actions → General → Workflow permissions → Read and write)
- O build completou com sucesso

### Remover uma release incorreta

```bash
# Deletar a release via CLI
gh release delete v4.1.1 --yes

# Deletar a tag localmente
git tag -d v4.1.1

# Deletar a tag remotamente
git push --delete origin v4.1.1
```

## Checklist de Release

Antes de criar uma release:

- [ ] Versão atualizada nos 3 manifests (chrome, firefox, edge)
- [ ] Todas as alterações commitadas
- [ ] Build local funciona (`npm run build`)
- [ ] Tag criada com nome correto (ex: `v4.1.1`)
- [ ] Tag enviada para o GitHub
- [ ] Release criada no GitHub
- [ ] Action completou com sucesso
- [ ] Arquivos anexados à release
- [ ] Link da release compartilhado com o time

## Versionamento

Seguimos Semantic Versioning (semver):

- **MAJOR** (4.x.x): Mudanças incompatíveis
- **MINOR** (x.1.x): Novas funcionalidades compatíveis
- **PATCH** (x.x.1): Correções de bugs

Exemplos:
- `v4.1.0` → `v4.1.1` (bug fix)
- `v4.1.1` → `v4.2.0` (nova funcionalidade)
- `v4.2.0` → `v5.0.0` (breaking change)
