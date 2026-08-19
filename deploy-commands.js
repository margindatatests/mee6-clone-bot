const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
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

  // Comando de Administração & Feature Flags (RBAC)
  new SlashCommandBuilder()
    .setName('paimon-config')
    .setDescription('Painel de configuração e feature flags da Paimon (Apenas Administradores).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('spicy-mode')
        .setDescription('Ativa ou desativa o modo sem censura (xingamentos fofos e deboche).')
        .addBooleanOption(option =>
          option
            .setName('ativar')
            .setDescription('True para ativar o modo atrevido, False para desativar')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-admin-role')
        .setDescription('Define um cargo com permissão para gerenciar a Paimon.')
        .addRoleOption(option =>
          option
            .setName('cargo')
            .setDescription('O cargo que terá acesso de administração')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Exibe o status atual das configurações e feature flags.')),
].map(command => command.toJSON());

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error('ERRO: DISCORD_TOKEN ou CLIENT_ID não configurados no .env!');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`👑 Iniciando o registro de ${commands.length} comandos slash (/) do PaimonBot.`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log(`✨ Sucesso! Foram registrados ${data.length} comandos slash (/) do PaimonBot.`);
  } catch (error) {
    console.error('Erro ao registrar comandos no Discord:', error);
  }
})();
