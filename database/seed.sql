-- Dados de exemplo para Sistema de Campeonato de Futebol

-- Inserir campeonato de exemplo
INSERT INTO campeonatos (nome, data_inicio, data_fim, status) VALUES
('Campeonato Amador 2025', '2025-01-15', '2025-06-15', 'ativo');

-- Inserir times de exemplo
INSERT INTO times (campeonato_id, nome, tecnico, cores_uniforme, data_fundacao, status) VALUES
(1, 'Flamengo FC', 'João Silva', 'Vermelho e Preto', '1895-11-15', 'ativo'),
(1, 'São Paulo EC', 'Maria Santos', 'Vermelho, Branco e Preto', '1930-01-25', 'ativo'),
(1, 'Palmeiras SP', 'Carlos Oliveira', 'Verde e Branco', '1914-08-26', 'ativo'),
(1, 'Corinthians SP', 'Ana Costa', 'Preto e Branco', '1910-09-01', 'ativo'),
(1, 'Santos FC', 'Pedro Lima', 'Branco e Preto', '1912-04-14', 'ativo'),
(1, 'Grêmio FBPA', 'Lucas Ferreira', 'Azul, Preto e Branco', '1903-09-15', 'ativo'),
(1, 'Internacional RS', 'Fernanda Rocha', 'Vermelho e Branco', '1909-04-04', 'ativo'),
(1, 'Cruzeiro EC', 'Roberto Alves', 'Azul e Branco', '1921-01-02', 'ativo');

-- Inserir jogadores de exemplo
INSERT INTO jogadores (time_id, nome_completo, apelido, numero_camisa, posicao, data_nascimento, cartoes_amarelos, cartoes_azuis, cartoes_vermelhos, gols_marcados, status) VALUES
-- Flamengo
(1, 'José da Silva', 'Zé', 1, 'goleiro', '1990-05-15', 0, 0, 0, 0, 'ativo'),
(1, 'Carlos Eduardo', 'Dudu', 10, 'atacante', '1995-03-20', 2, 0, 0, 15, 'ativo'),
(1, 'Roberto Santos', 'Betão', 4, 'zagueiro', '1988-11-10', 1, 0, 0, 2, 'ativo'),
(1, 'Marcos Paulo', 'Marquinhos', 5, 'volante', '1992-07-25', 3, 1, 0, 5, 'ativo'),
(1, 'Lucas Oliveira', 'Lukinha', 7, 'meia', '1994-09-12', 0, 0, 0, 8, 'ativo'),
-- São Paulo
(2, 'João Pedro', 'JP', 1, 'goleiro', '1989-02-18', 0, 0, 0, 0, 'ativo'),
(2, 'Fernando Costa', 'Nando', 9, 'atacante', '1993-08-05', 1, 0, 0, 12, 'ativo'),
(2, 'Ricardo Lima', 'Rica', 3, 'zagueiro', '1991-12-30', 2, 0, 0, 1, 'ativo'),
(2, 'André Silva', 'Dê', 8, 'volante', '1996-01-22', 0, 0, 0, 3, 'ativo'),
(2, 'Gabriel Santos', 'Gabigol', 11, 'meia', '1994-04-17', 1, 0, 0, 10, 'ativo'),
-- Palmeiras
(3, 'Rafael Souza', 'Rafa', 1, 'goleiro', '1990-06-08', 0, 0, 0, 0, 'ativo'),
(3, 'Bruno Rodrigues', 'Bruninho', 10, 'atacante', '1995-11-14', 0, 0, 0, 18, 'ativo'),
(3, 'Thiago Alves', 'Thiago', 2, 'lateral', '1987-03-09', 1, 0, 0, 0, 'ativo'),
(3, 'Paulo César', 'PC', 6, 'volante', '1992-05-28', 2, 0, 0, 4, 'ativo'),
(3, 'Diego Ferreira', 'Diego', 7, 'meia', '1994-12-03', 0, 0, 0, 7, 'ativo'),
-- Corinthians
(4, 'Matheus Lima', 'Matheus', 1, 'goleiro', '1988-09-21', 0, 0, 0, 0, 'ativo'),
(4, 'Rodrigo Santos', 'Rodrigo', 9, 'atacante', '1993-10-16', 1, 0, 0, 14, 'ativo'),
(4, 'Felipe Costa', 'Felipe', 4, 'zagueiro', '1990-01-07', 3, 0, 0, 2, 'ativo'),
(4, 'Gustavo Silva', 'Gustavo', 5, 'volante', '1995-02-11', 0, 0, 0, 6, 'ativo'),
(4, 'Leonardo Rocha', 'Léo', 8, 'meia', '1992-08-19', 1, 0, 0, 9, 'ativo'),
-- Santos
(5, 'Vinicius Pereira', 'Vini', 1, 'goleiro', '1991-04-13', 0, 0, 0, 0, 'ativo'),
(5, 'Eduardo Silva', 'Edu', 10, 'atacante', '1994-07-26', 0, 0, 0, 16, 'ativo'),
(5, 'Marcos Santos', 'Marcos', 3, 'zagueiro', '1989-11-02', 2, 0, 0, 1, 'ativo'),
(5, 'Rafael Costa', 'Rafa', 6, 'volante', '1993-06-15', 1, 0, 0, 5, 'ativo'),
(5, 'Thiago Lima', 'Thiago', 7, 'meia', '1995-09-08', 0, 0, 0, 8, 'ativo'),
-- Grêmio
(6, 'Pedro Oliveira', 'Pedro', 1, 'goleiro', '1990-12-24', 0, 0, 0, 0, 'ativo'),
(6, 'Lucas Silva', 'Lucas', 9, 'atacante', '1992-03-17', 1, 0, 0, 13, 'ativo'),
(6, 'João Costa', 'João', 2, 'lateral', '1988-05-30', 0, 0, 0, 0, 'ativo'),
(6, 'Carlos Lima', 'Carlos', 5, 'volante', '1994-01-12', 2, 0, 0, 4, 'ativo'),
(6, 'André Santos', 'André', 8, 'meia', '1991-10-05', 0, 0, 0, 7, 'ativo'),
-- Internacional
(7, 'Roberto Silva', 'Roberto', 1, 'goleiro', '1989-08-22', 0, 0, 0, 0, 'ativo'),
(7, 'Fernando Lima', 'Fernando', 10, 'atacante', '1993-12-09', 0, 0, 0, 17, 'ativo'),
(7, 'Gustavo Santos', 'Gustavo', 4, 'zagueiro', '1990-07-14', 1, 0, 0, 2, 'ativo'),
(7, 'Marcos Oliveira', 'Marcos', 6, 'volante', '1995-04-27', 0, 0, 0, 6, 'ativo'),
(7, 'Diego Costa', 'Diego', 7, 'meia', '1992-11-20', 1, 0, 0, 9, 'ativo'),
-- Cruzeiro
(8, 'Lucas Pereira', 'Lucas', 1, 'goleiro', '1991-01-31', 0, 0, 0, 0, 'ativo'),
(8, 'Bruno Lima', 'Bruno', 9, 'atacante', '1994-05-23', 1, 0, 0, 11, 'ativo'),
(8, 'Rafael Silva', 'Rafael', 3, 'zagueiro', '1987-09-16', 2, 0, 0, 1, 'ativo'),
(8, 'Thiago Santos', 'Thiago', 5, 'volante', '1993-02-28', 0, 0, 0, 5, 'ativo'),
(8, 'Pedro Costa', 'Pedro', 8, 'meia', '1995-08-11', 0, 0, 0, 8, 'ativo');

