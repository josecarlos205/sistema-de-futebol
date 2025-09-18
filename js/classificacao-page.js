import { carregarClassificacao, exportarClassificacaoPDF } from './classificacao.js';

document.addEventListener('DOMContentLoaded', function() {
    const btnAtualizar = document.getElementById('btnAtualizar');
    const btnExportarPDF = document.getElementById('btnExportarPDF');

    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', () => {
            carregarClassificacao();
        });
    }

    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', () => {
            exportarClassificacaoPDF();
        });
    }

    // Carregar classificação automaticamente
    carregarClassificacao();
});
