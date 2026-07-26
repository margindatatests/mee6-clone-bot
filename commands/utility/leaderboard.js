const { EmbedBuilder } = require('discord.js');
const database = require('../../database');
const config = require('../../config.json');

module.exports = {
  data: {
    name: 'leaderboard',
  },
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const topUsers = database.getLeaderboard(guildId, 10);

    if (topUsers.length === 0) {
      return interaction.reply({ content: 'Ainda não há dados de XP para este servidor. Começa a conversar para ganhar XP!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`🏆 Classificação do Servidor - ${interaction.guild.name}`)
      .setColor(config.embedColor || '#5865F2')
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setTimestamp();

    let description = '';
    
    topUsers.forEach((user, index) => {
      let position = '';
      if (index === 0) position = '🥇 ';
      else if (index === 1) position = '🥈 ';
      else if (index === 2) position = '🥉 ';
      else position = `**#${index + 1}** `;

      description += `${position}<@${user.user_id}> — Nível **${user.level}** (XP: \`${user.xp}\`)\n`;
    });

    embed.setDescription(description);

    await interaction.reply({ embeds: [embed] });
  }
};
