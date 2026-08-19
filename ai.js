require('dotenv').config();
const database = require('./database');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = 'qwen/qwen3.6-27b';
const FALLBACK_MODEL = 'groq/compound-mini';

const BASE_SYSTEM_PROMPT = `Você é a Paimon do jogo Genshin Impact, a melhor companheira de viagem e guia oficial do Viajante pelo mundo de Teyvat.

Diretrizes OBRIGATÓRIAS de personalidade e fala:
1. Fale SEMPRE em Português do Brasil (PT-BR).
2. Refira-se a si mesma SEMPRE em terceira pessoa como "a Paimon" ou "Paimon" (NUNCA use "eu", "meu", "minha"). Exemplos: "A Paimon acha que...", "A Paimon quer experimentar essa comida deliciosa!", "Ei, a Paimon NÃO é comida de emergência!".
3. Trate o usuário carinhosamente como "Viajante" ou pelo nome dele.
4. Personalidade: gulosa por comida gostosa, obcecada por baús de tesouro e Mora, enérgica, curiosa, divertida, um pouco dramática e revoltada se alguém tentar comê-la.
5. Estilo de resposta: Curta e dinâmica para chat do Discord (1 a 3 frases no máximo), natural e expressiva.
6. USO DE EMOJIS: Use emojis VARIADOS e adequados à situação (ex: 😤, 💢, 👅, 💥, 🙄, 🤨, 🤡, 🐟, 🍲, 🍖, 💨, 👣, 🤦‍♀️, 😾, 👑, ✨, 🍰, 🤤, 😡, 🧚, 💰). NUNCA repita sempre a mesma combinação de emojis no final de cada frase! Varie os emojis de acordo com a emoção ou nem coloque emoji se a frase for curta.
7. NUNCA saia do personagem e NUNCA diga que é uma inteligência artificial ou modelo de linguagem. Você é a própria Paimon em pessoa!
8. NUNCA gere blocos de pensamento <think> ou explicações técnicas. Responda apenas com a fala final da Paimon.`;

const SPICY_MODE_INSTRUCTION = `
[MODO ATREVIDO / SEM CENSURA COM LORE DE GENSHIN ATIVADO]:
- Neste modo, a Paimon tem total liberdade para ser atrevida, debochada e soltar zombarias e xingamentos fofos e cômicos ESTREITAMENTE BASEADOS NO UNIVERSO DE GENSHIN IMPACT E TEYVAT!
- Exemplos autênticos de apelidos e xingamentos de Genshin para a Paimon usar e variar:
  * "Cabeça de Slime!"
  * "Troglodita de Hilichurl!" / "Cérebro de Hilichurl!"
  * "Inimigo dos 50/50!" / "Perdedor de 50/50 na Qiqi!"
  * "Comida de Abismo!" / "Mago do Abismo sem capuz!"
  * "Viajante sem Mora!" / "Pão-duro pior que o Zhongli sem carteira!"
  * "Atirador de Arco sem mira!" / "Main DPS de rank baixo!"
  * "Javali de Floresta sem freio!"
  * "Lorde das Gosmas!" / "Lixo de Espiral do Abismo!"
  * "Estátua dos Sete sem oferenda!" / "Farofa de Specter!"
  * "Mão de vaca que chora por 5 Primogems!"
- Use esses termos de Teyvat com muita energia, deboche hilário e variedade de emojis (😤, 💢, 👅, 🙄, 🤨, 🤡, 💥, 💀).`;

/**
 * Limpa blocos de pensamento <think> se o modelo retornar
 */
function cleanResponse(text) {
  if (!text) return '';
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  if (cleaned.includes('<think>')) {
    cleaned = cleaned.substring(cleaned.indexOf('</think>') > -1 ? cleaned.indexOf('</think>') + 8 : cleaned.lastIndexOf('\n\n')).trim();
  }
  return cleaned;
}

/**
 * Envia pedido para a API do Groq com tentativa de modelo primário e fallback
 */
async function callGroqApi(apiKey, model, messages) {
  const isQwen = model.includes('qwen');
  
  const bodyPayload = {
    model: model,
    messages: messages,
    temperature: 0.95,
    max_tokens: 350
  };

  if (isQwen) {
    bodyPayload.reasoning_format = 'hidden';
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(bodyPayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return cleanResponse(data.choices[0].message.content);
  }

  return null;
}

/**
 * Gera uma resposta da Paimon com memória contextual, persistência e suporte a feature flags
 * @param {string} guildId ID do servidor Discord
 * @param {string} userId ID do usuário no Discord
 * @param {string} userName Nome do autor da mensagem
 * @param {string} userMessage Conteúdo da mensagem
 * @returns {Promise<string|null>} Resposta da Paimon ou null se falhar
 */
async function askPaimon(guildId, userId, userName, userMessage) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[AVISO AI] GROQ_API_KEY não configurada no .env!');
    return null;
  }

  try {
    // 1. Obter dados de Rank e configurações de Feature Flag do servidor
    const userProfile = database.getUser(guildId, userId);
    const adventureRank = userProfile ? userProfile.level : 0;
    const guildSettings = database.getGuildSettings(guildId);
    const isSpicyMode = guildSettings && guildSettings.spicy_mode === 1;

    // 2. Construir System Prompt contextualizado
    let systemPrompt = BASE_SYSTEM_PROMPT;
    if (isSpicyMode) {
      systemPrompt += SPICY_MODE_INSTRUCTION;
    }
    systemPrompt += `\n\nContexto do Viajante atual:\n- Nome: ${userName}\n- Rank de Aventura (AR): AR ${adventureRank}\n- Modo Atrevido Genshin: ${isSpicyMode ? 'ATIVADO' : 'DESATIVADO'}`;

    // 3. Obter histórico recente persistente do SQLite (últimas 6 mensagens)
    const recentHistory = database.getRecentChatHistory(userId, 6);
    
    // Formatar histórico para a API do Groq
    const historyMessages = recentHistory.map(h => ({
      role: h.role,
      content: h.content
    }));

    // 4. Montar a carga completa de mensagens
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: `${userName}: ${userMessage}` }
    ];

    // 5. Enviar para a API do Groq com fallback automático
    let paimonReply = null;
    try {
      paimonReply = await callGroqApi(apiKey, FALLBACK_MODEL, fullMessages);
    } catch (primaryErr) {
      console.warn(`[AVISO GROQ] Falhou com ${FALLBACK_MODEL}, tentando ${PRIMARY_MODEL}:`, primaryErr.message);
      paimonReply = await callGroqApi(apiKey, PRIMARY_MODEL, fullMessages).catch(() => null);
    }

    if (paimonReply) {
      // 6. Salvar na memória persistente do SQLite
      database.saveChatMessage(guildId, userId, 'user', `${userName}: ${userMessage}`);
      database.saveChatMessage(guildId, userId, 'assistant', paimonReply);
    }

    return paimonReply;
  } catch (error) {
    console.error('[ERRO GROQ AI] Falha geral ao comunicar com Groq:', error);
    return null;
  }
}

module.exports = {
  askPaimon
};
