# TODO: Atualizar Critérios de Desempate

## Passos para Implementar

1. **Adicionar cálculo de cartões por time**
   - Modificar `calcularClassificacaoCompleta` para incluir `total_cartoes` nas estatísticas de cada time.
   - Usar `getJogadores(time.id)` para obter jogadores do time e somar cartões amarelos, azuis e vermelhos.
   - ✅ Concluído

2. **Atualizar função de ordenação**
   - Modificar a função `sort` em `classificacao.sort` para incluir todos os critérios:
     - Pontos (já implementado)
     - Confronto direto (para dois times com mesma pontuação)
     - Maior número de vitórias
     - Maior saldo de gols
     - Maior número de gols a favor
     - Menor número de derrotas
     - Menor número de gols contra
     - Menor número de cartões
     - Sorteio (não implementado, deixar como último critério ou manual)
   - ✅ Concluído

3. **Testar a classificação**
   - Executar o sistema e verificar se a ordenação está correta com os novos critérios.
   - ✅ Corrigido: Implementei ordenação por grupos para aplicar confronto direto apenas para 2 times, e outros critérios para 3 ou mais.

4. **Ajustes finais**
   - Verificar se há necessidade de otimizar consultas ou adicionar índices no banco.
   - Se necessário, adicionar coluna de cartões na tabela de exibição.
