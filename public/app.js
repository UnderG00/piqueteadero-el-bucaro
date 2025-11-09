// app.js: Chatbot client logic
const messagesEl = document.getElementById('messages');
const input = document.getElementById('inputText');
const sendBtn = document.getElementById('sendBtn');
const todayListEl = document.getElementById('todayList');
// 🌟 Lista de Platos Populares (con imágenes, nombre y precio)
const popularDishes = [
  { img: "images/Plato_2.jpg", name: "Chivo Asado con Pepitoria", price: "40.000 COP" },
  { img: "images/Plato_4.jpg", name: "Plato de Sopa de Mute (Domingos)", price: "15.000 COP" },
  { img: "images/Plato_6.jpg", name: "Pepitoria", price: "33.000 COP" },
  { img: "images/Plato_8.jpg", name: "Sancocho de cola (sábados)", price: "20.000 COP" },
  { img: "images/Plato_5.jpg", name: "Almuerzo", price: "12.000 COP" }
];

function renderPopular() {
  todayList.innerHTML = popularDishes.map(dish => `
    <div class="dish-card">
      <img src="${dish.img}" alt="${dish.name}" class="today-img" style="cursor:pointer;">
      <p><strong>${dish.name}</strong><br>$${dish.price}</p>
    </div>
  `).join("");
}

renderPopular();
// Borrar cualquier visor viejo que haya quedado en el DOM
document.querySelectorAll(".image-viewer-overlay").forEach(el => el.remove());

const rInfoEl = document.getElementById('r-info');

let cachedMenu = null;
let botState = null;
let pendingMenuConfirm = false;           // esperando respuesta Si/No para "¿Quieres ver la carta?"
let pendingPostMenuOptions = false;       // esperando respuesta para las 2 opciones tras mostrar carta

