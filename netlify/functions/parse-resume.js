const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const CURRICULUM_PROMPT = `Você é um analisador de currículos brasileiro especializado em Engenharia Civil.
Extraia as informações do texto de currículo abaixo e retorne SOMENTE um objeto JSON válido, sem markdown, sem explicações, apenas o JSON.

Campos obrigatórios (use string vazia se não encontrar):
{
  "nome": "Nome completo",
  "email": "e-mail",
  "telefone": "telefone com DDD",
  "cidade": "cidade",
  "estado": "sigla do estado (2 letras)",
  "linkedin": "URL ou handle do LinkedIn",
  "crea": "número do CREA se houver",
  "resumo": "resumo profissional em 2-3 frases (gere um se não existir baseado nas experiências)",
  "habilidades": ["habilidade1", "habilidade2"],
  "experiencias": [
    {
      "empresa": "nome da empresa",
      "cargo": "cargo",
      "inicio": "MM/AAAA",
      "fim": "MM/AAAA ou vazio se atual",
      "atual": false,
      "descricao": "descrição resumida"
    }
  ],
  "formacoes": [
    {
      "instituicao": "nome da instituição",
      "curso": "nome do curso",
      "nivel": "Graduação",
      "inicio": "MM/AAAA",
      "fim": "MM/AAAA",
      "concluido": true
    }
  ]
}

Para o campo "nivel" use apenas: Técnico, Graduação, Especialização, MBA, Mestrado ou Doutorado.
Para datas use o formato MM/AAAA. Se só tiver o ano, use 01/AAAA.

TEXTO DO CURRÍCULO:`;

const CERTIFICATE_PROMPT = `Você é um analisador de certificados e diplomas.
Extraia informações do texto abaixo e retorne SOMENTE um objeto JSON válido, sem markdown:
{
  "titulo": "título do curso ou certificado",
  "instituicao": "instituição emissora",
  "habilidades": ["habilidade1", "habilidade2"],
  "cargaHoraria": "carga horária se houver",
  "data": "MM/AAAA da conclusão"
}

TEXTO DO CERTIFICADO:`;

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error: 'ANTHROPIC_API_KEY não configurada. Configure a variável de ambiente no Netlify.',
      }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const { text, type = 'curriculum' } = body;
  if (!text || typeof text !== 'string') {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Campo "text" obrigatório' }) };
  }

  const truncated = text.slice(0, 12000);
  const prompt = type === 'certificate' ? CERTIFICATE_PROMPT : CURRICULUM_PROMPT;

  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: `${prompt}\n\n${truncated}` }],
      }),
    });
  } catch (err) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: `Erro ao chamar API: ${err.message}` }) };
  }

  if (!res.ok) {
    const errText = await res.text();
    return { statusCode: 502, headers, body: JSON.stringify({ error: `API retornou ${res.status}: ${errText}` }) };
  }

  const data = await res.json();
  const content = data.content?.[0]?.text || '';

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Não foi possível extrair JSON da resposta', raw: content }) };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return { statusCode: 200, headers, body: JSON.stringify(parsed) };
  } catch {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'JSON inválido na resposta', raw: jsonMatch[0] }) };
  }
};
