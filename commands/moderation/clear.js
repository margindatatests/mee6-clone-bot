const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: {
    name: 'clear',
    description: 'Apaga um número específico de mensagens neste canal com uma rajada de vento Anemo.'
  },
  async execute(interaction) {
    // Verificar permissões
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ 
        content: '🚫 Não tens permissão de Gerir Mensagens neste canal!', 
        ephemeral: true 
      });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ 
        content: '🚫 A Paimon não tem permissão para apagar mensagens aqui!', 
        ephemeral: true 
      });
    }

    const amount = interaction.options.getInteger('amount');

    if (amount < 1 || amount > 100) {
      return interaction.reply({ content: 'Por favor, introduz um valor entre 1 e 100 mensagens.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.editReply({ 
        content: `🌪️ *Fwoosh!* A Paimon limpou com sucesso \`${deleted.size}\` mensagens do canal!` 
      });
    } catch (error) {
      console.error('Erro ao limpar mensagens:', error);
      await interaction.editReply({ content: '😖 Ocorreu um erro ao tentar apagar as mensagens.' });
    }
  }
};
