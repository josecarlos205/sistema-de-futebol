// Gerenciamento de jogos

import { getTimes, createJogo, supabaseClient, getJogadores, createGol, createCartao, getCampeonatos, createCampeonato, createJogosBatch } from './database.js';

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação e permissões antes de permitir ações
    if (localStorage.getItem('admin_logged_in') !== 'true') {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'index.html';
        return;
    }

    // Verificar permissões para acessar jogos.html
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const tipo = userData.tipo;
    const paginasPermitidas = userData.paginas_permitidas || [];
    if (tipo !== 'admin' && !paginasPermitidas.includes('jogos.html')) {
        alert('Você não tem permissão para acessar esta página.');
        window.location.href = 'index.html';
        return;
    }

    const btnGerarTabela = document.getElementById('btnGerarTabela');
    const btnNovoJogo = document.getElementById('btnNovoJogo');
    const formNovoJogo = document.getElementById('formNovoJogo');
    const btnCancelarJogo = document.getElementById('btnCancelarJogo');
    const jogoForm = document.getElementById('jogoForm');
    const filtroStatus = document.getElementById('filtroStatus');
    const tabelaJogosBody = document.querySelector('#tabelaJogos tbody');
    const modalResultado = document.getElementById('modalResultado');
    const modalSumula = document.getElementById('modalSumula');
    const closeModal = document.querySelector('.close');
    const closeModalSumula = document.getElementById('closeModalSumula');
    const btnGerarSumulaPDF = document.getElementById('btnGerarSumulaPDF');
    const btnImprimirSumula = document.getElementById('btnImprimirSumula');
    const btnCancelarSumula = document.getElementById('btnCancelarSumula');
    const resultadoForm = document.getElementById('resultadoForm');

    let jogoAtual = null;
    let isSaving = false;
    let eventosGolsAdicionados = false;
    let eventosCartoesAdicionados = false;

    btnNovoJogo.addEventListener('click', () => {
        formNovoJogo.style.display = 'block';
        btnNovoJogo.style.display = 'none';
    });

    btnCancelarJogo.addEventListener('click', () => {
        formNovoJogo.style.display = 'none';
        btnNovoJogo.style.display = 'inline-block';
        jogoForm.reset();
    });

    btnGerarTabela.addEventListener('click', () => {
        gerarTabelaJogos();
    });

    filtroStatus.addEventListener('change', () => {
        carregarJogos();
    });

    closeModal.addEventListener('click', () => {
        modalResultado.style.display = 'none';
    });

    closeModalSumula.addEventListener('click', () => {
        modalSumula.style.display = 'none';
    });

    btnGerarSumulaPDF.addEventListener('click', () => {
        if (!jogoAtual) {
            alert('Nenhum jogo selecionado para gerar a súmula.');
            return;
        }
        gerarSumulaPDF(jogoAtual, jogoAtual.jogadoresCasa, jogoAtual.jogadoresVisitante,
                      jogoAtual.gols, jogoAtual.cartoes, jogoAtual.arbitro, jogoAtual.observacoes);
        modalSumula.style.display = 'none';
    });

    btnImprimirSumula.addEventListener('click', () => {
        if (!jogoAtual) {
            alert('Nenhum jogo selecionado para imprimir a súmula.');
            return;
        }
        imprimirSumula(jogoAtual.id);
        modalSumula.style.display = 'none';
    });

    btnCancelarSumula.addEventListener('click', () => {
        modalSumula.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modalResultado) {
            modalResultado.style.display = 'none';
        }
        if (e.target === modalSumula) {
            modalSumula.style.display = 'none';
        }
    });

    jogoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const timeCasa = document.getElementById('timeCasa').value;
        const timeVisitante = document.getElementById('timeVisitante').value;
        const dataHora = document.getElementById('dataHora').value;
        const local = document.getElementById('local').value.trim();
        const arbitro = document.getElementById('arbitro').value.trim();
        const observacoes = document.getElementById('observacoes').value.trim();

        if (!timeCasa || !timeVisitante || !dataHora || !local) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        if (timeCasa === timeVisitante) {
            alert('Os times da casa e visitante devem ser diferentes.');
            return;
        }

        const novoJogo = {
            time_casa_id: parseInt(timeCasa),
            time_visitante_id: parseInt(timeVisitante),
            data_hora: dataHora,
            local: local,
            arbitro: arbitro,
            observacoes: observacoes,
            status: 'agendado'
        };

        try {
            const resultado = await createJogo(novoJogo);
            if (resultado && resultado.length > 0) {
                alert('Jogo agendado com sucesso!');
                jogoForm.reset();
                formNovoJogo.style.display = 'none';
                btnNovoJogo.style.display = 'inline-block';
                carregarJogos();
            } else {
                alert('Erro ao agendar jogo.');
            }
        } catch (error) {
            console.error('Erro ao agendar jogo:', error);
            alert('Erro ao agendar jogo.');
        }
    });

    resultadoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarResultado();
    });

    carregarTimes();
    carregarJogos();

    async function carregarTimes() {
        try {
            const times = await getTimes(null);
            if (times && times.length > 0) {
                const selectCasa = document.getElementById('timeCasa');
                const selectVisitante = document.getElementById('timeVisitante');

                selectCasa.innerHTML = '<option value="">Selecione</option>';
                selectVisitante.innerHTML = '<option value="">Selecione</option>';

                times.forEach(time => {
                    if (time.status === 'ativo') {
                        const option1 = document.createElement('option');
                        option1.value = time.id;
                        option1.textContent = time.nome;
                        selectCasa.appendChild(option1);

                        const option2 = document.createElement('option');
                        option2.value = time.id;
                        option2.textContent = time.nome;
                        selectVisitante.appendChild(option2);
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao carregar times:', error);
        }
    }

    async function carregarJogos() {
        tabelaJogosBody.innerHTML = '';
        try {
            const statusFiltro = filtroStatus.value;

            // Buscar jogos com informações dos times
            const { data: jogos, error } = await supabaseClient
                .from('jogos')
                .select(`
                    *,
                    time_casa:times!time_casa_id(nome),
                    time_visitante:times!time_visitante_id(nome)
                `)
                .order('data_hora', { ascending: true });

            if (error) {
                console.error('Erro ao buscar jogos:', error);
                tabelaJogosBody.innerHTML = '<tr><td colspan="6">Erro ao carregar jogos.</td></tr>';
                return;
            }

            let jogosFiltrados = jogos || [];

            if (statusFiltro) {
                jogosFiltrados = jogosFiltrados.filter(j => j.status === statusFiltro);
            }

            if (jogosFiltrados && jogosFiltrados.length > 0) {
                // Organizar jogos por rodadas
                const jogosPorRodada = organizarJogosPorRodada(jogosFiltrados);

                // Adicionar botão para expandir/colapsar todas as rodadas
                const trControle = document.createElement('tr');
                trControle.innerHTML = `
                    <td colspan="6" style="text-align: center; padding: 10px; background-color: #f8f9fa;">
                        <button id="btnToggleRodadas" class="btn-secondary" style="margin-right: 10px;">Expandir Todas</button>
                        <span>Total de rodadas: ${Object.keys(jogosPorRodada).length}</span>
                    </td>
                `;
                tabelaJogosBody.appendChild(trControle);

                // Exibir jogos organizados por rodada
                let rodadaIndex = 0;
                for (const [rodada, jogosRodada] of Object.entries(jogosPorRodada)) {
                    rodadaIndex++;
                    // Adicionar cabeçalho da rodada
                    const trRodada = document.createElement('tr');
                    trRodada.className = 'rodada-header';
                    trRodada.setAttribute('data-rodada', rodadaIndex);
                    trRodada.innerHTML = `
                        <td colspan="6" class="rodada-titulo">
                            <button class="btn-toggle-rodada" data-rodada="${rodadaIndex}" style="margin-right: 10px; background: none; border: none; color: #fff; cursor: pointer; font-size: 16px;">▼</button>
                            <strong>${rodada}</strong>
                            <span style="float: right; font-weight: normal; font-size: 14px;">${jogosRodada.length} jogos</span>
                        </td>
                    `;
                    tabelaJogosBody.appendChild(trRodada);

                    // Adicionar jogos da rodada
                    jogosRodada.forEach(jogo => {
                        const tr = document.createElement('tr');
                        tr.className = 'jogo-rodada';
                        tr.setAttribute('data-rodada', rodadaIndex);
                        const dataFormatada = formatarDataHora(jogo.data_hora);
                        const placar = jogo.status === 'finalizado' ? `${jogo.gols_casa || 0} - ${jogo.gols_visitante || 0}` : '-';

                        tr.innerHTML = `
                            <td>${dataFormatada}</td>
                            <td>${jogo.time_casa.nome} x ${jogo.time_visitante.nome}</td>
                            <td>${placar}</td>
                            <td>${jogo.local}</td>
                            <td>${jogo.status}</td>
                            <td>
                                ${jogo.status === 'agendado' ? `<button data-id="${jogo.id}" class="btn-registrar">Registrar Resultado</button>` : ''}
                                ${jogo.status === 'finalizado' ? `<button data-id="${jogo.id}" class="btn-sumula">Gerar Súmula</button>` : ''}
                                <button data-id="${jogo.id}" class="btn-editar">Editar</button>
                                <button data-id="${jogo.id}" class="btn-cancelar" ${jogo.status === 'cancelado' ? 'disabled' : ''}>${jogo.status === 'cancelado' ? 'Cancelado' : 'Cancelar'}</button>
                            </td>
                        `;
                        tabelaJogosBody.appendChild(tr);
                    });
                }

                // Adicionar event listeners para os botões de toggle
                adicionarEventosToggleRodadas();

                adicionarEventosBotoes();
            } else {
                tabelaJogosBody.innerHTML = '<tr><td colspan="6">Nenhum jogo encontrado.</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar jogos:', error);
            tabelaJogosBody.innerHTML = '<tr><td colspan="6">Erro ao carregar jogos.</td></tr>';
        }
    }

    function organizarJogosPorRodada(jogos) {
        const jogosPorRodada = {};
        const jogosOrdenados = [...jogos].sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

        // Agrupar jogos por data (cada data representa uma rodada)
        const jogosPorData = {};
        jogosOrdenados.forEach(jogo => {
            const data = jogo.data_hora.split(' ')[0]; // Pega apenas a data (YYYY-MM-DD)
            if (!jogosPorData[data]) {
                jogosPorData[data] = [];
            }
            jogosPorData[data].push(jogo);
        });

        // Organizar por rodadas sequenciais
        const datasOrdenadas = Object.keys(jogosPorData).sort();
        datasOrdenadas.forEach((data, index) => {
            const dataFormatada = new Date(data).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const rodada = `${index + 1}ª Rodada - ${dataFormatada}`;
            jogosPorRodada[rodada] = jogosPorData[data];
        });

        return jogosPorRodada;
    }

    function adicionarEventosBotoes() {
        const botoesRegistrar = document.querySelectorAll('.btn-registrar');
        const botoesSumula = document.querySelectorAll('.btn-sumula');
        const botoesEditar = document.querySelectorAll('.btn-editar');
        const botoesCancelar = document.querySelectorAll('.btn-cancelar');

        botoesRegistrar.forEach(botao => {
            botao.addEventListener('click', () => {
                const id = botao.getAttribute('data-id');
                abrirModalResultado(id);
            });
        });

        botoesSumula.forEach(botao => {
            botao.addEventListener('click', () => {
                const id = botao.getAttribute('data-id');
                gerarSumula(id);
            });
        });

        botoesEditar.forEach(botao => {
            botao.addEventListener('click', () => {
                const id = botao.getAttribute('data-id');
                editarJogo(id);
            });
        });

        botoesCancelar.forEach(botao => {
            botao.addEventListener('click', () => {
                const id = botao.getAttribute('data-id');
                cancelarJogo(id);
            });
        });
    }

    function adicionarEventosToggleRodadas() {
        // Event listener para o botão de expandir/colapsar todas as rodadas
        const btnToggleRodadas = document.getElementById('btnToggleRodadas');
        if (btnToggleRodadas) {
            btnToggleRodadas.addEventListener('click', () => {
                const jogosRodada = document.querySelectorAll('.jogo-rodada');
                const btnsToggleRodada = document.querySelectorAll('.btn-toggle-rodada');
                const isExpanded = btnToggleRodadas.textContent === 'Colapsar Todas';

                if (isExpanded) {
                    // Colapsar todas as rodadas
                    jogosRodada.forEach(jogo => jogo.style.display = 'none');
                    btnsToggleRodada.forEach(btn => btn.textContent = '▶');
                    btnToggleRodadas.textContent = 'Expandir Todas';
                } else {
                    // Expandir todas as rodadas
                    jogosRodada.forEach(jogo => jogo.style.display = 'table-row');
                    btnsToggleRodada.forEach(btn => btn.textContent = '▼');
                    btnToggleRodadas.textContent = 'Colapsar Todas';
                }
            });
        }

        // Event listeners para os botões individuais de cada rodada
        const btnsToggleRodada = document.querySelectorAll('.btn-toggle-rodada');
        btnsToggleRodada.forEach(btn => {
            btn.addEventListener('click', () => {
                const rodadaId = btn.getAttribute('data-rodada');
                const jogosRodada = document.querySelectorAll(`.jogo-rodada[data-rodada="${rodadaId}"]`);
                const isExpanded = btn.textContent === '▼';

                if (isExpanded) {
                    // Colapsar rodada
                    jogosRodada.forEach(jogo => jogo.style.display = 'none');
                    btn.textContent = '▶';
                } else {
                    // Expandir rodada
                    jogosRodada.forEach(jogo => jogo.style.display = 'table-row');
                    btn.textContent = '▼';
                }

                // Atualizar o botão geral se necessário
                atualizarBotaoGeral();
            });
        });
    }

    function atualizarBotaoGeral() {
        const btnToggleRodadas = document.getElementById('btnToggleRodadas');
        if (!btnToggleRodadas) return;

        const btnsToggleRodada = document.querySelectorAll('.btn-toggle-rodada');
        const todasExpandidas = Array.from(btnsToggleRodada).every(btn => btn.textContent === '▼');
        const todasColapsadas = Array.from(btnsToggleRodada).every(btn => btn.textContent === '▶');

        if (todasExpandidas) {
            btnToggleRodadas.textContent = 'Colapsar Todas';
        } else if (todasColapsadas) {
            btnToggleRodadas.textContent = 'Expandir Todas';
        } else {
            btnToggleRodadas.textContent = 'Alternar Todas';
        }
    }

    async function abrirModalResultado(id) {
        try {
            const { data: jogo, error } = await supabaseClient
                .from('jogos')
                .select(`
                    *,
                    time_casa:times!time_casa_id(nome),
                    time_visitante:times!time_visitante_id(nome)
                `)
                .eq('id', id)
                .single();

            if (error || !jogo) {
                alert('Jogo não encontrado.');
                return;
            }

            jogoAtual = jogo;

            document.getElementById('infoJogo').innerHTML = `
                <p><strong>${jogo.time_casa.nome} x ${jogo.time_visitante.nome}</strong></p>
                <p>${formatarDataHora(jogo.data_hora)} - ${jogo.local}</p>
            `;

            // Atualizar labels dos campos de gols com nomes dos times
            document.querySelector('label[for="golsCasa"]').textContent = `Gols ${jogo.time_casa.nome}:`;
            document.querySelector('label[for="golsVisitante"]').textContent = `Gols ${jogo.time_visitante.nome}:`;

            document.getElementById('golsCasa').value = jogo.gols_casa || 0;
            document.getElementById('golsVisitante').value = jogo.gols_visitante || 0;

            await carregarJogadoresParaGols(jogo.time_casa_id, jogo.time_visitante_id);
            await carregarJogadoresParaCartoes(jogo.time_casa_id, jogo.time_visitante_id);

            modalResultado.style.display = 'block';
        } catch (error) {
            console.error('Erro ao abrir modal:', error);
            alert('Erro ao abrir modal de resultado.');
        }
    }

    async function carregarJogadoresParaGols(timeCasaId, timeVisitanteId) {
        try {
            console.log('Carregando jogadores para gols - Casa ID:', timeCasaId, 'Visitante ID:', timeVisitanteId);
            const jogadoresCasa = await getJogadores(timeCasaId);
            const jogadoresVisitante = await getJogadores(timeVisitanteId);

            console.log('Jogadores casa:', jogadoresCasa);
            console.log('Jogadores visitante:', jogadoresVisitante);

            const listaCasa = document.getElementById('listaGolsCasa');
            const listaVisitante = document.getElementById('listaGolsVisitante');

            console.log('Div listaGolsCasa encontrada:', !!listaCasa);
            console.log('Div listaGolsVisitante encontrada:', !!listaVisitante);

            listaCasa.innerHTML = `<h5>${jogoAtual.time_casa.nome}</h5>`;
            listaVisitante.innerHTML = `<h5>${jogoAtual.time_visitante.nome}</h5>`;

            console.log('Div listaCartoesCasa encontrada:', !!listaCasa);
            console.log('Div listaCartoesVisitante encontrada:', !!listaVisitante);

            console.log('Adicionando jogadores da casa...');
            jogadoresCasa.forEach(jogador => {
                if (jogador.status === 'ativo') {
                    const jogadorDiv = document.createElement('div');
                    jogadorDiv.className = 'jogador-gols';
                    jogadorDiv.setAttribute('data-jogador', jogador.id);
                    jogadorDiv.innerHTML = `
                        <div class="jogador-header">
                            <label>${jogador.nome_completo} (${jogador.numero_camisa}):</label>
                            <button type="button" class="btn-add-gol" data-jogador="${jogador.id}" data-time="casa">+ Gol</button>
                        </div>
                        <div class="gols-container" data-jogador="${jogador.id}">
                            <div class="gol-input">
                                <input type="number" min="0" max="120" placeholder="Minuto" data-jogador="${jogador.id}" data-time="casa">
                                <button type="button" class="btn-remove-gol" style="display: none;">Remover</button>
                            </div>
                        </div>
                    `;
                    listaCasa.appendChild(jogadorDiv);
                }
            });

            console.log('Adicionando jogadores do visitante...');
            jogadoresVisitante.forEach(jogador => {
                if (jogador.status === 'ativo') {
                    const jogadorDiv = document.createElement('div');
                    jogadorDiv.className = 'jogador-gols';
                    jogadorDiv.setAttribute('data-jogador', jogador.id);
                    jogadorDiv.innerHTML = `
                        <div class="jogador-header">
                            <label>${jogador.nome_completo} (${jogador.numero_camisa}):</label>
                            <button type="button" class="btn-add-gol" data-jogador="${jogador.id}" data-time="visitante">+ Gol</button>
                        </div>
                        <div class="gols-container" data-jogador="${jogador.id}">
                            <div class="gol-input">
                                <input type="number" min="0" max="120" placeholder="Minuto" data-jogador="${jogador.id}" data-time="visitante">
                                <button type="button" class="btn-remove-gol" style="display: none;">Remover</button>
                            </div>
                        </div>
                    `;
                    listaVisitante.appendChild(jogadorDiv);
                }
            });

            // Adicionar event listeners para os botões de adicionar gol
            adicionarEventosBotoesGols();

            console.log('HTML final listaGolsCasa:', listaCasa.innerHTML);
            console.log('HTML final listaGolsVisitante:', listaVisitante.innerHTML);
        } catch (error) {
            console.error('Erro ao carregar jogadores para gols:', error);
        }
    }

    async function carregarJogadoresParaCartoes(timeCasaId, timeVisitanteId) {
        try {
            console.log('Carregando jogadores para cartões - Casa ID:', timeCasaId, 'Visitante ID:', timeVisitanteId);
            const jogadoresCasa = await getJogadores(timeCasaId);
            const jogadoresVisitante = await getJogadores(timeVisitanteId);

            console.log('Jogadores casa para cartões:', jogadoresCasa);
            console.log('Jogadores visitante para cartões:', jogadoresVisitante);

            const listaCasa = document.getElementById('listaCartoesCasa');
            const listaVisitante = document.getElementById('listaCartoesVisitante');

            console.log('Div listaCartoesCasa encontrada:', !!listaCasa);
            console.log('Div listaCartoesVisitante encontrada:', !!listaVisitante);

            console.log('Antes de adicionar conteúdo - listaCasa.innerHTML:', listaCasa.innerHTML);
            console.log('Antes de adicionar conteúdo - listaVisitante.innerHTML:', listaVisitante.innerHTML);

            listaCasa.innerHTML = `<h5>${jogoAtual.time_casa.nome}</h5>`;
            listaVisitante.innerHTML = `<h5>${jogoAtual.time_visitante.nome}</h5>`;

            console.log('Após adicionar títulos - listaCasa.innerHTML:', listaCasa.innerHTML);
            console.log('Após adicionar títulos - listaVisitante.innerHTML:', listaVisitante.innerHTML);

            console.log('Adicionando jogadores da casa para cartões...');
            jogadoresCasa.forEach(jogador => {
                if (jogador.status === 'ativo') {
                    const jogadorDiv = document.createElement('div');
                    jogadorDiv.className = 'jogador-cartoes';
                    jogadorDiv.setAttribute('data-jogador', jogador.id);
                    jogadorDiv.innerHTML = `
                        <div class="jogador-header">
                            <label>${jogador.nome_completo} (${jogador.numero_camisa}):</label>
                            <button type="button" class="btn-add-cartao" data-jogador="${jogador.id}" data-time="casa">+ Cartão</button>
                        </div>
                        <div class="cartoes-container" data-jogador="${jogador.id}">
                            <div class="cartao-input">
                                <select data-jogador="${jogador.id}" data-time="casa">
                                    <option value="">Nenhum</option>
                                    <option value="amarelo">Amarelo</option>
                                    <option value="azul">Azul</option>
                                    <option value="vermelho">Vermelho</option>
                                </select>
                                <input type="number" min="0" max="120" placeholder="Minuto" data-minuto-jogador="${jogador.id}" data-time="casa">
                                <button type="button" class="btn-remove-cartao" style="display: none;">Remover</button>
                            </div>
                        </div>
                    `;
                    listaCasa.appendChild(jogadorDiv);
                }
            });

            console.log('Adicionando jogadores do visitante para cartões...');
            jogadoresVisitante.forEach(jogador => {
                if (jogador.status === 'ativo') {
                    const jogadorDiv = document.createElement('div');
                    jogadorDiv.className = 'jogador-cartoes';
                    jogadorDiv.setAttribute('data-jogador', jogador.id);
                    jogadorDiv.innerHTML = `
                        <div class="jogador-header">
                            <label>${jogador.nome_completo} (${jogador.numero_camisa}):</label>
                            <button type="button" class="btn-add-cartao" data-jogador="${jogador.id}" data-time="visitante">+ Cartão</button>
                        </div>
                        <div class="cartoes-container" data-jogador="${jogador.id}">
                            <div class="cartao-input">
                                <select data-jogador="${jogador.id}" data-time="visitante">
                                    <option value="">Nenhum</option>
                                    <option value="amarelo">Amarelo</option>
                                    <option value="azul">Azul</option>
                                    <option value="vermelho">Vermelho</option>
                                </select>
                                <input type="number" min="0" max="120" placeholder="Minuto" data-minuto-jogador="${jogador.id}" data-time="visitante">
                                <button type="button" class="btn-remove-cartao" style="display: none;">Remover</button>
                            </div>
                        </div>
                    `;
                    listaVisitante.appendChild(jogadorDiv);
                }
            });

            // Adicionar event listeners para os botões de adicionar cartão
            adicionarEventosBotoesCartoes();

            console.log('HTML final listaCartoesCasa:', listaCasa.innerHTML);
            console.log('HTML final listaCartoesVisitante:', listaVisitante.innerHTML);
        } catch (error) {
            console.error('Erro ao carregar jogadores para cartões:', error);
        }
    }

    async function salvarResultado() {
        if (isSaving) {
            console.log('Salvamento já em andamento, ignorando clique duplicado.');
            return;
        }

        const submitButton = document.querySelector('#resultadoForm button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';
        }

        isSaving = true;

        const golsCasa = parseInt(document.getElementById('golsCasa').value) || 0;
        const golsVisitante = parseInt(document.getElementById('golsVisitante').value) || 0;

        try {
            console.log('Salvando resultado para jogo ID:', jogoAtual ? jogoAtual.id : 'undefined');
            // Atualizar placar do jogo
            const { error: updateError } = await supabaseClient
                .from('jogos')
                .update({
                    gols_casa: golsCasa,
                    gols_visitante: golsVisitante,
                    status: 'finalizado'
                })
                .eq('id', jogoAtual ? jogoAtual.id : null);

            if (updateError) {
                console.error('Erro ao atualizar placar:', updateError);
                alert('Erro ao salvar resultado: ' + updateError.message);
                return;
            }

            // Registrar gols
            await registrarGols();

            // Registrar cartões
            await registrarCartoes();

            alert('Resultado salvo com sucesso!');
            modalResultado.style.display = 'none';
            carregarJogos();

        } catch (error) {
            console.error('Erro ao salvar resultado:', error);
            alert('Erro ao salvar resultado: ' + error.message);
        } finally {
            isSaving = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Salvar Resultado';
            }
        }
    }

    async function registrarGols() {
        const golInputs = document.querySelectorAll('.gol-input input');
        const jogadoresAtualizar = new Set();

        // Primeiro, registrar todos os gols na tabela 'gols'
        for (const input of golInputs) {
            const minuto = parseInt(input.value);
            if (minuto > 0) {
                const jogadorId = input.getAttribute('data-jogador');
                const gol = {
                    jogo_id: jogoAtual.id,
                    jogador_id: parseInt(jogadorId),
                    minuto: minuto
                };
                await createGol(gol);
                jogadoresAtualizar.add(jogadorId);
            }
        }

        // Depois, recalcular o total de gols para cada jogador afetado
        for (const jogadorId of jogadoresAtualizar) {
            // Buscar todos os gols do jogador na tabela 'gols'
            const { data: golsJogador, error } = await supabaseClient
                .from('gols')
                .select('id')
                .eq('jogador_id', jogadorId);

            if (error) {
                console.error('Erro ao buscar gols do jogador:', error);
                continue;
            }

            const totalGols = golsJogador ? golsJogador.length : 0;

            // Atualizar o campo 'gols_marcados' com o total recalculado
            await supabaseClient
                .from('jogadores')
                .update({ gols_marcados: totalGols })
                .eq('id', jogadorId);
        }
    }

    async function registrarCartoes() {
        const cartaoSelects = document.querySelectorAll('.cartao-input select');
        const minutoInputs = document.querySelectorAll('.cartao-input input[type="number"]');

        for (let i = 0; i < cartaoSelects.length; i++) {
            const tipo = cartaoSelects[i].value;
            const minutoInput = minutoInputs[i];
            const minuto = parseInt(minutoInput.value);

            if (tipo && minuto > 0) {
                const jogadorId = cartaoSelects[i].getAttribute('data-jogador');
                const cartao = {
                    jogo_id: jogoAtual.id,
                    jogador_id: parseInt(jogadorId),
                    tipo: tipo,
                    minuto: minuto
                };
                await createCartao(cartao);

                // Buscar valor atual e atualizar contador de cartões do jogador
                const coluna = tipo === 'amarelo' ? 'cartoes_amarelos' :
                              tipo === 'azul' ? 'cartoes_azuis' : 'cartoes_vermelhos';

                const { data: jogador } = await supabaseClient
                    .from('jogadores')
                    .select(coluna)
                    .eq('id', jogadorId)
                    .single();

                if (jogador) {
                    await supabaseClient
                        .from('jogadores')
                        .update({ [coluna]: (jogador[coluna] || 0) + 1 })
                        .eq('id', jogadorId);
                }
            }
        }
    }

    async function gerarTabelaJogos() {
        try {
            const times = await getTimes(null);
            if (!times || times.length < 2) {
                alert('É necessário pelo menos 2 times para gerar a tabela.');
                return;
            }

            // Mostrar modal de seleção de tipo de tabela
            mostrarModalTipoTabela(times);

        } catch (error) {
            console.error('Erro ao gerar tabela:', error);
            alert('Erro ao gerar tabela de jogos.');
        }
    }

    function mostrarModalTipoTabela(times) {
        // Criar modal se não existir
        let modal = document.getElementById('modalTipoTabela');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modalTipoTabela';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" onclick="fecharModalTipoTabela()">&times;</span>
                    <h2>Gerar Tabela de Jogos</h2>
                    <p>Escolha o tipo de tabela que deseja gerar:</p>
                    <div class="tipo-tabela-opcoes">
                        <div class="opcao-tabela">
                            <input type="radio" id="turno-unico" name="tipo-tabela" value="turno-unico" checked>
                            <label for="turno-unico">
                                <strong>Turno Único</strong><br>
                                Cada time joga uma vez contra cada adversário.<br>
                                <small>Total de jogos: ${times.length * (times.length - 1) / 2}</small>
                            </label>
                        </div>
                        <div class="opcao-tabela">
                            <input type="radio" id="todos-contra-todos" name="tipo-tabela" value="todos-contra-todos">
                            <label for="todos-contra-todos">
                                <strong>Todos Contra Todos</strong><br>
                                Cada time joga duas vezes contra cada adversário (casa e fora).<br>
                                <small>Total de jogos: ${times.length * (times.length - 1)}</small>
                            </label>
                        </div>
                    </div>
                    <div class="modal-buttons">
                        <button id="confirmarGeracaoTabelaBtn" class="btn-primary">Gerar Tabela</button>
                        <button id="cancelarGeracaoTabelaBtn" class="btn-secondary">Cancelar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Sempre adicionar/remover event listeners para garantir funcionamento
        const btnConfirmar = document.getElementById('confirmarGeracaoTabelaBtn');
        const btnCancelar = document.getElementById('cancelarGeracaoTabelaBtn');

        // Remover event listeners existentes para evitar duplicatas
        btnConfirmar.removeEventListener('click', confirmarGeracaoTabela);
        btnCancelar.removeEventListener('click', fecharModalTipoTabela);

        // Adicionar event listeners
        btnConfirmar.addEventListener('click', confirmarGeracaoTabela);
        btnCancelar.addEventListener('click', fecharModalTipoTabela);

        modal.style.display = 'block';
    }

async function confirmarGeracaoTabela() {
        console.log('Iniciando confirmação de geração de tabela...');
        const tipoSelecionado = document.querySelector('input[name="tipo-tabela"]:checked').value;
        console.log('Tipo selecionado:', tipoSelecionado);
        const times = await getTimes(null);
        if (!times || !Array.isArray(times)) {
            alert('Erro ao carregar os times. Verifique sua conexão de rede e tente novamente.');
            return;
        }
        console.log('Times carregados:', times.length);
        console.log('Times:', times);

        // Verificar se existe um campeonato ativo
        let campeonatos = await getCampeonatos();
        console.log('Campeonatos encontrados:', campeonatos);

        let campeonatoId = null;
        if (campeonatos && campeonatos.length > 0) {
            // Usar o primeiro campeonato ativo encontrado
            const campeonatoAtivo = campeonatos.find(c => c.status === 'ativo') || campeonatos[0];
            campeonatoId = campeonatoAtivo.id;
            console.log('Usando campeonato ID:', campeonatoId);
        } else {
            console.log('Nenhum campeonato encontrado. Criando um novo...');
            // Criar um campeonato padrão se não existir nenhum
            const novoCampeonato = {
                nome: 'Campeonato Temporário',
                data_inicio: '2025-01-01',
                data_fim: '2025-12-31',
                status: 'ativo'
            };
            const resultado = await createCampeonato(novoCampeonato);
            if (resultado && resultado.data && resultado.data.length > 0) {
                campeonatoId = resultado.data[0].id;
                console.log('Novo campeonato criado com ID:', campeonatoId);
            } else {
                alert('Erro ao criar campeonato. Não é possível gerar a tabela.');
                return;
            }
        }

        let jogosGerados = [];
        let mensagemConfirmacao = '';

        if (tipoSelecionado === 'turno-unico') {
            // Algoritmo round-robin corrigido para turno único
            const numTimes = times.length;
            const isOdd = numTimes % 2 !== 0;
            const numRodadas = isOdd ? numTimes : numTimes - 1;
            const jogosPorRodada = Math.floor(numTimes / 2);
            let dataBase = new Date('2025-02-01');

            // Criar array de times, adicionando um "time fictício" se for ímpar para descanso
            let timesParaRodadas = [...times];
            if (isOdd) {
                timesParaRodadas.push({ id: null, nome: 'Descanso' });
            }

            // Algoritmo round-robin correto
            for (let rodada = 0; rodada < numRodadas; rodada++) {
                const dataRodada = new Date(dataBase);
                dataRodada.setDate(dataBase.getDate() + rodada * 7); // Uma semana por rodada

                // Gerar jogos para esta rodada
                for (let i = 0; i < Math.floor(timesParaRodadas.length / 2); i++) {
                    const timeCasa = timesParaRodadas[i];
                    const timeVisitante = timesParaRodadas[timesParaRodadas.length - 1 - i];

                    if (timeCasa.id !== null && timeVisitante.id !== null) {
                        jogosGerados.push({
                            campeonato_id: campeonatoId,
                            time_casa_id: timeCasa.id,
                            time_visitante_id: timeVisitante.id,
                            data_hora: dataRodada.toISOString().slice(0, 19).replace('T', ' '),
                            local: 'A definir',
                            status: 'agendado'
                        });
                    }
                }

                // Rotacionar array para a próxima rodada (algoritmo round-robin correto)
                // Fixar o primeiro time e rotacionar os demais no sentido horário
                const primeiroTime = timesParaRodadas.shift(); // Remove o primeiro time (fixo)
                const segundoTime = timesParaRodadas.shift(); // Remove o segundo time
                timesParaRodadas.push(segundoTime); // Move o segundo time para o final
                timesParaRodadas.unshift(primeiroTime); // Coloca o primeiro time de volta no início
            }

            // Calcular o número total de jogos esperado
            const totalJogosEsperado = (numTimes * (numTimes - 1)) / 2;

            console.log(`Times: ${numTimes}, Rodadas: ${numRodadas}, Jogos por rodada: ${jogosPorRodada}`);
            console.log(`Total esperado: ${totalJogosEsperado}, Total gerado: ${jogosGerados.length}`);

            // Verificar se o número de jogos gerados está correto
            if (jogosGerados.length !== totalJogosEsperado) {
                console.error(`Erro na geração de jogos: esperado ${totalJogosEsperado}, gerado ${jogosGerados.length}`);
                console.log('Jogos gerados:', jogosGerados.map(j => `${j.time_casa_id} vs ${j.time_visitante_id}`));
                alert('Erro na geração da tabela. Verifique o console para mais detalhes.');
                return;
            }

            const mensagemDescanso = isOdd ? `\nUm time descansará a cada rodada.` : '';
            mensagemConfirmacao = `Gerar tabela de Turno Único para ${numTimes} times?\n\n` +
                `Isso criará ${jogosGerados.length} jogos organizados em ${numRodadas} rodadas.\n` +
                `Cada rodada terá ${jogosPorRodada} jogos.${mensagemDescanso}\n` +
                `Total esperado: ${totalJogosEsperado} jogos (${numTimes} × ${numTimes - 1} / 2 = ${totalJogosEsperado}).`;
        } else if (tipoSelecionado === 'todos-contra-todos') {
            // Lógica para ida e volta com distribuição por rodadas
            const numTimes = times.length;
            const isOdd = numTimes % 2 !== 0;
            const numRodadas = isOdd ? numTimes : numTimes - 1;
            const jogosPorRodada = Math.floor(numTimes / 2);
            let dataBase = new Date('2025-02-01');

            // Criar array de times, adicionando um "time fictício" se for ímpar para descanso
            let timesParaRodadas = [...times];
            if (isOdd) {
                timesParaRodadas.push({ id: null, nome: 'Descanso' });
            }

            // Ida - Primeiro turno
            for (let rodada = 0; rodada < numRodadas; rodada++) {
                const dataRodada = new Date(dataBase);
                dataRodada.setDate(dataBase.getDate() + rodada * 7); // Uma semana por rodada

                for (let i = 0; i < Math.floor(timesParaRodadas.length / 2); i++) {
                    const timeCasa = timesParaRodadas[i];
                    const timeVisitante = timesParaRodadas[timesParaRodadas.length - 1 - i];

                    if (timeCasa.id !== null && timeVisitante.id !== null) {
                        jogosGerados.push({
                            campeonato_id: campeonatoId,
                            time_casa_id: timeCasa.id,
                            time_visitante_id: timeVisitante.id,
                            data_hora: dataRodada.toISOString().slice(0, 19).replace('T', ' '),
                            local: 'A definir',
                            status: 'agendado'
                        });
                    }
                }

                // Rotacionar array para a próxima rodada (algoritmo round-robin correto)
                // Fixar o primeiro time e rotacionar os demais no sentido horário
                const primeiroTime = timesParaRodadas.shift(); // Remove o primeiro time (fixo)
                const segundoTime = timesParaRodadas.shift(); // Remove o segundo time
                timesParaRodadas.push(segundoTime); // Move o segundo time para o final
                timesParaRodadas.unshift(primeiroTime); // Coloca o primeiro time de volta no início
            }

            // Volta - Segundo turno (inverter mandos de campo)
            // Resetar array para a ordem original
            timesParaRodadas = [...times];
            if (isOdd) {
                timesParaRodadas.push({ id: null, nome: 'Descanso' });
            }

            for (let rodada = 0; rodada < numRodadas; rodada++) {
                const dataRodada = new Date(dataBase);
                dataRodada.setDate(dataBase.getDate() + (numRodadas + rodada) * 7); // Uma semana por rodada (após o primeiro turno)

                for (let i = 0; i < Math.floor(timesParaRodadas.length / 2); i++) {
                    const timeCasa = timesParaRodadas[timesParaRodadas.length - 1 - i];
                    const timeVisitante = timesParaRodadas[i];

                    if (timeCasa.id !== null && timeVisitante.id !== null) {
                        jogosGerados.push({
                            campeonato_id: campeonatoId,
                            time_casa_id: timeCasa.id,
                            time_visitante_id: timeVisitante.id,
                            data_hora: dataRodada.toISOString().slice(0, 19).replace('T', ' '),
                            local: 'A definir',
                            status: 'agendado'
                        });
                    }
                }

                // Rotacionar array para a próxima rodada (algoritmo round-robin correto)
                // Fixar o primeiro time e rotacionar os demais no sentido horário
                const primeiroTime = timesParaRodadas.shift(); // Remove o primeiro time (fixo)
                const segundoTime = timesParaRodadas.shift(); // Remove o segundo time
                timesParaRodadas.push(segundoTime); // Move o segundo time para o final
                timesParaRodadas.unshift(primeiroTime); // Coloca o primeiro time de volta no início
            }

            // Calcular o número total de jogos esperado para ida e volta
            const totalJogosEsperado = numTimes * (numTimes - 1);

            // Verificar se o número de jogos gerados está correto
            if (jogosGerados.length !== totalJogosEsperado) {
                console.error(`Erro na geração de jogos: esperado ${totalJogosEsperado}, gerado ${jogosGerados.length}`);
                alert('Erro na geração da tabela. Verifique o console para mais detalhes.');
                return;
            }

            const mensagemDescanso = isOdd ? `\nUm time descansará a cada rodada.` : '';
            mensagemConfirmacao = `Gerar tabela de Todos Contra Todos para ${numTimes} times?\n\n` +
                `Isso criará ${jogosGerados.length} jogos organizados em ${numRodadas * 2} rodadas.\n` +
                `Cada rodada terá ${jogosPorRodada} jogos.${mensagemDescanso}\n` +
                `Total esperado: ${totalJogosEsperado} jogos (${numTimes} × ${numTimes - 1} = ${totalJogosEsperado}).`;
        }

        console.log('Jogos gerados:', jogosGerados.length);
        console.log('Primeiro jogo de exemplo:', jogosGerados[0]);

        const confirmacao = confirm(mensagemConfirmacao);
        if (!confirmacao) {
            console.log('Confirmação cancelada pelo usuário.');
            return;
        }

        try {
            console.log('Iniciando inserção em lote...');
            // Inserir jogos em lote para evitar freeze
            await createJogosBatch(jogosGerados);
            console.log('Inserção em lote concluída.');

            alert(`Tabela gerada com sucesso! ${jogosGerados.length} jogos criados.`);
            fecharModalTipoTabela();
            carregarJogos();

        } catch (error) {
            console.error('Erro ao gerar tabela:', error);
            alert('Erro ao gerar tabela de jogos. Verifique o console para mais detalhes.');
        }
    }

    function fecharModalTipoTabela() {
        const modal = document.getElementById('modalTipoTabela');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async function editarJogo(id) {
        try {
            // Buscar dados do jogo para edição
            const { data: jogo, error } = await supabaseClient
                .from('jogos')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !jogo) {
                alert('Jogo não encontrado para edição.');
                return;
            }

            // Preencher formulário de edição com dados do jogo
            document.getElementById('editarTimeCasa').innerHTML = '';
            document.getElementById('editarTimeVisitante').innerHTML = '';

            const times = await getTimes(null);
            times.forEach(time => {
                const optionCasa = document.createElement('option');
                optionCasa.value = time.id;
                optionCasa.textContent = time.nome;
                if (time.id === jogo.time_casa_id) optionCasa.selected = true;
                document.getElementById('editarTimeCasa').appendChild(optionCasa);

                const optionVisitante = document.createElement('option');
                optionVisitante.value = time.id;
                optionVisitante.textContent = time.nome;
                if (time.id === jogo.time_visitante_id) optionVisitante.selected = true;
                document.getElementById('editarTimeVisitante').appendChild(optionVisitante);
            });

            document.getElementById('editarDataHora').value = jogo.data_hora.replace(' ', 'T');
            document.getElementById('editarLocal').value = jogo.local;
            document.getElementById('editarArbitro').value = jogo.arbitro || '';
            document.getElementById('editarObservacoes').value = jogo.observacoes || '';

            // Exibir modal de edição
            const modalEditar = document.getElementById('modalEditarJogo');
            modalEditar.style.display = 'block';

            // Configurar evento para fechar modal
            document.getElementById('closeModalEditar').onclick = () => {
                modalEditar.style.display = 'none';
            };
            document.getElementById('btnCancelarEditar').onclick = () => {
                modalEditar.style.display = 'none';
            };

            // Configurar submissão do formulário de edição
            const formEditar = document.getElementById('editarJogoForm');
            formEditar.onsubmit = async (e) => {
                e.preventDefault();

                const timeCasa = document.getElementById('editarTimeCasa').value;
                const timeVisitante = document.getElementById('editarTimeVisitante').value;
                const dataHora = document.getElementById('editarDataHora').value;
                const local = document.getElementById('editarLocal').value.trim();
                const arbitro = document.getElementById('editarArbitro').value.trim();
                const observacoes = document.getElementById('editarObservacoes').value.trim();

                if (!timeCasa || !timeVisitante || !dataHora || !local) {
                    alert('Preencha todos os campos obrigatórios.');
                    return;
                }

                if (timeCasa === timeVisitante) {
                    alert('Os times da casa e visitante devem ser diferentes.');
                    return;
                }

                try {
                    const { error: updateError } = await supabaseClient
                        .from('jogos')
                        .update({
                            time_casa_id: parseInt(timeCasa),
                            time_visitante_id: parseInt(timeVisitante),
                            data_hora: dataHora,
                            local: local,
                            arbitro: arbitro,
                            observacoes: observacoes
                        })
                        .eq('id', id);

                    if (updateError) {
                        alert('Erro ao atualizar jogo: ' + updateError.message);
                        return;
                    }

                    alert('Jogo atualizado com sucesso!');
                    modalEditar.style.display = 'none';
                    carregarJogos();

                } catch (error) {
                    alert('Erro ao atualizar jogo: ' + error.message);
                }
            };

        } catch (error) {
            alert('Erro ao carregar dados para edição: ' + error.message);
        }
    }

    async function cancelarJogo(id) {
        const confirmacao = confirm('Tem certeza que deseja cancelar este jogo?');
        if (!confirmacao) return;

        try {
            const { error } = await supabaseClient
                .from('jogos')
                .update({ status: 'cancelado' })
                .eq('id', id);

            if (error) {
                console.error('Erro ao cancelar jogo:', error);
                alert('Erro ao cancelar jogo.');
                return;
            }

            alert('Jogo cancelado com sucesso!');
            carregarJogos();
        } catch (error) {
            console.error('Erro ao cancelar jogo:', error);
            alert('Erro ao cancelar jogo.');
        }
    }

    async function gerarSumula(id) {
        try {
            // Buscar dados completos do jogo
            const { data: jogo, error: jogoError } = await supabaseClient
                .from('jogos')
                .select(`
                    *,
                    time_casa:times!time_casa_id(*),
                    time_visitante:times!time_visitante_id(*)
                `)
                .eq('id', id)
                .single();

            if (jogoError || !jogo) {
                alert('Jogo não encontrado.');
                return;
            }

            // Buscar jogadores dos times
            const jogadoresCasa = await getJogadores(jogo.time_casa_id);
            const jogadoresVisitante = await getJogadores(jogo.time_visitante_id);

            // Buscar gols do jogo
            const { data: gols, error: golsError } = await supabaseClient
                .from('gols')
                .select(`
                    *,
                    jogador:jogadores!jogador_id(nome_completo, numero_camisa)
                `)
                .eq('jogo_id', id)
                .order('minuto');

            // Buscar cartões do jogo
            const { data: cartoes, error: cartoesError } = await supabaseClient
                .from('cartoes')
                .select(`
                    *,
                    jogador:jogadores!jogador_id(nome_completo, numero_camisa)
                `)
                .eq('jogo_id', id)
                .order('minuto');

            // Armazenar dados do jogo para uso nos botões do modal
            jogoAtual = jogo;
            jogoAtual.jogadoresCasa = jogadoresCasa || [];
            jogoAtual.jogadoresVisitante = jogadoresVisitante || [];
            jogoAtual.gols = gols || [];
            jogoAtual.cartoes = cartoes || [];

            // Preencher informações básicas do jogo
            document.getElementById('infoJogoSumula').innerHTML = `
                <p><strong>${jogo.time_casa.nome} x ${jogo.time_visitante.nome}</strong></p>
                <p>${formatarDataHora(jogo.data_hora)} - ${jogo.local}</p>
            `;

            // Preencher placar final
            const placar = jogo.status === 'finalizado' ? `${jogo.gols_casa || 0} - ${jogo.gols_visitante || 0}` : 'Jogo não finalizado';
            document.getElementById('placarFinal').textContent = placar;

            // Preencher relação de jogadores com gols e cartões na ordem: Nº, Nome, Gols, AM, AZ, VER

            // Função para contar gols e cartões por jogador
            function contarEventos(jogadorId, eventos, tipoCartao = null) {
                if (!eventos) return 0;
                if (tipoCartao) {
                    return eventos.filter(e => e.jogador_id === jogadorId && e.tipo === tipoCartao).length;
                } else {
                    return eventos.filter(e => e.jogador_id === jogadorId).length;
                }
            }

            // Função para montar linhas da tabela para um time
            function montarLinhasTabela(jogadores, gols, cartoes) {
                return jogadores
                    .filter(j => j.status === 'ativo')
                    .sort((a, b) => a.numero_camisa - b.numero_camisa)
                    .map(jogador => {
                        const num = jogador.numero_camisa || '';
                        const nome = jogador.nome_completo || '';
                        const golsCount = contarEventos(jogador.id, gols);
                        const amarelos = contarEventos(jogador.id, cartoes, 'amarelo');
                        const azuis = contarEventos(jogador.id, cartoes, 'azul');
                        const vermelhos = contarEventos(jogador.id, cartoes, 'vermelho');

                        return `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${num}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${nome}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${golsCount}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${amarelos}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${azuis}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${vermelhos}</td>
                            </tr>
                        `;
                    }).join('');
            }

            // Montar e inserir linhas para time da casa
            const corpoCasa = document.getElementById('corpoTabelaCasa');
            corpoCasa.innerHTML = montarLinhasTabela(jogadoresCasa, gols, cartoes);

            // Montar e inserir linhas para time visitante
            const corpoVisitante = document.getElementById('corpoTabelaVisitante');
            corpoVisitante.innerHTML = montarLinhasTabela(jogadoresVisitante, gols, cartoes);

            // Preencher nomes dos times nas tabelas
            document.getElementById('timeCasaNomeSumula').textContent = jogo.time_casa.nome;
            document.getElementById('timeVisitanteNomeSumula').textContent = jogo.time_visitante.nome;

            // Preencher árbitro e observações
            document.getElementById('arbitroInfo').innerHTML = jogo.arbitro ? `<strong>Árbitro:</strong> ${jogo.arbitro}` : '<strong>Árbitro:</strong> Não informado';
            document.getElementById('observacoesInfo').innerHTML = jogo.observacoes ? `<strong>Observações:</strong> ${jogo.observacoes}` : '<strong>Observações:</strong> Nenhuma';

            // Mostrar modal de súmula
            modalSumula.style.display = 'block';
        } catch (error) {
            console.error('Erro ao gerar súmula:', error);
            alert('Erro ao gerar súmula.');
        }
    }

    async function gerarSumulaPDFModal(jogoId) {
        try {
            if (!jogoAtual) {
                alert('Dados do jogo não encontrados.');
                return;
            }

            // Gerar PDF da súmula usando a função do pdf-generator.js
            gerarSumulaPDF(jogoAtual, jogoAtual.jogadoresCasa, jogoAtual.jogadoresVisitante,
                          jogoAtual.gols, jogoAtual.cartoes, jogoAtual.arbitro, jogoAtual.observacoes);

        } catch (error) {
            console.error('Erro ao gerar PDF da súmula:', error);
            alert('Erro ao gerar PDF da súmula.');
        }
    }

    async function imprimirSumula(jogoId) {
        try {
            if (!jogoAtual) {
                alert('Dados do jogo não encontrados.');
                return;
            }

            // Gerar e imprimir PDF da súmula usando a função do pdf-generator.js
            gerarSumulaPDF(jogoAtual, jogoAtual.jogadoresCasa, jogoAtual.jogadoresVisitante,
                          jogoAtual.gols, jogoAtual.cartoes, jogoAtual.arbitro, jogoAtual.observacoes);

            // Após gerar o PDF, tentar imprimir
            setTimeout(() => {
                window.print();
            }, 1000);

        } catch (error) {
            console.error('Erro ao imprimir súmula:', error);
            alert('Erro ao imprimir súmula.');
        }
    }

    function adicionarEventosBotoesGols() {
        // Verificar se os event listeners já foram adicionados
        if (eventosGolsAdicionados) {
            return;
        }

        // Usar delegação de eventos para evitar múltiplos event listeners
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-add-gol')) {
                const jogadorId = e.target.getAttribute('data-jogador');
                const time = e.target.getAttribute('data-time');
                const container = document.querySelector(`.gols-container[data-jogador="${jogadorId}"]`);

                // Verificar se já existe um gol-input sem valor para evitar múltiplos inputs vazios
                const golInputs = container.querySelectorAll('.gol-input input');
                const existeInputVazio = Array.from(golInputs).some(input => input.value === '');

                if (existeInputVazio) {
                    // Focar no input vazio existente e não adicionar outro
                    golInputs.forEach(input => {
                        if (input.value === '') {
                            input.focus();
                        }
                    });
                    return;
                }

                const golInput = document.createElement('div');
                golInput.className = 'gol-input';
                golInput.innerHTML = `
                    <input type="number" min="0" max="120" placeholder="Minuto" data-jogador="${jogadorId}" data-time="${time}">
                    <button type="button" class="btn-remove-gol">Remover</button>
                `;

                container.appendChild(golInput);

                // Mostrar botão de remover no primeiro gol se houver mais de um
                const golInputsAtualizados = container.querySelectorAll('.gol-input');
                if (golInputsAtualizados.length > 1) {
                    golInputsAtualizados[0].querySelector('.btn-remove-gol').style.display = 'inline-block';
                }
            }

            if (e.target.classList.contains('btn-remove-gol')) {
                const golInput = e.target.parentElement;
                const container = golInput.parentElement;
                const jogadorId = container.getAttribute('data-jogador');

                golInput.remove();

                // Esconder botão de remover se só houver um gol restante
                const golInputs = container.querySelectorAll('.gol-input');
                if (golInputs.length === 1) {
                    golInputs[0].querySelector('.btn-remove-gol').style.display = 'none';
                }
            }
        });

        // Marcar que os event listeners foram adicionados
        eventosGolsAdicionados = true;
    }

    function adicionarEventosBotoesCartoes() {
        // Verificar se os event listeners já foram adicionados
        if (eventosCartoesAdicionados) {
            return;
        }

        // Usar delegação de eventos para evitar múltiplos event listeners
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-add-cartao')) {
                const jogadorId = e.target.getAttribute('data-jogador');
                const time = e.target.getAttribute('data-time');
                const container = document.querySelector(`.cartoes-container[data-jogador="${jogadorId}"]`);

                // Verificar se já existe um cartao-input sem valor para evitar múltiplos inputs vazios
                const cartaoInputs = container.querySelectorAll('.cartao-input select');
                const existeInputVazio = Array.from(cartaoInputs).some(select => select.value === '');

                if (existeInputVazio) {
                    // Focar no select vazio existente e não adicionar outro
                    cartaoInputs.forEach(select => {
                        if (select.value === '') {
                            select.focus();
                        }
                    });
                    return;
                }

                const cartaoInput = document.createElement('div');
                cartaoInput.className = 'cartao-input';
                cartaoInput.innerHTML = `
                    <select data-jogador="${jogadorId}" data-time="${time}">
                        <option value="">Nenhum</option>
                        <option value="amarelo">Amarelo</option>
                        <option value="azul">Azul</option>
                        <option value="vermelho">Vermelho</option>
                    </select>
                    <input type="number" min="0" max="120" placeholder="Minuto" data-minuto-jogador="${jogadorId}" data-time="${time}">
                    <button type="button" class="btn-remove-cartao">Remover</button>
                `;

                container.appendChild(cartaoInput);

                // Scroll para mostrar o novo cartão
                cartaoInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                // Mostrar botão de remover no primeiro cartão se houver mais de um
                const cartaoInputsAtualizados = container.querySelectorAll('.cartao-input');
                if (cartaoInputsAtualizados.length > 1) {
                    cartaoInputsAtualizados[0].querySelector('.btn-remove-cartao').style.display = 'inline-block';
                }
            }

            if (e.target.classList.contains('btn-remove-cartao')) {
                const cartaoInput = e.target.parentElement;
                const container = cartaoInput.parentElement;
                const jogadorId = container.getAttribute('data-jogador');

                cartaoInput.remove();

                // Esconder botão de remover se só houver um cartão restante
                const cartaoInputs = container.querySelectorAll('.cartao-input');
                if (cartaoInputs.length === 1) {
                    cartaoInputs[0].querySelector('.btn-remove-cartao').style.display = 'none';
                }
            }
        });

        // Marcar que os event listeners foram adicionados
        eventosCartoesAdicionados = true;
    }

    function formatarDataHora(dataHora) {
        const data = new Date(dataHora);
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
});
