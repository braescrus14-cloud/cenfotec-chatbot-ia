import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const apiKey = process.env.GEMINI_API_KEY?.trim();
const model = 'gemini-3.1-flash-lite';
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';
const systemPrompt = await readFile(new URL('./contexto-cenfotec.txt', import.meta.url), 'utf8');

const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/styles.css', ['styles.css', 'text/css']],
  ['/script.js', ['script.js', 'text/javascript']],
]);

const rateLimits = new Map();
let requestsInProgress = 0;
const clearRateLimits = setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimits) {
    if (entry.until <= now) rateLimits.delete(ip);
  }
}, 60_000);
clearRateLimits.unref();

function sendJson(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(data));
}

async function readMessages(request) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    length += chunk.length;
    if (length > 300_000) return null;
    chunks.push(chunk);
  }

  const { messages } = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!Array.isArray(messages) || messages.length > 12 || messages.at(-1)?.role !== 'user') return null;
  if (!messages.every(message =>
    message && ['user', 'assistant'].includes(message.role) &&
    typeof message.text === 'string' && message.text.length <= 4000 && message.text.trim()
  )) return null;
  const contents = [];
  for (const { role, text } of messages) {
    const geminiRole = role === 'assistant' ? 'model' : 'user';
    const last = contents.at(-1);
    if (geminiRole === 'model' && !last) continue;
    if (last?.role === geminiRole) {
      last.parts.push({ text });
    } else {
      contents.push({ role: geminiRole, parts: [{ text }] });
    }
  }
  return contents;
}

async function answerChat(request, response) {
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json') ||
      request.headers['sec-fetch-site'] === 'cross-site') {
    return sendJson(response, 400, { error: 'Solicitud no válida.' });
  }
  if (!apiKey) {
    return sendJson(response, 503, { error: 'Falta configurar GEMINI_API_KEY en el servidor con una clave de Google AI Studio.' });
  }

  const ip = request.socket.remoteAddress;
  const now = Date.now();
  let entry = rateLimits.get(ip);
  if (!entry || entry.until <= now) {
    entry = { count: 0, until: now + 60_000 };
    rateLimits.set(ip, entry);
  }
  if (entry.count >= 20 || requestsInProgress >= 8) {
    return sendJson(response, 429, { error: 'Hay muchas consultas en este momento. Intenta de nuevo en un momento.' });
  }
  entry.count += 1;
  requestsInProgress += 1;
  const controller = new AbortController();
  response.on('close', () => controller.abort());

  try {
    const contents = await readMessages(request).catch(() => null);
    if (!contents) {
      response.setHeader('Connection', 'close');
      return sendJson(response, 400, { error: 'El mensaje o el historial supera los límites del chat o tiene un formato inválido.' });
    }

    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 1024, thinkingConfig: { thinkingLevel: 'minimal' } },
      }),
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(25_000)]),
    });
    if (!upstream.ok) {
      console.error('Gemini devolvió HTTP', upstream.status);
      const failure = await upstream.json().catch(() => null);
      const keyRejected = failure?.error?.details?.some(detail =>
        ['API_KEY_INVALID', 'API_KEY_EXPIRED', 'API_KEY_SERVICE_BLOCKED'].includes(detail.reason)
      );
      const errors = {
        401: 'Google rechazó la clave. Reinicia el servidor con una clave válida de Google AI Studio.',
        403: 'Google denegó el acceso. Revisa que la clave y el proyecto tengan acceso a la API de Gemini.',
        404: 'Gemini 3.1 Flash-Lite no está disponible para este proyecto.',
        429: 'Se alcanzó la cuota de Gemini. Revisa el límite de tu proyecto en Google AI Studio.',
      };
      return sendJson(response, 502, {
        error: (keyRejected ? errors[401] : errors[upstream.status]) ||
          'El servicio de IA no está disponible en este momento. Intenta de nuevo.',
      });
    }
    const completion = await upstream.json();
    const candidate = completion.candidates?.[0];
    const reply = candidate?.content?.parts
      ?.filter(part => !part.thought && typeof part.text === 'string')
      .map(part => part.text)
      .join('').trim();
    if (candidate?.finishReason !== 'STOP' || !reply || reply.length > 4000) {
      return sendJson(response, 502, { error: 'No pude completar la respuesta. Intenta reformular tu consulta.' });
    }
    sendJson(response, 200, { reply });
  } catch (error) {
    if (controller.signal.aborted) return;
    console.error('Error al consultar Gemini:', error.name);
    sendJson(response, 502, { error: 'No pude conectar con el servicio de IA. Intenta de nuevo.' });
  } finally {
    requestsInProgress -= 1;
  }
}

const server = createServer({ requestTimeout: 15_000, headersTimeout: 10_000 }, async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  const path = request.url.split('?')[0];
  if (path === '/api/chat' && request.method === 'POST') return answerChat(request, response);

  const asset = assets.get(path);
  if (asset && ['GET', 'HEAD'].includes(request.method)) {
    try {
      const [name, mime] = asset;
      const content = await readFile(new URL(name, import.meta.url));
      response.writeHead(200, {
        'Content-Type': `${mime}; charset=utf-8`,
        'Content-Length': content.length,
        'Cache-Control': 'no-cache',
      });
      return response.end(request.method === 'HEAD' ? undefined : content);
    } catch {
      return sendJson(response, 500, { error: 'No se pudo cargar la página.' });
    }
  }
  sendJson(response, 404, { error: 'Ruta no encontrada.' });
});

server.listen(port, host, () => {
  console.log(`Cenfotec IA disponible en http://${host}:${server.address().port}`);
  if (!apiKey) console.warn('Falta GEMINI_API_KEY. Configura una clave de Google AI Studio para activar el asistente.');
});
