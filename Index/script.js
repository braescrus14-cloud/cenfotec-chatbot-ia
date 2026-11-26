/*
 * CENFOTEC · ORIENTACIÓN AL CLIENTE
 * index.html: estructura | styles.css: diseño | script.js: interacción.
 * El historial se guarda en el navegador y el servidor consulta a Gemini.
 */
'use strict';

// 1. Configuración y estado de la aplicación.
const $ = (id) => document.getElementById(id);
// Conservamos la clave anterior para poder recuperar el historial del prototipo.
const STORAGE_KEY = 'nexo.frontend.chats.v1';
const THEME_KEY = 'nexo.frontend.theme';
const WELCOME_MESSAGE = '¡Hola! 👋 Tu futuro empieza hoy.\n\nSoy tu asistente de orientación sobre Cenfotec. Estoy aquí para ayudarte a descubrir opciones de formación técnica y dar tu próximo paso.\n\n¿Quieres conocer los programas, encontrar tu sede o saber cómo inscribirte? Elige una opción del menú o cuéntame qué te gustaría estudiar. ¡Empecemos!';
let chats = [];
let activeId = null;
// Cada conversación puede cancelar su solicitud al borrarse.
const pendingReplies = new Map();
const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

function notify(message) {
  $('notice').textContent = message;
  $('notice').hidden = false;
}

function greeting() {
  return { role: 'assistant', text: WELCOME_MESSAGE };
}

// 2. Persistencia local del historial.
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (Array.isArray(saved)) {
    chats = saved.filter(chat =>
      chat && typeof chat.id === 'string' && typeof chat.title === 'string' &&
      Array.isArray(chat.messages) && chat.messages.every(message =>
        message && ['user', 'assistant'].includes(message.role) &&
        typeof message.text === 'string'
      )
    );
  }
  if (localStorage.getItem(THEME_KEY) === 'dark') {
    document.body.classList.add('dark');
  }
} catch {
  notify('El historial no está disponible. Puedes usar el chat durante esta sesión.');
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    return true;
  } catch {
    notify('No se pudo actualizar el historial guardado. Los cambios solo están disponibles durante esta sesión.');
    return false;
  }
}

function currentChat() {
  return chats.find(chat => chat.id === activeId);
}

function setSidebar(open) {
  document.body.classList.toggle('sidebar-open', open);
  $('menu').setAttribute('aria-expanded', String(open));
}

// 3. Historial: cada fila contiene un botón para abrir y otro para eliminar.
function createTrashIcon() {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  const use = document.createElementNS(namespace, 'use');
  svg.setAttribute('aria-hidden', 'true');
  use.setAttribute('href', '#i-trash');
  svg.append(use);
  return svg;
}

