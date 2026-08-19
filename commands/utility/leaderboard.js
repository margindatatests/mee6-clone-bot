const { EmbedBuilder } = require('discord.js');
const database = require('../../database');
const config = require('../../config.json');

module.exports = {
  data: {
    name: 'leaderboard',
    description: 'Mostra o Mural dos Melhores Aventureiros (Top 10 do servidor).'
  },
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const topUsers = database.getLeaderboard(guildId, 10);

    if (topUsers.length === 0) {
      return interaction.reply({ 
        content: '📜 O Mural de Aventureiros ainda está vazio! Comece a conversar no chat para ganhar EXP e subir no Rank de Aventura!', 
        ephemeral: true 
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`🏆 Mural dos Melhores Aventureiros — ${interaction.guild.name}`)
      .setDescription('Aqui estão os Viajantes com maior **Rank de Aventura (AR)** e dedicação no servidor!\n')
      .setColor(config.embedColor || '#F3C343')
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'PaimonBot • Continue explorando para alcançar o topo!' })
      .setTimestamp();

    let description = '';
    
    topUsers.forEach((user, index) => {
      let medal = '';
      if (index === 0) medal = '🥇 ';
      else if (index === 1) medal = '🥈 ';
      else if (index === 2) medal = '🥉 ';
      else medal = `**#${index + 1}** `;

      description += `${medal}<@${user.user_id}> — **AR ${user.level}** (EXP: \`${user.xp}\`)\n`;
    });

    embed.setDescription(description);

    await interaction.reply({ embeds: [embed] });
  }
};
