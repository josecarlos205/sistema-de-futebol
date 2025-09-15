// Gerenciamento de campeonatos

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (localStorage.getItem('admin_logged_in') !== 'true') {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'index.html';
        return;
    }

    const btnNovoCampeonato = document.getElementById('btnNovoCampeonato');
    const formNovoCampeonato = document.getElementById('formNovoCampeonato');
    const btnCancelarCampeonato = document.getElementById('btnCancelarCampeonato');
    const campeonatoForm = document.getElementById('campeonatoForm');
    const tabelaCampeonatosBody = document.querySelector('#tabelaCampeonatos tbody');

    btnNovoCampeonato.addEventListener('click', () => {
        formNovoCampeonato.style.display = 'block';
        btnNovoCampeonato.style.display = 'none';
    });

    btnCancelarCampeonato.addEventListener('click', () => {
        formNovoCampeonato.style.display = 'none';
        btnNovoCampeonato.style.display = 'inline-block';
        campeonatoForm.reset();
    });

    const originalSubmitHandler = async function(e) {
        const submitButton = document.getElementById('campeonatoForm').querySelector('button[type="submit"]');
        submitButton.disabled = true;
        e.preventDefault();

        const nome = document.getElementById('nomeCampeonato').value.trim();
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;

        if (!nome || !dataInicio) {
            alert('Preencha pelo menos o nome e data de início.');
            submitButton.disabled = false;
            return;
        }

        const novoCampeonato = {
            nome: nome,
            data_inicio: dataInicio,
            data_fim: dataFim || null,
            status: 'ativo'
        };

        try {
            const resultado = await createCampeonato(novoCampeonato);
            if (resultado && !resultado.error) {
                alert('Campeonato cadastrado com sucesso!');
                campeonatoForm.reset();
                formNovoCampeonato.style.display = 'none';
                btnNovoCampeonato.style.display = 'inline-block';
                carregarCampeonatos();
            } else {
                alert('Erro ao cadastrar campeonato.');
                submitButton.disabled = false;
            }
        } catch (error) {
            console.error('Erro ao cadastrar campeonato:', error);
            alert('Erro ao cadastrar campeonato.');
            submitButton.disabled = false;
        }
    };

    campeonatoForm.addEventListener('submit', originalSubmitHandler);

    carregarCampeonatos();

    async function carregarCampeonatos() {
        tabelaCampeonatosBody.innerHTML = '';
        try {
            const campeonatos = await getCampeonatos();
            if (campeonatos && campeonatos.length > 0) {
                campeonatos.forEach(campeonato => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${campeonato.nome}</td>
                        <td>${formatarData(campeonato.data_inicio)}</td>
                        <td>${campeonato.data_fim ? formatarData(campeonato.data_fim) : '-'}</td>
                        <td>${campeonato.status}</td>
                        <td>
                            <button data-id="${campeonato.id}" class="btn-editar">Editar</button>
                            <button data-id="${campeonato.id}" class="btn-excluir">Excluir</button>
                        </td>
                    `;
                    tabelaCampeonatosBody.appendChild(tr);
                });
                adicionarEventosBotoes();
            } else {
                tabelaCampeonatosBody.innerHTML = '<tr><td colspan="5">Nenhum campeonato cadastrado.</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar campeonatos:', error);
            tabelaCampeonatosBody.innerHTML = '<tr><td colspan="5">Erro ao carregar campeonatos.</td></tr>';
        }
    }

    function adicionarEventosBotoes() {
        const botoesEditar = document.querySelectorAll('.btn-editar');
        const botoesExcluir = document.querySelectorAll('.btn-excluir');

        botoesEditar.forEach(botao => {
            botao.addEventListener('click', () => {
                const id = parseInt(botao.getAttribute('data-id'));
                editarCampeonato(id);
            });
        });

        botoesExcluir.forEach(botao => {
            botao.addEventListener('click', () => {
                const id = parseInt(botao.getAttribute('data-id'));
                excluirCampeonato(id);
            });
        });
    }

    async function editarCampeonato(id) {
        try {
            const { data: campeonato, error } = await supabaseClient
                .from('campeonatos')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !campeonato) {
                alert('Campeonato não encontrado.');
                return;
            }

            // Preencher formulário
            document.getElementById('nomeCampeonato').value = campeonato.nome;
            document.getElementById('dataInicio').value = campeonato.data_inicio;
            document.getElementById('dataFim').value = campeonato.data_fim ? campeonato.data_fim.split('T')[0] : '';

            formNovoCampeonato.style.display = 'block';
            btnNovoCampeonato.style.display = 'none';

            // Alterar evento submit para atualizar
            campeonatoForm.removeEventListener('submit', originalSubmitHandler);
            campeonatoForm._submitHandler = async function(e) {
                const submitButton = document.getElementById('campeonatoForm').querySelector('button[type="submit"]');
                submitButton.disabled = true;
                e.preventDefault();
                await atualizarCampeonato(id);
                submitButton.disabled = false;
            };
            campeonatoForm.addEventListener('submit', campeonatoForm._submitHandler);

        } catch (error) {
            console.error('Erro ao buscar campeonato:', error);
            alert('Erro ao buscar campeonato.');
        }
    }

    async function atualizarCampeonato(id) {
        const nome = document.getElementById('nomeCampeonato').value.trim();
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;

        if (!nome || !dataInicio) {
            alert('Preencha pelo menos o nome e data de início.');
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('campeonatos')
                .update({
                    nome: nome,
                    data_inicio: dataInicio,
                    data_fim: dataFim || null
                })
                .eq('id', id);

            if (error) {
                console.error('Erro ao atualizar campeonato:', error);
                alert('Erro ao atualizar campeonato.');
                return;
            }

            alert('Campeonato atualizado com sucesso!');
            campeonatoForm.reset();
            formNovoCampeonato.style.display = 'none';
            btnNovoCampeonato.style.display = 'inline-block';
            carregarCampeonatos();

            // Restaurar evento submit
            campeonatoForm.removeEventListener('submit', campeonatoForm._submitHandler);
            campeonatoForm.addEventListener('submit', originalSubmitHandler);
            campeonatoForm._submitHandler = null;

        } catch (error) {
            console.error('Erro ao atualizar campeonato:', error);
            alert('Erro ao atualizar campeonato.');
        }
    }

    async function excluirCampeonato(id) {
        if (!confirm('Tem certeza que deseja excluir este campeonato? Todos os times, jogos e dados relacionados serão afetados.')) {
            return;
        }

        try {
            const { error } = await supabaseClient
                .from('campeonatos')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Erro ao excluir campeonato:', error);
                alert('Erro ao excluir campeonato.');
                return;
            }

            alert('Campeonato excluído com sucesso!');
            carregarCampeonatos();
        } catch (error) {
            console.error('Erro ao excluir campeonato:', error);
            alert('Erro ao excluir campeonato.');
        }
    }
});
