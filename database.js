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

  // Criar tabela de usuários e índice B-Tree para Leaderboard
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 0,
      last_xp_time INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_leaderboard ON users (guild_id, level DESC, xp DESC);
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
    importUser: db.prepare(`
      INSERT OR REPLACE INTO users (guild_id, user_id, xp, level, last_xp_time) 
      VALUES (?, ?, ?, ?, ?)
    `)
  };

  // Migração automática do antigo database.json (se existir)
  migrateFromJsonIfPresent();

  console.log('🗄️ Base de dados SQLite (Paimon.db) inicializada em modo WAL com sucesso!');
}

// Migrar dados do antigo database.json se ainda existir
function migrateFromJsonIfPresent() {
  const jsonPath = path.join(__dirname, 'database.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.users && Object.keys(parsed.users).length > 0) {
        const count = Object.keys(parsed.users).length;
        console.log(`🔄 Migrando ${count} usuários de database.json para SQLite...`);
        
        const insertMany = db.transaction((users) => {
          for (const u of Object.values(users)) {
            if (u.guild_id && u.user_id) {
              stmts.importUser.run(
                u.guild_id,
                u.user_id,
                u.xp || 0,
                u.level || 0,
                u.last_xp_time || 0
              );
            }
          }
        });

        insertMany(parsed.users);
        console.log('✅ Migração concluída com sucesso!');
        // Renomear ficheiro antigo como backup
        fs.renameSync(jsonPath, path.join(__dirname, 'database.json.backup'));
      }
    } catch (e) {
      console.error('Erro na migração de database.json:', e);
    }
  }
}

// Fórmula para EXP necessária para o próximo Rank de Aventura (AR)
function getXpNeededForNextLevel(level) {
  return 5 * (level ** 2) + 50 * level + 100;
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

// Obter posição exata de um usuário no ranking sem carregar todos os dados
function getUserRankPosition(guildId, userId, level, xp) {
  const row = stmts.getRankPosition.get(guildId, level, level, xp);
  return row ? row.position : 1;
}

module.exports = {
  init,
  getUser,
  addXp,
  updateCooldown,
  getLeaderboard,
  getUserRankPosition,
  getXpNeededForNextLevel
};
