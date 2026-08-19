const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

const PAIMON_QUOTES = [
  "✨ *'Que tal explorarmos a área à nossa frente mais tarde?'* (A clássica barreira vermelha da Paimon!)",
  "💰 *'Tesouro! Tesouro! A Paimon quer abrir o baú primeiro!'*",
  "🤤 *'Uma refeição deliciosa é o segredo para recuperar toda a stamina!'*",
  "💎 *'Guardou Gemas Essenciais suficientes para o próximo banner ou gastou tudo em tiros avulsos?'*",
  "⚔️ *'Ad astra abyssosque! Bem-vindo(a) à Guilda dos Aventureiros!'*",
  "💤 *'A Paimon está ficando com sono... Hora de adiantar o relógio do jogo para amanhã de manhã!'*",
  "🧚 *'Lembre-se: o melhor guia de viagem de todo o universo sou eu, a Paimon!'*"
];

module.exports = {
  data: {
    name: 'paimon',
    description: 'Peça um conselho ou ouça uma frase sábia da Paimon!'
  },
  async execute(interaction) {
    const randomQuote = PAIMON_QUOTES[Math.floor(Math.random() * PAIMON_QUOTES.length)];

    const embed = new EmbedBuilder()
      .setTitle('🧚 Sabedoria da Paimon')
      .setDescription(randomQuote)
      .setColor(config.embedColor || '#F3C343')
      .setFooter({ text: `Perguntado por ${interaction.user.username} • PaimonBot` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
