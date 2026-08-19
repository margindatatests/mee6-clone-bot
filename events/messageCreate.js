const database = require('../database');
const config = require('../config.json');

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

    // Obter dados do usuário
    const user = database.getUser(guildId, userId);

    // Verificação de cooldown
    const cooldownMs = (config.xpCooldownSeconds || 60) * 1000;
    if (now - user.last_xp_time >= cooldownMs) {
      // Calcular EXP aleatório
      const minXp = config.xpPerMessageMin || 15;
      const maxXp = config.xpPerMessageMax || 25;
      const xpToAdd = Math.floor(Math.random() * (maxXp - minXp + 1)) + minXp;

      // Adicionar EXP e verificar subida de nível
      const result = database.addXp(guildId, userId, xpToAdd);
      
      // Atualizar cooldown
      database.updateCooldown(guildId, userId, now);

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
  }
};
