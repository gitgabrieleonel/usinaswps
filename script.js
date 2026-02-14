// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCGjY_-zk9NV-EeC82idU_gsxMejCrlLeI",
    authDomain: "controlesolar-92343.firebaseapp.com",
    projectId: "controlesolar-92343",
    storageBucket: "controlesolar-92343.firebasestorage.app",
    messagingSenderId: "982365669692",
    appId: "1:982365669692:web:72821077d36f19a341f639",
    measurementId: "G-EWBQ7LVFZQ"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elementos do DOM
const modal = document.getElementById('orcamento-modal');
const loadingOverlay = document.getElementById('loadingOverlay');
const orcamentosList = document.getElementById('orcamentos-list');
const usinasTableBody = document.getElementById('usinas-table-body');
const concluidosTableBody = document.getElementById('concluidos-table-body');
const orcamentosCount = document.getElementById('orcamentos-count');
const dataInicio = document.getElementById('data-inicio');
const dataFim = document.getElementById('data-fim');
const searchInput = document.getElementById('searchInput');
const form = document.getElementById('orcamento-form');

// Elementos do Dashboard
const totalUsinasEl = document.getElementById('totalUsinas');
const kwhTotalEl = document.getElementById('kwhTotal');
const concluidasEl = document.getElementById('concluidas');
const emProgressoEl = document.getElementById('emProgresso');

// Estado da aplicação
let filtrosAtivos = {
    dataInicio: null,
    dataFim: null
};
let termoBusca = '';
let usinasAtuais = [];
let concluidosAtuais = [];
let orcamentosAtuais = [];

// Configurar data atual nos inputs
const hoje = new Date().toISOString().split('T')[0];
if (dataInicio) dataInicio.value = hoje;
if (dataFim) {
    const fim = new Date();
    fim.setDate(fim.getDate() + 30);
    dataFim.value = fim.toISOString().split('T')[0];
}

// Mostrar/esconder loading
function showLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('active');
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.remove('active');
}

// Event Listeners para as abas
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        
        btn.classList.add('active');
        const tabName = btn.dataset.tab;
        const section = document.getElementById(`${tabName}-section`);
        if (section) section.classList.add('active');
        
        // Mostrar/esconder elementos específicos por aba
        toggleElementsByTab(tabName);
        
        // Carregar dados da aba selecionada
        carregarDados(tabName);
    });
});

// Função para mostrar/esconder elementos por aba
function toggleElementsByTab(tabName) {
    const dateFilters = document.getElementById('dateFilters');
    const orcamentosCount = document.getElementById('orcamentos-count');
    const dashboardCards = document.getElementById('dashboardCards');
    const usinasHeader = document.getElementById('usinasHeader');
    
    // Esconder todos primeiro
    if (dateFilters) dateFilters.classList.add('hidden');
    if (orcamentosCount) orcamentosCount.classList.add('hidden');
    if (dashboardCards) dashboardCards.classList.add('hidden');
    if (usinasHeader) usinasHeader.classList.add('hidden');
    
    // Mostrar baseado na aba ativa
    switch(tabName) {
        case 'orcamentos':
            if (dateFilters) dateFilters.classList.remove('hidden');
            if (orcamentosCount) orcamentosCount.classList.remove('hidden');
            break;
        case 'usinas':
            if (dashboardCards) dashboardCards.classList.remove('hidden');
            if (usinasHeader) usinasHeader.classList.remove('hidden');
            break;
        case 'concluidos':
            // Não mostra elementos específicos
            break;
    }
}

// Event listener para busca - CORRIGIDO
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        termoBusca = e.target.value.toLowerCase().trim();
        const tabAtiva = document.querySelector('.tab-btn.active')?.dataset.tab;
        
        if (!tabAtiva) return;
        
        switch(tabAtiva) {
            case 'usinas':
                filtrarUsinas();
                break;
            case 'concluidos':
                filtrarConcluidos();
                break;
            case 'orcamentos':
                filtrarOrcamentos();
                break;
        }
    });
}

