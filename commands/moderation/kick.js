const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: {
    name: 'kick',
  },
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'Nenhum motivo especificado';

    // Check executor permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: 'Não tens permissão para expulsar membros!', ephemeral: true });
    }

    // Check bot permissions
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: 'Eu não tenho permissão para expulsar membros!', ephemeral: true });
    }

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      return interaction.reply({ content: 'Membro não encontrado neste servidor!', ephemeral: true });
    }

    // Check hierarchies
    if (targetMember.id === interaction.guild.ownerId) {
      return interaction.reply({ content: 'Não podes expulsar o dono do servidor!', ephemeral: true });
    }

    if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({ content: 'Não posso expulsar este membro porque o cargo dele é igual ou superior ao meu!', ephemeral: true });
    }

    if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ content: 'Não podes expulsar este membro porque o cargo dele é igual ou superior ao teu!', ephemeral: true });
    }

    try {
      await targetMember.kick(reason);
      await interaction.reply({ 
        content: `✅ **${targetUser.tag}** foi expulso do servidor.\n**Moderador:** ${interaction.user.tag}\n**Motivo:** ${reason}` 
      });
    } catch (error) {
      console.error('Erro ao expulsar membro:', error);
      await interaction.reply({ content: 'Erro ao tentar expulsar o membro.', ephemeral: true });
    }
  }
};
