const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const { guild } = member;
    
    // Find the welcome channel (either configured or fallback to system channel)
    let channel = null;
    if (config.welcomeChannelId) {
      channel = guild.channels.cache.get(config.welcomeChannelId);
    }
    if (!channel) {
      channel = guild.systemChannel;
    }
    
    // If no channel is found at all, stop
    if (!channel) return;

    // Create a welcoming embed
    const welcomeEmbed = new EmbedBuilder()
      .setTitle('👋 Bem-vindo!')
      .setDescription(`Olá ${member}, bem-vindo ao servidor **${guild.name}**! Diverte-te por cá!`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setColor(config.embedColor || '#5865F2')
      .setFooter({ text: `Agora somos ${guild.memberCount} membros!` })
      .setTimestamp();

    try {
      await channel.send({ content: `Bem-vindo ${member}!`, embeds: [welcomeEmbed] });
    } catch (error) {
      console.error(`Erro ao enviar mensagem de boas-vindas no canal:`, error);
    }
  }
};
