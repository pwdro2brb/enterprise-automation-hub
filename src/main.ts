import './style.css'

type View = 'home' | 'robots' | 'settings' | 'help'
type Robot = { id: string; title: string; description: string; category: string; duration: string; tags: string[]; tone: string }
type ExecutionStatus = 'sucesso' | 'falhou' | 'cancelado'
type ExecutionRecord = { robot: string; status: ExecutionStatus; timestamp: string }

const robots: Robot[] = [
  { id: 'malote', title: 'Distribuição de Custos', description: 'Organiza valores e gera uma planilha consolidada por unidade.', category: 'Arquivos & Processamento', duration: '2 a 10 min', tags: ['Excel', 'Arquivos locais', 'Validação'], tone: 'blue' },
  { id: 'agf', title: 'Validação de Registros', description: 'Processa arquivos recebidos e valida os registros encontrados.', category: 'Arquivos & Processamento', duration: '3 a 10 min', tags: ['Excel', 'Arquivos locais', 'Consulta'], tone: 'blue' },
  { id: 'drafts', title: 'Preparar Comunicações', description: 'Cria rascunhos de mensagens a partir dos dados processados.', category: 'Arquivos & Processamento', duration: '1 a 2 min', tags: ['E-mail'], tone: 'blue' },
  { id: 'billing', title: 'Processamento de Documentos', description: 'Executa o fluxo completo a partir de mensagens ou arquivos selecionados.', category: 'Arquivos & Processamento', duration: '5 a 15 min', tags: ['E-mail', 'Portal', 'Excel'], tone: 'blue' },
  { id: 'legal', title: 'Relatório Externo', description: 'Baixa e formata um relatório de uma plataforma externa.', category: 'Integrações & Relatórios', duration: '1 a 3 min', tags: ['Portal', 'Excel', 'Autenticação'], tone: 'pink' },
  { id: 'encomendas', title: 'Importar Registros Rápidos', description: 'Inclui novos registros a partir de uma planilha de entrada.', category: 'Integrações & Relatórios', duration: '30 seg a 2 min', tags: ['Planilha', 'Integração'], tone: 'pink' },
  { id: 'produtividade', title: 'Consolidar Indicadores', description: 'Consolida relatórios de desempenho de diferentes fontes.', category: 'Integrações & Relatórios', duration: '5 a 12 min', tags: ['Relatórios', 'Dados', 'Excel'], tone: 'orange' },
  { id: 'uber', title: 'Atualizar Responsáveis', description: 'Atualiza responsáveis e vínculos usando uma base de referência.', category: 'Bases & Contratos', duration: '4 a 8 min', tags: ['Base de dados', 'Planilhas', 'Excel'], tone: 'yellow' },
  { id: 'chamados', title: 'Monitorar Pendências', description: 'Monitora solicitações próximas do prazo e sinaliza pendências.', category: 'Integrações & Relatórios', duration: 'contínuo', tags: ['Monitoramento', 'Autenticação'], tone: 'orange' },
]

const app = document.querySelector<HTMLDivElement>('#app')!
let currentView: View = 'home'
let query = ''
let activeRobot: Robot | null = null
let runTimer: number | undefined
let selectedHelpTopic = 0
let quickConfigOpen = false
let quickRobotIds = ['produtividade', 'malote', 'uber', 'chamados']
let executionHistory: ExecutionRecord[] = []
let runningRobot: Robot | null = null
let notification: { status: ExecutionStatus; message: string } | null = null
let notificationTimer: number | undefined

const icon = (name: string) => `<span class="icon icon-${name}" aria-hidden="true"></span>`

function layout(content: string) {
  return `<div class="shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">✣</div><div>Automações<br><strong>Administrativas</strong></div></div>
      <nav class="nav" aria-label="Navegação principal">
        ${navItem('home', 'Início', 'home')}
        ${navItem('robots', 'Robôs', 'bot')}
        ${navItem('settings', 'Configurações', 'gear')}
        ${navItem('help', 'Ajuda', 'help')}
      </nav>
      <div class="sidebar-status"><span>Status do Hub</span><small>${icon('warning')} Credenciais pendentes</small></div>
    </aside>
    <main class="main">${content}</main>
    ${notification ? `<div class="toast toast-${notification.status}" role="status"><span class="toast-mark">${notification.status === 'sucesso' ? '✓' : notification.status === 'cancelado' ? '!' : '×'}</span><div><strong>${notification.status === 'sucesso' ? 'Processo concluído' : notification.status === 'cancelado' ? 'Processo cancelado' : 'Processo não concluído'}</strong><span>${notification.message}</span></div><button id="close-toast" aria-label="Fechar notificação">×</button></div>` : ''}
    ${activeRobot ? robotModal() : ''}
  </div>`
}

