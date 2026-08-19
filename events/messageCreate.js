const database = require('../database');
const config = require('../config.json');

// Cache em memória RAM para verificação instantânea de cooldown (0.0001ms)
const cooldownCache = new Map();

// Limpeza periódica do cache a cada 30 minutos para evitar fugas de memória
setInterval(() => {
  const now = Date.now();
  const maxAge = (config.xpCooldownSeconds || 60) * 1000 * 2;
  for (const [key, timestamp] of cooldownCache.entries()) {
    if (now - timestamp > maxAge) {
      cooldownCache.delete(key);
    }
  }
}, 30 * 60 * 1000).unref();

const LEVEL_UP_QUOTES = [
  "Parabéns {user}! Seu Rank de Aventura subiu para **AR {level}**! 🎉 A Paimon acha que você merece um lanche delicioso!",
  "Uau {user}, você está ficando muito mais forte! Subiu para **AR {level}**! ✨ Não esqueça de compartilhar os tesouros com a Paimon!",
  "Olha só, {user} atingiu o **Rank de Aventura {level}**! 🏆 A Paimon está super orgulhosa do seu Viajante favorito!",
  "Ding! {user} alcançou o **Nível {level}**! ⭐ A Guilda dos Aventureiros mandou lembranças e Gemas Essenciais imaginárias!"
];

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignorar bots e mensagens diretas
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;
    const cacheKey = `${guildId}-${userId}`;
    const now = Date.now();
    const cooldownMs = (config.xpCooldownSeconds || 60) * 1000;

    // 1. Verificação ultra-rápida em RAM Cache (descarta 95% das mensagens em 0.0001ms)
    const lastTime = cooldownCache.get(cacheKey);
    if (lastTime && (now - lastTime < cooldownMs)) {
      return;
    }

    // 2. Atualizar cache em RAM imediatamente
    cooldownCache.set(cacheKey, now);

    // 3. Calcular EXP aleatório
    const minXp = config.xpPerMessageMin || 15;
    const maxXp = config.xpPerMessageMax || 25;
    const xpToAdd = Math.floor(Math.random() * (maxXp - minXp + 1)) + minXp;

    // 4. Adicionar EXP no SQLite via Prepared Statement
    const result = database.addXp(guildId, userId, xpToAdd);
    database.updateCooldown(guildId, userId, now);

    // 5. Notificar level up se aplicável
    if (result.leveledUp) {
      try {
        const randomQuote = LEVEL_UP_QUOTES[Math.floor(Math.random() * LEVEL_UP_QUOTES.length)]
          .replace('{user}', `<@${message.author.id}>`)
          .replace('{level}', result.newLevel);
          
        await message.channel.send(randomQuote);
      } catch (error) {
        console.error(`Erro ao enviar mensagem de level up da Paimon:`, error);
      }
    }
  }
};