function appendBot(text){

  const d = document.createElement('div');
  d.className = 'botText';
  const span = document.createElement('span');
  span.textContent = text;
  d.appendChild(span);
  messagesEl.appendChild(d);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addBotMessage(text){ appendBot(text); }

function addBotImage(src, caption){
  const d = document.createElement('div'); d.className='botText';
  const c = document.createElement('div'); c.style.display='flex'; c.style.flexDirection='column';
  const img = document.createElement('img'); img.src = src; img.style.maxWidth='240px'; img.style.borderRadius='8px'; img.style.marginTop='8px';
  c.appendChild(img);
  if(caption){ const s=document.createElement('span'); s.textContent=caption; s.style.marginTop='6px'; c.appendChild(s); }
  d.appendChild(c);
  messagesEl.appendChild(d);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}


function appendUser(text){
  const d = document.createElement('div');
  d.className = 'userText';
  const span = document.createElement('span');
  span.textContent = text;
  d.appendChild(span);
  messagesEl.appendChild(d);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}


async function loadMenu(){
  try{
    const res = await fetch('/api/menu'); if(!res.ok) throw new Error('API');
    cachedMenu = await res.json();
// actualizar logo y nombre del restaurante si vienen en los datos
if (cachedMenu && cachedMenu.restaurant) {
  const r = cachedMenu.restaurant;
  
// cuando generes la tarjeta de un plato
if (d.image_url) card.innerHTML += `<div style="margin-top:8px"><img src="${d.image_url}" alt="${d.name}" style="max-width:100%;height:auto;border-radius:6px;"></div>`;

  // actualiza el texto con dirección, teléfono y horario (ya lo haces)
  rInfoEl.textContent = `${r.address} • ${r.hours}`;

  // actualizar logo dinámicamente si existe la propiedad 'logo'
  const logoEl = document.getElementById('brandLogo');
  if (logoEl && r.logo && r.logo.trim() !== '') {
    // Asegurar que la ruta sea absoluta
    const logoPath = r.logo.startsWith('/') ? r.logo : '/' + r.logo;
    if (logoEl.src !== logoPath) logoEl.src = logoPath;
  }

  // actualizar el nombre del restaurante si se cambia desde admin
  const brandNameEl = document.getElementById('brandName');
  if (brandNameEl && r.name && r.name.trim() !== '') {
    brandNameEl.textContent = r.name;
  }
}

    // header
    const r = cachedMenu.restaurant;
    rInfoEl.textContent = `${r.address} • ${r.hours}`;
    renderTodaySidebar();
  }catch(e){
    console.error(e); rInfoEl.textContent = 'Información no disponible';
  }
}

function renderTodaySidebar(){
  todayListEl.innerHTML = '';

  if (!cachedMenu) return;

  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const todayKey = days[new Date().getDay()];

  let meal;

  if (todayKey === 'saturday' || todayKey === 'sunday') {
    meal = (cachedMenu.menu_weekend || {})[todayKey];
  } else {
    meal = (cachedMenu.menu_weekday || {})[todayKey];
  }

  if (!meal || !meal.name) {
    todayListEl.innerHTML = `<div class="small">No hay menú configurado hoy.</div>`;
    return;
  }

  const card = document.createElement('div'); 
  card.className='card';
  card.innerHTML = `<strong>${meal.name} — ${meal.price || ''}</strong>`;
  todayListEl.appendChild(card);
}

function matchIntent(text){
  text = text.toLowerCase();
  if(text.includes('menú del día') || text.includes('plato del día') || text.includes('platos del día') || text.includes('hoy')) return 'today';
  if(text.includes('menú') || text.includes('carta') || text.includes('carta completa')) return 'menu';
  if(text.includes('horario') || text.includes('direccion') || text.includes('ubicación') || text.includes('dirección')) return 'info';
  if(text.includes('telefono') || text.includes('contacto') || text.includes('whatsapp')) return 'contact';
  if(text.includes('hola') || text.includes('buenas')) return 'greet';
  return 'hello!';
}

async function handleText(text){
  const tclean = (text||'').trim().toLowerCase();
  
  // Manejo de estados previos
  if(botState){
    const msg = tclean;
    
    // info-menu
    if(botState === 'info-menu'){
      if(msg === '1'){
        addBotMessage('📍 Dirección: Cl. 28 #4-06, COMUNA 4, Barrio: Jorge Isaacs, Cali, Valle del Cauca.');
        addBotImage('/images/Restaurante_fisico.jpg');
        
        // ✅ CAMBIO: Ahora pregunta si quiere volver y cambia el estado
        setTimeout(() => addBotMessage('¿Quieres volver al menú principal?🔙 (si / no)'), 600);
        botState = 'contact-return'; // Reutilizamos el mismo estado que usa contacto
        return;
      }
      if(msg === '2'){
        addBotMessage('⏰ Horario: Lunes a Domingo(y festivos) — 11:30 AM a 4:00 PM');
        
        // ✅ CAMBIO: Ahora pregunta si quiere volver y cambia el estado
        setTimeout(() => addBotMessage('¿Quieres volver al menú principal?🔙 (si / no)'), 600);
        botState = 'contact-return'; // Reutilizamos el mismo estado que usa contacto
        return;
      }
      if(msg === '3'){
        addBotMessage('OK! Aquí están los métodos de pago que hay en el restaurante 💵🤖:\n\n💸 Efectivo.\n📲 Nequi: 3167217944');
        
        setTimeout(() => addBotMessage('¿Quieres volver al menú principal?🔙 (si / no)'), 600);
        botState = 'contact-return';
        return;
      }
      if(msg === '4'){
        addBotMessage('✅ ok! Regresando al menú principal.🔙');
        botState = null;
        return;
      }
      addBotMessage('❗Por favor escribe 1, 2, 3 o 4.');
      return;
    }
    
    // contact-return (este maneja tanto contacto como info ahora)
    if(botState === 'contact-return'){
      if(['si','s','sí'].includes(msg)){
        addBotMessage('✅Ok! Regresando al menú principal 🔙\n(Ya puedes usar los 4 botones o escribir otra cosa).');
        botState = null;
        return;
      }
      if(['no','n'].includes(msg)){
        addBotMessage('Ok! Seguirás en esta sección.');
        botState = 'locked-section'; // Nuevo estado bloqueado
        return;
      }
      addBotMessage('Por favor responde si o no.');
      return;
    }
    
    // locked-section: cualquier input pide confirmación para salir
    if(botState === 'locked-section'){
      if(['si','s','sí'].includes(msg)){
        addBotMessage('✅Ok! Regresando al menú principal 🔙\n(Ya puedes usar los 4 botones o escribir otra cosa).');
        botState = null;
        return;
      }
      if(['no','n'].includes(msg)){
        addBotMessage('Ok! Seguirás en esta sección.');
        return; // Permanece en locked-section
      }
      // Para cualquier otro mensaje o acción
      addBotMessage('¿Ya quieres salir al menú principal? (si/no)');
      return;
    }
    
    if(botState === 'menu-dia'){
      if(msg === '1'){ await showTodayMenu(); return; }
      if(msg === '2'){ await showWeekendMenu(); return; }
      if(msg === '3'){
        addBotMessage('✅ Regresando al menú principal 🔙\n(Ya puedes usar los botones o escribir otra cosa).');
        botState = null;
        return;
      }
      addBotMessage('❗Escribe un número del 1 al 3.');
      return;
    }
  }
  
const t = (text || '').trim().toLowerCase();

  // 1) Si estamos esperando la confirmación "¿Quieres ver la carta?"
  if(pendingMenuConfirm){
    if(t === 'si' || t === 'sí' || t === 's'){
      pendingMenuConfirm = false;
      appendBot('Perfecto. Te muestro la carta completa:');
      await showFullMenuInChat();
      return;
    }
    if(t === 'no' || t === 'n'){
  pendingMenuConfirm = false;
  appendBot('OK! No te muestro la carta y te devuelvo al menú principal 🔙'); // ✅ Mensaje de chatbot
  setTimeout(() => {
    appendBot('Ya puedes usar los 4 botones o escribir lo que necesites. 😊');
  }, 400);
  return;
}
    // Si la respuesta no es clara
    appendBot('Por favor responde "Si" o "No". ¿Quieres ver la carta completa del restaurante Búcaro?');
    return;
  }

  // 2) Si estamos esperando la respuesta de las opciones después de mostrar la carta
  if(pendingPostMenuOptions){
    // aceptar 1, 2 o palabras clave
    if(t === '1' || t.includes('imagen') || t.includes('foto')){
      pendingPostMenuOptions = false;
      showMenuImagesInChat();
      return;
    }
    if(t === '2' || t.includes('volver') || t.includes('menu principal') || t.includes('menú principal')){
      pendingPostMenuOptions = false;
      appendBot('Ok, regresando al menú principal.');
      // Trigger para mostrar botones rápidos (si ya tienes una función o simplemente recordarlo)
      showMainMenuButtons(); // implementa opcionalmente; si no existe, sólo appendBot
      return;
    }
    appendBot('Por favor elige: 1️⃣ (Ver imágenes) o 2️⃣ (Volver al menú principal).');
    return;
  }

  // --- Mejor detección para "menú" evitando conflictos con "menú del día" ---
// Primero detectamos intenciones específicas (platos del día, info, contacto, etc.)
const intent = matchIntent ? matchIntent(text) : null;
const msgLower = (text||'').toLowerCase();

// Priorizar palabras clave específicas antes de preguntar por la carta completa
if(['info','informacion','información','horario','direccion','dirección','Info','Informacion','Información','Direccion','Dirección','Horario','Abierto','abierto'].some(w=>msgLower.includes(w))){ 
  botState='info-menu'; 
  addBotMessage('✨ Información del Restaurante\n\n1️⃣ Ver dirección y foto 📍\n2️⃣ Ver horario ⏰\n3️⃣ Ver métodos de pago 💵💰\n4️⃣ Volver al menú principal 🔙'); 
  return; 
}
if(['contacto','tel','telefono','teléfono','numero','número','Contacto','Tel','Telefono','Teléfono','Numero','Número','Numeros','Números','Contactos','contactos'].some(w=>msgLower.includes(w))){ 
  botState='contact-return'; 
  addBotMessage('📞 Números de teléfono (Domicilios):\n- 324 2680816\n- 315 6462946'); 
  setTimeout(()=>addBotMessage('¿Quieres volver al menú principal?🔙 (si / no)'),600); 
  return; 
}
if(['platos del dia','menu del dia','menú del día','menu dia','plato del día','platos del día','Plato del dia','Platos del día','Menu dia','Menu día','Menú dia','Menú día','Menu del dia','Menú del dia','Menú del día','menú del dia'].some(w=>msgLower.includes(w))){ 
  botState='menu-dia'; 
  addBotMessage('🥘 Platos del Día\n\n1️⃣ Menú del día (Lunes a Viernes)\n2️⃣ Menú del fin de semana\n3️⃣ Volver al menú principal'); 
  return; 
}

// Si el usuario pide expresamente "ver carta completa" o variantes muy precisas
if(/^\s*(ver carta completa|ver carta|carta completa|menu completo|menú completo)\s*$/i.test(text)){
  pendingMenuConfirm = true;
  appendBot('¿Quieres ver la carta completa del restaurante Búcaro? Responde "Si" o "No".');
  return;
}
}

async function showMenu(){
  if(!cachedMenu) await loadMenu();
  if(!cachedMenu){ appendBot('Menú no disponible.'); return; }
  const list = cachedMenu.dishes;
  let text = 'Carta completa:\n';
  list.slice(0,20).forEach(d => text += `• ${d.name} — ${d.price ? d.price+' COP' : ''}\n`);
  appendBot(text);
  appendBot('Escribe la palabra del plato si quieres ver detalle o "volver" para regresar.');
}
async function showFullMenuInChat(){
  if(!cachedMenu){
    try {
      const res = await fetch('/api/menu');
      cachedMenu = await res.json();
    } catch(e){
      appendBot('Lo siento, no pude cargar la carta ahora.');
      return;
    }
  }

  const dishes = cachedMenu.dishes || [];
  if(!dishes.length){
    appendBot('La carta está vacía por ahora.');
    return;
  }

  let text = '📋 *Carta completa del restaurante Búcaro:*\n\n';
  dishes.forEach(d => {
    const priceText = d.price ? ` — COP ${Number(d.price).toLocaleString('es-CO')}` : '';
    const desc = d.description ? `\n   ${d.description}` : '';
    text += `• ${d.name}${priceText}${desc}\n\n`;
  });

  appendBot(text);
  appendBot('¿Qué deseas ahora?\n1️⃣ Ver imágenes de algunos platos\n2️⃣ Volver al menú principal');
  pendingPostMenuOptions = true;
}

async function showToday(){
  try{
    // intentamos usar la configuración del admin en /api/menu
    if(!cachedMenu) await loadMenu();
    // cachedMenu debe tener: cachedMenu.menu_weekday y cachedMenu.menu_weekend según admin.html
    if(cachedMenu && cachedMenu.menu_weekday){
      const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const dayKey = days[new Date().getDay()]; // e.g. 'monday'
      // menu_weekday guarda monday,tuesday,... (weekday) y menu_weekend guarda saturday,sunday
      if(dayKey === 'saturday' || dayKey === 'sunday'){
        // fin de semana: mostramos desde menu_weekend
        const wk = cachedMenu.menu_weekend || {};
        const sat = wk.saturday || {name:'', price:''};
        const sun = wk.sunday || {name:'', price:''};
        addBotMessage(`🎉 Menú Fin de Semana:\n\n🍲 Sábado: ${sat.name || 'No configurado'} — ${sat.price || ''}\n🥘 Domingo: ${sun.name || 'No configurado'} — ${sun.price || ''}`);
        setTimeout(()=> addBotMessage('¿Quieres volver al menú principal? (si / no)'), 500);
        botState = 'contact-return';
        return;
      } else {
        // día de semana: mostramos el/los platos configurados para ese día
        const menu = cachedMenu.menu_weekday || {};
        const meal = menu[dayKey] || { name:'', price:'' };
        if(!meal || !meal.name) {
          appendBot('Hoy no hay menú configurado ❌');
          return;
        }
        addBotMessage(`🍽️ Menú de Hoy (${dayKey}):\n${meal.name} — ${meal.price ? meal.price + ' COP' : ''}`);
        setTimeout(()=> addBotMessage('¿Quieres volver al menú principal? (si / no)'), 500);
        botState = 'contact-return';
        return;
      }
    }

    // Fallback clásico: si no existe menu_weekday en cachedMenu, preguntamos la API /api/menu/today
    const res = await fetch('/api/menu/today');
    if(!res.ok) throw new Error('API /api/menu/today');
    const today = await res.json();
    if(!Array.isArray(today) || !today.length){
      appendBot('Hoy no hay platos del día disponibles 🔅❌');
      return;
    }
    let text = '🥘 *Platos del Día:*\n\n';
    today.forEach(d => {
      const price = d.price ? ` — ${Number(d.price).toLocaleString('es-CO')} COP` : '';
      const desc = d.description ? `\n   ${d.description}` : '';
      text += `• ${d.name}${price}${desc}\n\n`;
    });
    appendBot(text);
    appendBot('Puedes ver imágenes a la derecha si estás en PC o escribir "contacto" para pedir por WhatsApp 📲');
  }catch(e){
    console.error(e);
    appendBot('⚠ No se pudo cargar el menú del día.');
  }
}

function showInfo(){
  if(!cachedMenu) { appendBot('Información no disponible'); return; }
  const r = cachedMenu.restaurant;
  appendBot(`Horario: ${r.hours}\nDirección: ${r.address}\nTeléfono: ${r.phone}`);
  appendBot('¿Deseas volver? Escribe "volver".');
}

function showContact(){
  if(!cachedMenu){ appendBot('Contacto no disponible'); return; }
  const r = cachedMenu.restaurant;
  appendBot(`Teléfono: ${r.phone}\nWhatsApp: click el botón de contacto en la web\nCorreo: info@piqueteaderobucaro.com (ejemplo)`);
  appendBot('¿Deseas volver al inicio?');
}

function showMainMenuButtons(){
  appendBot('✅Volviendo al menú principal🔙\n\n Recuerda usar los botones:\n"Platos del día", "Ver carta completa", "Información" o "Contacto".💡');
  // Si quieres, podrías simular clickable quick buttons por HTML aquí.
}

// === EVENTS (sin duplicar mensajes) ===
sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const t = input.value.trim();
  if (!t) return;

  // Mostrar mensaje del usuario solo una vez
  appendUser(t);
  input.value = '';

  // Enviar texto al manejador principal
  setTimeout(() => handleText(t), 400);
}
// botones rapidos del chat
document.querySelectorAll('.quick-btn').forEach((b) => {
  b.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (action === 'today') {
      // abrimos las opciones guiadas de "Platos del día"
      botState = 'menu-dia';
      addBotMessage('🥘 Platos del Día 🌞\n ¡Escribe del 1 al 3 la opción que quieres ver!\n\n1️⃣ Menú del día (Lunes a Viernes)\n2️⃣ Menú del fin de semana\n3️⃣ Volver al menú principal');
      return;
    }
    if (action === 'menu') handleText('ver carta completa'); // pedimos explícitamente la carta
    if (action === 'info') handleText('horario');
    if (action === 'contact') handleText('contacto');
  });
});