function renderHistory() {
  const query = $('search').value.trim().toLocaleLowerCase();
  const visible = chats.filter(chat => chat.title.toLocaleLowerCase().includes(query));
  $('history').replaceChildren();

  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-history';
    empty.textContent = query
      ? 'No se encontraron conversaciones.'
      : 'Tu historial aparecerá aquí cuando envíes tu primer mensaje.';
    $('history').append(empty);
  }

  visible.forEach(chat => {
    const row = document.createElement('div');
    row.className = 'history-row' + (chat.id === activeId ? ' active' : '');

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'history-open';
    openButton.title = chat.title;
    if (chat.id === activeId) openButton.setAttribute('aria-current', 'true');

    const icon = document.createElement('span');
    icon.textContent = '◌';
    icon.setAttribute('aria-hidden', 'true');
    const title = document.createElement('span');
    title.textContent = chat.title;
    openButton.append(icon, title);
    openButton.addEventListener('click', () => {
      activeId = chat.id;
      $('prompt').value = '';
      $('prompt').style.height = '';
      render();
      setSidebar(false);
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-chat';
    deleteButton.title = 'Eliminar conversación';
    deleteButton.setAttribute('aria-label', 'Eliminar conversación: ' + chat.title);
    deleteButton.append(createTrashIcon());
    deleteButton.addEventListener('click', () => deleteChat(chat.id));

    row.append(openButton, deleteButton);
    $('history').append(row);
  });
}

function deleteChat(id) {
  const chat = chats.find(item => item.id === id);
  if (!chat) return;
  if (!window.confirm('¿Eliminar la conversación «' + chat.title + '»? Esta acción no se puede deshacer.')) return;

  // Una respuesta pendiente nunca debe volver a crear una conversación eliminada.
  if (pendingReplies.has(id)) {
    pendingReplies.get(id).abort();
    pendingReplies.delete(id);
  }
  chats = chats.filter(item => item.id !== id);
  if (activeId === id) {
    activeId = null;
    $('prompt').value = '';
    $('prompt').style.height = '';
  }
  if (save()) notify('Conversación eliminada.');
  render();
  $('newChat').focus();
}

// 4. Presentación de mensajes. El agente saluda antes de que escriba el cliente.
function render() {
  const chat = currentChat();
  const hasUserMessages = Boolean(chat?.messages.some(message => message.role === 'user'));
  const messages = chat?.messages.length ? chat.messages : [greeting()];
  $('messages').replaceChildren();

  messages.forEach(message => {
    const row = document.createElement('article');
    row.className = 'message ' + message.role;
    if (!hasUserMessages && message.role === 'assistant') row.classList.add('greeting-message');

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = message.role === 'user' ? 'TÚ' : '✧';
    avatar.setAttribute('aria-hidden', 'true');

    const body = document.createElement('div');
    body.className = 'body';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = message.role === 'user' ? 'Tú' : 'Cenfotec IA';
    const text = document.createElement('p');
    text.className = 'text';
    // textContent muestra el mensaje sin ejecutar HTML introducido por el cliente.
    text.textContent = message.text;
    body.append(name, text);
    row.append(avatar, body);
    $('messages').append(row);
  });

  if (pendingReplies.has(activeId)) {
    const typing = document.createElement('div');
    typing.className = 'typing';
    typing.textContent = 'Preparando respuesta…';
    $('messages').append(typing);
  }

  $('export').disabled = !hasUserMessages;
  updateSend();
  renderHistory();
  requestAnimationFrame(() => {
    // Al iniciar, mostramos el saludo desde arriba; al conversar, el último mensaje.
    $('scrollArea').scrollTop = hasUserMessages ? $('scrollArea').scrollHeight : 0;
  });
}

function updateSend() {
  const waiting = pendingReplies.has(activeId);
  $('send').disabled = !$('prompt').value.trim() || waiting;
  document.querySelectorAll('[data-prompt]').forEach(button => {
    button.disabled = waiting;
  });
}

// 5. Envío de mensajes y creación de conversaciones.
async function sendMessage() {
  const text = $('prompt').value.trim();
  if (!text || text.length > 4000 || pendingReplies.has(activeId)) return;

  if (window.location.protocol === 'file:') {
    notify('Inicia el servidor con iniciar-chat.ps1 y abre http://127.0.0.1:3000 para usar el chat.');
    return;
  }

  let chat = currentChat();
  if (!chat) {
    // El saludo mostrado al inicio pasa a ser el primer mensaje del historial.
    chat = { id: makeId(), title: text.slice(0, 44), messages: [greeting()] };
    chats.unshift(chat);
    activeId = chat.id;
  }
  chat.messages.push({ role: 'user', text });
  $('prompt').value = '';
  $('prompt').style.height = '';
  $('notice').hidden = true;

  const controller = new AbortController();
  pendingReplies.set(chat.id, controller);
  save();
  render();

  try {
    const messages = chat.messages
      .filter(message => message.role === 'user' || message.generatedByAI === true)
      .slice(-12)
      .map(({ role, text }) => ({ role, text: text.slice(0, 4000) }));
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (activeId === chat.id) {
        notify('Esta página no está conectada al servidor del chat. Ejecuta iniciar-chat.ps1 y abre http://127.0.0.1:3000.');
      }
      return;
    }
    const result = await response.json();
    if (controller.signal.aborted) return;
    if (!response.ok || typeof result.reply !== 'string') {
      if (activeId === chat.id) notify(result.error || 'No se pudo obtener una respuesta.');
      return;
    }
    chat.messages.push({ role: 'assistant', text: result.reply, generatedByAI: true });
    save();
  } catch {
    if (!controller.signal.aborted && activeId === chat.id) {
      notify('Se perdió la conexión con el servidor del chat. Verifica que siga ejecutándose y vuelve a enviar tu consulta.');
    }
  } finally {
    pendingReplies.delete(chat.id);
    if (activeId === chat.id) render();
  }
}

function newConversation() {
  activeId = null;
  $('prompt').value = '';
  $('prompt').style.height = '';
  $('search').value = '';
  $('notice').hidden = true;
  render();
  setSidebar(false);
  $('prompt').focus();
}

// 7. Eventos de formulario, búsqueda, tarjetas y navegación.
$('chatForm').addEventListener('submit', event => {
  event.preventDefault();
  sendMessage();
});

$('prompt').addEventListener('input', () => {
  updateSend();
  $('prompt').style.height = 'auto';
  $('prompt').style.height = Math.min($('prompt').scrollHeight, 140) + 'px';
});

$('prompt').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    sendMessage();
  }
});

$('newChat').addEventListener('click', newConversation);
$('search').addEventListener('input', renderHistory);
document.querySelectorAll('[data-prompt]').forEach(button => {
  button.addEventListener('click', () => {
    $('prompt').value = button.dataset.prompt;
    sendMessage();
    setSidebar(false);
    $('prompt').focus();
  });
});

$('menu').addEventListener('click', () => {
  setSidebar(!document.body.classList.contains('sidebar-open'));
});
$('overlay').addEventListener('click', () => setSidebar(false));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') setSidebar(false);
});

// 8. Tema y exportación de la conversación activa.
function updateThemeLabel() {
  const dark = document.body.classList.contains('dark');
  $('theme').setAttribute('aria-pressed', String(dark));
  $('theme').querySelector('span').textContent = dark ? 'Modo claro' : 'Modo oscuro';
}

$('theme').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  updateThemeLabel();
  try {
    localStorage.setItem(THEME_KEY, document.body.classList.contains('dark') ? 'dark' : 'light');
  } catch {
    // El tema permanece activo aunque el navegador bloquee el almacenamiento.
  }
});

$('export').addEventListener('click', () => {
  const chat = currentChat();
  if (!chat?.messages.length) return;
  const content = 'CENFOTEC IA · CONVERSACIÓN\n\n' +
    chat.messages.map(message =>
      (message.role === 'user' ? 'Tú' : 'Cenfotec IA') + ':\n' + message.text
    ).join('\n\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'conversacion-cenfotec.txt';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// Siempre comenzamos con el saludo. Los chats guardados siguen accesibles en el menú.
updateThemeLabel();
render();
