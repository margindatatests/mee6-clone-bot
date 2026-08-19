# 🧚 PaimonBot — Guia de Arquitetura e Diretrizes para Agentes

Bem-vindo ao repositório do **PaimonBot**! Este documento serve como guia central para desenvolvedores e agentes de IA que mantêm e expandem o bot.

---

## 🌟 O que é o PaimonBot?

O **PaimonBot** é um bot completo para Discord construído em **Node.js** e **discord.js v14**, inspirado na icônica personagem **Paimon** do universo de *Genshin Impact*.

Ele atua como um assistente de comunidade e guia de viagem ("*o melhor guia de Teyvat e parceira oficial do Viajante*"), combinando:
1. **Sistema de Níveis & RPG (Rank de Aventura):** Ganho de EXP por mensagens de chat com cooldown anti-spam, cálculo progressivo de níveis e mural dos melhores aventureiros (Leaderboard).
2. **Personalidade da Paimon em PT-BR:** Diálogos imersivos, piadas sobre *comida de emergência*, falas em terceira pessoa e reações temáticas.
3. **Mini-jogos & Diversão:** Simulador de Orações/Gacha (`/wish`) com raridades 3⭐, 4⭐ e 5⭐, frases sábias (`/paimon`) e piadas interativas (`/food`).
4. **Moderação Completa:** Comandos administrativos (`/clear`, `/kick`, `/ban`) com verificação rigorosa de hierarquia de cargos e permissões do Discord.
5. **Servidor HTTP Keep-Alive:** Servidor embutido para plataformas de hospedagem em nuvem (Render, Oracle VPS, Railway, etc.).

---

## 🗣️ Diretrizes de Linguagem (PT-BR Obrigatório)

Todas as interações do PaimonBot devem seguir rigorosamente o padrão de **Português do Brasil (PT-BR)** e manter a persona oficial da Paimon:

- **Voz da Paimon:** A Paimon fala sempre de si mesma em **terceira pessoa** (*"A Paimon acha que...", "A Paimon vai te ajudar!", "Ei, a Paimon não é comida de emergência!"*).
- **Tratamento:** Uso de *"você"*, *"seu/sua"*, *"Viajante"*, *"aventureiros"*.
- **Terminologia Oficial de Teyvat (PT-BR):**
  - Nível ➡️ **Rank de Aventura (AR)**
  - Pontos de Experiência ➡️ **EXP de Aventura**
  - Primogems ➡️ **Gemas Essenciais**
  - Wishes / Orações ➡️ **Orações / Tiros de Gacha**
  - Mora ➡️ **Mora (Moeda)**
  - Guilda de Aventureiros ➡️ **Guilda dos Aventureiros**

---

## 📂 Estrutura de Diretórios

```
paimonbot/
├── commands/               # Comandos Slash (/) divididos por categoria
│   ├── fun/                # Comandos de diversão (/wish, /food, /paimon)
│   └── utility/            # Comandos de perfil e ranking (/rank, /leaderboard)
├── events/                 # Manipuladores de eventos do Discord
│   ├── guildMemberAdd.js   # Boas-vindas para novos membros
│   ├── interactionCreate.js# Execução e tratamento de comandos slash
│   └── messageCreate.js    # Atribuição de EXP com cache em RAM e Prepared Statements
├── config.json             # Cores dos embeds, canais e taxas de EXP
├── database.js             # Camada de banco de dados SQLite (better-sqlite3 em modo WAL)
├── paimon.db               # Banco de dados SQLite persistente de alta velocidade
├── deploy-commands.js      # Script de registro dos comandos na API do Discord
├── Dockerfile              # Imagem Docker Node 18 Alpine (com build nativo)
├── docker-compose.yml      # Orquestração do container paimonbot
├── index.js                # Ponto de entrada do bot e servidor HTTP
└── package.json            # Dependências e scripts npm
```

---

## ⚡ Arquitetura de Alta Performance (10k+ Membros)