// init
loadMenu();
appendBot('👋 Bienvenido al chatbot del Piqueteadero El Bucaro!💬🤖\n\n 💡Puedes escribir en la barra del chat o pulsar los 4 botones para una respuesta rapida!💡\n\n ¿En que te puedo ayudar hoy?.😊');

// ===== Welcome overlays: versión robusta =====
(function(){
  // IDs usados en el HTML (asegúrate que coincidan)
  const OVERLAY1_ID = 'welcome-overlay-1';
  const OVERLAY2_ID = 'welcome-overlay-2';
  const BTN1_ID = 'welcome-1-btn';
  const BTN2_ID = 'welcome-2-btn';

  // elementos
  const overlay1 = document.getElementById(OVERLAY1_ID);
  const overlay2 = document.getElementById(OVERLAY2_ID);
  const btn1 = document.getElementById(BTN1_ID);
  const btn2 = document.getElementById(BTN2_ID);

  // contenedor a desenfocar (fallbacks)
  const pageContent = document.querySelector('main') || document.querySelector('.container') || document.body;

  // helper: mostrar/ocultar con atributo hidden
  function show(el){
    if(!el) return;
    el.hidden = false;
    el.style.display = 'flex';
    el.setAttribute('aria-hidden','false');
  }
  function hide(el){
    if(!el) return;
    el.hidden = true;
    el.style.display = 'none';
    el.setAttribute('aria-hidden','true');
  }

  function applyBlur(){
    pageContent.classList.add('page-blurred');
    document.body.classList.add('no-scroll');
  }
  function removeBlur(){
    pageContent.classList.remove('page-blurred');
    document.body.classList.remove('no-scroll');
  }

  // Si no existen los elementos, sale (y escribe aviso en consola)
  if(!overlay1 || !overlay2 || !btn1 || !btn2){
    console.warn('Welcome overlays: faltan elementos HTML. Asegura IDs: ', OVERLAY1_ID, OVERLAY2_ID, BTN1_ID, BTN2_ID);
    return;
  }

  // Muestra primer overlay y aplica blur
  function startSequence(){
    show(overlay1);
    hide(overlay2);
    applyBlur();
    // foco en botón 1
    btn1.focus();
  }

  // acciones
  function openSecond(){
    hide(overlay1);
    show(overlay2);
    applyBlur();
    btn2.focus();
  }
  function finishAndClose(){
    hide(overlay1);
    hide(overlay2);
    removeBlur();
    // poner foco en input del chat
    const chatInput = document.getElementById('inputText');
    if(chatInput) chatInput.focus();
  }

  // Event listeners seguros (evitan errores si se vuelven a añadir)
  btn1.addEventListener('click', (e) => {
    try { openSecond(); } catch(err){ console.error(err); }
  });
  btn2.addEventListener('click', (e) => {
    try { finishAndClose(); } catch(err){ console.error(err); }
  });

  // soporte Escape (navegación accesible)
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      // si overlay2 visible -> cerrar todo; si overlay1 visible -> pasar al segundo
      if(overlay2 && !overlay2.hidden) finishAndClose();
      else if(overlay1 && !overlay1.hidden) openSecond();
    }
  });

  // Mostrar solo la primera vez (opcional): comentar si quieres siempre mostrar
  const ONLY_FIRST_TIME = false;
  const STORAGE_KEY = 'piqueteadero_welcome_shown';

  
