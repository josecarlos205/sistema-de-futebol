// Funções principais do sistema

import { calcularClassificacaoCompleta } from './classificacao.js';
import { calcularTop4Artilheiros } from './artilharia.js';
import { loginUsuario, cadastrarUsuario, getCampeonatos, getJogos, getTimes, getJogadores, getCartoesPorJogador, calcularSuspensoes, supabaseClient } from './database.js';

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar dashboard
    initDashboard();
});

function initDashboard() {
    console.log('Sistema de Campeonato de Futebol inicializado');
}

async function loadDashboardData() {
    console.log('Iniciando carregamento do dashboard...');
    try {
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const tipo = userData.tipo;
        const paginasPermitidas = userData.paginas_permitidas || [];

        console.log('Tipo de usuário:', tipo);
        console.log('Páginas permitidas:', paginasPermitidas);

        // Carregar dados do dashboard apenas se permitido
        const campeonatos = await getCampeonatos();
        console.log('Campeonatos carregados:', campeonatos);

        // Carregar jogos apenas se jogos.html for permitido
        if (tipo === 'admin' || paginasPermitidas.includes('jogos.html')) {
            console.log('Carregando jogos...');
            const jogos = await getJogos(campeonatos[0]?.id);
            console.log('Jogos carregados:', jogos?.length || 0, 'jogos');
            if (jogos && jogos.length > 0) {
                updateProximosJogos(jogos);
            } else {
                console.log('Nenhum jogo encontrado');
            }
        } else {
            console.log('Jogos não permitidos para este usuário');
        }

        // Carregar classificação apenas se classificacao.html for permitido
        if (tipo === 'admin' || paginasPermitidas.includes('classificacao.html')) {
            console.log('Carregando classificação...');
            const classificacao = await calcularClassificacaoCompleta(campeonatos[0]?.id);
            console.log('Classificação carregada:', classificacao?.length || 0, 'times');
            if (classificacao && classificacao.length > 0) {
                updateClassificacao(classificacao);
            } else {
                console.log('Nenhuma classificação encontrada');
            }
        } else {
            console.log('Classificação não permitida para este usuário');
        }

        // Carregar artilheiros apenas se artilharia.html for permitido
        if (tipo === 'admin' || paginasPermitidas.includes('artilharia.html')) {
            console.log('Carregando artilheiros...');
            const artilheiros = await calcularTop4Artilheiros();
            console.log('Artilheiros carregados:', artilheiros?.length || 0, 'artilheiros');
            if (artilheiros && artilheiros.length > 0) {
                updateArtilheiros();
            } else {
                console.log('Nenhum artilheiro encontrado');
            }
        } else {
            console.log('Artilheiros não permitidos para este usuário');
        }

        // Carregar suspensões apenas se cartoes.html for permitido
        if (tipo === 'admin' || paginasPermitidas.includes('cartoes.html')) {
            console.log('Carregando suspensões...');
            const suspensoes = await calcularSuspensoes();
            console.log('Suspensões carregadas:', suspensoes?.length || 0, 'suspensões');
            if (suspensoes && suspensoes.length > 0) {
                updateSuspensoes();
            } else {
                console.log('Nenhuma suspensão encontrada');
            }
        } else {
            console.log('Suspensões não permitidas para este usuário');
        }

        console.log('Dashboard atualizado.');
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
    }
}

function updateProximosJogos(jogos) {
    const container = document.querySelector('.card:nth-child(1) p');
    if (container && jogos) {
        const proximos = jogos.filter(j => j.status === 'agendado').slice(0, 5);
        container.innerHTML = proximos.map(j => `${j.local} - ${new Date(j.data_hora).toLocaleDateString()}`).join('<br>');
    }
}

function updateClassificacao(classificacao) {
    const container = document.querySelector('.card:nth-child(2) p');
    if (container && classificacao) {
        const top4 = classificacao.slice(0, 4);
        container.innerHTML = top4.map((t, i) => `${i+1}. ${t.nome} - ${t.pontos} pts`).join('<br>');
    }
}

async function updateArtilheiros() {
    const container = document.querySelector('.card:nth-child(3) p');
    if (!container) return;

    try {
        const artilheiros = await calcularTop4Artilheiros();

        if (artilheiros && artilheiros.length > 0) {
            container.innerHTML = artilheiros.map((j, i) =>
                `${i+1}. ${j.nome_completo} (${j.time_nome}) - ${j.gols_marcados} gols`
            ).join('<br>');
        } else {
            container.innerHTML = 'Nenhum artilheiro encontrado';
        }
    } catch (error) {
        console.error('Erro ao carregar artilheiros:', error);
        container.innerHTML = 'Erro ao carregar artilheiros';
    }
}

async function updateSuspensoes() {
    const container = document.querySelector('.card:nth-child(4) p');
    if (!container) return;

    try {
        const suspensoes = await calcularSuspensoes();

        if (suspensoes && suspensoes.length > 0) {
            container.innerHTML = suspensoes.map((suspensao, index) =>
                `${index + 1}. ${suspensao.nome_completo} (${suspensao.time_nome}) - ${suspensao.motivo}`
            ).join('<br>');
        } else {
            container.innerHTML = 'Nenhum jogador suspenso no momento';
        }
    } catch (error) {
        console.error('Erro ao carregar suspensões:', error);
        container.innerHTML = 'Erro ao carregar suspensões';
    }
}

// Funções de validação
function validarFormulario(form) {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let valido = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = 'red';
            valido = false;
        } else {
            input.style.borderColor = '#ddd';
        }
    });

    return valido;
}