// Função para filtrar usinas - CORRIGIDA
function filtrarUsinas() {
    if (!termoBusca || termoBusca === '') {
        renderizarTabelaUsinas(usinasAtuais);
        return;
    }
    
    const filtradas = usinasAtuais.filter(usina => {
        const nomeCliente = (usina.nomeCliente || '').toLowerCase();
        const cidade = (usina.cidade || '').toLowerCase();
        return nomeCliente.includes(termoBusca) || cidade.includes(termoBusca);
    });
    
    renderizarTabelaUsinas(filtradas);
}

// Função para filtrar concluídos - CORRIGIDA
function filtrarConcluidos() {
    if (!termoBusca || termoBusca === '') {
        renderizarTabelaConcluidos(concluidosAtuais);
        return;
    }
    
    const filtradas = concluidosAtuais.filter(concluido => {
        const nomeCliente = (concluido.nomeCliente || '').toLowerCase();
        const cidade = (concluido.cidade || '').toLowerCase();
        return nomeCliente.includes(termoBusca) || cidade.includes(termoBusca);
    });
    
    renderizarTabelaConcluidos(filtradas);
}

// Função para filtrar orçamentos - CORRIGIDA
function filtrarOrcamentos() {
    if (!termoBusca || termoBusca === '') {
        renderizarOrcamentos(orcamentosAtuais);
        return;
    }
    
    const filtrados = orcamentosAtuais.filter(orc => {
        const nomeCliente = (orc.nomeCliente || '').toLowerCase();
        const cidade = (orc.cidade || '').toLowerCase();
        return nomeCliente.includes(termoBusca) || cidade.includes(termoBusca);
    });
    
    renderizarOrcamentos(filtrados);
}

