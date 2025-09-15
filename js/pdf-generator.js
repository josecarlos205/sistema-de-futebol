// Geração de PDFs usando jsPDF
// Nota: Este arquivo requer a biblioteca jsPDF (https://github.com/parallax/jsPDF)

function gerarSumulaPDF(jogo, escalaoCasa, escalaoVisitante, gols, cartoes, arbitro, observacoes) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Função auxiliar para verificar quebra de página
    function verificarQuebraPagina(yPos, espacoNecessario = 50) {
        if (yPos + espacoNecessario > pageHeight - 50) {
            doc.addPage();
            return 50; // Nova posição Y no topo da página
        }
        return yPos;
    }

    // Função auxiliar para quebrar texto longo
    function quebrarTexto(texto, larguraMaxima, fonteSize = 9) {
        doc.setFontSize(fonteSize);
        const linhas = doc.splitTextToSize(texto, larguraMaxima);
        return linhas;
    }

    let currentY = 40; // Aumentado espaçamento inicial

    // Cabeçalho com informações do campeonato, jogo, campo, data, hora e rodada
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const tituloCampeonato = 'CAMPEONATO INTERNO - FUTEBOL SUÍÇO MASTER 40+ 1º SEM 2025';
    const linhasTitulo = quebrarTexto(tituloCampeonato, pageWidth - 80, 10);
    doc.text(linhasTitulo, 40, currentY);
    currentY += linhasTitulo.length * 15; // Aumentado espaçamento entre linhas

    const infoJogo = `CAMPO 01 - JOGO ${jogo.id} - DATA: ${formatarDataHora(jogo.data_hora).split(' ')[0]} HORAS: ${formatarDataHora(jogo.data_hora).split(' ')[1]} RODADA: 1ª`;
    const linhasInfo = quebrarTexto(infoJogo, pageWidth - 80, 10);
    doc.text(linhasInfo, 40, currentY);
    currentY += linhasInfo.length * 15 + 15; // Aumentado espaçamento

    // Verificar quebra de página antes dos times
    currentY = verificarQuebraPagina(currentY, 40);

    // Times e placar centralizado
    doc.setFontSize(12);
    const confronto = `${jogo.time_casa.nome.toUpperCase()} X ${jogo.time_visitante.nome.toUpperCase()}`;
    const linhasConfronto = quebrarTexto(confronto, pageWidth - 80, 12);
    doc.text(linhasConfronto, pageWidth / 2, currentY, { align: 'center' });
    currentY += linhasConfronto.length * 16 + 10; // Aumentado espaçamento

    doc.setFontSize(14);
    const placar = `PLACAR FINAL: ${jogo.gols_casa} X ${jogo.gols_visitante}`;
    doc.text(placar, pageWidth / 2, currentY, { align: 'center' });
    currentY += 30; // Aumentado espaçamento antes das tabelas

    // Verificar quebra de página antes das tabelas
    currentY = verificarQuebraPagina(currentY, 100);

    // Tabelas lado a lado para os times - ajustar larguras com espaçamento otimizado ==================
    const startY = currentY;
    const tableSpacing = 10; // Espaçamento entre as tabelas
    const availableWidth = pageWidth - 80 - tableSpacing; // Largura disponível menos margens e espaçamento
    const tableWidth = availableWidth / 2; // Largura de cada tabela
    const colWidths = [22, 250, 30, 20, 20, 20]; 
    // Nº, Nome, Gols, AM, AZ, VER - ajustado para melhor aproveitamento =================================

    // Função para desenhar tabela de jogadores com melhor tratamento de texto
    function desenharTabela(time, escalao, x, y) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');

        // Título do time com quebra de linha se necessário
        const tituloTime = quebrarTexto(time.nome.toUpperCase(), tableWidth - 10, 9);
        doc.text(tituloTime, x + tableWidth / 2, y, { align: 'center' });
        let currentY = y + (tituloTime.length * 10) + 5;

        // Verificar quebra de página antes do cabeçalho
        currentY = verificarQuebraPagina(currentY, 20);

        // Cabeçalho da tabela
        const headers = ['Nº', 'NOME', 'GOLS', 'AM', 'AZ', 'VER'];
        let currentX = x;

        // Desenhar cabeçalho
        headers.forEach((header, i) => {
            let w = colWidths[i];
            doc.rect(currentX, currentY - 8, w, 16); // Aumentado altura da célula do cabeçalho
            doc.text(header, currentX + 2, currentY);
            currentX += w;
        });

        // Desenhar linhas dos jogadores
        doc.setFont('helvetica', 'normal');
        let rowY = currentY + 18; // Aumentado espaçamento após cabeçalho

        const jogadoresAtivos = escalao
            .filter(jogador => jogador.status === 'ativo')
            .sort((a, b) => a.numero_camisa - b.numero_camisa);

        jogadoresAtivos.forEach(jogador => {
            // Verificar quebra de página antes de cada jogador
            rowY = verificarQuebraPagina(rowY, 20); // Aumentado espaço necessário

            currentX = x;

            // Nº
            doc.rect(currentX, rowY - 10, colWidths[0], 16); // Aumentado altura da célula
            doc.text(jogador.numero_camisa ? jogador.numero_camisa.toString() : '', currentX + 2, rowY);
            currentX += colWidths[0];

            // NOME - com tratamento para texto longo
            doc.rect(currentX, rowY - 10, colWidths[1], 20); // Aumentado altura da célula
            const nomeJogador = jogador.nome_completo.toUpperCase();
            doc.text(nomeJogador, currentX + 2, rowY);
            currentX += colWidths[1];

            // GOLS
            const golsJogador = gols.filter(g => g.jogador_id === jogador.id).length;
            doc.rect(currentX, rowY - 10, colWidths[2], 16); // Aumentado altura da célula
            doc.text(golsJogador.toString(), currentX + 8, rowY);
            currentX += colWidths[2];

            // AMARELO
            const amarelos = cartoes.filter(c => c.jogador_id === jogador.id && c.tipo === 'amarelo').length;
            doc.rect(currentX, rowY - 10, colWidths[3], 16); // Aumentado altura da célula
            if (amarelos > 0) doc.text('X', currentX + 7, rowY);
            currentX += colWidths[3];

            // AZUL
            const azuis = cartoes.filter(c => c.jogador_id === jogador.id && c.tipo === 'azul').length;
            doc.rect(currentX, rowY - 10, colWidths[4], 16); // Aumentado altura da célula
            if (azuis > 0) doc.text('X', currentX + 7, rowY);
            currentX += colWidths[4];

            // VERMELHO
            const vermelhos = cartoes.filter(c => c.jogador_id === jogador.id && c.tipo === 'vermelho').length;
            doc.rect(currentX, rowY - 10, colWidths[5], 16); // Aumentado altura da célula
            if (vermelhos > 0) doc.text('X', currentX + 7, rowY);
            currentX += colWidths[5];

            rowY += 18; // Aumentado espaçamento entre linhas
        });

        return rowY; // Retornar a posição Y final da tabela
    }

    // Desenhar tabelas dos dois times com espaçamento definido
    const endYCasa = desenharTabela(jogo.time_casa, escalaoCasa, 50, startY);
    const endYVisitante = desenharTabela(jogo.time_visitante, escalaoVisitante, 70 + tableWidth + tableSpacing, startY);
    const maxTableEndY = Math.max(endYCasa, endYVisitante);

    // Rodapé com capitão, árbitro, mesário, assinaturas e observações
    let footerY = maxTableEndY + 30; // Aumentado espaçamento após a tabela

    // Verificar quebra de página antes do rodapé
    footerY = verificarQuebraPagina(footerY, 100); // Aumentado espaço necessário

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Capitão e árbitro
    doc.text(`CAPITÃO: ${jogo.capitao_casa || ''}`, 40, footerY);
    doc.text(`CAPITÃO: ${jogo.capitao_visitante || ''}`, 300, footerY);

    footerY += 18; // Aumentado espaçamento
    doc.text(`ÁRBITRO: ${arbitro || ''}`, 40, footerY);
    doc.text(`MESÁRIO: ${jogo.mesario || ''}`, 300, footerY);

    footerY += 35; // Aumentado espaçamento antes das assinaturas

    // Verificar quebra de página antes das assinaturas
    footerY = verificarQuebraPagina(footerY, 60); // Aumentado espaço necessário

    // Linhas para assinaturas
    doc.text('______________________________', 40, footerY);
    doc.text('Árbitro', 60, footerY + 15); // Aumentado espaçamento para o texto

    doc.text('______________________________', 300, footerY);
    doc.text('Representante Time Casa', 320, footerY + 15); // Aumentado espaçamento para o texto

    footerY += 35; // Aumentado espaçamento
    doc.text('______________________________', 300, footerY);
    doc.text('Representante Time Visitante', 320, footerY + 15); // Aumentado espaçamento para o texto

    footerY += 45; // Aumentado espaçamento antes das observações

    // Verificar quebra de página antes das observações
    footerY = verificarQuebraPagina(footerY, 60); // Aumentado espaço necessário

    // Observações
    if (observacoes) {
        const linhasObservacoes = quebrarTexto(observacoes, pageWidth - 80, 10);
        doc.text('OBSERVAÇÕES:', 40, footerY);
        doc.text(linhasObservacoes, 40, footerY + 18); // Aumentado espaçamento para o texto
    }

    // Salvar PDF
    doc.save(`sumula_${jogo.id}.pdf`);
}

