module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Erro ao executar comando ${interaction.commandName}:`, error);
      const replyContent = { 
        content: 'Eep! 😖 A Paimon tropeçou e ocorreu um erro ao executar este comando!', 
        ephemeral: true 
      };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyContent);
      } else {
        await interaction.reply(replyContent);
      }
    }
  }
};