// Função para carregar dados baseado na aba
async function carregarDados(tabName) {
    showLoading();
    try {
        switch(tabName) {
            case 'orcamentos':
                await carregarOrcamentos();
                break;
            case 'usinas':
                await carregarUsinas();
                break;
            case 'concluidos':
                await carregarConcluidos();
                break;
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarNotificacao('Erro ao carregar dados do Firebase', 'error');
    } finally {
        hideLoading();
    }
}

// Carregar orçamentos do Firebase
async function carregarOrcamentos() {
    try {
        let query = db.collection('orcamentos').where('status', '==', 'pendente');
        
        // Aplicar filtros de data
        if (filtrosAtivos.dataInicio) {
            const inicio = new Date(filtrosAtivos.dataInicio);
            inicio.setHours(0, 0, 0, 0);
            query = query.where('dataCriacao', '>=', inicio.toISOString());
        }
        
        if (filtrosAtivos.dataFim) {
            const fim = new Date(filtrosAtivos.dataFim);
            fim.setHours(23, 59, 59, 999);
            query = query.where('dataCriacao', '<=', fim.toISOString());
        }
        
        const snapshot = await query.get();
        orcamentosAtuais = [];
        
        snapshot.forEach(doc => {
            orcamentosAtuais.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Aplicar busca se houver termo
        if (termoBusca) {
            filtrarOrcamentos();
        } else {
            renderizarOrcamentos(orcamentosAtuais);
        }
        
        atualizarContadorOrcamentos(orcamentosAtuais.length);
    } catch (error) {
        console.error('Erro ao carregar orçamentos:', error);
        throw error;
    }
}

// Carregar usinas do Firebase
async function carregarUsinas() {
    try {
        const snapshot = await db.collection('orcamentos')
            .where('status', '==', 'aprovado')
            .get();
        
        usinasAtuais = [];
        snapshot.forEach(doc => {
            usinasAtuais.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Aplicar busca se houver termo
        if (termoBusca) {
            filtrarUsinas();
        } else {
            renderizarTabelaUsinas(usinasAtuais);
        }
        
        atualizarDashboard(usinasAtuais);
    } catch (error) {
        console.error('Erro ao carregar usinas:', error);
        throw error;
    }
}

// Carregar concluídos do Firebase
async function carregarConcluidos() {
    try {
        const snapshot = await db.collection('orcamentos')
            .where('status', '==', 'concluido')
            .get();
        
        concluidosAtuais = [];
        snapshot.forEach(doc => {
            concluidosAtuais.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Aplicar busca se houver termo
        if (termoBusca) {
            filtrarConcluidos();
        } else {
            renderizarTabelaConcluidos(concluidosAtuais);
        }
    } catch (error) {
        console.error('Erro ao carregar concluídos:', error);
        throw error;
    }
}

// Função para alternar status de um item
async function alternarStatus(usinaId, campo, valorAtual) {
    showLoading();
    
    try {
        // Alternar entre Pendente e Concluído
        const novoValor = valorAtual === 'Pendente' ? 'Concluído' : 'Pendente';
        
        // Buscar dados atuais da usina
        const docRef = db.collection('orcamentos').doc(usinaId);
        
        // Atualizar o campo específico
        await docRef.update({
            [campo]: novoValor
        });
        
        // Buscar dados atualizados
        const docAtualizado = await docRef.get();
        const usinaAtualizada = docAtualizado.data();
        
        // Contar quantos campos estão como "Concluído"
        const campos = ['art', 'parecerAcesso', 'material', 'estoque', 'instalado'];
        let conclusoes = 0;
        
        campos.forEach(c => {
            if (usinaAtualizada[c] === 'Concluído') {
                conclusoes++;
            }
        });
        
        // Calcular progresso (cada conclusão = 20%)
        const novoProgresso = conclusoes * 20;
        
        // Atualizar progresso
        await docRef.update({
            progresso: novoProgresso
        });
        
        // Se progresso for 100%, mover para concluídos
        if (novoProgresso === 100) {
            await docRef.update({
                status: 'concluido',
                dataConclusao: new Date().toISOString()
            });
            
            mostrarNotificacao('Usina concluída! Movida para a aba Concluídos.', 'success');
        }
        
        // Recarregar dados da aba atual
        const tabAtiva = document.querySelector('.tab-btn.active').dataset.tab;
        await carregarDados(tabAtiva);
        
    } catch (error) {
        console.error('Erro ao alternar status:', error);
        mostrarNotificacao('Erro ao atualizar status', 'error');
    } finally {
        hideLoading();
    }
}

// Renderizar tabela de usinas
function renderizarTabelaUsinas(usinas) {
    if (!usinasTableBody) return;
    
    if (usinas.length === 0) {
        usinasTableBody.innerHTML = `
            <tr>
                <td colspan="11" class="empty-table">
                    <i class="fas fa-solar-panel fa-3x"></i>
                    <p>Nenhuma usina em andamento</p>
                </td>
            </tr>
        `;
        return;
    }
    
    usinasTableBody.innerHTML = usinas.map(usina => {
        const progresso = usina.progresso || 0;
        const art = usina.art || 'Pendente';
        const parecer = usina.parecerAcesso || 'Pendente';
        const material = usina.material || 'Pendente';
        const estoque = usina.estoque || 'Pendente';
        const instalado = usina.instalado || 'Pendente';
        
        return `
            <tr>
                <td><strong>${usina.nomeCliente || ''}</strong></td>
                <td>${usina.cidade || ''}</td>
                <td>${formatarData(usina.dataCriacao)}</td>
                <td>${usina.kwh || 0} KWH</td>
                <td>
                    <button class="status-btn ${art === 'Concluído' ? 'status-concluido' : 'status-pendente'}" 
                            onclick="alternarStatus('${usina.id}', 'art', '${art}')">
                        ${art === 'Concluído' ? '✔' : '○'} ${art}
                    </button>
                </td>
                <td>
                    <button class="status-btn ${parecer === 'Concluído' ? 'status-concluido' : 'status-pendente'}" 
                            onclick="alternarStatus('${usina.id}', 'parecerAcesso', '${parecer}')">
                        ${parecer === 'Concluído' ? '✔' : '○'} ${parecer}
                    </button>
                </td>
                <td>
                    <button class="status-btn ${material === 'Concluído' ? 'status-concluido' : 'status-pendente'}" 
                            onclick="alternarStatus('${usina.id}', 'material', '${material}')">
                        ${material === 'Concluído' ? '✔' : '○'} ${material}
                    </button>
                </td>
                <td>
                    <button class="status-btn ${estoque === 'Concluído' ? 'status-concluido' : 'status-pendente'}" 
                            onclick="alternarStatus('${usina.id}', 'estoque', '${estoque}')">
                        ${estoque === 'Concluído' ? '✔' : '○'} ${estoque}
                    </button>
                </td>
                <td>
                    <button class="status-btn ${instalado === 'Concluído' ? 'status-concluido' : 'status-pendente'}" 
                            onclick="alternarStatus('${usina.id}', 'instalado', '${instalado}')">
                        ${instalado === 'Concluído' ? '✔' : '○'} ${instalado}
                    </button>
                </td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progresso}%"></div>
                        <span class="progress-text">${progresso}%</span>
                    </div>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn-delete" onclick="excluirProjeto('${usina.id}', event)">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Renderizar tabela de concluídos - ATUALIZADA com as colunas solicitadas
function renderizarTabelaConcluidos(concluidos) {
    if (!concluidosTableBody) return;
    
    if (concluidos.length === 0) {
        concluidosTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">
                    <i class="fas fa-check-circle fa-3x"></i>
                    <p>Nenhum projeto concluído</p>
                </td>
            </tr>
        `;
        return;
    }
    
    concluidosTableBody.innerHTML = concluidos.map(concluido => {
        return `
            <tr>
                <td><strong>${concluido.nomeCliente || ''}</strong></td>
                <td>${concluido.contato || ''}</td>
                <td>${concluido.cidade || ''}</td>
                <td>${formatarData(concluido.dataConclusao || concluido.dataCriacao)}</td>
                <td>R$ ${parseFloat(concluido.valor || 0).toFixed(2)}</td>
                <td>${concluido.prazo || 'à vista'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-delete" onclick="excluirProjeto('${concluido.id}', event)">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Atualizar dashboard
function atualizarDashboard(usinas) {
    if (!totalUsinasEl || !kwhTotalEl || !concluidasEl || !emProgressoEl) return;
    
    const total = usinas.length;
    const kwhTotal = usinas.reduce((acc, usina) => acc + parseFloat(usina.kwh || 0), 0);
    const concluidas = usinas.filter(u => u.progresso === 100).length;
    const emProgresso = total - concluidas;
    
    totalUsinasEl.textContent = total;
    kwhTotalEl.textContent = kwhTotal.toFixed(0);
    concluidasEl.textContent = concluidas;
    emProgressoEl.textContent = emProgresso;
}

// Renderizar orçamentos
function renderizarOrcamentos(orcamentos) {
    if (!orcamentosList) return;
    
    if (orcamentos.length === 0) {
        orcamentosList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-invoice fa-3x"></i>
                <p>Nenhum orçamento cadastrado</p>
                <span>Clique em "Novo Orçamento" para começar</span>
            </div>
        `;
        return;
    }
    
    orcamentosList.innerHTML = orcamentos.map(orc => `
        <div class="orcamento-card" data-id="${orc.id}">
            <div class="orcamento-header">
                <h3><i class="fas fa-user"></i> ${orc.nomeCliente || ''}</h3>
                <span class="status-badge status-pendente">Pendente</span>
            </div>
            <div class="orcamento-details">
                <div><i class="fas fa-phone"></i> ${orc.contato || ''}</div>
                <div><i class="fas fa-city"></i> ${orc.cidade || ''}</div>
                <div><i class="fas fa-bolt"></i> ${orc.kwh || 0} KWH</div>
                <div><i class="fas fa-dollar-sign"></i> R$ ${parseFloat(orc.valor || 0).toFixed(2)}</div>
                <div><i class="fas fa-clock"></i> ${orc.prazo || 'à vista'}</div>
                <div><i class="fas fa-calendar"></i> ${formatarData(orc.dataCriacao)}</div>
            </div>
            ${orc.observacao ? `<div class="observacao"><i class="fas fa-comment"></i> ${orc.observacao}</div>` : ''}
            <div class="orcamento-actions">
                <button class="btn-aprovar" onclick="aprovarOrcamento('${orc.id}')">
                    <i class="fas fa-check"></i> Aprovar
                </button>
                <button class="btn-rejeitar" onclick="rejeitarOrcamento('${orc.id}')">
                    <i class="fas fa-times"></i> Rejeitar
                </button>
            </div>
        </div>
    `).join('');
}

// Função para formatar data
function formatarData(data) {
    if (!data) return 'Data não disponível';
    try {
        return new Date(data).toLocaleDateString('pt-BR');
    } catch {
        return 'Data inválida';
    }
}

// Função para atualizar contador de orçamentos
function atualizarContadorOrcamentos(count) {
    if (orcamentosCount) {
        orcamentosCount.textContent = `${count} orçamento${count !== 1 ? 's' : ''}`;
    }
}

// Função para abrir o modal de orçamento
function abrirModal() {
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Função para fechar o modal de orçamento
function fecharModal() {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        if (form) form.reset();
    }
}

// Fechar modal ao clicar fora
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        fecharModal();
    }
});

// Função para salvar orçamento no Firebase
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        showLoading();
        
        try {
            const orcamento = {
                nomeCliente: document.getElementById('nome-cliente').value,
                contato: document.getElementById('contato').value,
                cidade: document.getElementById('cidade').value,
                kwh: document.getElementById('kwh').value,
                valor: document.getElementById('valor').value,
                prazo: document.getElementById('prazo').value,
                observacao: document.getElementById('observacao').value,
                status: 'pendente',
                progresso: 0,
                art: 'Pendente',
                parecerAcesso: 'Pendente',
                material: 'Pendente',
                estoque: 'Pendente',
                instalado: 'Pendente',
                dataCriacao: new Date().toISOString()
            };
            
            await db.collection('orcamentos').add(orcamento);
            
            // Recarregar orçamentos
            await carregarOrcamentos();
            
            fecharModal();
            mostrarNotificacao('Orçamento salvo com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar orçamento:', error);
            mostrarNotificacao('Erro ao salvar orçamento', 'error');
        } finally {
            hideLoading();
        }
    });
}

// Função para aprovar orçamento
async function aprovarOrcamento(id) {
    if (!confirm('Deseja aprovar este orçamento?')) return;
    
    showLoading();
    
    try {
        await db.collection('orcamentos').doc(id).update({
            status: 'aprovado',
            dataAprovacao: new Date().toISOString()
        });
        
        // Recarregar dados da aba atual
        const tabAtiva = document.querySelector('.tab-btn.active').dataset.tab;
        await carregarDados(tabAtiva);
        
        mostrarNotificacao('Orçamento aprovado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao aprovar orçamento:', error);
        mostrarNotificacao('Erro ao aprovar orçamento', 'error');
    } finally {
        hideLoading();
    }
}

// Função para rejeitar orçamento
async function rejeitarOrcamento(id) {
    if (!confirm('Tem certeza que deseja rejeitar este orçamento?')) return;
    
    showLoading();
    
    try {
        await db.collection('orcamentos').doc(id).delete();
        
        // Recarregar dados da aba atual
        const tabAtiva = document.querySelector('.tab-btn.active').dataset.tab;
        await carregarDados(tabAtiva);
        
        mostrarNotificacao('Orçamento rejeitado!', 'info');
    } catch (error) {
        console.error('Erro ao rejeitar orçamento:', error);
        mostrarNotificacao('Erro ao rejeitar orçamento', 'error');
    } finally {
        hideLoading();
    }
}

// Função para excluir projeto
async function excluirProjeto(id, event) {
    if (event) {
        event.stopPropagation();
    }
    
    if (!confirm('Tem certeza que deseja excluir este projeto permanentemente?')) return;
    
    showLoading();
    
    try {
        await db.collection('orcamentos').doc(id).delete();
        
        // Recarregar dados da aba atual
        const tabAtiva = document.querySelector('.tab-btn.active').dataset.tab;
        await carregarDados(tabAtiva);
        
        mostrarNotificacao('Projeto excluído com sucesso!', 'info');
    } catch (error) {
        console.error('Erro ao excluir projeto:', error);
        mostrarNotificacao('Erro ao excluir projeto', 'error');
    } finally {
        hideLoading();
    }
}

// Função para aplicar filtros
async function aplicarFiltros() {
    filtrosAtivos = {
        dataInicio: dataInicio.value,
        dataFim: dataFim.value
    };
    
    showLoading();
    try {
        await carregarOrcamentos();
        mostrarNotificacao('Filtros aplicados!', 'success');
    } catch (error) {
        console.error('Erro ao aplicar filtros:', error);
        mostrarNotificacao('Erro ao aplicar filtros', 'error');
    } finally {
        hideLoading();
    }
}

// Função para limpar filtros
async function limparFiltros() {
    filtrosAtivos = {
        dataInicio: null,
        dataFim: null
    };
    
    if (dataInicio) dataInicio.value = hoje;
    if (dataFim) {
        const fim = new Date();
        fim.setDate(fim.getDate() + 30);
        dataFim.value = fim.toISOString().split('T')[0];
    }
    
    showLoading();
    try {
        await carregarOrcamentos();
        mostrarNotificacao('Filtros removidos!', 'info');
    } catch (error) {
        console.error('Erro ao limpar filtros:', error);
        mostrarNotificacao('Erro ao limpar filtros', 'error');
    } finally {
        hideLoading();
    }
}

// Função para mostrar notificações
function mostrarNotificacao(mensagem, tipo = 'info') {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    
    let icone, cor;
    switch(tipo) {
        case 'success':
            icone = 'fa-check-circle';
            cor = '#27ae60';
            break;
        case 'error':
            icone = 'fa-exclamation-circle';
            cor = '#e74c3c';
            break;
        default:
            icone = 'fa-info-circle';
            cor = '#3498db';
    }
    
    notificacao.innerHTML = `
        <i class="fas ${icone}"></i>
        <span>${mensagem}</span>
    `;
    
    notificacao.style.position = 'fixed';
    notificacao.style.bottom = '20px';
    notificacao.style.left = '50%';
    notificacao.style.transform = 'translateX(-50%)';
    notificacao.style.backgroundColor = cor;
    notificacao.style.color = 'white';
    notificacao.style.padding = '10px 20px';
    notificacao.style.borderRadius = '40px';
    notificacao.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    notificacao.style.display = 'flex';
    notificacao.style.alignItems = 'center';
    notificacao.style.gap = '8px';
    notificacao.style.zIndex = '2000';
    notificacao.style.fontSize = '0.9em';
    notificacao.style.animation = 'slideIn 0.3s';
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.style.animation = 'fadeOut 0.3s';
        setTimeout(() => {
            if (document.body.contains(notificacao)) {
                document.body.removeChild(notificacao);
            }
        }, 300);
    }, 3000);
}

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', () => {
    // Esconder elementos específicos inicialmente
    const dashboardCards = document.getElementById('dashboardCards');
    const usinasHeader = document.getElementById('usinasHeader');
    
    if (dashboardCards) dashboardCards.classList.add('hidden');
    if (usinasHeader) usinasHeader.classList.add('hidden');
    
    carregarOrcamentos();
});

// Fechar modal com tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (modal && modal.style.display === 'flex') {
            fecharModal();
        }
    }
});

// Tornar funções globais para acesso pelo onclick
window.alternarStatus = alternarStatus;
window.excluirProjeto = excluirProjeto;
window.aprovarOrcamento = aprovarOrcamento;
window.rejeitarOrcamento = rejeitarOrcamento;
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.aplicarFiltros = aplicarFiltros;
window.limparFiltros = limparFiltros;