// Sistema de ajuda contextual e validações avançadas

// Dicas de ajuda para diferentes seções
const helpTips = {
    dashboard: {
        title: "Dashboard Principal",
        content: "Aqui você encontra um resumo geral do campeonato. Visualize próximos jogos, classificação atual, artilheiros e jogadores suspensos."
    },
    times: {
        title: "Gerenciamento de Times",
        content: "Cadastre e gerencie os times participantes. Cada time pode ter até 20 jogadores. Use o botão 'Novo Time' para adicionar um time ao campeonato."
    },
    jogadores: {
        title: "Gerenciamento de Jogadores",
        content: "Cadastre jogadores para cada time. Informe dados pessoais, posição e número da camisa (único por time). Máximo 20 jogadores por time."
    },
    jogos: {
        title: "Gerenciamento de Jogos",
        content: "Agende jogos, registre placares e estatísticas. Para jogos finalizados, você pode gerar súmulas em PDF."
    },
    classificacao: {
        title: "Tabela de Classificação",
        content: "Visualize a classificação atual do campeonato. A tabela é atualizada automaticamente após cada jogo."
    },
    artilharia: {
        title: "Lista de Artilheiros",
        content: "Veja os jogadores com mais gols marcados no campeonato."
    }
};

// Validações avançadas
const validacoes = {
    // Validação de email
    email: function(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // Validação de CPF (formato brasileiro)
    cpf: function(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        if (cpf.length !== 11) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(cpf)) return false;

        // Calcula primeiro dígito verificador
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(9))) return false;

        // Calcula segundo dígito verificador
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpf.charAt(i)) * (11 - i);
        }
        resto = 11 - (soma % 11);
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(10))) return false;

        return true;
    },

    // Validação de data (não pode ser futura para nascimento)
    dataNascimento: function(data) {
        const hoje = new Date();
        const nascimento = new Date(data);
        return nascimento <= hoje;
    },

    // Validação de idade mínima (16 anos para jogadores)
    idadeMinima: function(dataNascimento) {
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        const idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();

        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            return idade - 1 >= 16;
        }
        return idade >= 16;
    },

    // Validação de número da camisa (1-99, único por time)
    numeroCamisa: function(numero, timeId, jogadorId = null) {
        numero = parseInt(numero);
        if (numero < 1 || numero > 99) return false;

        // Aqui seria feita uma verificação no banco de dados
        // Por enquanto, retorna true (implementar na integração com BD)
        return true;
    },

    // Validação de placar (não pode ser negativo)
    placar: function(gols) {
        const placar = parseInt(gols);
        return !isNaN(placar) && placar >= 0;
    },

    // Validação de minuto do gol (1-120 + acréscimos)
    minutoGol: function(minuto) {
        const min = parseInt(minuto);
        return !isNaN(min) && min >= 1 && min <= 120;
    }
};

// Funções de ajuda
function mostrarAjuda(secao) {
    const tip = helpTips[secao];
    if (!tip) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            <h2>${tip.title}</h2>
            <p>${tip.content}</p>
            <button onclick="this.closest('.modal').remove()" class="btn-secondary">Entendi</button>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Validações em tempo real
function adicionarValidacaoTempoReal() {
    // Validação de email
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !validacoes.email(this.value)) {
                mostrarErroValidacao(this, 'Email inválido');
            } else {
                removerErroValidacao(this);
            }
        });
    });

    // Validação de CPF
    const cpfInputs = document.querySelectorAll('input[data-validacao="cpf"]');
    cpfInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !validacoes.cpf(this.value)) {
                mostrarErroValidacao(this, 'CPF inválido');
            } else {
                removerErroValidacao(this);
            }
        });
    });

    // Validação de data de nascimento
    const dataInputs = document.querySelectorAll('input[type="date"][data-validacao="nascimento"]');
    dataInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value) {
                if (!validacoes.dataNascimento(this.value)) {
                    mostrarErroValidacao(this, 'Data não pode ser futura');
                } else if (!validacoes.idadeMinima(this.value)) {
                    mostrarErroValidacao(this, 'Jogador deve ter pelo menos 16 anos');
                } else {
                    removerErroValidacao(this);
                }
            }
        });
    });

    // Validação de número da camisa
    const numeroInputs = document.querySelectorAll('input[data-validacao="numero-camisa"]');
    numeroInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !validacoes.numeroCamisa(this.value)) {
                mostrarErroValidacao(this, 'Número deve ser entre 1 e 99');
            } else {
                removerErroValidacao(this);
            }
        });
    });

    // Validação de placar
    const placarInputs = document.querySelectorAll('input[data-validacao="placar"]');
    placarInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !validacoes.placar(this.value)) {
                mostrarErroValidacao(this, 'Placar deve ser um número não negativo');
            } else {
                removerErroValidacao(this);
            }
        });
    });

    // Validação de minuto do gol
    const minutoInputs = document.querySelectorAll('input[data-validacao="minuto"]');
    minutoInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !validacoes.minutoGol(this.value)) {
                mostrarErroValidacao(this, 'Minuto deve ser entre 1 e 120');
            } else {
                removerErroValidacao(this);
            }
        });
    });
}

function mostrarErroValidacao(elemento, mensagem) {
    removerErroValidacao(elemento);

    elemento.style.borderColor = 'red';
    elemento.style.boxShadow = '0 0 5px rgba(255, 0, 0, 0.3)';

    const erroDiv = document.createElement('div');
    erroDiv.className = 'erro-validacao';
    erroDiv.textContent = mensagem;
    erroDiv.style.color = 'red';
    erroDiv.style.fontSize = '12px';
    erroDiv.style.marginTop = '5px';

    elemento.parentNode.insertBefore(erroDiv, elemento.nextSibling);
}

function removerErroValidacao(elemento) {
    elemento.style.borderColor = '#ddd';
    elemento.style.boxShadow = 'none';

    const erroExistente = elemento.parentNode.querySelector('.erro-validacao');
    if (erroExistente) {
        erroExistente.remove();
    }
}

// Tooltips de ajuda
function adicionarTooltips() {
    const elementosComTooltip = document.querySelectorAll('[data-tooltip]');

    elementosComTooltip.forEach(elemento => {
        elemento.addEventListener('mouseenter', function(e) {
            mostrarTooltip(this, this.dataset.tooltip);
        });

        elemento.addEventListener('mouseleave', function() {
            esconderTooltip();
        });
    });
}

function mostrarTooltip(elemento, texto) {
    esconderTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = texto;
    tooltip.style.position = 'fixed';
    tooltip.style.backgroundColor = '#333';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.zIndex = '1000';
    tooltip.style.pointerEvents = 'none';

    document.body.appendChild(tooltip);

    const rect = elemento.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - 30) + 'px';
}

function esconderTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Inicialização das funcionalidades de ajuda
document.addEventListener('DOMContentLoaded', function() {
    adicionarValidacaoTempoReal();
    adicionarTooltips();
});