// --- Compatibility: support desktop and mobile input/button IDs ---
var desktopInput = document.getElementById('inputText');
var desktopSend = document.getElementById('sendBtn');
var mobileInput = document.getElementById('mobileInputText');
var mobileSend = document.getElementById('mobileSendBtn');
// main references for code to use:
var chatInputEl = desktopInput || mobileInput;
var chatSendBtn = desktopSend || mobileSend;

document.addEventListener('DOMContentLoaded', () => {
    try {
      if(ONLY_FIRST_TIME){
        if(!localStorage.getItem(STORAGE_KEY)){
          startSequence();
          localStorage.setItem(STORAGE_KEY, '1');
        } else {
          // no mostrar nunca más
          hide(overlay1); hide(overlay2);
          removeBlur();
        }
      } else {
        // siempre mostrar
        startSequence();
      }
    } catch(err){
      console.error('Error welcome overlay:', err);
      // en caso de error, aseguramos que los overlays no queden bloqueando
      hide(overlay1); hide(overlay2);
      removeBlur();
    }
  });
})();

// Toggle para "Platos Populares" en móvil — no rompe el chat

// --- Compatibility: support desktop and mobile input/button IDs ---
var desktopInput = document.getElementById('inputText');
var desktopSend = document.getElementById('sendBtn');
var mobileInput = document.getElementById('mobileInputText');
var mobileSend = document.getElementById('mobileSendBtn');
// main references for code to use:
var chatInputEl = desktopInput || mobileInput;
var chatSendBtn = desktopSend || mobileSend;

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('toggle-todayList');
  const aside = document.querySelector('.sidebar');
  if(!btn || !aside) return;

  btn.addEventListener('click', () => {
    const opened = aside.classList.toggle('open');
    btn.setAttribute('aria-expanded', opened ? 'true' : 'false');
    btn.textContent = opened ? '🌟 Platos Populares (ocultar)' : '🌟 Platos Populares (ver)';
    // opcional: poner foco en contenedor para accesibilidad
    if(opened) {
      const firstItem = aside.querySelector('.todayList > *');
      if(firstItem) firstItem.focus && firstItem.focus();
    }
  });
});
// ======== Script para fijar la barra del chat en móvil y ajustar padding dinámico ========
(function(){
  function wrapChatInputIfNeeded(){
    const existingWrapper = document.querySelector('.chat-input-wrapper');
    if(existingWrapper) return existingWrapper;

  // Detectar los dos posibles inputs (PC o móvil)
const inputText = document.getElementById('inputText') || document.getElementById('mobileInputText');
const sendBtn = document.getElementById('sendBtn') || document.getElementById('mobileSendBtn');


    if(!input || !sendBtn) {
      // si no encuentra se sale
      return null;
    }

    // Crear wrapper y contenedor
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-input-wrapper';
    const container = document.createElement('div');
    container.className = 'chat-input-container';

    // Mover input y botón dentro del container
    // Si input estaba dentro de otro contenedor, lo movemos a body al final
    container.appendChild(input);
    container.appendChild(sendBtn);
    wrapper.appendChild(container);

    // Insertar el wrapper justo antes del cierre del body
    document.body.appendChild(wrapper);

    return wrapper;
  }

  function adjustBottomPadding(){
    try {
      const wrapper = document.querySelector('.chat-input-wrapper');
      const main = document.querySelector('main') || document.querySelector('.content') || document.querySelector('.chat-area') || document.documentElement;
      if(!wrapper || !main) return;
      // obtener altura real del wrapper
      const rect = wrapper.getBoundingClientRect();
      const height = Math.ceil(rect.height || 84); // fallback
      // aplicar padding-bottom en main
      main.style.paddingBottom = (height + 10) + 'px';
    } catch(e){
      console.warn('adjustBottomPadding error', e);
    }
  }

  // Ejecutar al cargar DOM
  
// --- Compatibility: support desktop and mobile input/button IDs ---
var desktopInput = document.getElementById('inputText');
var desktopSend = document.getElementById('sendBtn');
var mobileInput = document.getElementById('mobileInputText');
var mobileSend = document.getElementById('mobileSendBtn');
// main references for code to use:
var chatInputEl = desktopInput || mobileInput;
var chatSendBtn = desktopSend || mobileSend;

document.addEventListener('DOMContentLoaded', function(){
    // envolver si es necesario
    const wrapper = wrapChatInputIfNeeded();
    // esperamos un tick para estilos
    setTimeout(adjustBottomPadding, 80);
  });

  // Re-ajustar en resize (teclado, rotación)
  window.addEventListener('resize', function(){
    setTimeout(adjustBottomPadding, 120);
  });

  // Observador por si el DOM del input cambia (ej: librería SPA)
  const observer = new MutationObserver(function(){
    adjustBottomPadding();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Llamada inicial por si script se carga después
  setTimeout(function(){ adjustBottomPadding(); }, 500);
})();

function showMenuImagesInChat(){
  if(!cachedMenu || !cachedMenu.dishes) {
    appendBot('No hay datos del menú disponibles para mostrar imágenes.');
    return;
  }
  const dishesWithImages = (cachedMenu.dishes || []).filter(d => d.image_url && d.image_url.trim() !== '');
  if(!dishesWithImages.length){
    appendBot('No hay imágenes disponibles de los platos en este momento.');
    
    // ✅ CAMBIO: Usar el mismo formato que otros bloques
    pendingPostMenuOptions = false;
    setTimeout(() => appendBot('¿Quieres volver al menú principal?🔙 (si / no)'), 600);
    botState = 'contact-return'; // Activar el estado para manejar si/no
    return;
  }

  appendBot('📷 Mostrando imágenes de algunos platos:');

  dishesWithImages.forEach(d => {
    // Crear un contenedor con imagen + texto
    const container = document.createElement('div');
    container.className = 'msg bot';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '6px';

    const title = document.createElement('div');
    title.textContent = d.name + (d.price ? ` — COP ${Number(d.price).toLocaleString('es-CO')}` : '');
    title.style.fontWeight = '600';

    const img = document.createElement('img');
    img.src = d.image_url;
    img.alt = d.name;
    img.style.maxWidth = '220px';
    img.style.borderRadius = '8px';
    img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';

    container.appendChild(title);
    container.appendChild(img);

    messagesEl.appendChild(container);
  });

  messagesEl.scrollTop = messagesEl.scrollHeight;

  // Luego dar opción de volver al menú principal
  pendingPostMenuOptions = false;
  setTimeout(() => appendBot('¿Quieres volver al menú principal?🔙 (si / no)'), 600);
  botState = 'contact-return';
}
(function(){
  function createMobileWrapperIfNeeded(){
    // ya existe: no crear de nuevo
    if(document.querySelector('.chat-input-wrapper')) return;

    // solo en pantallas móviles
    if(window.innerWidth > 768) return;

    // buscar el input/btn originales en el chat
    const originalInput = document.getElementById('inputText');
    const originalBtn = document.getElementById('sendBtn');

    if(!originalInput || !originalBtn) return;

    // clonar los nodos (en lugar de mover) para mantener la versión desktop intacta
    const mobileInput = originalInput.cloneNode(true);
    const mobileBtn = originalBtn.cloneNode(true);

    // asignar ids distintos para evitar conflictos
    mobileInput.id = 'mobileInputText';
    mobileBtn.id = 'mobileSendBtn';

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-input-wrapper';
    const container = document.createElement('div');
    container.className = 'chat-input-container';
    container.appendChild(mobileInput);
    container.appendChild(mobileBtn);
    wrapper.appendChild(container);
    document.body.appendChild(wrapper);

    // conectar evento del botón móvil al handler original (si usas addEventListener)
    // si tu código usa event delegation o atacha el handler por id, añade aquí:
    mobileBtn.addEventListener('click', function(){
      // tomar valor del mobileInput e invocar la función que envía mensajes
      const text = mobileInput.value;
      if(typeof sendMessage === 'function'){
        sendMessage(text); // si tu app tiene esta función
      } else {
        // si en tu app el envío se hace por submit o por otra función:
        const evt = new Event('input', { bubbles: true });
        mobileInput.dispatchEvent(evt);
        // fallback: intentar usar el mismo listener que el sendBtn original
        originalBtn.click();
      }
    });

    // ajustar padding inicial
    adjustBottomPadding();
  }

  function adjustBottomPadding(){
    const wrapper = document.querySelector('.chat-input-wrapper');
    const main = document.querySelector('main') || document.querySelector('.content') || document.documentElement;
    if(!wrapper || !main) return;
    const rect = wrapper.getBoundingClientRect();
    main.style.paddingBottom = (Math.ceil(rect.height) + 10) + 'px';
  }

  // crear al cargar solo si es móvil
  
// --- Compatibility: support desktop and mobile input/button IDs ---
var desktopInput = document.getElementById('inputText');
var desktopSend = document.getElementById('sendBtn');
var mobileInput = document.getElementById('mobileInputText');
var mobileSend = document.getElementById('mobileSendBtn');
// main references for code to use:
var chatInputEl = desktopInput || mobileInput;
var chatSendBtn = desktopSend || mobileSend;

document.addEventListener('DOMContentLoaded', function(){
    createMobileWrapperIfNeeded();
    window.addEventListener('resize', function(){
      // si cambia de tamaño, eliminar o crear wrapper según corresponda
      if(window.innerWidth > 768) {
        const w = document.querySelector('.chat-input-wrapper');
        if(w) w.remove();
        document.querySelector('main').style.paddingBottom = '';
      } else {
        if(!document.querySelector('.chat-input-wrapper')) createMobileWrapperIfNeeded();
        setTimeout(adjustBottomPadding,100);
      }
    });
  });
})();
// -- INICIO: UNIFICAR ENVÍO MÓVIL CON PC (Pegar al final de app.js) --
document.addEventListener('DOMContentLoaded', () => {
  const mobileInput = document.getElementById('mobileInputText');
  const mobileSend = document.getElementById('mobileSendBtn');
  const desktopInput = document.getElementById('inputText'); // input principal ya usado por sendMessage()
  const desktopSend  = document.getElementById('sendBtn');  // boton principal ya usado por sendMessage()

  if (mobileSend && mobileInput && desktopSend && desktopInput) {
    // cuando pulsan enviar en móvil, delegamos al botón desktop
    mobileSend.addEventListener('click', (e) => {
      const text = (mobileInput.value || '').trim();
      if (!text) return;
      // copiar al input principal y disparar el mismo flujo que en escritorio
      desktopInput.value = text;
      desktopSend.click();      // usa la función sendMessage() que ya existe
      mobileInput.value = '';   // limpiar input movil
      desktopInput.focus();
    });

    // permitir enviar con Enter desde teclado móvil
    mobileInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        mobileSend.click();
      }
    });
  }
});
// ✅ Visor de imágenes funcional - ARREGLADO
document.addEventListener('DOMContentLoaded', function() {
  const imageViewer = document.getElementById("image-viewer");
  const viewerImg = document.getElementById("viewer-img");
  const closeViewer = document.getElementById("close-viewer");

  if (!imageViewer || !viewerImg || !closeViewer) {
    console.warn('Elementos del visor de imágenes no encontrados');
    return;
  }

  // Abrir visor al hacer clic en una imagen (delegación de eventos)
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("today-img")) {
      e.preventDefault();
      e.stopPropagation();
      viewerImg.src = e.target.src;
      viewerImg.alt = e.target.alt || 'Plato';
      imageViewer.hidden = false;
      imageViewer.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // evitar scroll de fondo
    }
  });

  // Cerrar visor con la X
  closeViewer.addEventListener("click", (e) => {
    e.stopPropagation();
    imageViewer.hidden = true;
    imageViewer.style.display = 'none';
    document.body.style.overflow = ''; // restaurar scroll
  });

  // Cerrar visor haciendo clic en el fondo oscuro
  imageViewer.addEventListener("click", (e) => {
    if (e.target === imageViewer) {
      imageViewer.hidden = true;
      imageViewer.style.display = 'none';
      document.body.style.overflow = '';
    }
  });

  // Cerrar con tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !imageViewer.hidden) {
      imageViewer.hidden = true;
      imageViewer.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
});

