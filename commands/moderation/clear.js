const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: {
    name: 'clear',
  },
  async execute(interaction) {
    // Check permissions of the user
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'Não tens permissão para gerir mensagens neste canal!', ephemeral: true });
    }

    // Check permissions of the bot
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'Eu não tenho a permissão `Gerir Mensagens`!', ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount');

    if (amount < 1 || amount > 100) {
      return interaction.reply({ content: 'Por favor, introduz um valor entre 1 e 100.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.editReply({ 
        content: `Sucesso! Foram apagadas \`${deleted.size}\` mensagens. (Mensagens enviadas há mais de 14 dias não podem ser apagadas pelo Discord).` 
      });
    } catch (error) {
      console.error('Erro ao limpar mensagens:', error);
      await interaction.editReply({ content: 'Ocorreu um erro ao tentar apagar as mensagens.' });
    }
  }
};
