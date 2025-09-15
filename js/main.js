// Funções principais do sistema

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar dashboard
    initDashboard();

    // Verificar se estamos na página correta
    if (document.getElementById('dashboard')) {
        loadDashboardData();
    }
});

function initDashboard() {
    console.log('Sistema de Campeonato de Futebol inicializado');
}

async function loadDashboardData() {
    try {
        // Carregar dados do dashboard
        const campeonatos = await getCampeonatos();
        const jogos = await getJogos(campeonatos[0]?.id); // Assumindo primeiro campeonato
        const classificacao = await calcularClassificacao(campeonatos[0]?.id);

        // Atualizar interface
        updateProximosJogos(jogos);
        updateClassificacao(classificacao);
        updateArtilheiros();
        updateSuspensoes();
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
        const top3 = classificacao.slice(0, 3);
        container.innerHTML = top3.map((t, i) => `${i+1}. ${t.nome} - ${t.pontos} pts`).join('<br>');
    }
}

function updateArtilheiros() {
    const container = document.querySelector('.card:nth-child(3) p');
    // Implementar busca de artilheiros
    container.innerHTML = 'Implementar busca de artilheiros';
}

function updateSuspensoes() {
    const container = document.querySelector('.card:nth-child(4) p');
    // Implementar busca de suspensões
    container.innerHTML = 'Implementar busca de suspensões';
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

    // Verificar credenciais do admin ou usuários cadastrados
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);

    if ((username === 'admin' && password === 'Admin@2024!') || user) {
        localStorage.setItem('admin_logged_in', 'true');
        localStorage.setItem('admin_username', username);
        verificarAutenticacao();
        fecharAuth();
        mostrarMensagem('Login realizado com sucesso!', 'success');
        location.reload(); // Recarregar página para carregar dados
    } else {
        mostrarMensagem('Usuário ou senha incorretos!', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        mostrarMensagem('As senhas não coincidem!', 'error');
        return;
    }

    // Simulação de cadastro (em produção, salvar no banco)
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const existingUser = users.find(u => u.username === username || u.email === email);

    if (existingUser) {
        mostrarMensagem('Usuário ou email já cadastrado!', 'error');
        return;
    }

    users.push({ username, email, password });
    localStorage.setItem('registered_users', JSON.stringify(users));

    mostrarMensagem('Usuário cadastrado com sucesso! Faça o login.', 'success');
    mostrarTab('login');
    location.reload(); // Recarregar página após cadastro
}

function logout() {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_username');
    verificarAutenticacao();
    mostrarMensagem('Logout realizado com sucesso!', 'info');
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('auth-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
