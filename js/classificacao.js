// Sistema de classificação

export async function calcularClassificacaoCompleta(campeonatoId) {
        try {
            const times = await getTimes(campeonatoId);
            if (!times || times.length === 0) return [];

            const jogos = await getJogos(campeonatoId);
            let classificacao = [];

            for (const time of times) {
                if (time.status !== 'ativo') continue;

                const estatisticas = {
                    id: time.id,
                    nome: time.nome,
                    pontos: 0,
                    jogos: 0,
                    vitorias: 0,
                    empates: 0,
                    derrotas: 0,
                    gols_pro: 0,
                    gols_contra: 0,
                    saldo_gols: 0,
                    total_cartoes: 0
                };

                // Filtrar jogos do time
                const jogosTime = jogos.filter(j =>
                    (j.time_casa_id === time.id || j.time_visitante_id === time.id) &&
                    j.status === 'finalizado'
                );

                estatisticas.jogos = jogosTime.length;

                for (const jogo of jogosTime) {
                    const isCasa = jogo.time_casa_id === time.id;
                    const golsPro = isCasa ? jogo.gols_casa : jogo.gols_visitante;
                    const golsContra = isCasa ? jogo.gols_visitante : jogo.gols_casa;

                    estatisticas.gols_pro += golsPro;
                    estatisticas.gols_contra += golsContra;

                    if (golsPro > golsContra) {
                        estatisticas.vitorias++;
                        estatisticas.pontos += 3;
                    } else if (golsPro === golsContra) {
                        estatisticas.empates++;
                        estatisticas.pontos += 1;
                    } else {
                        estatisticas.derrotas++;
                    }
                }

                estatisticas.saldo_gols = estatisticas.gols_pro - estatisticas.gols_contra;

                // Calcular total de cartões do time
                const jogadores = await getJogadores(time.id);
                estatisticas.total_cartoes = jogadores.reduce((sum, j) => sum + (j.cartoes_amarelos || 0) + (j.cartoes_azuis || 0) + (j.cartoes_vermelhos || 0), 0);

                classificacao.push(estatisticas);
            }

            // Função auxiliar para calcular confronto direto
            function calcularConfrontoDireto(timeA, timeB, jogos) {
                const jogosEntre = jogos.filter(j =>
                    ((j.time_casa_id === timeA.id && j.time_visitante_id === timeB.id) ||
                     (j.time_casa_id === timeB.id && j.time_visitante_id === timeA.id)) &&
                    j.status === 'finalizado'
                );

                let pontosA = 0, pontosB = 0, saldoA = 0, saldoB = 0;

                for (const jogo of jogosEntre) {
                    const isA_Casa = jogo.time_casa_id === timeA.id;
                    const golsA = isA_Casa ? jogo.gols_casa : jogo.gols_visitante;
                    const golsB = isA_Casa ? jogo.gols_visitante : jogo.gols_casa;

                    if (golsA > golsB) pontosA += 3;
                    else if (golsA < golsB) pontosB += 3;
                    else { pontosA += 1; pontosB += 1; }

                    saldoA += golsA - golsB;
                    saldoB += golsB - golsA;
                }

                return { pontosA, pontosB, saldoA, saldoB };
            }

            // Agrupar por pontos
            const grupos = {};
            classificacao.forEach(time => {
                if (!grupos[time.pontos]) grupos[time.pontos] = [];
                grupos[time.pontos].push(time);
            });

            // Ordenar cada grupo
            Object.keys(grupos).sort((a, b) => b - a).forEach(pontos => {
                const grupo = grupos[pontos];
                if (grupo.length === 2) {
                    // Ordenar por confronto direto
                    grupo.sort((a, b) => {
                        const confronto = calcularConfrontoDireto(a, b, jogos);
                        if (confronto.pontosA !== confronto.pontosB) return confronto.pontosB - confronto.pontosA;
                        if (confronto.saldoA !== confronto.saldoB) return confronto.saldoB - confronto.saldoA;

                        // Outros critérios
                        if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;
                        if (a.saldo_gols !== b.saldo_gols) return b.saldo_gols - a.saldo_gols;
                        if (a.gols_pro !== b.gols_pro) return b.gols_pro - a.gols_pro;
                        if (a.derrotas !== b.derrotas) return a.derrotas - b.derrotas;
                        if (a.gols_contra !== b.gols_contra) return a.gols_contra - b.gols_contra;
                        if (a.total_cartoes !== b.total_cartoes) return a.total_cartoes - b.total_cartoes;
                        return 0;
                    });
                } else {
                    // Ordenar por outros critérios (para 3 ou mais times)
                    grupo.sort((a, b) => {
                        if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;
                        if (a.saldo_gols !== b.saldo_gols) return b.saldo_gols - a.saldo_gols;
                        if (a.gols_pro !== b.gols_pro) return b.gols_pro - a.gols_pro;
                        if (a.derrotas !== b.derrotas) return a.derrotas - b.derrotas;
                        if (a.gols_contra !== b.gols_contra) return a.gols_contra - b.gols_contra;
                        if (a.total_cartoes !== b.total_cartoes) return a.total_cartoes - b.total_cartoes;
                        return 0;
                    });
                }
            });

            // Reordenar a classificação final
            classificacao = Object.keys(grupos).sort((a, b) => b - a).flatMap(pontos => grupos[pontos]);

            return classificacao;
        } catch (error) {
            console.error('Erro ao calcular classificação:', error);
            return [];
        }
    }

