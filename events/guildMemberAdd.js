const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const { guild } = member;
    
    // Encontrar canal de boas-vindas
    let channel = null;
    if (config.welcomeChannelId) {
      channel = guild.channels.cache.get(config.welcomeChannelId);
    }
    if (!channel) {
      channel = guild.systemChannel;
    }
    
    if (!channel) return;

    // Criar embed de boas-vindas da Paimon em PT-BR
    const welcomeEmbed = new EmbedBuilder()
      .setTitle('✨ Um novo Viajante chegou a Teyvat!')
      .setDescription(`Olá ${member}! A **Paimon** te dá as boas-vindas ao servidor **${guild.name}**!\n\nPrepare suas armas, explore os canais e divirta-se com a gente nessa grande aventura!\n*(E lembre-se: a Paimon não é comida de emergência! 🍰)*`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setColor(config.embedColor || '#F3C343')
      .setFooter({ text: `Agora somos ${guild.memberCount} aventureiros no servidor!` })
      .setTimestamp();

    try {
      await channel.send({ content: `Bem-vindo(a) ${member}! 🎉`, embeds: [welcomeEmbed] });
    } catch (error) {
      console.error(`Erro ao enviar mensagem de boas-vindas da Paimon:`, error);
    }
  }
};
