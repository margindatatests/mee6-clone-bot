const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'paimon.db');
let db = null;

// Prepared statements cache
let stmts = {};

function init() {
  // Conectar ao SQLite com opções de alta performance
  db = new Database(dbPath);
  
  // Ativar modo WAL (Write-Ahead Logging) e sincronização otimizada
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('temp_store = MEMORY');

  // Criar tabelas e índices
  db.exec(`
    -- Tabela de usuários e níveis
    CREATE TABLE IF NOT EXISTS users (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 0,
      last_xp_time INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_leaderboard ON users (guild_id, level DESC, xp DESC);

    -- Tabela de histórico persistente de conversas com a Paimon
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL, -- 'user' ou 'assistant'
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages (user_id, created_at DESC);

    -- Tabela de fatos e memórias de longo prazo sobre cada Viajante
    CREATE TABLE IF NOT EXISTS user_memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      memory TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_user_memories ON user_memories (user_id);
  `);

  // Compilar Prepared Statements para velocidade máxima (sub-milissegundo)
  stmts = {
    getUser: db.prepare('SELECT * FROM users WHERE guild_id = ? AND user_id = ?'),
    createUser: db.prepare('INSERT OR IGNORE INTO users (guild_id, user_id, xp, level, last_xp_time) VALUES (?, ?, 0, 0, 0)'),
    updateUserXp: db.prepare('UPDATE users SET xp = ?, level = ? WHERE guild_id = ? AND user_id = ?'),
    updateCooldown: db.prepare('UPDATE users SET last_xp_time = ? WHERE guild_id = ? AND user_id = ?'),
    getLeaderboard: db.prepare('SELECT user_id, xp, level FROM users WHERE guild_id = ? ORDER BY level DESC, xp DESC LIMIT ?'),
    getRankPosition: db.prepare(`
      SELECT COUNT(*) + 1 AS position 
      FROM users 
      WHERE guild_id = ? AND (level > ? OR (level = ? AND xp > ?))
    `),
    
    // Histórico de Conversa Persistente
    saveChatMessage: db.prepare(`
      INSERT INTO chat_messages (guild_id, user_id, role, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `),
    getRecentChatHistory: db.prepare(`
      SELECT role, content 
      FROM chat_messages 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `),
    cleanOldChatMessages: db.prepare(`
      DELETE FROM chat_messages 
      WHERE user_id = ? AND id NOT IN (
        SELECT id FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
      )
    `),

    // Memórias de Longo Prazo
    getUserMemories: db.prepare('SELECT memory FROM user_memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 5'),
    saveUserMemory: db.prepare('INSERT INTO user_memories (user_id, memory, created_at) VALUES (?, ?, ?)')
  };

  console.log('🗄️ Base de dados SQLite (Paimon.db) inicializada com suporte a Memória Persistente!');
}

// Obter usuário da base de dados (cria se não existir)
function getUser(guildId, userId) {
  let user = stmts.getUser.get(guildId, userId);
  if (!user) {
    stmts.createUser.run(guildId, userId);
    user = {
      guild_id: guildId,
      user_id: userId,
      xp: 0,
      level: 0,
      last_xp_time: 0
    };
  }
  return user;
}

// Fórmula para EXP necessária para o próximo Rank de Aventura (AR)
function getXpNeededForNextLevel(level) {
  return 5 * (level ** 2) + 50 * level + 100;
}

// Adicionar EXP e calcular subida de Rank de Aventura
function addXp(guildId, userId, amount) {
  const user = getUser(guildId, userId);
  const oldLevel = user.level;
  let newXp = user.xp + amount;
  let currentLevel = user.level;
  let leveledUp = false;

  while (true) {
    const xpNeeded = getXpNeededForNextLevel(currentLevel);
    if (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      currentLevel++;
      leveledUp = true;
    } else {
      break;
    }
  }

  // Atualizar na base de dados SQLite
  stmts.updateUserXp.run(newXp, currentLevel, guildId, userId);

  return {
    leveledUp,
    oldLevel,
    newLevel: currentLevel,
    xp: newXp
  };
}

// Atualizar timestamp de cooldown
function updateCooldown(guildId, userId, timestamp) {
  stmts.updateCooldown.run(timestamp, guildId, userId);
}

// Obter Leaderboard do servidor (Mural de Aventureiros)
function getLeaderboard(guildId, limit = 10) {
  return stmts.getLeaderboard.all(guildId, limit);
}

// Obter posição exata de um usuário no ranking
function getUserRankPosition(guildId, userId, level, xp) {
  const row = stmts.getRankPosition.get(guildId, level, level, xp);
  return row ? row.position : 1;
}

// Salvar mensagem no histórico persistente da conversa
function saveChatMessage(guildId, userId, role, content) {
  const now = Date.now();
  stmts.saveChatMessage.run(guildId, userId, role, content, now);
  
  // Limpeza assíncrona/rápida para manter apenas as últimas 20 mensagens por usuário
  try {
    stmts.cleanOldChatMessages.run(userId, userId);
  } catch (e) {}
}

// Obter histórico recente ordenado cronologicamente (do mais antigo para o mais recente)
function getRecentChatHistory(userId, limit = 6) {
  const rows = stmts.getRecentChatHistory.all(userId, limit);
  return rows.reverse(); // Inverter para enviar na ordem correta da conversa
}

// Obter memórias de longo prazo do usuário
function getUserMemories(userId) {
  return stmts.getUserMemories.all(userId).map(r => r.memory);
}

module.exports = {
  init,
  getUser,
  addXp,
  updateCooldown,
  getLeaderboard,
  getUserRankPosition,
  getXpNeededForNextLevel,
  saveChatMessage,
  getRecentChatHistory,
  getUserMemories
};
