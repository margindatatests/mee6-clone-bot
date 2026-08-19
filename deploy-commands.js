const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Mostra o seu Cartão de Viajante e Rank de Aventura (AR).')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('O aventureiro de quem você quer ver o rank')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Mostra o Mural dos Melhores Aventureiros (Top 10 do servidor).'),

  new SlashCommandBuilder()
    .setName('wish')
    .setDescription('Faça um Wish/Oração com os seus Destinos Entrelaçados imaginários!'),

  new SlashCommandBuilder()
    .setName('food')
    .setDescription('Pergunte para a Paimon sobre a comida de emergência.'),

  new SlashCommandBuilder()
    .setName('paimon')
    .setDescription('Peça um conselho ou ouça uma frase sábia da Paimon!'),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Apaga uma quantidade específica de mensagens neste canal com uma rajada Anemo.')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Quantidade de mensagens a apagar (1-100)')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa um membro do servidor.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('O membro a ser expulso')
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
        .setDescription('O membro a ser banido')
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
    console.log(`👑 Iniciando o registro de ${commands.length} comandos slash (/) do PaimonBot.`);

    // Registrar comandos globalmente
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log(`✨ Sucesso! Foram registrados ${data.length} comandos slash (/) do PaimonBot.`);
  } catch (error) {
    console.error('Erro ao registrar comandos no Discord:', error);
  }
})();
