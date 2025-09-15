-- Esquema do banco de dados para Sistema de Campeonato de Futebol

-- Tabela: campeonatos
CREATE TABLE IF NOT EXISTS campeonatos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status VARCHAR(20) DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: times
CREATE TABLE IF NOT EXISTS times (
    id SERIAL PRIMARY KEY,
    campeonato_id INTEGER REFERENCES campeonatos(id),
    nome VARCHAR(100) NOT NULL,
    tecnico VARCHAR(100),
    cores_uniforme VARCHAR(100),
    data_fundacao DATE,
    logo_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ativo'
);

-- Tabela: jogadores
CREATE TABLE IF NOT EXISTS jogadores (
    id SERIAL PRIMARY KEY,
    time_id INTEGER REFERENCES times(id),
    nome_completo VARCHAR(100) NOT NULL,
    apelido VARCHAR(50),
    numero_camisa INTEGER CHECK (numero_camisa BETWEEN 1 AND 99),
    posicao VARCHAR(20) CHECK (posicao IN ('goleiro', 'zagueiro', 'lateral', 'volante', 'meia', 'atacante')),
    data_nascimento DATE,
    foto_url VARCHAR(255),
    cartoes_amarelos INTEGER DEFAULT 0,
    cartoes_azuis INTEGER DEFAULT 0,
    cartoes_vermelhos INTEGER DEFAULT 0,
    gols_marcados INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ativo'
);

-- Tabela: jogos
CREATE TABLE IF NOT EXISTS jogos (
    id SERIAL PRIMARY KEY,
    campeonato_id INTEGER REFERENCES campeonatos(id),
    time_casa_id INTEGER REFERENCES times(id),
    time_visitante_id INTEGER REFERENCES times(id),
    data_hora TIMESTAMP NOT NULL,
    local VARCHAR(100),
    arbitro VARCHAR(100),
    gols_casa INTEGER DEFAULT 0,
    gols_visitante INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'agendado',
    observacoes TEXT
);

-- Tabela: gols
CREATE TABLE IF NOT EXISTS gols (
    id SERIAL PRIMARY KEY,
    jogo_id INTEGER REFERENCES jogos(id),
    jogador_id INTEGER REFERENCES jogadores(id),
    minuto INTEGER CHECK (minuto BETWEEN 1 AND 120),
    tipo VARCHAR(20) DEFAULT 'normal' CHECK (tipo IN ('normal', 'contra', 'penalti'))
);

-- Tabela: cartoes
CREATE TABLE IF NOT EXISTS cartoes (
    id SERIAL PRIMARY KEY,
    jogo_id INTEGER REFERENCES jogos(id),
    jogador_id INTEGER REFERENCES jogadores(id),
    tipo VARCHAR(10) CHECK (tipo IN ('amarelo', 'azul', 'vermelho')),
    minuto INTEGER CHECK (minuto BETWEEN 1 AND 120),
    motivo VARCHAR(255)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_times_campeonato ON times(campeonato_id);
CREATE INDEX IF NOT EXISTS idx_jogadores_time ON jogadores(time_id);
CREATE INDEX IF NOT EXISTS idx_jogos_campeonato ON jogos(campeonato_id);
CREATE INDEX IF NOT EXISTS idx_gols_jogo ON gols(jogo_id);
CREATE INDEX IF NOT EXISTS idx_cartoes_jogo ON cartoes(jogo_id);
