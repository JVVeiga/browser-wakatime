# Instalação da Extensão WakaTime (Versão Customizada)

Esta é uma versão customizada da extensão WakaTime para uso interno.

## Instalação no Google Chrome / Microsoft Edge

### 1. Baixar a extensão

Baixe o arquivo `wakatime-4.1.0.zip` fornecido.

### 2. Descompactar

Descompacte o arquivo em uma pasta permanente no seu computador.
**Importante:** Não delete esta pasta depois, pois o Chrome precisa dela para manter a extensão funcionando.

Exemplo de local recomendado:
- Windows: `C:\Extensions\wakatime`
- Mac: `~/Extensions/wakatime`
- Linux: `~/extensions/wakatime`

### 3. Instalar no Chrome

1. Abra o Chrome e vá para `chrome://extensions/`
2. Ative o **"Modo do desenvolvedor"** no canto superior direito
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta onde você descompactou a extensão
5. A extensão será instalada e aparecerá na lista

### 4. Instalar no Edge

1. Abra o Edge e vá para `edge://extensions/`
2. Ative o **"Modo de desenvolvedor"** no painel esquerdo
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta onde você descompactou a extensão
5. A extensão será instalada e aparecerá na lista

## Instalação no Firefox

### 1. Baixar a extensão

Baixe o arquivo `wakatime-4.1.0.zip` fornecido (versão Firefox).

### 2. Descompactar

Descompacte o arquivo em uma pasta permanente no seu computador.

### 3. Instalar (temporariamente)

**Nota:** No Firefox, extensões não-assinadas são temporárias e precisam ser reinstaladas após reiniciar o navegador.

1. Abra o Firefox e vá para `about:debugging#/runtime/this-firefox`
2. Clique em **"Carregar extensão temporária..."**
3. Navegue até a pasta descompactada e selecione o arquivo `manifest.json`
4. A extensão será carregada temporariamente

## Configuração

Após instalar:

1. Clique no ícone da extensão WakaTime na barra de ferramentas
2. Insira sua **API Key** do WakaTime
3. Configure a **API URL** (se necessário)
4. Os sites monitorados serão carregados automaticamente da API

## Diferenças desta versão customizada

Esta versão possui as seguintes customizações em relação à versão oficial:

1. **Sites monitorados via API**: Os sites permitidos são carregados automaticamente da API, não precisam ser configurados manualmente
2. **Modo de logging fixo**: Sempre em modo "Only allowed sites"
3. **Tipo de logging fixo**: Sempre rastreia apenas o domínio (não a URL completa)
4. **Sem tracking de redes sociais**: Funcionalidade removida

## Atualizações

Quando uma nova versão for disponibilizada:

1. Baixe o novo arquivo `.zip`
2. Descompacte **substituindo** os arquivos na pasta anterior
3. No Chrome/Edge, vá em `chrome://extensions/` ou `edge://extensions/`
4. Clique no botão de **recarregar** (🔄) na extensão WakaTime
5. As configurações e dados serão mantidos

## Solução de Problemas

### A extensão não carrega
- Verifique se o "Modo do desenvolvedor" está ativado
- Certifique-se de que a pasta não foi movida ou deletada

### Aviso de "extensão não verificada"
- Isso é normal para extensões instaladas manualmente
- Pode ignorar o aviso com segurança

### Extensão desaparece após reiniciar (Firefox)
- No Firefox, extensões temporárias precisam ser recarregadas
- Para uso permanente, considere usar Chrome/Edge

### Dados não sincronizam
- Verifique se a API Key está correta
- Verifique se a API URL está acessível
- Confira o console do navegador para erros (F12 → Console)

## Suporte

Para problemas ou dúvidas, entre em contato com o time de desenvolvimento.
