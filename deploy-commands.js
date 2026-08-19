const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Mostra o teu Cartão de Viajante e Rank de Aventura (AR).')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('O aventureiro de quem queres ver o rank')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Mostra o Mural dos Melhores Aventureiros (Top 10 do servidor).'),

  new SlashCommandBuilder()
    .setName('wish')
    .setDescription('Faz um Wish/Oração com as tuas Destinos Entrelaçados imaginárias!'),

  new SlashCommandBuilder()
    .setName('food')
    .setDescription('Pergunta à Paimon sobre a comida de emergência.'),

  new SlashCommandBuilder()
    .setName('paimon')
    .setDescription('Pede um conselho ou ouve uma frase sábia da Paimon!'),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Apaga um número específico de mensagens neste canal com uma rajada Anemo.')
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

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error('ERRO: DISCORD_TOKEN ou CLIENT_ID não configurados no .env!');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`👑 A iniciar o registo de ${commands.length} comandos slash (/) do PaimonBot.`);

    // Registar comandos globalmente
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log(`✨ Sucesso! Foram registados ${data.length} comandos slash (/) do PaimonBot.`);
  } catch (error) {
    console.error('Erro ao registar comandos no Discord:', error);
  }
})();
