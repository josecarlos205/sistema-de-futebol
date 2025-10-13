// Sistema de cartões

import { supabaseClient, getJogos } from './database.js';

document.addEventListener('DOMContentLoaded', function() {
    const btnAtualizarCartoes = document.getElementById('btnAtualizarCartoes');
    const btnExportarCartoesPDF = document.getElementById('btnExportarCartoesPDF');
    const corpoCartoes = document.getElementById('corpoCartoes');

    btnAtualizarCartoes.addEventListener('click', () => {
        carregarCartoes();
    });

    btnExportarCartoesPDF.addEventListener('click', () => {
        exportarCartoesPDF();
    });

    carregarCartoes();

    async function carregarCartoes() {
        corpoCartoes.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';

        try {
            const cartoesJogadores = await calcularCartoes();

            if (cartoesJogadores && cartoesJogadores.length > 0) {
                corpoCartoes.innerHTML = '';

                cartoesJogadores.forEach((jogador, index) => {
                    const tr = document.createElement('tr');

                    tr.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${jogador.nome_completo}</td>
                        <td>${jogador.time_nome || 'N/A'}</td>
                        <td><strong>${jogador.cartoes_amarelos || 0}</strong></td>
                        <td><strong>${jogador.cartoes_azuis || 0}</strong></td>
                        <td><strong>${jogador.cartoes_vermelhos || 0}</strong></td>
                        <td><strong>${jogador.total_cartoes || 0}</strong></td>
                    `;
                    corpoCartoes.appendChild(tr);
                });

                // Atualizar estatísticas gerais
                atualizarEstatisticasGerais(cartoesJogadores);
            } else {
                corpoCartoes.innerHTML = '<tr><td colspan="7">Nenhum cartão encontrado.</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar cartões:', error);
            corpoCartoes.innerHTML = '<tr><td colspan="7">Erro ao carregar cartões.</td></tr>';
        }
    }

    async function calcularCartoes() {
        try {
            // Buscar jogadores com seus times
            const { data: jogadores, error } = await supabaseClient
                .from('jogadores')
                .select(`
                    *,
                    times:time_id (
                        nome
                    )
                `)
                .eq('status', 'ativo')
                .order('cartoes_amarelos', { ascending: false });

            if (error) {
                console.error('Erro ao buscar jogadores:', error);
                return [];
            }

            // Buscar cartões da tabela cartoes
            const { data: cartoes, error: cartoesError } = await supabaseClient
                .from('cartoes')
                .select('*');

            if (cartoesError) {
                console.error('Erro ao buscar cartões:', cartoesError);
                return [];
            }

            // Agrupar cartões por jogador
            const cartoesPorJogador = {};
            cartoes.forEach(cartao => {
                if (!cartoesPorJogador[cartao.jogador_id]) {
                    cartoesPorJogador[cartao.jogador_id] = {
                        amarelos: 0,
                        azuis: 0,
                        vermelhos: 0
                    };
                }
                if (cartao.tipo === 'amarelo') {
                    cartoesPorJogador[cartao.jogador_id].amarelos++;
                } else if (cartao.tipo === 'azul') {
                    cartoesPorJogador[cartao.jogador_id].azuis++;
                } else if (cartao.tipo === 'vermelho') {
                    cartoesPorJogador[cartao.jogador_id].vermelhos++;
                }
            });

            const cartoesJogadores = jogadores.map(jogador => {
                const cartoesJogador = cartoesPorJogador[jogador.id] || { amarelos: 0, azuis: 0, vermelhos: 0 };
                const total = cartoesJogador.amarelos + cartoesJogador.azuis + cartoesJogador.vermelhos;

                return {
                    ...jogador,
                    time_nome: jogador.times?.nome || 'N/A',
                    cartoes_amarelos: cartoesJogador.amarelos,
                    cartoes_azuis: cartoesJogador.azuis,
                    cartoes_vermelhos: cartoesJogador.vermelhos,
                    total_cartoes: total
                };
            });

            // Filtrar jogadores com pelo menos 1 cartão e ordenar
            return cartoesJogadores
                .filter(j => j.total_cartoes > 0)
                .sort((a, b) => {
                    if (a.total_cartoes !== b.total_cartoes) {
                        return b.total_cartoes - a.total_cartoes;
                    }
                    // Em caso de empate, ordenar por cartões vermelhos
                    return b.cartoes_vermelhos - a.cartoes_vermelhos;
                });

        } catch (error) {
            console.error('Erro ao calcular cartões:', error);
            return [];
        }
    }

    async function atualizarEstatisticasGerais(cartoesJogadores) {
        try {
            const totalCartoes = cartoesJogadores.reduce((sum, jogador) => sum + jogador.total_cartoes, 0);
            const jogos = await getJogos(null);
            const jogosFinalizados = jogos.filter(j => j.status === 'finalizado');
            const mediaCartoesJogo = jogosFinalizados.length > 0 ? (totalCartoes / jogosFinalizados.length).toFixed(2) : '0.00';
            const jogadorMaisCartoes = cartoesJogadores.length > 0 ? `${cartoesJogadores[0].nome_completo} (${cartoesJogadores[0].total_cartoes} cartões)` : '-';

            document.getElementById('totalCartoes').textContent = totalCartoes;
            document.getElementById('mediaCartoesJogo').textContent = mediaCartoesJogo;
            document.getElementById('jogadorMaisCartoes').textContent = jogadorMaisCartoes;

        } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
        }
    }

    async function exportarCartoesPDF() {
        try {
            const cartoesJogadores = await calcularCartoes();

            if (!cartoesJogadores || cartoesJogadores.length === 0) {
                alert('Nenhuma informação de cartões para exportar.');
                return;
            }

            // Verificar se jsPDF está carregado
            if (typeof jspdf === 'undefined') {
                alert('Biblioteca jsPDF não encontrada. Adicione o script ao HTML.');
                return;
            }

            const { jsPDF } = jspdf;
            const doc = new jsPDF();

            // Título
            doc.setFontSize(18);
            doc.text('Cartões do Campeonato', 20, 20);

            // Data
            doc.setFontSize(12);
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);

            // Cabeçalho da tabela
            let y = 50;
            doc.setFontSize(10);
            doc.text('Pos', 20, y);
            doc.text('Jogador', 35, y);
            doc.text('Time', 100, y);
            doc.text('AM', 150, y);
            doc.text('AZ', 165, y);
            doc.text('VER', 180, y);

            y += 10;

            // Linhas da tabela
            cartoesJogadores.forEach((jogador, index) => {
                doc.text(`${index + 1}`, 20, y);
                doc.text(jogador.nome_completo, 35, y);
                doc.text(jogador.time_nome, 100, y);
                doc.text(`${jogador.cartoes_amarelos}`, 150, y);
                doc.text(`${jogador.cartoes_azuis}`, 165, y);
                doc.text(`${jogador.cartoes_vermelhos}`, 180, y);
                y += 8;

                // Quebrar página se necessário
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            });

            // Estatísticas gerais
            y += 10;
            doc.setFontSize(12);
            doc.text('Estatísticas Gerais:', 20, y);
            y += 10;
            doc.setFontSize(10);

            const totalCartoes = cartoesJogadores.reduce((sum, j) => sum + j.total_cartoes, 0);
            const jogos = await getJogos(null);
            const jogosFinalizados = jogos.filter(j => j.status === 'finalizado');
            const mediaCartoesJogo = jogosFinalizados.length > 0 ? (totalCartoes / jogosFinalizados.length).toFixed(2) : '0.00';

            doc.text(`Total de Cartões: ${totalCartoes}`, 20, y);
            y += 8;
            doc.text(`Média de Cartões por Jogo: ${mediaCartoesJogo}`, 20, y);
            y += 8;
            if (cartoesJogadores.length > 0) {
                doc.text(`Jogador com Mais Cartões: ${cartoesJogadores[0].nome_completo} (${cartoesJogadores[0].total_cartoes} cartões)`, 20, y);
            }

            // Salvar PDF
            doc.save('cartoes.pdf');
            alert('PDF exportado com sucesso!');

        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            alert('Erro ao exportar PDF.');
        }
    }
});