function navItem(view: View, label: string, glyph: string) {
  return `<button class="nav-item ${currentView === view ? 'active' : ''}" data-view="${view}">${icon(glyph)}<span>${label}</span></button>`
}

function header(title: string, subtitle: string, eyebrow = '') {
  return `<header class="page-header">${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h1>${title}</h1><p>${subtitle}</p></header>`
}

function homeView() {
  return `<section class="page home-page">${header('Bem-vindo ao Hub Central', 'Acompanhe suas automações, execute ações rápidas e veja o histórico.')}
    <div class="stats-grid">
      ${stat('bot', String(robots.length), 'Robôs disponíveis')} ${stat('clock', executionHistory[0]?.robot ?? 'Nenhuma', 'Última execução')} ${stat('lock', 'Pendentes', 'Credenciais')} ${stat('rocket', 'Local', 'Ambiente')}
    </div>
    <section class="panel quick-panel"><div class="section-heading"><div><h2>Ações rápidas</h2><p>Escolha os processos que devem aparecer como atalhos.</p></div><button class="secondary" id="toggle-quick-config">${quickConfigOpen ? 'Fechar' : 'Configurar'}</button></div>${quickConfigOpen ? quickConfigPanel() : `<div class="quick-actions">${quickRobotIds.map((id) => { const robot = robots.find((item) => item.id === id)!; return quickAction(robot.id, robot.title, robot.id) }).join('')}</div>`}</section>
    ${historyPanel()}
  </section>`
}

function stat(glyph: string, value: string, label: string) { return `<div class="stat-card"><div class="stat-icon">${icon(glyph)}</div><strong>${value}</strong><span>${label}</span></div>` }
function quickAction(id: string, label: string, glyph: string) { return `<button class="quick-action" data-run="${id}">${icon(glyph)}<span>${label}</span><b>›</b></button>` }
function quickConfigPanel() { return `<div class="quick-config"><p>Selecione quais robôs devem aparecer nos atalhos da tela inicial.</p><div class="quick-config-grid">${robots.map((robot) => `<label><input type="checkbox" data-quick-id="${robot.id}" ${quickRobotIds.includes(robot.id) ? 'checked' : ''}><span>${robot.title}</span></label>`).join('')}</div></div>` }
function historyPanel() { return `<section class="panel history"><div class="section-heading"><div><h2>Últimas execuções</h2><p>${executionHistory.length ? 'Acompanhe os processos executados recentemente.' : 'Nenhuma execução registrada ainda.'}</p></div></div>${executionHistory.length ? `<div class="history-list">${executionHistory.slice(0, 8).map((record) => `<div class="history-row"><span class="history-status status-${record.status}">${record.status}</span><strong>${record.robot}</strong><time>${record.timestamp}</time></div>`).join('')}</div>` : `<div class="empty-history">${icon('pulse')}<span>Os logs das automações aparecerão aqui.</span></div>`}</section>` }