function gerarClassificacaoPDF(classificacao, nomeCampeonato) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text(`Classificação - ${nomeCampeonato}`, 105, 20, { align: 'center' });

    // Cabeçalho da tabela
    doc.setFontSize(12);
    let yPos = 40;
    doc.text('Pos', 20, yPos);
    doc.text('Time', 40, yPos);
    doc.text('P', 140, yPos);
    doc.text('J', 150, yPos);
    doc.text('V', 160, yPos);
    doc.text('E', 170, yPos);
    doc.text('D', 180, yPos);

    // Dados da classificação
    yPos += 10;
    classificacao.forEach((time, index) => {
        doc.text(`${index + 1}`, 20, yPos);
        doc.text(time.nome, 40, yPos);
        doc.text(time.pontos.toString(), 140, yPos);
        doc.text(time.jogos.toString(), 150, yPos);
        doc.text(time.vitorias.toString(), 160, yPos);
        doc.text(time.empates.toString(), 170, yPos);
        doc.text(time.derrotas.toString(), 180, yPos);
        yPos += 10;
    });

    // Salvar PDF
    doc.save(`classificacao_${nomeCampeonato.replace(/\s+/g, '_')}.pdf`);
}

function gerarArtilhariaPDF(artilheiros, nomeCampeonato) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text(`Artilharia - ${nomeCampeonato}`, 105, 20, { align: 'center' });

    // Cabeçalho
    doc.setFontSize(12);
    let yPos = 40;
    doc.text('Pos', 20, yPos);
    doc.text('Jogador', 40, yPos);
    doc.text('Time', 120, yPos);
    doc.text('Gols', 170, yPos);

    // Dados dos artilheiros
    yPos += 10;
    artilheiros.forEach((jogador, index) => {
        doc.text(`${index + 1}`, 20, yPos);
        doc.text(jogador.nome_completo, 40, yPos);
        doc.text(jogador.time_nome, 120, yPos);
        doc.text(jogador.gols_marcados.toString(), 170, yPos);
        yPos += 10;
    });

    // Salvar PDF
    doc.save(`artilharia_${nomeCampeonato.replace(/\s+/g, '_')}.pdf`);
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