-- Inserir jogos de exemplo
INSERT INTO jogos (campeonato_id, time_casa_id, time_visitante_id, data_hora, local, arbitro, status) VALUES
(1, 1, 2, '2025-01-20 15:00:00', 'Maracanã', 'José Maria', 'finalizado'),
(1, 3, 4, '2025-01-21 16:00:00', 'Allianz Parque', 'Carlos Silva', 'finalizado'),
(1, 5, 6, '2025-01-22 17:00:00', 'Vila Belmiro', 'Maria Santos', 'finalizado'),
(1, 7, 8, '2025-01-23 18:00:00', 'Beira-Rio', 'João Pedro', 'agendado'),
(1, 1, 3, '2025-01-27 15:00:00', 'Maracanã', 'Ana Costa', 'agendado'),
(1, 2, 4, '2025-01-28 16:00:00', 'Morumbi', 'Pedro Lima', 'agendado');

-- Atualizar placares dos jogos finalizados
UPDATE jogos SET gols_casa = 2, gols_visitante = 1 WHERE id = 1;
UPDATE jogos SET gols_casa = 1, gols_visitante = 1 WHERE id = 2;
UPDATE jogos SET gols_casa = 3, gols_visitante = 0 WHERE id = 3;

-- Inserir gols de exemplo
INSERT INTO gols (jogo_id, jogador_id, minuto, tipo) VALUES
(1, 2, 15, 'normal'), -- Dudu (Flamengo)
(1, 2, 67, 'normal'), -- Dudu (Flamengo)
(1, 7, 82, 'normal'), -- Fernando (São Paulo)
(2, 12, 34, 'normal'), -- Rodrigo (Corinthians)
(2, 17, 78, 'normal'), -- Fernando (Internacional)
(3, 22, 12, 'normal'), -- Edu (Santos)
(3, 22, 45, 'penalti'), -- Edu (Santos)
(3, 22, 89, 'normal'); -- Edu (Santos)

-- Inserir cartões de exemplo
INSERT INTO cartoes (jogo_id, jogador_id, tipo, minuto, motivo) VALUES
(1, 4, 'amarelo', 23, 'Falta dura'),
(1, 9, 'amarelo', 45, 'Reclamação'),
(2, 14, 'azul', 67, 'Conduta antidesportiva'),
(3, 19, 'vermelho', 78, 'Agressão');
