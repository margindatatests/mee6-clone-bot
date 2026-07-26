const { EmbedBuilder } = require('discord.js');
const database = require('../../database');
const config = require('../../config.json');

module.exports = {
  data: {
    name: 'rank',
  },
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    // Ignore bots
    if (targetUser.bot) {
      return interaction.reply({ content: 'Os bots não acumulam nível nem XP!', ephemeral: true });
    }

    const guildId = interaction.guild.id;
    const user = database.getUser(guildId, targetUser.id);
    const xpNeeded = database.getXpNeededForNextLevel(user.level);

    // Calculate percentage and build a progress bar
    const percent = Math.min(Math.floor((user.xp / xpNeeded) * 100), 100);
    const filledBlocks = Math.min(Math.floor(percent / 10), 10);
    const emptyBlocks = 10 - filledBlocks;
    const progressBar = '▰'.repeat(filledBlocks) + '▱'.repeat(emptyBlocks);

    // Get leaderboard to find the user's rank position
    const guildUsers = database.getLeaderboard(guildId, 9999);
    const rankPosition = guildUsers.findIndex(u => u.user_id === targetUser.id) + 1;
    const rankStr = rankPosition > 0 ? `#${rankPosition}` : 'N/A';

    const embed = new EmbedBuilder()
      .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
      .setTitle(`Rank de ${targetUser.username}`)
      .setColor(config.embedColor || '#5865F2')
      .addFields(
        { name: 'Nível', value: `⭐ **${user.level}**`, inline: true },
        { name: 'XP', value: `✨ **${user.xp}** / ${xpNeeded}`, inline: true },
        { name: 'Posição', value: `🏆 **${rankStr}**`, inline: true },
        { name: 'Progresso para o Nível ' + (user.level + 1), value: `\`${progressBar}\` (${percent}%)`, inline: false }
      )
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