export async function carregarClassificacao() {
    const corpoClassificacao = document.getElementById('corpoClassificacao');
    corpoClassificacao.innerHTML = '<tr><td colspan="10">Carregando...</td></tr>';

    try {
        const classificacao = await calcularClassificacaoCompleta(null);

        if (classificacao && classificacao.length > 0) {
            corpoClassificacao.innerHTML = '';

            classificacao.forEach((time, index) => {
                const tr = document.createElement('tr');
                tr.className = index < 4 ? 'top4' : '';

                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${time.nome}</td>
                    <td><strong>${time.pontos}</strong></td>
                    <td>${time.jogos}</td>
                    <td>${time.vitorias}</td>
                    <td>${time.empates}</td>
                    <td>${time.derrotas}</td>
                    <td>${time.gols_pro}</td>
                    <td>${time.gols_contra}</td>
                    <td>${time.saldo_gols >= 0 ? '+' : ''}${time.saldo_gols}</td>
                `;
                corpoClassificacao.appendChild(tr);
            });
        } else {
            corpoClassificacao.innerHTML = '<tr><td colspan="10">Nenhum time encontrado.</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar classificação:', error);
        corpoClassificacao.innerHTML = '<tr><td colspan="10">Erro ao carregar classificação.</td></tr>';
    }
}

export async function exportarClassificacaoPDF() {
    try {
        const classificacao = await calcularClassificacaoCompleta(null);

        if (!classificacao || classificacao.length === 0) {
            alert('Nenhuma classificação para exportar.');
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
        doc.text('Tabela de Classificação', 20, 20);

        // Data
        doc.setFontSize(12);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);

        // Cabeçalho da tabela
        let y = 50;
        doc.setFontSize(10);
        doc.text('Pos', 20, y);
        doc.text('Time', 35, y);
        doc.text('Pts', 120, y);
        doc.text('J', 135, y);
        doc.text('V', 145, y);
        doc.text('E', 155, y);
        doc.text('D', 165, y);
        doc.text('SG', 175, y);

        y += 10;

        // Linhas da tabela
        classificacao.forEach((time, index) => {
            doc.text(`${index + 1}`, 20, y);
            doc.text(time.nome, 35, y);
            doc.text(`${time.pontos}`, 120, y);
            doc.text(`${time.jogos}`, 135, y);
            doc.text(`${time.vitorias}`, 145, y);
            doc.text(`${time.empates}`, 155, y);
            doc.text(`${time.derrotas}`, 165, y);
            doc.text(`${time.saldo_gols >= 0 ? '+' : ''}${time.saldo_gols}`, 175, y);
            y += 8;

            // Quebrar página se necessário
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        });

        // Salvar PDF
        doc.save('classificacao.pdf');
        alert('PDF exportado com sucesso!');

    } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        alert('Erro ao exportar PDF.');
    }
}
