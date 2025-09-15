// Gerenciamento de times

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação antes de permitir ações
    if (localStorage.getItem('admin_logged_in') !== 'true') {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'index.html';
        return;
    }

    const btnNovoTime = document.getElementById('btnNovoTime');
    const formNovoTime = document.getElementById('formNovoTime');
    const btnCancelar = document.getElementById('btnCancelar');
    const btnAtualizar = document.getElementById('btnAtualizar');
    const timeForm = document.getElementById('timeForm');
    const tabelaTimesBody = document.querySelector('#tabelaTimes tbody');

    btnNovoTime.addEventListener('click', () => {
        formNovoTime.style.display = 'block';
        btnNovoTime.style.display = 'none';
    });

    btnAtualizar.addEventListener('click', () => {
        carregarTimes();
    });

    // Garantir que os event listeners dos botões principais estejam sempre ativos
    function ativarBotoesPrincipais() {
        const btnNovo = document.getElementById('btnNovoTime');
        const btnAtualizarLista = document.getElementById('btnAtualizar');

        btnNovo.removeEventListener('click', abrirFormulario);
        btnNovo.addEventListener('click', abrirFormulario);

        btnAtualizarLista.removeEventListener('click', carregarTimes);
        btnAtualizarLista.addEventListener('click', carregarTimes);
    }

    function abrirFormulario() {
        formNovoTime.style.display = 'block';
        btnNovoTime.style.display = 'none';
    }

    ativarBotoesPrincipais();

    btnCancelar.addEventListener('click', () => {
        formNovoTime.style.display = 'none';
        btnNovoTime.style.display = 'inline-block';
        timeForm.reset();
        // Garantir que o handler original esteja ativo
        if (timeForm._currentHandler) {
            timeForm.removeEventListener('submit', timeForm._currentHandler);
            timeForm._currentHandler = null;
        }
        timeForm.addEventListener('submit', originalSubmitHandler);
        timeForm._isUpdating = false; // Resetar flag de atualização
    });

    // Armazenar o handler original de criação
    const originalSubmitHandler = async (e) => {
        e.preventDefault();

        const nome = document.getElementById('nomeTime').value.trim();
        const tecnico = document.getElementById('tecnico').value.trim();
        const cores = document.getElementById('cores').value.trim();
        const dataFundacao = document.getElementById('dataFundacao').value;
        const logo = document.getElementById('logo').value.trim();

        if (!nome) {
            alert('O nome do time é obrigatório.');
            return;
        }

        // Criar objeto time
        const novoTime = {
            nome: nome,
            tecnico: tecnico,
            cores_uniforme: cores,
            data_fundacao: dataFundacao || null,
            logo_url: logo,
            status: 'ativo'
        };

        try {
            console.log('Tentando cadastrar time:', novoTime);
            const resultado = await createTime(novoTime);
            console.log('Resultado do cadastro:', resultado);

            if (resultado && !resultado.error) {
                alert('Time cadastrado com sucesso!');
                timeForm.reset();
                formNovoTime.style.display = 'none';
                btnNovoTime.style.display = 'inline-block';
                console.log('Recarregando lista de times...');
                await carregarTimes();
                console.log('Lista recarregada');
            } else {
                console.error('Erro no resultado:', resultado);
                alert('Erro ao cadastrar time. Verifique o console para detalhes.');
            }
        } catch (error) {
            console.error('Erro ao cadastrar time:', error);
            alert('Erro ao cadastrar time: ' + error.message);
        }
    };

    timeForm.addEventListener('submit', originalSubmitHandler);

    carregarTimes();

    async function carregarTimes() {
        // Prevenir múltiplas chamadas simultâneas
        if (carregarTimes._isLoading) {
            console.log('Carregamento já em andamento, ignorando...');
            return;
        }
        carregarTimes._isLoading = true;

        console.log('Iniciando carregamento de times...');
        try {
            // Limpar a tabela antes de adicionar novos elementos
            while (tabelaTimesBody.firstChild) {
                tabelaTimesBody.removeChild(tabelaTimesBody.firstChild);
            }

            // Para simplificação, buscar todos os times (ajustar conforme campeonato)
            const times = await getTimes(null);
            console.log('Times carregados do banco:', times);

            if (times && times.length > 0) {
                console.log(`Adicionando ${times.length} times à tabela`);
                times.forEach(time => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${time.nome}</td>
                        <td>${time.tecnico || ''}</td>
                        <td>${time.cores_uniforme || ''}</td>
                        <td>${time.status}</td>
                        <td>
                            <button data-id="${time.id}" class="btn-editar">Editar</button>
                            <button data-id="${time.id}" class="btn-toggle-status">${time.status === 'ativo' ? 'Desativar' : 'Ativar'}</button>
                        </td>
                    `;
                    tabelaTimesBody.appendChild(tr);
                });
                adicionarEventosBotoes();
                console.log('Times carregados com sucesso');
            } else {
                tabelaTimesBody.innerHTML = '<tr><td colspan="5">Nenhum time cadastrado.</td></tr>';
                console.log('Nenhum time encontrado');
            }
        } catch (error) {
            console.error('Erro ao carregar times:', error);
            tabelaTimesBody.innerHTML = '<tr><td colspan="5">Erro ao carregar times.</td></tr>';
        } finally {
            carregarTimes._isLoading = false;
        }
    }

    function adicionarEventosBotoes() {
        console.log('Adicionando eventos aos botões...');

        // SOLUÇÃO MAIS ROBUSTA: Remover completamente todos os event listeners existentes
        const todosBotoesEditar = document.querySelectorAll('.btn-editar');
        const todosBotoesToggle = document.querySelectorAll('.btn-toggle-status');

        console.log(`Encontrados ${todosBotoesEditar.length} botões de editar e ${todosBotoesToggle.length} botões de toggle`);

        // Remover event listeners usando clone + replace (mais confiável)
        todosBotoesEditar.forEach(botao => {
            // Verificar se o botão ainda tem parentNode antes de clonar
            if (botao.parentNode) {
                const clone = botao.cloneNode(true);
                botao.parentNode.replaceChild(clone, botao);
            }
        });

        todosBotoesToggle.forEach(botao => {
            if (botao.parentNode) {
                const clone = botao.cloneNode(true);
                botao.parentNode.replaceChild(clone, botao);
            }
        });

        // AGORA adicionar event listeners aos botões recém-clonados
        const botoesEditar = document.querySelectorAll('.btn-editar');
        const botoesToggle = document.querySelectorAll('.btn-toggle-status');

        console.log(`Após limpeza: ${botoesEditar.length} botões de editar e ${botoesToggle.length} botões de toggle`);

        // Usar delegação de eventos para evitar problemas de múltiplos listeners
        if (tabelaTimesBody._editarHandler) {
            tabelaTimesBody.removeEventListener('click', tabelaTimesBody._editarHandler);
        }
        if (tabelaTimesBody._toggleHandler) {
            tabelaTimesBody.removeEventListener('click', tabelaTimesBody._toggleHandler);
        }

        // Handler único para todos os botões de editar
        tabelaTimesBody._editarHandler = function(e) {
            if (e.target.classList.contains('btn-editar')) {
                e.preventDefault();
                const id = e.target.getAttribute('data-id');
                console.log('Botão editar clicado via delegação, ID:', id);
                editarTime(id);
            }
        };

        // Handler único para todos os botões de toggle
        tabelaTimesBody._toggleHandler = function(e) {
            if (e.target.classList.contains('btn-toggle-status')) {
                e.preventDefault();
                const id = e.target.getAttribute('data-id');
                console.log('Botão toggle clicado via delegação, ID:', id);
                toggleStatusTime(id);
            }
        };

        tabelaTimesBody.addEventListener('click', tabelaTimesBody._editarHandler);
        tabelaTimesBody.addEventListener('click', tabelaTimesBody._toggleHandler);

        console.log('Event listeners adicionados via delegação com sucesso');
    }

    async function editarTime(id) {
        console.log('=== INÍCIO DA EDIÇÃO ===');
        console.log('ID do time a ser editado:', id, 'Tipo:', typeof id);

        try {
            console.log('Buscando dados do time no banco...');
            const times = await getTimes(null);
            console.log('Times retornados:', times);
            const time = times.find(t => t.id == id);
            console.log('Time encontrado:', time);

            if (!time) {
                alert('Time não encontrado.');
                return;
            }

            // Preencher formulário com dados do time
            console.log('Preenchendo formulário com dados:', time);
            document.getElementById('nomeTime').value = time.nome;
            document.getElementById('tecnico').value = time.tecnico || '';
            document.getElementById('cores').value = time.cores_uniforme || '';
            document.getElementById('dataFundacao').value = time.data_fundacao ? time.data_fundacao.split('T')[0] : '';
            document.getElementById('logo').value = time.logo_url || '';

            formNovoTime.style.display = 'block';
            btnNovoTime.style.display = 'none';

            // Remover qualquer handler anterior
            console.log('Verificando handler anterior...');
            if (timeForm._currentHandler) {
                console.log('Removendo handler anterior');
                timeForm.removeEventListener('submit', timeForm._currentHandler);
                timeForm._currentHandler = null;
            }

            // CRÍTICO: Remover o handler original para evitar conflito
            console.log('Removendo handler original para modo de edição...');
            timeForm.removeEventListener('submit', originalSubmitHandler);

            // Criar novo handler para atualização
            console.log('Criando novo handler para atualização');
            timeForm._currentHandler = async function(e) {
                e.preventDefault();
                console.log('Handler de atualização chamado para ID:', id);
                await atualizarTime(id);
            };
            timeForm.addEventListener('submit', timeForm._currentHandler);
            console.log('Handler de atualização adicionado');

        } catch (error) {
            console.error('Erro ao buscar time:', error);
            alert('Erro ao buscar time.');
        }
        console.log('=== FIM DA EDIÇÃO ===');
    }

    async function atualizarTime(id) {
        console.log('=== INÍCIO DA ATUALIZAÇÃO ===');
        console.log('ID recebido:', id, 'Tipo:', typeof id);

        // Prevenir múltiplas submissões
        if (timeForm._isUpdating) {
            console.log('Atualização já em andamento, ignorando...');
            return;
        }

        timeForm._isUpdating = true;
        console.log('Flag _isUpdating definida como true');

        const nome = document.getElementById('nomeTime').value.trim();
        const tecnico = document.getElementById('tecnico').value.trim();
        const cores = document.getElementById('cores').value.trim();
        const dataFundacao = document.getElementById('dataFundacao').value;
        const logo = document.getElementById('logo').value.trim();

        console.log('Dados do formulário:', { nome, tecnico, cores, dataFundacao, logo });

        if (!nome) {
            alert('O nome do time é obrigatório.');
            timeForm._isUpdating = false;
            return;
        }

        try {
            // Usar função do database.js para consistência
            const timeAtualizado = {
                nome: nome,
                tecnico: tecnico,
                cores_uniforme: cores,
                data_fundacao: dataFundacao || null,
                logo_url: logo
            };

            console.log('Dados para atualizar no banco:', timeAtualizado);
            console.log('Query SQL: UPDATE times SET ... WHERE id =', parseInt(id));

            const { data, error } = await supabaseClient
                .from('times')
                .update(timeAtualizado)
                .eq('id', parseInt(id)) // Garantir que ID seja número
                .select(); // Forçar retorno dos dados atualizados

            console.log('Resultado da query:', { data, error });

            if (error) {
                console.error('Erro ao atualizar time:', error);
                alert('Erro ao atualizar time.');
                timeForm._isUpdating = false;
                return;
            }

            console.log('Time atualizado com sucesso, dados retornados:', data);
            alert('Time atualizado com sucesso!');
            timeForm.reset();
            formNovoTime.style.display = 'none';
            btnNovoTime.style.display = 'inline-block';
            console.log('Chamando carregarTimes()...');
            await carregarTimes();

            // Restaurar evento submit para criação
            console.log('Restaurando handler original...');
            timeForm.removeEventListener('submit', timeForm._currentHandler);
            timeForm.addEventListener('submit', originalSubmitHandler);

        } catch (error) {
            console.error('Erro ao atualizar time:', error);
            alert('Erro ao atualizar time.');
        } finally {
            console.log('Definindo _isUpdating como false');
            timeForm._isUpdating = false;
            console.log('=== FIM DA ATUALIZAÇÃO ===');
        }
    }

    async function toggleStatusTime(id) {
        try {
            console.log('Alterando status do time com ID:', id);
            const times = await getTimes(null);
            const time = times.find(t => t.id == id);
            if (!time) {
                alert('Time não encontrado.');
                return;
            }
            const novoStatus = time.status === 'ativo' ? 'inativo' : 'ativo';

            const { data, error } = await supabaseClient
                .from('times')
                .update({ status: novoStatus })
                .eq('id', parseInt(id)); // Garantir que ID seja número

            if (error) {
                console.error('Erro ao alterar status:', error);
                alert('Erro ao alterar status do time.');
                return;
            }

            console.log('Status alterado com sucesso');
            alert(`Time ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
            carregarTimes();
        } catch (error) {
            console.error('Erro ao alterar status do time:', error);
            alert('Erro ao alterar status do time.');
        }
    }
});
