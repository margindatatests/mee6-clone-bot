const { EmbedBuilder } = require('discord.js');
const database = require('../../database');
const config = require('../../config.json');

module.exports = {
  data: {
    name: 'rank',
    description: 'Mostra o seu Cartão de Viajante e Rank de Aventura (AR).'
  },
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    // Ignorar bots
    if (targetUser.bot) {
      return interaction.reply({ 
        content: '🤖 Ei! Os autômatos e bots não ganham Rank de Aventura nem EXP!', 
        ephemeral: true 
      });
    }

    const guildId = interaction.guild.id;
    const user = database.getUser(guildId, targetUser.id);
    const xpNeeded = database.getXpNeededForNextLevel(user.level);

    // Calcular porcentagem e barra de progresso temática
    const percent = Math.min(Math.floor((user.xp / xpNeeded) * 100), 100);
    const filledBlocks = Math.min(Math.floor(percent / 10), 10);
    const emptyBlocks = 10 - filledBlocks;
    const progressBar = '⭐'.repeat(Math.min(filledBlocks, 5)) + '✨'.repeat(Math.max(0, filledBlocks - 5)) + '▪️'.repeat(emptyBlocks);

    // Obter posição no ranking diretamente via SQL indexado (< 0.05ms)
    const rankPosition = database.getUserRankPosition(guildId, targetUser.id, user.level, user.xp);
    const rankStr = rankPosition > 0 ? `#${rankPosition}` : 'Sem Classificação';

    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: `Cartão de Viajante - ${targetUser.tag}`, 
        iconURL: targetUser.displayAvatarURL({ dynamic: true }) 
      })
      .setTitle(`📜 Perfil de Aventureiro de ${targetUser.username}`)
      .setColor(config.embedColor || '#F3C343')
      .addFields(
        { name: '🎖️ Rank de Aventura (AR)', value: `**AR ${user.level}**`, inline: true },
        { name: '✨ EXP de Aventura', value: `\`${user.xp}\` / \`${xpNeeded}\``, inline: true },
        { name: '🏆 Posição em Teyvat', value: `**${rankStr}**`, inline: true },
        { name: `⚡ Progresso para AR ${user.level + 1}`, value: `${progressBar} (${percent}%)`, inline: false }
      )
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: 'PaimonBot • O melhor guia de viagem de Teyvat!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
