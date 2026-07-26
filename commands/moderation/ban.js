const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: {
    name: 'ban',
  },
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'Nenhum motivo especificado';

    // Check executor permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: 'Não tens permissão para banir membros!', ephemeral: true });
    }

    // Check bot permissions
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: 'Eu não tenho permissão para banir membros!', ephemeral: true });
    }

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    // Hierarchy checks only apply if the member is present in the guild
    if (targetMember) {
      if (targetMember.id === interaction.guild.ownerId) {
        return interaction.reply({ content: 'Não podes banir o dono do servidor!', ephemeral: true });
      }

      if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({ content: 'Não posso banir este membro porque o cargo dele é igual ou superior ao meu!', ephemeral: true });
      }

      if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({ content: 'Não podes banir este membro porque o cargo dele é igual ou superior ao teu!', ephemeral: true });
      }
    }

    try {
      await interaction.guild.members.ban(targetUser.id, { reason });
      await interaction.reply({ 
        content: `⛔ **${targetUser.tag}** foi banido do servidor.\n**Moderador:** ${interaction.user.tag}\n**Motivo:** ${reason}` 
      });
    } catch (error) {
      console.error('Erro ao banir membro:', error);
      await interaction.reply({ content: 'Erro ao tentar banir o membro.', ephemeral: true });
    }
  }
};
