# Sistema de Campeonato de Futebol Amador

Sistema web completo para gerenciamento de campeonatos de futebol amador, desenvolvido em HTML5, CSS3 e JavaScript vanilla, com hospedagem no GitHub Pages e banco de dados PostgreSQL via Supabase.

## 📋 Funcionalidades

- ✅ Cadastro de times e jogadores
- ✅ Geração automática de tabela de jogos
- ✅ Registro de resultados e estatísticas
- ✅ Controle disciplinar (cartões amarelos, azuis, vermelhos)
- ✅ Cálculo automático de classificação
- ✅ Geração de súmulas em PDF
- ✅ Interface responsiva para mobile
- ✅ Dashboard com estatísticas em tempo real

## 🚀 Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Banco de Dados**: PostgreSQL (via Supabase)
- **PDF Generation**: jsPDF
- **Hospedagem**: GitHub Pages
- **Versionamento**: Git

## 📁 Estrutura do Projeto

```
sistema-futebol/
├── index.html              # Dashboard principal
├── times.html              # Gerenciamento de times
├── jogadores.html          # Gerenciamento de jogadores
├── jogos.html              # Agenda e resultados
├── classificacao.html      # Tabela de classificação
├── artilharia.html         # Lista de artilheiros
├── css/
│   ├── main.css           # Estilos principais
│   ├── responsive.css     # Estilos responsivos
│   └── components.css     # Componentes reutilizáveis
├── js/
│   ├── main.js            # Funções principais
│   ├── database.js        # Integração com Supabase
│   ├── teams.js           # Lógica de times
│   ├── players.js         # Lógica de jogadores
│   ├── matches.js         # Lógica de jogos
│   ├── classificacao.js   # Lógica de classificação
│   ├── artilharia.js      # Lógica de artilharia
│   └── pdf-generator.js   # Geração de PDFs
├── database/
│   ├── schema.sql         # Esquema do banco
│   └── seed.sql           # Dados de exemplo
└── assets/
    ├── images/            # Imagens e logos
    └── fonts/             # Fontes personalizadas
```

## 🛠️ Instalação e Configuração

### 1. Clonagem do Repositório

```bash
git clone https://github.com/seu-usuario/sistema-futebol.git
cd sistema-futebol
```

### 2. Configuração do Banco de Dados

#### Opção A: Supabase (Recomendado)

1. Acesse [Supabase](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. No painel do Supabase, vá para "SQL Editor"
4. Execute o conteúdo do arquivo `database/schema.sql`
5. Execute o conteúdo do arquivo `database/seed.sql` (opcional, para dados de exemplo)
6. Vá para "Settings" > "API" e copie a URL e a chave anônima

#### Opção B: PostgreSQL Local

1. Instale PostgreSQL em sua máquina
2. Crie um banco de dados
3. Execute os scripts SQL na pasta `database/`

### 3. Configuração do Frontend

1. Abra o arquivo `js/database.js`
2. Substitua as constantes `SUPABASE_URL` e `SUPABASE_ANON_KEY` pelas suas credenciais:

```javascript
const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anonima';
```

### 4. Inclusão de Bibliotecas Externas

Para geração de PDFs, inclua a biblioteca jsPDF no `index.html`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

## 🌐 Deploy no GitHub Pages

1. Faça commit e push das alterações:

```bash
git add .
git commit -m "Implementação inicial do sistema"
git push origin main
```

2. No GitHub, vá para "Settings" > "Pages"
3. Selecione "Deploy from a branch" e escolha "main"
4. Clique em "Save"
5. O sistema estará disponível em `https://seu-usuario.github.io/sistema-futebol/`

## 📖 Como Usar

### 1. Criar Campeonato

- Acesse a página principal
- Clique em "Novo Campeonato"
- Preencha nome, data de início e fim
- O sistema gera automaticamente a tabela de jogos

### 2. Cadastrar Times

- Vá para "Times" no menu
- Clique em "Novo Time"
- Preencha informações: nome, técnico, cores, data de fundação
- Faça upload do escudo (opcional)

### 3. Cadastrar Jogadores

- Vá para "Jogadores" no menu
- Selecione um time
- Clique em "Novo Jogador"
- Preencha dados pessoais e posição
- Máximo 20 jogadores por time

### 4. Registrar Jogos

- Vá para "Jogos" no menu
- Selecione um jogo agendado
- Informe placar final
- Registre gols com jogadores e minutos
- Registre cartões distribuídos

### 5. Visualizar Estatísticas

- **Classificação**: Tabela atualizada automaticamente
- **Artilharia**: Lista de jogadores com mais gols
- **Dashboard**: Visão geral com próximos jogos e estatísticas

### 6. Gerar Documentos

- Para súmulas: Na página de jogos, clique em "Gerar Súmula"
- Para classificação: Na página de classificação, clique em "Exportar PDF"
- Para artilharia: Na página de artilharia, clique em "Exportar PDF"

## 🔧 Regras de Negócio

### Classificação
1. Pontos (vitória = 3, empate = 1, derrota = 0)
2. Confronto direto (se dois times tiverem os mesmos pontos)
3. Número de vitórias
4. Gols sofridos
5. Saldo de gols

### Suspensões
- 3 cartões amarelos = 1 jogo de suspensão
- 2 cartões azuis = 1 jogo de suspensão
- 1 cartão vermelho = 1 jogo de suspensão

### Limites
- Máximo 20 times por campeonato
- Máximo 20 jogadores por time
- Números de camisa únicos por time (1-99)

## 🐛 Solução de Problemas

### Erro de Conexão com Banco
- Verifique se as credenciais do Supabase estão corretas
- Confirme se o projeto Supabase está ativo
- Verifique as políticas de segurança (RLS) no Supabase

### PDFs não Geram
- Certifique-se de que a biblioteca jsPDF está incluída
- Verifique o console do navegador para erros
- Teste em navegadores modernos (Chrome, Firefox, Edge)

### Interface não Responsiva
- Limpe o cache do navegador
- Verifique se os arquivos CSS estão sendo carregados
- Teste em diferentes dispositivos

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou sugestões:
- Abra uma issue no GitHub
- Envie um email para suporte@sistemafutebol.com
- Consulte a documentação em `/docs`

---

**Desenvolvido por**: JCS - Sistema de Campeonato de Futebol  
**Versão**: 1.0.0  
**Data**: Setembro 2025
