// Configuração do Supabase para PostgreSQL
const SUPABASE_URL = 'https://kbtjgelflweevfvtmxxi.supabase.co'; // Substitua pela URL do seu projeto Supabase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidGpnZWxmbHdlZXZmdnRteHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mjg4MDEsImV4cCI6MjA3MzAwNDgwMX0.bv79MT8O_P2O_Cy-9N9mhIkDLuhvZ3MgJISMAsP_Z-Q'; // Substitua pela chave anônima do Supabase

const { createClient } = supabase;
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Funções para interagir com o banco de dados

// Campeonatos
export async function getCampeonatos() {
    const { data, error } = await supabaseClient
        .from('campeonatos')
        .select('*');
    if (error) {
        alert('Erro ao buscar campeonatos: ' + error.message);
        console.error('Erro ao buscar campeonatos:', error);
    }
    return data;
}

export async function createCampeonato(campeonato) {
    const { data, error } = await supabaseClient
        .from('campeonatos')
        .insert([campeonato]);
    if (error) console.error('Erro ao criar campeonato:', error);
    return { data, error };
}

// Times
export async function getTimes(campeonatoId) {
    let query = supabaseClient
        .from('times')
        .select('*');

    if (campeonatoId != null) {
        query = query.eq('campeonato_id', campeonatoId);
    }
    // Quando campeonatoId é null ou undefined, não aplica filtro para carregar todos os times

    const { data, error } = await query;
    if (error) {
        alert('Erro ao buscar times: ' + error.message);
        console.error('Erro ao buscar times:', error);
    }
    return data;
}

export async function createTime(time) {
    const { data, error } = await supabaseClient
        .from('times')
        .insert([time]);
    if (error) {
        console.error('Erro ao criar time:', error);
    }
    return { data, error };
}

// Jogadores
export async function getJogadores(timeId) {
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

export async function createJogador(jogador) {
    const { data, error } = await supabaseClient
        .from('jogadores')
        .insert([jogador]);
    if (error) console.error('Erro ao criar jogador:', error);
    return { data, error };
}

// Jogos
export async function getJogos(campeonatoId) {
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

export async function createJogo(jogo) {
    const { data, error } = await supabaseClient
        .from('jogos')
        .insert([jogo]);
    if (error) console.error('Erro ao criar jogo:', error);
    return data;
}

export async function createJogosBatch(jogos) {
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
export async function createGol(gol) {
    const { data, error } = await supabaseClient
        .from('gols')
        .insert([gol]);
    if (error) console.error('Erro ao registrar gol:', error);
    return data;
}

// Cartões
export async function createCartao(cartao) {
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
export async function getCartoesPorJogador() {
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

// Função para calcular suspensões
export async function calcularSuspensoes() {
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
            .eq('status', 'ativo');

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

        // Filtrar jogadores suspensos
        const suspensoes = [];
        jogadores.forEach(jogador => {
            const cartoesJogador = cartoesPorJogador[jogador.id] || { amarelos: 0, azuis: 0, vermelhos: 0 };

            let motivo = '';
            if (cartoesJogador.vermelhos >= 1) {
                motivo = 'Cartão vermelho';
            } else if (cartoesJogador.azuis >= 2) {
                motivo = `${cartoesJogador.azuis} cartões azuis`;
            } else if (cartoesJogador.amarelos >= 3) {
                motivo = `${cartoesJogador.amarelos} cartões amarelos`;
            }

            if (motivo) {
                suspensoes.push({
                    ...jogador,
                    time_nome: jogador.times?.nome || 'N/A',
                    motivo: motivo
                });
            }
        });

        return suspensoes;

    } catch (error) {
        console.error('Erro ao calcular suspensões:', error);
        return [];
    }
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

// Funções de autenticação para usuários

// Login: Verificar credenciais na tabela usuarios
export async function loginUsuario(usuario, senha) {
    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('usuario', usuario)
        .eq('senha', senha)
        .single();

    if (error) {
        console.error('Erro no login:', error);
        return null;
    }
    return data; // Retorna o usuário se encontrado
}

// Cadastro: Inserir novo usuário na tabela usuarios
export async function cadastrarUsuario(usuario, senha, tipo, paginasPermitidas = []) {
    const { data, error } = await supabaseClient
        .from('usuarios')
        .insert([{
            usuario: usuario,
            senha: senha,
            tipo: tipo,
            paginas_permitidas: paginasPermitidas
        }]);

    if (error) {
        console.error('Erro no cadastro:', error);
        return { success: false, error: error.message };
    }
    return { success: true, data };
}

// Buscar usuário por ID ou nome
async function getUsuario(userId) {
    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Erro ao buscar usuário:', error);
        return null;
    }
    return data;
}
