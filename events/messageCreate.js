const database = require('../database');
const config = require('../config.json');
const { askPaimon } = require('../ai');

// Cache em memória RAM para verificação instantânea de cooldown de EXP (0.0001ms)
const xpCooldownCache = new Map();

// Cache em memória para rate-limit de chamadas da IA da Paimon (3s por usuário)
const aiCooldownCache = new Map();

// Limpeza periódica do cache a cada 30 minutos para evitar fugas de memória
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of xpCooldownCache.entries()) {
    if (now - timestamp > 120000) xpCooldownCache.delete(key);
  }
  for (const [key, timestamp] of aiCooldownCache.entries()) {
    if (now - timestamp > 10000) aiCooldownCache.delete(key);
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
    const now = Date.now();

    // ==========================================
    // 1. SISTEMA DE RESPOSTA IA NATURAL (GROQ)
    // ==========================================
    const isMentioned = message.mentions.has(message.client.user.id);
    const mentionsPaimon = /\bpaimon\b/i.test(message.content);
    
    // Verificar se é resposta direta a uma mensagem anterior da Paimon
    let isReplyToPaimon = false;
    if (message.reference && message.reference.messageId) {
      try {
        const repliedMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
        if (repliedMsg && repliedMsg.author.id === message.client.user.id) {
          isReplyToPaimon = true;
        }
      } catch (e) {}
    }

    if (isMentioned || mentionsPaimon || isReplyToPaimon) {
      const lastAiCall = aiCooldownCache.get(userId) || 0;
      if (now - lastAiCall >= 2500) { // Cooldown de 2.5s por usuário
        aiCooldownCache.set(userId, now);

        // Limpar menção do texto
        let cleanPrompt = message.content.replace(/<@!?\d+>/g, '').trim();
        if (!cleanPrompt && isMentioned) {
          cleanPrompt = 'Oi Paimon!';
        }

        if (cleanPrompt) {
          try {
            await message.channel.sendTyping();
            const aiAnswer = await askPaimon(message.author.username, cleanPrompt);
            if (aiAnswer) {
              await message.reply({ 
                content: aiAnswer,
                allowedMentions: { repliedUser: false } 
              });
            }
          } catch (aiErr) {
            console.error('Erro ao responder com IA:', aiErr);
          }
        }
      }
    }

    // ==========================================
    // 2. SISTEMA DE RANK DE AVENTURA & EXP (SQLITE)
    // ==========================================
    const cacheKey = `${guildId}-${userId}`;
    const xpCooldownMs = (config.xpCooldownSeconds || 60) * 1000;

    // Verificação instantânea de cooldown em RAM
    const lastXpTime = xpCooldownCache.get(cacheKey);
    if (lastXpTime && (now - lastXpTime < xpCooldownMs)) {
      return;
    }

    // Atualizar cache de EXP em RAM
    xpCooldownCache.set(cacheKey, now);

    // Calcular EXP aleatório
    const minXp = config.xpPerMessageMin || 15;
    const maxXp = config.xpPerMessageMax || 25;
    const xpToAdd = Math.floor(Math.random() * (maxXp - minXp + 1)) + minXp;

    // Persistir no SQLite com Prepared Statements
    const result = database.addXp(guildId, userId, xpToAdd);
    database.updateCooldown(guildId, userId, now);

    // Notificar subida de Rank de Aventura (AR)
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