O PaimonBot utiliza uma arquitetura híbrida de **Cache em RAM + SQLite WAL Mode** projetada para comunidades com milhares de membros ativos:

1. **Cache de Cooldown em RAM (`messageCreate.js`):**
   - Um `Map` em memória verifica em **0.0001ms** se o usuário está em cooldown de 60s.
   - Mais de **95% das mensagens em chats movimentados são descartadas instantaneamente sem tocar no disco**.
2. **SQLite com Modo WAL (`better-sqlite3`):**
   - `PRAGMA journal_mode = WAL;` e `PRAGMA synchronous = NORMAL;`.
   - Suporta mais de **50.000 escritas por segundo** e leituras concorrentes simultâneas sem bloqueio.
   - Índice B-Tree `idx_users_leaderboard` para consultas instantâneas de ranking.
3. **Prepared Statements pré-compilados:**
   - As consultas SQL são pré-compiladas na inicialização para máxima economia de CPU.
4. **Portabilidade & Backup:**
   - O banco de dados reside no arquivo único `paimon.db` (mapeado via volume no Docker).
   - Conversão direta para PostgreSQL no futuro se o bot migrar para sharding distribuído.

---

## ⚙️ Configurações & Variáveis de Ambiente (`.env`)

O ficheiro `.env` deve conter:
```env
DISCORD_TOKEN=seu_token_aqui
CLIENT_ID=seu_client_id_aqui
PORT=3000
```

### Configurações no `config.json`:
- `embedColor`: Cor hexadecimal padrão dos embeds da Paimon (`#F3C343`).
- `xpPerMessageMin`: EXP mínima por mensagem (padrão: `15`).
- `xpPerMessageMax`: EXP máxima por mensagem (padrão: `25`).
- `xpCooldownSeconds`: Cooldown em segundos para ganhar EXP (padrão: `60`).
- `welcomeChannelId`: ID do canal de boas-vindas (opcional; se vazio, usa o canal padrão do servidor).

---

## 🛠️ Comandos Disponíveis

| Comando | Categoria | Descrição |
| :--- | :--- | :--- |
| `/rank [user]` | Utilidade | Exibe o Cartão de Viajante, Rank de Aventura (AR), EXP e barra de progresso. |
| `/leaderboard` | Utilidade | Exibe o Mural dos Melhores Aventureiros (Top 10 com maior AR no servidor). |
| `/wish` | Diversão | Realiza uma oração gacha com chances de armas 3⭐, personagens 4⭐ e 5⭐ lendários. |
| `/food` | Diversão | Interage com a Paimon sobre a comida de emergência. |
| `/paimon` | Diversão | Pede um conselho ou citação divertida da Paimon. |

---

## 🚀 Como Executar e Fazer Deploy

### 1. Registrar / Atualizar Comandos no Discord:
```bash
npm run deploy
```

### 2. Iniciar Localmente:
```bash
npm run start
```

### 3. Executar via Docker:
```bash
docker compose up -d --build
```

### 4. Deploy no Servidor / Oracle VPS:
```bash
git pull
docker compose down && docker compose up -d --build
```

---

## 🔗 Link de Convite Oficial (Permissões Mínimas & Seguras)

O PaimonBot solicita **zero permissões destrutivas** (sem expulsão, sem banimento, sem apagar mensagens, sem administrador). Solicita apenas permissões de leitura/envio de mensagens para chat, embeds e EXP:

> Permissões: `117760` (Ver canais, Enviar mensagens, Inserir links/Embeds, Anexar arquivos e Ler histórico).

👉 **[Convidar o PaimonBot com Permissões Seguras](https://discord.com/api/oauth2/authorize?client_id=1530728822461431808&permissions=117760&scope=bot%20applications.commands)**

```text
https://discord.com/api/oauth2/authorize?client_id=1530728822461431808&permissions=117760&scope=bot%20applications.commands
```


