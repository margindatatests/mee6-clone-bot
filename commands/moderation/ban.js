const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: {
    name: 'ban',
    description: 'Bane um membro do servidor (ordem da Paimon e dos Cavaleiros de Favonius).'
  },
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'Nenhum motivo especificado';

    // Verificar permissões do executor
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ 
        content: '🚫 Ei! Você não tem permissão de Cavaleiro de Favonius para banir membros!', 
        ephemeral: true 
      });
    }

    // Verificar permissões do bot
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ 
        content: '🚫 A Paimon não tem permissão para banir membros neste servidor!', 
        ephemeral: true 
      });
    }

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    // Verificações de hierarquia
    if (targetMember) {
      if (targetMember.id === interaction.guild.ownerId) {
        return interaction.reply({ 
          content: '😱 A Paimon não pode banir o Grande Mestre / Dono do servidor!', 
          ephemeral: true 
        });
      }

      if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({ 
          content: '🛡️ A Paimon não consegue banir este membro porque o cargo dele é igual ou superior ao meu!', 
          ephemeral: true 
        });
      }

      if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({ 
          content: '🛡️ Você não pode banir este membro porque o cargo dele é igual ou superior ao seu!', 
          ephemeral: true 
        });
      }
    }

    try {
      await interaction.guild.members.ban(targetUser.id, { reason });
      await interaction.reply({ 
        content: `⚡ **${targetUser.tag}** foi banido(a) de Teyvat!\n**Moderador:** ${interaction.user.tag}\n**Motivo:** ${reason}\n*A Paimon assegura que a ordem foi restabelecida!* 🛡️` 
      });
    } catch (error) {
      console.error('Erro ao banir membro:', error);
      await interaction.reply({ content: '😖 Ocorreu um erro ao tentar banir o membro.', ephemeral: true });
    }
  }
};
