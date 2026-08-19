const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const database = require('../../database');
const config = require('../../config.json');

/**
 * Função de verificação de RBAC (Dono do servidor, permissão de Administrador ou Cargo Admin configurado)
 */
function isUserAdmin(interaction) {
  // 1. Dono do servidor sempre tem acesso total
  if (interaction.user.id === interaction.guild.ownerId) return true;

  // 2. Membro com permissão nativa de Administrador do Discord
  if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return true;

  // 3. Membro com cargo configurado de Admin
  const settings = database.getGuildSettings(interaction.guild.id);
  if (settings && settings.admin_role_id) {
    if (interaction.member.roles.cache.has(settings.admin_role_id)) return true;
  }

  return false;
}

module.exports = {
  data: {
    name: 'paimon-config',
    description: 'Painel de configuração e feature flags da Paimon (Apenas Administradores).'
  },
  async execute(interaction) {
    // Verificação de RBAC
    if (!isUserAdmin(interaction)) {
      return interaction.reply({
        content: '🚫 **Acesso Negado!** Apenas Administradores do servidor ou membros autorizados podem alterar as configurações da Paimon.',
        ephemeral: true
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (subcommand === 'spicy-mode') {
      const enabled = interaction.options.getBoolean('ativar');
      database.setSpicyMode(guildId, enabled);

      const embed = new EmbedBuilder()
        .setTitle('🌶️ Modo Atrevido / Sem Censura da Paimon')
        .setDescription(
          enabled
            ? '🔥 **MODO ATREVIDO ATIVADO!**\n\nA Paimon agora está liberada para ser debochada, fazer zombarias engraçadas e soltar "xingamentos" fofos e cômicos de anime (ex: *"cabeça de slime!", "troglodita de hilichurl!", "seu tapado!"*) se for provocada!'
            : '😇 **MODO ATREVIDO DESATIVADO!**\n\nA Paimon voltou ao seu modo comportado, dócil e educado padrão de Teyvat.'
        )
        .setColor(enabled ? '#E74C3C' : '#2ECC71')
        .setFooter({ text: `Alterado por ${interaction.user.username} • PaimonBot RBAC` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'set-admin-role') {
      const role = interaction.options.getRole('cargo');
      database.setAdminRole(guildId, role.id);

      const embed = new EmbedBuilder()
        .setTitle('🛡️ Cargo de Administrador Configurado')
        .setDescription(`Membros com o cargo ${role} agora têm permissão de gerenciar as configurações da Paimon!`)
        .setColor(config.embedColor || '#F3C343')
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'status') {
      const settings = database.getGuildSettings(guildId);
      const isSpicy = settings.spicy_mode === 1;
      const adminRole = settings.admin_role_id ? `<@&${settings.admin_role_id}>` : '`Nenhum (usa Permissão Admin)`';

      const embed = new EmbedBuilder()
        .setTitle(`⚙️ Painel de Configurações — ${interaction.guild.name}`)
        .addFields(
          { name: '🌶️ Modo Atrevido (Xingamentos Fofos)', value: isSpicy ? '🟢 **Ativado**' : '🔴 **Desativado**', inline: true },
          { name: '🛡️ Cargo de Admin Extra', value: adminRole, inline: true },
          { name: '🧠 Motor de IA', value: '`Groq (LLaMA / Qwen 27B)`', inline: true }
        )
        .setColor(config.embedColor || '#F3C343')
        .setFooter({ text: 'Use /paimon-config para alterar' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  }
};
