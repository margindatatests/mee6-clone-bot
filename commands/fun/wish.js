const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

const FIVE_STAR_POOL = [
  { name: 'Raiden Shogun', element: '⚡ Electro', title: 'Plano da Eutimia' },
  { name: 'Zhongli', element: '🔶 Geo', title: 'Vago e Sozinho' },
  { name: 'Furina', element: '💧 Hydro', title: 'Solista Infinita' },
  { name: 'Nahida', element: '🌿 Dendro', title: 'Física da Pureza' },
  { name: 'Neuvillette', element: '💧 Hydro', title: 'Juiz Supremo de Fontaine' },
  { name: 'Arlecchino', element: '🔥 Pyro', title: 'O Servo dos Fatui' },
  { name: 'Kaedehara Kazuha', element: '🌪️ Anemo', title: 'Folhas ao Vento' },
  { name: 'Hu Tao', element: '🔥 Pyro', title: 'Diretora da Casa Funerária Wangsheng' },
  { name: 'Yelan', element: '💧 Hydro', title: 'Orquídea do Vale' },
  { name: 'Mavuika', element: '🔥 Pyro', title: 'Arconte Pyro de Natlan' }
];

const FOUR_STAR_POOL = [
  { name: 'Bennett', element: '🔥 Pyro', title: 'O Melhor Suporte de Teyvat' },
  { name: 'Xiangling', element: '🔥 Pyro', title: 'Mestre da Culinária de Liyue' },
  { name: 'Xingqiu', element: '💧 Hydro', title: 'Jovem Galante de Feiyun' },
  { name: 'Fischl', element: '⚡ Electro', title: 'Princesa dos Pecados' },
  { name: 'Kuki Shinobu', element: '⚡ Electro', title: 'Vice-Líder da Gangue Arataki' },
  { name: 'Sucrose', element: '🌪️ Anemo', title: 'Alquimista Gentil' },
  { name: 'Gaming', element: '🔥 Pyro', title: 'Dançarino Wushou' }
];

const THREE_STAR_WEAPONS = [
  'Espada de Ferro Negro',
  'História dos Caçadores de Dragões',
  'Arco Recurvado',
  'Espada Grande de Sangue Nobre',
  'Lança de Borla Branca'
];

module.exports = {
  data: {
    name: 'wish',
    description: 'Faz um Wish/Oração com as tuas Destinos Entrelaçados imaginárias!'
  },
  async execute(interaction) {
    const roll = Math.random() * 100;
    let result = {};
    let stars = 3;
    let embedColor = '#5865F2';
    let bannerTitle = '💫 Oração de Teyvat';

    if (roll < 3.5) {
      // 5-Star Drop (Ouro)
      stars = 5;
      const char = FIVE_STAR_POOL[Math.floor(Math.random() * FIVE_STAR_POOL.length)];
      result = {
        title: `🌟🌟🌟🌟🌟 OURO LENDÁRIO! (${char.name})`,
        description: `✨ **BRILHO DOURADO NO CÉU!** ✨\n\nObtiveste **${char.name}** [${char.element}]!\n*${char.title}*\n\nA Paimon está maravilhada! Que sorte inacreditável, Viajante! 🎉`
      };
      embedColor = '#FFD700';
    } else if (roll < 20) {
      // 4-Star Drop (Roxo)
      stars = 4;
      const char = FOUR_STAR_POOL[Math.floor(Math.random() * FOUR_STAR_POOL.length)];
      result = {
        title: `💜💜💜💜 Item de 4 Estrelas! (${char.name})`,
        description: `Brilho Roxo! Obtiveste **${char.name}** [${char.element}]!\n*${char.title}*\n\nA Paimon acha uma excelente adição à tua equipa!`
      };
      embedColor = '#A335EE';
    } else {
      // 3-Star Drop (Azul)
      stars = 3;
      const weapon = THREE_STAR_WEAPONS[Math.floor(Math.random() * THREE_STAR_WEAPONS.length)];
      result = {
        title: `💙 Item de 3 Estrelas (Arma)`,
        description: `Saiu-te uma **${weapon}** (3⭐).\n\n*A Paimon suspira:* "Mais uma arma de 3 estrelas para a coleção... Tenta de novo na próxima!"`
      };
      embedColor = '#0070DD';
    }

    const embed = new EmbedBuilder()
      .setTitle(result.title)
      .setDescription(result.description)
      .setColor(embedColor)
      .setFooter({ text: `Oração feita por ${interaction.user.username} • PaimonBot Gacha` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