// Funções utilitárias
function mostrarMensagem(mensagem, tipo = 'info') {
    // Implementar sistema de notificações
    alert(mensagem);
}

async function verificarJogosProximos() {
    try {
        const campeonatos = await getCampeonatos();
        if (campeonatos.length === 0) return;

        const jogos = await getJogos(campeonatos[0].id);
        const agora = new Date();
        const proximosJogos = jogos.filter(jogo => {
            const dataJogo = new Date(jogo.data_hora);
            const diffHoras = (dataJogo - agora) / (1000 * 60 * 60);
            return jogo.status === 'agendado' && diffHoras > 0 && diffHoras <= 24; // Jogos nas próximas 24 horas
        });

        if (proximosJogos.length > 0) {
            mostrarNotificacaoJogos(proximosJogos);
        }
    } catch (error) {
        console.error('Erro ao verificar jogos próximos:', error);
    }
}

function mostrarNotificacaoJogos(jogos) {
    const container = document.createElement('div');
    container.className = 'notificacao-jogos';
    container.innerHTML = `
        <div class="notificacao-header">
            <h4>Jogos Próximos</h4>
            <button onclick="fecharNotificacao(this)">×</button>
        </div>
        <div class="notificacao-body">
            ${jogos.map(jogo => `
                <div class="jogo-item">
                    <strong>${formatarDataHora(jogo.data_hora)}</strong><br>
                    ${jogo.time_casa_nome || 'Time Casa'} vs ${jogo.time_visitante_nome || 'Time Visitante'}<br>
                    Local: ${jogo.local}
                </div>
            `).join('')}
        </div>
    `;

    document.body.appendChild(container);

    // Auto-remover após 10 segundos
    setTimeout(() => {
        if (container.parentNode) {
            container.remove();
        }
    }, 10000);
}

function fecharNotificacao(button) {
    const notificacao = button.closest('.notificacao-jogos');
    notificacao.remove();
}

// Verificar jogos próximos ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    // ... código existente ...

    // Verificar autenticação
    verificarAutenticacao();

    // Verificar jogos próximos
    verificarJogosProximos();

    // Verificar a cada hora
    setInterval(verificarJogosProximos, 60 * 60 * 1000);

    // Configurar formulários de autenticação
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

function formatarHora(data) {
    return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarDataHora(dataHora) {
    const data = new Date(dataHora);
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const horaFormatada = data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    return `${dataFormatada} ${horaFormatada}`;
}

// Funções de autenticação
function verificarAutenticacao() {
    const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (isLoggedIn) {
        // Mostrar menu principal
        if (header) header.style.display = 'block';
        if (main) main.style.display = 'block';
        if (footer) footer.style.display = 'block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';

        // Aplicar permissões
        aplicarPermissoes();

        // Carregar dados do dashboard após mostrar os elementos
        if (document.getElementById('dashboard')) {
            loadDashboardData();
        }
    } else {
        // Esconder menu principal e mostrar tela de login
        if (header) header.style.display = 'none';
        if (main) main.style.display = 'none';
        if (footer) footer.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        // Mostrar modal de autenticação automaticamente
        mostrarAuth();
    }
}

function aplicarPermissoes() {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const tipo = userData.tipo;
    const paginasPermitidas = userData.paginas_permitidas || [];

    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (tipo === 'admin' || paginasPermitidas.includes(href)) {
            link.style.display = 'inline-block';
        } else {
            link.style.display = 'none';
        }
    });
}

function mostrarAuth() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function fecharAuth() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function mostrarTab(tab) {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    if (tab === 'login') {
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        togglePermissoes(); // Atualizar permissões ao mostrar cadastro
    }
}

window.mostrarTab = mostrarTab;

function togglePermissoes() {
    const tipo = document.getElementById('reg-tipo').value;
    const permissoesSection = document.getElementById('permissoes-section');
    if (tipo === 'admin') {
        permissoesSection.style.display = 'none';
    } else {
        permissoesSection.style.display = 'block';
    }
}

function mostrarLogin() {
    mostrarAuth();
    mostrarTab('login');
}

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const user = await loginUsuario(username, password);
        if (user) {
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('user_data', JSON.stringify(user));
            verificarAutenticacao();
            fecharAuth();
            mostrarMensagem('Login realizado com sucesso!', 'success');
            location.reload(); // Recarregar página para carregar dados
        } else {
            mostrarMensagem('Usuário ou senha incorretos!', 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        mostrarMensagem('Erro ao fazer login. Tente novamente.', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const tipo = document.getElementById('reg-tipo').value;

    if (password !== confirmPassword) {
        mostrarMensagem('As senhas não coincidem!', 'error');
        return;
    }

    let paginasPermitidas = [];
    if (tipo === 'usuario') {
        const checkboxes = document.querySelectorAll('#permissoes-section input[name="paginas"]:checked');
        paginasPermitidas = Array.from(checkboxes).map(cb => cb.value);
    } else {
        // Admin tem acesso a todas
        paginasPermitidas = ['index.html', 'campeonatos.html', 'times.html', 'jogadores.html', 'jogos.html', 'classificacao.html', 'artilharia.html', 'cartoes.html'];
    }

    try {
        const result = await cadastrarUsuario(username, password, tipo, paginasPermitidas);
        if (result.success) {
            mostrarMensagem('Usuário cadastrado com sucesso! Faça o login.', 'success');
            mostrarTab('login');
        } else {
            mostrarMensagem('Erro no cadastro: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Erro no cadastro:', error);
        mostrarMensagem('Erro ao cadastrar usuário. Tente novamente.', 'error');
    }
}

function logout() {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('user_data');
    window.location.href = 'index.html';
}

window.logout = logout;

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('auth-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
