const database = require('../database');
const config = require('../config.json');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignore bots and DM messages
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;
    const now = Date.now();

    // Get user from database
    const user = database.getUser(guildId, userId);

    // Cooldown check
    const cooldownMs = (config.xpCooldownSeconds || 60) * 1000;
    if (now - user.last_xp_time >= cooldownMs) {
      // Calculate random XP to award
      const minXp = config.xpPerMessageMin || 15;
      const maxXp = config.xpPerMessageMax || 25;
      const xpToAdd = Math.floor(Math.random() * (maxXp - minXp + 1)) + minXp;

      // Add XP and check for level up
      const result = database.addXp(guildId, userId, xpToAdd);
      
      // Update cooldown timestamp
      database.updateCooldown(guildId, userId, now);

      if (result.leveledUp) {
        try {
          await message.channel.send(`Parabéns ${message.author}! Subiste para o **Nível ${result.newLevel}**! 🎉`);
        } catch (error) {
          console.error(`Erro ao enviar mensagem de level up:`, error);
        }
      }
    }
  }
};
