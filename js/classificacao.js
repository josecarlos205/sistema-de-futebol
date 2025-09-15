// Sistema de classificação

document.addEventListener('DOMContentLoaded', function() {
    const btnAtualizar = document.getElementById('btnAtualizar');
    const btnExportarPDF = document.getElementById('btnExportarPDF');
    const corpoClassificacao = document.getElementById('corpoClassificacao');

    btnAtualizar.addEventListener('click', () => {
        carregarClassificacao();
    });

    btnExportarPDF.addEventListener('click', () => {
        exportarClassificacaoPDF();
    });

    carregarClassificacao();

    async function carregarClassificacao() {
        corpoClassificacao.innerHTML = '<tr><td colspan="10">Carregando...</td></tr>';

        try {
            const classificacao = await calcularClassificacaoCompleta();

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

    async function calcularClassificacaoCompleta() {
        try {
            const times = await getTimes(null);
            if (!times || times.length === 0) return [];

            const jogos = await getJogos(null);
            const classificacao = [];

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
                    saldo_gols: 0
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
                classificacao.push(estatisticas);
            }

            // Ordenar classificação
            classificacao.sort((a, b) => {
                // 1. Pontos
                if (a.pontos !== b.pontos) return b.pontos - a.pontos;

                // 2. Confronto direto (simplificado - implementar se necessário)
                // Para simplificação, assumimos que não há empates em pontos

                // 3. Número de vitórias
                if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;

                // 4. Saldo de gols
                if (a.saldo_gols !== b.saldo_gols) return b.saldo_gols - a.saldo_gols;

                // 5. Gols pró
                return b.gols_pro - a.gols_pro;
            });

            return classificacao;
        } catch (error) {
            console.error('Erro ao calcular classificação:', error);
            return [];
        }
    }

    async function exportarClassificacaoPDF() {
        try {
            const classificacao = await calcularClassificacaoCompleta();

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
});
