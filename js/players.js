// Gerenciamento de jogadores

import { getTimes, getJogadores, createJogador, supabaseClient } from './database.js';

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação e permissões antes de permitir ações
    if (localStorage.getItem('admin_logged_in') !== 'true') {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'index.html';
        return;
    }

    // Verificar permissões para acessar jogadores.html
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const tipo = userData.tipo;
    const paginasPermitidas = userData.paginas_permitidas || [];
    if (tipo !== 'admin' && !paginasPermitidas.includes('jogadores.html')) {
        alert('Você não tem permissão para acessar esta página.');
        window.location.href = 'index.html';
        return;
    }

    const btnNovoJogador = document.getElementById('btnNovoJogador');
    const formNovoJogador = document.getElementById('formNovoJogador');
    const btnCancelarJogador = document.getElementById('btnCancelarJogador');
    const jogadorForm = document.getElementById('jogadorForm');
    const selectTime = document.getElementById('selectTime');
    const selectTimeJogador = document.getElementById('timeJogador');
    const tabelaJogadoresBody = document.querySelector('#tabelaJogadores tbody');
    let isEditing = false;
    let editingId = null;

    btnNovoJogador.addEventListener('click', () => {
        formNovoJogador.style.display = 'block';
        btnNovoJogador.style.display = 'none';
    });

    btnCancelarJogador.addEventListener('click', () => {
        formNovoJogador.style.display = 'none';
        btnNovoJogador.style.display = 'inline-block';
        jogadorForm.reset();
        isEditing = false;
        editingId = null;
    });

    selectTime.addEventListener('change', () => {
        carregarJogadores();
    });

    jogadorForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (isEditing) {
            await atualizarJogador(editingId);
        } else {
            await criarJogador();
        }
    });

    async function criarJogador() {
        const timeId = document.getElementById('timeJogador').value;
        const nome = document.getElementById('nomeJogador').value.trim();
        const apelido = document.getElementById('apelido').value.trim();
        const numeroCamisa = document.getElementById('numeroCamisa').value;
        const posicao = document.getElementById('posicao').value;
        const dataNascimento = document.getElementById('dataNascimento').value;
        const foto = document.getElementById('foto').value.trim();

        if (!timeId || !nome || !numeroCamisa || !posicao) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        // Verificar se número da camisa já existe no time
        try {
            const jogadoresTime = await getJogadores(timeId);
            const numeroExistente = jogadoresTime.find(j => j.numero_camisa == numeroCamisa && j.status === 'ativo');
            if (numeroExistente) {
                alert('Este número da camisa já está em uso neste time.');
                return;
            }

            // Verificar limite de 20 jogadores por time
            const jogadoresAtivos = jogadoresTime.filter(j => j.status === 'ativo');
            if (jogadoresAtivos.length >= 20) {
                alert('Este time já possui o limite máximo de 20 jogadores.');
                return;
            }

        } catch (error) {
            console.error('Erro ao verificar jogadores:', error);
            alert('Erro ao verificar dados do time.');
            return;
        }

        // Criar objeto jogador
        const novoJogador = {
            time_id: parseInt(timeId),
            nome_completo: nome,
            apelido: apelido,
            numero_camisa: parseInt(numeroCamisa),
            posicao: posicao,
            data_nascimento: dataNascimento || null,
            foto_url: foto,
            status: 'ativo'
        };

        try {
            const resultado = await createJogador(novoJogador);
            if (resultado && !resultado.error) {
                alert('Jogador cadastrado com sucesso!');
                resetForm();
            } else {
                alert('Erro ao cadastrar jogador.');
            }
        } catch (error) {
            console.error('Erro ao cadastrar jogador:', error);
            alert('Erro ao cadastrar jogador.');
        }
    }

    carregarTimes();
    carregarJogadores();

    async function carregarTimes() {
        try {
            const times = await getTimes(null);
            if (times && times.length > 0) {
                selectTime.innerHTML = '<option value="">Todos os Times</option>';
                selectTimeJogador.innerHTML = '<option value="">Selecione um time</option>';

                times.forEach(time => {
                    if (time.status === 'ativo') {
                        const option1 = document.createElement('option');
                        option1.value = time.id;
                        option1.textContent = time.nome;
                        selectTime.appendChild(option1);

                        const option2 = document.createElement('option');
                        option2.value = time.id;
                        option2.textContent = time.nome;
                        selectTimeJogador.appendChild(option2);
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao carregar times:', error);
        }
    }

    async function carregarJogadores() {
        tabelaJogadoresBody.innerHTML = '';
        try {
            const timeId = selectTime.value;
            let jogadores = [];

            if (timeId) {
                jogadores = await getJogadores(timeId);
            } else {
                // Carregar todos os jogadores de todos os times
                const times = await getTimes(null);
                for (const time of times) {
                    const jogadoresTime = await getJogadores(time.id);
                    jogadores = jogadores.concat(jogadoresTime);
                }
            }

            if (jogadores && jogadores.length > 0) {
                // Ordenar por nome
                jogadores.sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));

                jogadores.forEach(jogador => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${jogador.nome_completo}</td>
                        <td>${jogador.apelido || ''}</td>
                        <td>${jogador.numero_camisa}</td>
                        <td>${jogador.posicao}</td>
                        <td>${jogador.time_nome || 'N/A'}</td>
                        <td>${jogador.gols_marcados || 0}</td>
                        <td>${(jogador.cartoes_amarelos || 0) + (jogador.cartoes_azuis || 0) + (jogador.cartoes_vermelhos || 0)}</td>
                        <td>${jogador.status}</td>
                        <td>
                            <button data-id="${jogador.id}" class="btn-editar">Editar</button>
                            <button data-id="${jogador.id}" class="btn-toggle-status">${jogador.status === 'ativo' ? 'Desativar' : 'Ativar'}</button>
                        </td>
                    `;
                    tabelaJogadoresBody.appendChild(tr);
                });
                adicionarEventosBotoes();
            } else {
                tabelaJogadoresBody.innerHTML = '<tr><td colspan="9">Nenhum jogador cadastrado. Verifique se há times criados e jogadores associados.</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar jogadores:', error);
            tabelaJogadoresBody.innerHTML = '<tr><td colspan="9">Erro ao carregar jogadores.</td></tr>';
        }
    }

    function adicionarEventosBotoes() {
        const botoesEditar = document.querySelectorAll('.btn-editar');
        const botoesToggle = document.querySelectorAll('.btn-toggle-status');

        botoesEditar.forEach(botao => {
            botao.addEventListener('click', () => {
                const id = parseInt(botao.getAttribute('data-id'));
                editarJogador(id);
            });
        });

        botoesToggle.forEach(botao => {
            botao.addEventListener('click', () => {
                const id = parseInt(botao.getAttribute('data-id'));
                toggleStatusJogador(id);
            });
        });
    }

    async function editarJogador(id) {
        try {
            // Buscar jogador por ID (implementar função no database.js)
            const { data: jogador, error } = await supabaseClient
                .from('jogadores')
                .select('*, times(nome)')
                .eq('id', id)
                .single();

            if (error || !jogador) {
                alert('Jogador não encontrado.');
                return;
            }

            // Preencher formulário
            document.getElementById('timeJogador').value = jogador.time_id;
            document.getElementById('nomeJogador').value = jogador.nome_completo;
            document.getElementById('apelido').value = jogador.apelido || '';
            document.getElementById('numeroCamisa').value = jogador.numero_camisa;
            document.getElementById('posicao').value = jogador.posicao;
            document.getElementById('dataNascimento').value = jogador.data_nascimento ? jogador.data_nascimento.split('T')[0] : '';
            document.getElementById('foto').value = jogador.foto_url || '';

            isEditing = true;
            editingId = id;

            formNovoJogador.style.display = 'block';
            btnNovoJogador.style.display = 'none';

        } catch (error) {
            console.error('Erro ao buscar jogador:', error);
            alert('Erro ao buscar jogador.');
        }
    }

    async function atualizarJogador(id) {
        const timeId = document.getElementById('timeJogador').value;
        const nome = document.getElementById('nomeJogador').value.trim();
        const apelido = document.getElementById('apelido').value.trim();
        const numeroCamisa = document.getElementById('numeroCamisa').value;
        const posicao = document.getElementById('posicao').value;
        const dataNascimento = document.getElementById('dataNascimento').value;
        const foto = document.getElementById('foto').value.trim();

        if (!timeId || !nome || !numeroCamisa || !posicao) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        // Verificar se número da camisa já existe no time (excluindo o jogador atual)
        try {
            const jogadoresTime = await getJogadores(timeId);
            const numeroExistente = jogadoresTime.find(j => j.numero_camisa == numeroCamisa && j.status === 'ativo' && j.id !== id);
            if (numeroExistente) {
                alert('Este número da camisa já está em uso neste time.');
                return;
            }
        } catch (error) {
            console.error('Erro ao verificar jogadores:', error);
            alert('Erro ao verificar dados do time.');
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('jogadores')
                .update({
                    time_id: parseInt(timeId),
                    nome_completo: nome,
                    apelido: apelido,
                    numero_camisa: parseInt(numeroCamisa),
                    posicao: posicao,
                    data_nascimento: dataNascimento || null,
                    foto_url: foto
                })
                .eq('id', id);

            if (error) {
                console.error('Erro ao atualizar jogador:', error);
                alert('Erro ao atualizar jogador.');
                return;
            }

            alert('Jogador atualizado com sucesso!');
            resetForm();

        } catch (error) {
            console.error('Erro ao atualizar jogador:', error);
            alert('Erro ao atualizar jogador.');
        }
    }

    async function toggleStatusJogador(id) {
        try {
            const { data: jogador, error } = await supabaseClient
                .from('jogadores')
                .select('status')
                .eq('id', id)
                .single();

            if (error || !jogador) {
                alert('Jogador não encontrado.');
                return;
            }

            const novoStatus = jogador.status === 'ativo' ? 'inativo' : 'ativo';

            const { data, error: updateError } = await supabaseClient
                .from('jogadores')
                .update({ status: novoStatus })
                .eq('id', id);

            if (updateError) {
                console.error('Erro ao alterar status:', updateError);
                alert('Erro ao alterar status do jogador.');
                return;
            }

            alert(`Jogador ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
            carregarJogadores();
        } catch (error) {
            console.error('Erro ao alterar status do jogador:', error);
            alert('Erro ao alterar status do jogador.');
        }
    }

    function resetForm() {
        jogadorForm.reset();
        formNovoJogador.style.display = 'none';
        btnNovoJogador.style.display = 'inline-block';
        isEditing = false;
        editingId = null;
        carregarJogadores();
    }
});
