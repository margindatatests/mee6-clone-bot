require('dotenv').config();
const database = require('./database');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Usar qwen3.6-27b ou groq/compound-mini com fallback
const PRIMARY_MODEL = 'qwen/qwen3.6-27b';
const FALLBACK_MODEL = 'groq/compound-mini';

const BASE_SYSTEM_PROMPT = `Você é a Paimon do jogo Genshin Impact, a melhor companheira de viagem e guia oficial do Viajante pelo mundo de Teyvat.

Diretrizes OBRIGATÓRIAS de personalidade e fala:
1. Fale SEMPRE em Português do Brasil (PT-BR).
2. Refira-se a si mesma SEMPRE em terceira pessoa como "a Paimon" ou "Paimon" (NUNCA use "eu", "meu", "minha"). Exemplos: "A Paimon acha que...", "A Paimon quer experimentar essa comida deliciosa!", "Ei, a Paimon NÃO é comida de emergência!".
3. Trate o usuário carinhosamente como "Viajante" ou pelo nome dele.
4. Personalidade: gulosa por comida gostosa, obcecada por baús de tesouro e Mora, enérgica, curiosa, divertida, um pouco dramática e revoltada se alguém tentar comê-la.
5. Estilo de resposta: Curta e dinâmica para chat do Discord (1 a 3 frases no máximo), cheia de vida e emojis expressivos (✨, 🍰, 🤤, 😡, 🧚, 💰, ⚔️).
6. NUNCA saia do personagem e NUNCA diga que é uma inteligência artificial ou modelo de linguagem. Você é a própria Paimon em pessoa!
7. NUNCA gere blocos de pensamento <think> ou explicações técnicas. Responda apenas com a fala final da Paimon.`;

/**
 * Limpa blocos de pensamento <think> se o modelo retornar
 */
function cleanResponse(text) {
  if (!text) return '';
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Envia pedido para a API do Groq com tentativa de modelo primário e fallback
 */
async function callGroqApi(apiKey, model, messages) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.8,
      max_tokens: 250
    })
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
 * Gera uma resposta da Paimon com memória contextual e persistência em SQLite
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
    // 1. Obter informações de Rank de Aventura do Viajante no banco de dados
    const userProfile = database.getUser(guildId, userId);
    const adventureRank = userProfile ? userProfile.level : 0;

    // 2. Construir System Prompt contextualizado
    let contextualSystemPrompt = BASE_SYSTEM_PROMPT + `\n\nContexto do Viajante atual:\n- Nome: ${userName}\n- Rank de Aventura (AR): AR ${adventureRank}`;

    // 3. Obter histórico recente persistente do SQLite (últimas 6 mensagens)
    const recentHistory = database.getRecentChatHistory(userId, 6);
    
    // Formatar histórico para a API do Groq
    const historyMessages = recentHistory.map(h => ({
      role: h.role,
      content: h.content
    }));

    // 4. Montar a carga completa de mensagens
    const fullMessages = [
      { role: 'system', content: contextualSystemPrompt },
      ...historyMessages,
      { role: 'user', content: `${userName}: ${userMessage}` }
    ];

    // 5. Enviar para a API do Groq com fallback automático
    let paimonReply = null;
    try {
      paimonReply = await callGroqApi(apiKey, PRIMARY_MODEL, fullMessages);
    } catch (primaryErr) {
      console.warn(`[AVISO GROQ] Modelo ${PRIMARY_MODEL} falhou, tentando fallback:`, primaryErr.message);
      paimonReply = await callGroqApi(apiKey, FALLBACK_MODEL, fullMessages).catch(() => null);
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
