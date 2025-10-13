// Sistema de artilharia

import { supabaseClient, getJogos } from './database.js';

export async function calcularTop4Artilheiros() {
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
            .order('gols_marcados', { ascending: false });

        if (error) {
            console.error('Erro ao buscar jogadores:', error);
            return [];
        }

        // Calcular jogos disputados por jogador (simplificado)
        const jogos = await getJogos(null);
        const { data: gols, error: golsError } = await supabaseClient
            .from('gols')
            .select('*');

        if (golsError) {
            console.error('Erro ao buscar gols:', golsError);
            return [];
        }

        const artilheiros = jogadores.map(jogador => {
            // Contar jogos em que o jogador participou (verificar gols na tabela gols)
            const jogosJogador = jogos.filter(j =>
                j.status === 'finalizado' &&
                gols.some(gol => gol.jogo_id === j.id && gol.jogador_id === jogador.id)
            );

            return {
                ...jogador,
                time_nome: jogador.times?.nome || 'N/A',
                jogos: jogosJogador.length,
                gols_marcados: jogador.gols_marcados || 0
            };
        });

        // Filtrar jogadores com pelo menos 1 gol e ordenar, pegar apenas os 4 primeiros
        return artilheiros
            .filter(j => j.gols_marcados > 0)
            .sort((a, b) => {
                if (a.gols_marcados !== b.gols_marcados) {
                    return b.gols_marcados - a.gols_marcados;
                }
                // Em caso de empate, ordenar por média de gols
                const mediaA = a.jogos > 0 ? a.gols_marcados / a.jogos : 0;
                const mediaB = b.jogos > 0 ? b.gols_marcados / b.jogos : 0;
                return mediaB - mediaA;
            })
            .slice(0, 4);

    } catch (error) {
        console.error('Erro ao calcular top 4 artilheiros:', error);
        return [];
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const btnAtualizarArtilharia = document.getElementById('btnAtualizarArtilharia');
    const btnExportarArtilhariaPDF = document.getElementById('btnExportarArtilhariaPDF');
    const corpoArtilheiros = document.getElementById('corpoArtilheiros');

    btnAtualizarArtilharia.addEventListener('click', () => {
        carregarArtilharia();
    });

    btnExportarArtilhariaPDF.addEventListener('click', () => {
        exportarArtilhariaPDF();
    });

    carregarArtilharia();

    async function carregarArtilharia() {
        corpoArtilheiros.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';

        try {
            const artilheiros = await calcularArtilharia();

            if (artilheiros && artilheiros.length > 0) {
                corpoArtilheiros.innerHTML = '';

                artilheiros.forEach((jogador, index) => {
                    const media = jogador.jogos > 0 ? (jogador.gols_marcados / jogador.jogos).toFixed(2) : '0.00';
                    const tr = document.createElement('tr');

                    tr.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${jogador.nome_completo}</td>
                        <td>${jogador.time_nome || 'N/A'}</td>
                        <td><strong>${jogador.gols_marcados}</strong></td>
                        <td>${jogador.jogos}</td>
                        <td>${media}</td>
                    `;
                    corpoArtilheiros.appendChild(tr);
                });

                // Atualizar estatísticas gerais
                atualizarEstatisticasGerais(artilheiros);
            } else {
                corpoArtilheiros.innerHTML = '<tr><td colspan="6">Nenhum artilheiro encontrado.</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar artilharia:', error);
            corpoArtilheiros.innerHTML = '<tr><td colspan="6">Erro ao carregar artilharia.</td></tr>';
        }
    }

    async function calcularArtilharia() {
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
                .order('gols_marcados', { ascending: false });

            if (error) {
                console.error('Erro ao buscar jogadores:', error);
                return [];
            }

            // Calcular jogos disputados por jogador (simplificado)
            const jogos = await getJogos(null);
            const { data: gols, error: golsError } = await supabaseClient
                .from('gols')
                .select('*');

            if (golsError) {
                console.error('Erro ao buscar gols:', golsError);
                return [];
            }

            const artilheiros = jogadores.map(jogador => {
                // Contar jogos em que o jogador participou (verificar gols na tabela gols)
                const jogosJogador = jogos.filter(j =>
                    j.status === 'finalizado' &&
                    gols.some(gol => gol.jogo_id === j.id && gol.jogador_id === jogador.id)
                );

                return {
                    ...jogador,
                    time_nome: jogador.times?.nome || 'N/A',
                    jogos: jogosJogador.length,
                    gols_marcados: jogador.gols_marcados || 0
                };
            });

            // Filtrar jogadores com pelo menos 1 gol e ordenar
            return artilheiros
                .filter(j => j.gols_marcados > 0)
                .sort((a, b) => {
                    if (a.gols_marcados !== b.gols_marcados) {
                        return b.gols_marcados - a.gols_marcados;
                    }
                    // Em caso de empate, ordenar por média de gols
                    const mediaA = a.jogos > 0 ? a.gols_marcados / a.jogos : 0;
                    const mediaB = b.jogos > 0 ? b.gols_marcados / b.jogos : 0;
                    return mediaB - mediaA;
                });

        } catch (error) {
            console.error('Erro ao calcular artilharia:', error);
            return [];
        }
    }

    async function atualizarEstatisticasGerais(artilheiros) {
        try {
            const totalGols = artilheiros.reduce((sum, jogador) => sum + jogador.gols_marcados, 0);
            const jogos = await getJogos(null);
            const jogosFinalizados = jogos.filter(j => j.status === 'finalizado');
            const mediaGolsJogo = jogosFinalizados.length > 0 ? (totalGols / jogosFinalizados.length).toFixed(2) : '0.00';
            const artilheiroMaximo = artilheiros.length > 0 ? `${artilheiros[0].nome_completo} (${artilheiros[0].gols_marcados} gols)` : '-';

            document.getElementById('totalGols').textContent = totalGols;
            document.getElementById('mediaGolsJogo').textContent = mediaGolsJogo;
            document.getElementById('artilheiroMaximo').textContent = artilheiroMaximo;

        } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
        }
    }

    async function exportarArtilhariaPDF() {
        try {
            const artilheiros = await calcularArtilharia();

            if (!artilheiros || artilheiros.length === 0) {
                alert('Nenhuma artilharia para exportar.');
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
            doc.text('Artilheiros do Campeonato', 20, 20);

            // Data
            doc.setFontSize(12);
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);

            // Cabeçalho da tabela
            let y = 50;
            doc.setFontSize(10);
            doc.text('Pos', 20, y);
            doc.text('Jogador', 35, y);
            doc.text('Time', 100, y);
            doc.text('Gols', 150, y);
            doc.text('Jogos', 170, y);

            y += 10;

            // Linhas da tabela
            artilheiros.forEach((jogador, index) => {
                doc.text(`${index + 1}`, 20, y);
                doc.text(jogador.nome_completo, 35, y);
                doc.text(jogador.time_nome, 100, y);
                doc.text(`${jogador.gols_marcados}`, 150, y);
                doc.text(`${jogador.jogos}`, 170, y);
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

            const totalGols = artilheiros.reduce((sum, j) => sum + j.gols_marcados, 0);
            const jogos = await getJogos(null);
            const jogosFinalizados = jogos.filter(j => j.status === 'finalizado');
            const mediaGolsJogo = jogosFinalizados.length > 0 ? (totalGols / jogosFinalizados.length).toFixed(2) : '0.00';

            doc.text(`Total de Gols: ${totalGols}`, 20, y);
            y += 8;
            doc.text(`Média de Gols por Jogo: ${mediaGolsJogo}`, 20, y);
            y += 8;
            if (artilheiros.length > 0) {
                doc.text(`Artilheiro Máximo: ${artilheiros[0].nome_completo} (${artilheiros[0].gols_marcados} gols)`, 20, y);
            }

            // Salvar PDF
            doc.save('artilharia.pdf');
            alert('PDF exportado com sucesso!');

        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            alert('Erro ao exportar PDF.');
        }
    }
});
