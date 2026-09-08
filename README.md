# Hub de Automações Administrativas

Hub central para organizar, configurar e acompanhar processos administrativos automatizados.

Esta versão contém uma interface demonstrativa com dados fictícios. Ela reproduz o fluxo visual do hub original e está preparada para chamar robôs Python reais por meio de um dispatcher.

## Funcionalidades

- Painel inicial com quantidade real de robôs disponíveis.
- Atalhos configuráveis na tela inicial.
- Catálogo de robôs agrupado por categoria.
- Busca por nome, categoria ou requisito.
- Ajuda específica para cada robô.
- Guia de uso navegável por temas.
- Tela de credenciais com campos de senha protegidos.
- Execução simulada com progresso e logs.
- Histórico das últimas execuções com os estados:
  - `sucesso`;
  - `falhou`;
  - `cancelado`.
- Layout responsivo para telas estreitas.

## Tecnologias

### Interface atual

- TypeScript
- Vite 5
- HTML e CSS
- Node.js 18 ou superior

### Integração planejada com os robôs

Os robôs do projeto original podem ser conectados usando Python e um dispatcher. A interface pode iniciar um processo Python, receber mensagens de progresso e atualizar o histórico conforme o código de saída:

- código `0`: sucesso;
- código diferente de `0`: falha;
- encerramento solicitado pelo usuário: cancelado.

As dependências Python listadas em [requirements.txt](requirements.txt) correspondem às automações descritas no material original, incluindo Selenium, Excel, Outlook, automação de tela, OCR, APIs e armazenamento local de credenciais.

## Como executar a interface

Instale as dependências JavaScript:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente:

```text
http://127.0.0.1:5173/
```

Para gerar a versão de produção:

```bash
npm run build
```

## Publicar no GitHub Pages

O projeto já possui o workflow [deploy-pages.yml](.github/workflows/deploy-pages.yml). Para publicar:

1. Crie um repositório no GitHub, por exemplo `enterprise-automation-hub`.
2. Inicialize o Git nesta pasta e adicione o remoto:

```powershell
git init
git add .
git commit -m "Initial automation hub"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/enterprise-automation-hub.git
git push -u origin main
```

3. No GitHub, abra `Settings > Pages` e selecione `GitHub Actions` como origem.
4. Aguarde o workflow `Deploy to GitHub Pages` terminar na aba `Actions`.

O site ficará disponível em:

```text
https://SEU_USUARIO.github.io/enterprise-automation-hub/
```

O workflow calcula automaticamente o caminho base pelo nome do repositório, portanto links e arquivos estáticos funcionam em GitHub Pages.

## Como executar os robôs Python

Crie um ambiente virtual e instale as dependências:

```bash
python -m venv .venv
```

No Windows PowerShell:

```powershell
.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
```

Os robôs reais dependem de configurações locais, acesso à rede corporativa, Outlook, navegador, SAP ou outros sistemas externos. Esses valores não devem ser gravados no código nem versionados.

## Configuração segura

Use arquivos locais ignorados pelo Git ou variáveis de ambiente para armazenar:

- e-mail e senhas;
- tokens e chaves de API;
- caminhos de rede;
- parâmetros de pastas;
- dados de serviços externos.

Nunca publique credenciais, tokens, arquivos `config_mrv.json`, `config_emails.json`, planilhas reais ou dados de clientes.

Para uma integração real, o arquivo de configuração pode seguir esta separação:

```text
config.py                 configuracoes locais
secret_store.py           armazenamento de credenciais
config_mrv.json           arquivo local ignorado pelo Git
dados_locais.json         mapas e parâmetros locais
dispatcher.py             roteamento das ações do hub
robos/                    módulos Python de automação
```

## Estrutura da interface

```text
enterprise-automation-hub/
├── index.html
├── package.json
├── requirements.txt
├── README.md
├── tsconfig.json
└── src/
    ├── main.ts
    └── style.css
```

## Integração com Python

Uma integração posterior pode substituir a simulação da função `startRun` por uma chamada a um serviço local Flask/FastAPI ou por um processo Python iniciado pelo sistema operacional.

Contrato recomendado para o dispatcher:

```text
POST /actions/{robot_id}

Resposta inicial:
{
  "execution_id": "abc123",
  "status": "running"
}
```

Eventos de execução:

```text
[PROGRESSO:20] Validando arquivos
[PROGRESSO:60] Processando dados
[PROGRESSO:100] Processo concluído
```

O hub deve registrar o resultado somente quando receber o encerramento do processo. Erros técnicos devem retornar uma mensagem segura para a interface, sem expor senhas, tokens ou caminhos sensíveis.

## Dados fictícios

Os nomes dos robôs, categorias, credenciais e mensagens exibidos nesta versão são genéricos e não representam processos reais de nenhuma organização.