function robotsView() {
  const filtered = robots.filter((robot) => `${robot.title} ${robot.description} ${robot.category} ${robot.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
  const groups = [...new Set(filtered.map((robot) => robot.category))]
  return `<section class="page robots-page">${header('Central de Robôs', 'Escolha um robô, confira os requisitos e acompanhe a execução em tempo real.')}
    <div class="search-row"><label class="search-box">${icon('search')}<input id="search" value="${query}" placeholder="Buscar robô por nome, categoria ou requisito..." /></label><button class="secondary" id="clear-search">Limpar</button></div>
    <div class="robot-columns">${groups.map((group) => `<section class="robot-group"><div class="group-title"><h2>${group}</h2><span>${filtered.filter((r) => r.category === group).length} robôs</span></div>${filtered.filter((r) => r.category === group).map(robotCard).join('')}</section>`).join('')}</div>
    ${filtered.length === 0 ? `<div class="empty-state"><div class="empty-icon">⌕</div><h2>Nenhum robô encontrado</h2><p>Tente buscar por outro nome ou categoria.</p></div>` : ''}
    <section class="execution panel"><div class="execution-head"><div><h2>Execução</h2><p id="execution-status">Pronto para executar uma automação.</p></div><button class="cancel" id="cancel-run">CANCELAR PROCESSO ATIVO</button></div><div class="progress-track"><span id="progress-bar"></span></div><pre id="logs">Sistema Central iniciado com sucesso.\nSelecione o processo que deseja executar.\n------------------------------------------</pre></section>
  </section>`
}

function robotCard(robot: Robot) { return `<article class="robot-card"><div class="robot-card-top"><div class="robot-title"><span class="robot-bullet tone-${robot.tone}">${icon('spark')}</span><div><h3>${robot.title}</h3><p>${robot.description}</p></div></div><button class="help-button" data-help="${robot.id}" aria-label="Ajuda">?</button></div><div class="robot-meta"><span>${icon('clock')} ${robot.duration}</span><strong>${robot.tags.map((tag) => tag).join(' · ')}</strong></div><button class="run-button" data-run="${robot.id}">${icon('play')} Executar</button></article>` }

function settingsView() { return `<section class="page settings-page">${header('Configurar Credenciais do Sistema', 'Salve as credenciais usadas pelos robôs. Mantenha este arquivo seguro.')}
  <div class="credential-status"><div><strong>Status das credenciais</strong><p>${icon('warning')} Credenciais pendentes</p><small>Última atualização: Não registrada</small></div><span>Dica: não compartilhe os arquivos locais de configuração com terceiros.</span></div>
  <form class="settings-grid" id="settings-form"><div class="panel form-panel"><h2 class="green-heading">Acessos corporativos & Consultas</h2>${input('E-mail corporativo', 'email', 'nome@empresa.com.br')}${input('Senha corporativa', 'password', '••••••••', true)}${input('Senha do serviço de arquivos', 'malote', '••••••••', true)}${input('Chave de integração principal', 'agilis', 'Cole sua chave de integração', true)}<button type="button" class="text-link">Como gerar uma chave de integração?</button></div><div class="panel form-panel"><h2 class="yellow-heading">Serviço de Entregas</h2>${input('Código administrativo', 'codigo', '00000000')}${input('E-mail do serviço', 'correios-email', 'nome@empresa.com.br')}${input('Senha do serviço', 'correios-password', '••••••••', true)}<h2 class="pink-heading spaced">Integrações de Mensageria</h2><button type="button" class="text-link">Como gerar as chaves da integração?</button>${input('Identificador do cliente', 'podio-id', 'ID da aplicação')}${input('Chave privada', 'podio-secret', '••••••••', true)}${input('Identificador da aplicação', 'podio-app', '00000000')}${input('Token da aplicação', 'podio-token', 'Token da aplicação', true)}<h2 class="orange-heading spaced">Plataforma Externa</h2>${input('E-mail da plataforma', 'uber-email', 'nome@empresa.com.br')}${input('Senha da plataforma', 'uber-password', '••••••••', true)}</div><div class="form-actions"><span id="save-message"></span><button class="primary" type="submit">Salvar credenciais</button></div></form>
  </section>` }
function input(label: string, id: string, placeholder: string, secret = false) { return `<label class="field">${label}<span class="input-wrap"><input id="${id}" type="${secret ? 'password' : 'text'}" placeholder="${placeholder}" />${secret ? `<button type="button" class="show-password" data-target="${id}">${icon('eye')}</button>` : ''}</span></label>` }

function helpView() { const topics = ['Primeiros passos', 'Credenciais', 'Chaves de integração', 'Acessos externos', 'Arquivos e documentos', 'Consultas e pendências', 'Bases e contratos', 'Cancelamento', 'FAQ']; return `<section class="page help-page">${header('Guia de Uso e Tutorial', 'Consulte instruções por tema. Use Ctrl+F para buscar dentro do texto.')}
  <div class="help-layout"><aside class="help-nav">${topics.map((item, index) => `<button class="${index === selectedHelpTopic ? 'selected' : ''}" data-help-topic="${index}">${item}</button>`).join('')}</aside><article class="help-content">${helpTopicContent(selectedHelpTopic, topics[selectedHelpTopic])}</article></div></section>` }
function helpTopicContent(topic: number, title: string) { const contents = [
  `<p>Bem-vindo à Central de Automações.</p><ol><li>Acesse a aba Configurações.</li><li>Preencha suas credenciais.</li><li>Salve as credenciais.</li><li>Acesse a aba Robôs.</li><li>Escolha o processo desejado.</li><li>Acompanhe o progresso e os logs pela área de execução.</li></ol><p>Antes de rodar qualquer processo, confirme se os arquivos necessários estão nas pastas corretas.</p>`,
  `<p>As credenciais ficam disponíveis apenas nesta demonstração local.</p><p>Preencha os campos necessários, confira os dados e use o botão de salvamento. Senhas são exibidas somente quando solicitado.</p>`,
  `<p>As chaves permitem que os robôs consultem serviços externos autorizados.</p><p>Mantenha tokens privados e substitua valores fictícios pelas credenciais do ambiente de destino quando a integração for implementada.</p>`,
  `<p>Os acessos externos são utilizados por processos que dependem de autenticação.</p><p>Deixe o navegador disponível quando um robô solicitar autenticação adicional.</p>`,
  `<p>Os arquivos de entrada e saída devem ficar nas pastas configuradas para cada processo.</p><p>Antes da execução, confira nomes, formatos e se nenhum arquivo está aberto em outro programa.</p>`,
  `<p>A área de pendências mostra o andamento da execução e os registros encontrados.</p><p>Use os logs para identificar em qual etapa o processo está e revise o resultado ao final.</p>`,
  `<p>Os processos de base usam planilhas de referência para organizar e distribuir informações.</p><p>Atualize as bases antes de iniciar uma nova rodada.</p>`,
  `<p>Use o botão vermelho de cancelamento quando precisar interromper uma execução ativa.</p><p>Depois do cancelamento, confira se nenhum arquivo ficou incompleto antes de executar novamente.</p>`,
  `<p>Os robôs desta versão usam dados fictícios e não alteram sistemas reais.</p><p>Uma execução por vez mantém os arquivos e os logs organizados.</p>`,
]; return `<h2>${title.toUpperCase()}</h2>${contents[topic]}${topic === 0 || topic === 7 ? `<div class="help-callout"><strong>Uma automação por vez</strong><span>Processos que controlam a tela podem usar mouse e teclado. Não utilize o computador durante a execução.</span></div>` : ''}` }

function robotModal() { return `<div class="modal-backdrop" id="modal-backdrop"><section class="modal"><div class="modal-icon">${icon('box')}</div><div><h2>${activeRobot?.title}</h2><p>Ajuda específica desta automação</p></div><button class="close-modal" id="close-modal">×</button><div class="modal-body"><h3>O que este robô faz</h3><p>${activeRobot?.description} O processo utiliza dados fictícios nesta demonstração e simula o acompanhamento de cada etapa.</p><h3>Antes de executar</h3><ul><li>Confira os arquivos necessários na pasta do processo.</li><li>Verifique as credenciais e acessos configurados.</li><li>Revise o resultado antes de qualquer envio definitivo.</li></ul></div><button class="primary" id="modal-run">Executar agora</button></section></div>` }

function render() { app.innerHTML = layout(currentView === 'home' ? homeView() : currentView === 'robots' ? robotsView() : currentView === 'settings' ? settingsView() : helpView()); bindEvents() }
function bindEvents() {
  document.getElementById('close-toast')?.addEventListener('click', () => { notification = null; window.clearTimeout(notificationTimer); render() })
  document.querySelectorAll<HTMLElement>('[data-view]').forEach((el) => el.addEventListener('click', () => { currentView = el.dataset.view as View; render() }))
  document.querySelectorAll<HTMLElement>('[data-run]').forEach((el) => el.addEventListener('click', () => { activeRobot = robots.find((robot) => robot.id === el.dataset.run) ?? null; if (currentView !== 'robots') currentView = 'robots'; render() }))
  document.querySelectorAll<HTMLElement>('[data-help]').forEach((el) => el.addEventListener('click', () => { activeRobot = robots.find((robot) => robot.id === el.dataset.help) ?? null; render() }))
  document.querySelectorAll<HTMLElement>('[data-help-topic]').forEach((el) => el.addEventListener('click', () => { selectedHelpTopic = Number(el.dataset.helpTopic); render() }))
  document.getElementById('close-modal')?.addEventListener('click', () => { activeRobot = null; render() })
  document.getElementById('modal-backdrop')?.addEventListener('click', (event) => { if (event.target === event.currentTarget) { activeRobot = null; render() } })
  document.getElementById('modal-run')?.addEventListener('click', () => { const robotToRun = activeRobot; activeRobot = null; render(); if (robotToRun) setTimeout(() => startRun(robotToRun), 0) })
  const search = document.getElementById('search') as HTMLInputElement | null
  search?.addEventListener('input', () => { query = search.value; render(); const input = document.getElementById('search') as HTMLInputElement; input.focus(); input.setSelectionRange(query.length, query.length) })
  document.getElementById('clear-search')?.addEventListener('click', () => { query = ''; render() })
  document.getElementById('toggle-quick-config')?.addEventListener('click', () => { quickConfigOpen = !quickConfigOpen; render() })
  document.querySelectorAll<HTMLInputElement>('[data-quick-id]').forEach((input) => input.addEventListener('change', () => { const id = input.dataset.quickId!; quickRobotIds = input.checked ? [...new Set([...quickRobotIds, id])] : quickRobotIds.filter((item) => item !== id); render() }))
  document.getElementById('cancel-run')?.addEventListener('click', cancelRun)
  document.querySelectorAll<HTMLButtonElement>('.show-password').forEach((button) => button.addEventListener('click', () => { const target = document.getElementById(button.dataset.target ?? '') as HTMLInputElement; target.type = target.type === 'password' ? 'text' : 'password' }))
  document.getElementById('settings-form')?.addEventListener('submit', (event) => { event.preventDefault(); const message = document.getElementById('save-message'); if (message) { message.textContent = 'Credenciais salvas nesta demonstração.'; message.className = 'saved-message' } })
}
function recordExecution(robot: Robot, status: ExecutionStatus) { executionHistory = [{ robot: robot.title, status, timestamp: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) }, ...executionHistory].slice(0, 8) }
function notify(status: ExecutionStatus, message: string) { notification = { status, message }; window.clearTimeout(notificationTimer); render(); notificationTimer = window.setTimeout(() => { notification = null; render() }, 5000) }
function startRun(robot: Robot) { if (currentView !== 'robots') { currentView = 'robots'; render() } const status = document.getElementById('execution-status'); const logs = document.getElementById('logs'); const bar = document.getElementById('progress-bar'); if (!status || !logs || !bar) return; runningRobot = robot; let progress = 0; logs.textContent = `Iniciando: ${robot.title}\nPreparando ambiente seguro...\n`; status.textContent = `Executando ${robot.title}`; bar.style.width = '0%'; window.clearInterval(runTimer); window.clearTimeout(notificationTimer); notification = null; runTimer = window.setInterval(() => { try { progress += 20; bar.style.width = `${progress}%`; logs.textContent += `[${progress}%] ${['Validando arquivos locais', 'Conectando aos sistemas', 'Processando dados fictícios', 'Gerando resultado', 'Execução concluída'][progress / 20 - 1]}\n`; if (progress >= 100) { window.clearInterval(runTimer); recordExecution(robot, 'sucesso'); runningRobot = null; status.textContent = 'Execução concluída com sucesso'; logs.textContent += '------------------------------------------\nProcesso finalizado. Revise o arquivo de saída.'; notify('sucesso', `${robot.title} foi executado com sucesso.`) } } catch { window.clearInterval(runTimer); recordExecution(robot, 'falhou'); runningRobot = null; status.textContent = 'Execução falhou'; logs.textContent += '\nO processo encontrou um erro e foi encerrado.\n'; notify('falhou', `${robot.title} encontrou um erro durante a execução.`) } }, 500) }
function cancelRun() { window.clearInterval(runTimer); const status = document.getElementById('execution-status'); const logs = document.getElementById('logs'); const bar = document.getElementById('progress-bar'); if (runningRobot) { const cancelledRobot = runningRobot; recordExecution(cancelledRobot, 'cancelado'); runningRobot = null; notify('cancelado', `${cancelledRobot.title} foi interrompido pelo usuário.`) } if (status) status.textContent = 'Processo cancelado pelo usuário'; if (bar) bar.style.width = '0%'; if (logs) logs.textContent += '\nProcesso cancelado com segurança.\n' }

render()
