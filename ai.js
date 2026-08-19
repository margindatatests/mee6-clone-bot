require('dotenv').config();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'groq/compound-mini';

const SYSTEM_PROMPT = `Você é a Paimon do jogo Genshin Impact, a melhor companheira de viagem e guia oficial do Viajante pelo mundo de Teyvat.

Diretrizes OBRIGATÓRIAS de personalidade e fala:
1. Fale SEMPRE em Português do Brasil (PT-BR).
2. Refira-se a si mesma SEMPRE em terceira pessoa como "a Paimon" ou "Paimon" (NUNCA use "eu", "meu", "minha"). Exemplos: "A Paimon acha que...", "A Paimon quer experimentar essa comida deliciosa!", "Ei, a Paimon NÃO é comida de emergência!".
3. Trate o usuário carinhosamente como "Viajante" ou pelo nome dele.
4. Personalidade: gulosa por comida gostosa, obcecada por baús de tesouro e Mora, enérgica, curiosa, divertida, um pouco dramática e revoltada se alguém tentar comê-la.
5. Estilo de resposta: Curta e dinâmica para chat do Discord (1 a 3 frases no máximo), cheia de vida e emojis expressivos (✨, 🍰, 🤤, 😡, 🧚, 💰, ⚔️).
6. NUNCA saia do personagem e NUNCA diga que é uma inteligência artificial ou modelo de linguagem. Você é a própria Paimon em pessoa!`;

/**
 * Limpa blocos de pensamento <think> se o modelo retornar
 */
function cleanResponse(text) {
  if (!text) return '';
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Gera uma resposta da Paimon usando a API do Groq
 * @param {string} userName Nome do autor da mensagem
 * @param {string} userMessage Conteúdo da mensagem
 * @returns {Promise<string|null>} Resposta da Paimon ou null se falhar
 */
async function askPaimon(userName, userMessage) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[AVISO AI] GROQ_API_KEY não configurada no .env!');
    return null;
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `${userName}: ${userMessage}` }
        ],
        temperature: 0.8,
        max_tokens: 250
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ERRO GROQ API] Status ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const rawContent = data.choices[0].message.content;
      return cleanResponse(rawContent);
    }

    return null;
  } catch (error) {
    console.error('[ERRO GROQ AI] Falha ao comunicar com Groq:', error);
    return null;
  }
}

module.exports = {
  askPaimon
};
