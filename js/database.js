// Configuração do Supabase para PostgreSQL
const SUPABASE_URL = 'https://kbtjgelflweevfvtmxxi.supabase.co'; // Substitua pela URL do seu projeto Supabase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidGpnZWxmbHdlZXZmdnRteHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mjg4MDEsImV4cCI6MjA3MzAwNDgwMX0.bv79MT8O_P2O_Cy-9N9mhIkDLuhvZ3MgJISMAsP_Z-Q'; // Substitua pela chave anônima do Supabase

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Funções para interagir com o banco de dados

// Campeonatos
async function getCampeonatos() {
    const { data, error } = await supabaseClient
        .from('campeonatos')
        .select('*');
    if (error) {
        alert('Erro ao buscar campeonatos: ' + error.message);
        console.error('Erro ao buscar campeonatos:', error);
    }
    return data;
}

async function createCampeonato(campeonato) {
    const { data, error } = await supabaseClient
        .from('campeonatos')
        .insert([campeonato]);
    if (error) console.error('Erro ao criar campeonato:', error);
    return { data, error };
}

// Times
async function getTimes(campeonatoId) {
    let query = supabaseClient
        .from('times')
        .select('*');

    if (campeonatoId !== null) {
        query = query.eq('campeonato_id', campeonatoId);
    }
    // Quando campeonatoId é null, não aplica filtro para carregar todos os times

    const { data, error } = await query;
    if (error) {
        alert('Erro ao buscar times: ' + error.message);
        console.error('Erro ao buscar times:', error);
    }
    return data;
}

async function createTime(time) {
    const { data, error } = await supabaseClient
        .from('times')
        .insert([time]);
    if (error) {
        console.error('Erro ao criar time:', error);
    }
    return { data, error };
}

// Jogadores
async function getJogadores(timeId) {
    let query = supabaseClient
        .from('jogadores')
        .select('*');

    if (timeId !== null) {
        query = query.eq('time_id', timeId);
    }
    // Quando timeId é null, não aplica filtro para carregar todos os jogadores

    const { data, error } = await query;
    if (error) {
        alert('Erro ao buscar jogadores: ' + error.message);
        console.error('Erro ao buscar jogadores:', error);
    }
    return data;
}

async function createJogador(jogador) {
    const { data, error } = await supabaseClient
        .from('jogadores')
        .insert([jogador]);
    if (error) console.error('Erro ao criar jogador:', error);
    return { data, error };
}

// Jogos
async function getJogos(campeonatoId) {
    let query = supabaseClient
        .from('jogos')
        .select('*');

    if (campeonatoId !== null) {
        query = query.eq('campeonato_id', campeonatoId);
    }
    // Quando campeonatoId é null, não aplica filtro para carregar todos os jogos

    const { data, error } = await query;
    if (error) console.error('Erro ao buscar jogos:', error);
    return data;
}

async function createJogo(jogo) {
    const { data, error } = await supabaseClient
        .from('jogos')
        .insert([jogo]);
    if (error) console.error('Erro ao criar jogo:', error);
    return data;
}

async function createJogosBatch(jogos) {
    console.log('Iniciando createJogosBatch com', jogos.length, 'jogos...');
    try {
        const { data, error } = await supabaseClient
            .from('jogos')
            .insert(jogos);
        if (error) {
            console.error('Erro ao criar jogos em lote:', error);
            throw error; // Lançar erro para tratamento superior
        }
        console.log('createJogosBatch concluído com sucesso. Dados retornados:', data);
        return data;
    } catch (error) {
        console.error('Erro inesperado em createJogosBatch:', error);
        throw error;
    }
}

// Gols
async function createGol(gol) {
    const { data, error } = await supabaseClient
        .from('gols')
        .insert([gol]);
    if (error) console.error('Erro ao registrar gol:', error);
    return data;
}

// Cartões
async function createCartao(cartao) {
    const { data, error } = await supabaseClient
        .from('cartoes')
        .insert([cartao]);
    if (error) console.error('Erro ao registrar cartão:', error);
    return data;
}

// Função para obter a soma de gols por jogador (agrupados por jogador_id)
async function getGolsPorJogador() {
    const { data, error } = await supabaseClient
        .from('gols')
        .select('jogador_id, COUNT(*) as total_gols')
        .group('jogador_id')
        .order('total_gols', { ascending: false });

    if (error) {
        console.error('Erro ao buscar soma de gols por jogador:', error);
        return [];
    }
    return data;
}

// Função para obter cartões por jogador (agrupados por jogador_id e tipo)
async function getCartoesPorJogador() {
    const { data, error } = await supabaseClient
        .from('cartoes')
        .select(`
            jogador_id,
            tipo,
            COUNT(*) as quantidade
        `)
        .group('jogador_id, tipo')
        .order('jogador_id');

    if (error) {
        console.error('Erro ao buscar cartões por jogador:', error);
        return [];
    }
    return data;
}

// Função para calcular classificação
async function calcularClassificacao(campeonatoId) {
    // Implementar lógica de cálculo baseada nas regras
    // Pontos, vitórias, saldo de gols, etc.
    const jogos = await getJogos(campeonatoId);
    const times = await getTimes(campeonatoId);

    // Lógica simplificada - implementar cálculo completo
    const classificacao = times.map(time => {
        const jogosTime = jogos.filter(j => j.time_casa_id === time.id || j.time_visitante_id === time.id);
        // Calcular pontos, etc.
        return {
            ...time,
            pontos: 0, // Calcular
            vitorias: 0,
            empates: 0,
            derrotas: 0,
            gols_pro: 0,
            gols_contra: 0,
            saldo_gols: 0
        };
    });

    return classificacao.sort((a, b) => b.pontos - a.pontos);
}
