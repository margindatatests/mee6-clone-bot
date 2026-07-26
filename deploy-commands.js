const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Mostra o teu nível e XP atual.')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('O utilizador de quem queres ver o rank')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Mostra o top 10 de utilizadores com mais XP no servidor.'),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Apaga um número específico de mensagens neste canal.')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Número de mensagens a apagar (1-100)')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa um membro do servidor.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('O membro a expulsar')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Motivo da expulsão')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bane um membro do servidor.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('O membro a banir')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Motivo do banimento')
        .setRequired(false)),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`A iniciar a atualização de ${commands.length} comandos slash (/).`);

    // Register commands globally
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log(`Sucesso! Foram registados ${data.length} comandos slash (/) com sucesso.`);
  } catch (error) {
    console.error('Erro ao registar comandos:', error);
  }
})();
