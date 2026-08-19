const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

const FOOD_RESPONSES = [
  "😡 **EI! A Paimon NÃO é comida de emergência!** Pare de olhar para a Paimon com garfo e faca!",
  "🍰 Se estiver com fome, vá caçar javalis em Mondstadt ou peça comida para a Xiangling em Liyue! A Paimon é a sua melhor parceira de viagem, não um bife!",
  "😱 *A Paimon se esconde atrás de você.* 'Não me coma! A Paimon promete te ajudar a encontrar todos os baús e Anemoculus de Teyvat!'",
  "🍲 'Receita secreta: 1x Paimon com geleia de Slime' ... ESPERA! Quem escreveu isso no livro de receitas?! Foi o Kaeya, não foi?!"
];

module.exports = {
  data: {
    name: 'food',
    description: 'Pergunte para a Paimon sobre a comida de emergência.'
  },
  async execute(interaction) {
    const randomResponse = FOOD_RESPONSES[Math.floor(Math.random() * FOOD_RESPONSES.length)];

    const embed = new EmbedBuilder()
      .setTitle('🍗 Comida de Emergência?!')
      .setDescription(randomResponse)
      .setColor(config.embedColor || '#F3C343')
      .setFooter({ text: 'PaimonBot • Guia oficial de viagem' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