async function showTodayMenu(){
  try{
    const res = await fetch('/api/menu');
    const data = await res.json();
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const today = days[new Date().getDay()];
    
    // ✅ VERIFICAR SI ESTAMOS EN FIN DE SEMANA
    if (today === 'saturday' || today === 'sunday') {
      addBotMessage('❌ Platos no encontrados porque estamos ya en fin de semana!📅🎊\n\n👉 Utiliza la opción 2️⃣ "Menú del fin de semana" para ver los platos disponibles hoy!.');
      setTimeout(()=> addBotMessage('¿Quieres volver al menú principal? (si / no)'), 600);
      botState = 'contact-return';
      return;
    }
    
    // Si es día entre semana, mostrar el menú correspondiente
    const menu = data.menu_weekday || {};
    const meal = menu[today] || {name:'No hay plato configurado', price:''};
    
    if (!meal.name || meal.name === 'No hay plato configurado') {
      addBotMessage('❌ No hay menú configurado para hoy.');
      setTimeout(()=> addBotMessage('¿Quieres volver al menú principal? (si / no)'), 600);
      botState = 'contact-return';
      return;
    }
    
    addBotMessage(`🍽️ Menú de Hoy (${today}):\n${meal.name} \n${meal.price ? meal.price + ' COP' : ''}`);
    setTimeout(()=> addBotMessage('¿Quieres volver al menú principal? (si / no)'), 500);
    botState = 'contact-return';
  }catch(e){ 
    console.error(e);
    addBotMessage('No pude cargar el menú del día.'); 
    botState=null; 
  }
}

async function showWeekendMenu(){
  try{
    const res = await fetch('/api/menu');
    const data = await res.json();
    const wk = data.menu_weekend || {};
    const sat = wk.saturday || {name:'',price:''};
    const sun = wk.sunday || {name:'',price:''};
    addBotMessage(`🎉 Menú Fin de Semana:\n\n🍲 Sábado: ${sat.name} — ${sat.price}\n🥘 Domingo: ${sun.name} — ${sun.price}`);
    setTimeout(()=> addBotMessage('¿Quieres volver al menú principal? (si / no)'), 500);
    botState = 'contact-return';
  }catch(e){ addBotMessage('No pude cargar el menú del fin de semana.'); botState=null; }
}
