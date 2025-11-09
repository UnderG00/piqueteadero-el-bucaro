// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
console.log('iniciando server.js — comprobación log 1');


const DATA_FILE = path.join(__dirname, 'data.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ERNESTO2004';

function ensureData(){
  if(!fs.existsSync(DATA_FILE)){
    const sample = {
      restaurant: {
        name: "Piqueteadero El Bucaro",
        phone: "+57 300 000 0000",
        address: "Carrera 12 #34-56, Cali",
        hours: "Lun-Dom 10:00 - 21:00",
        info: "Especialidad en platos tipicos santandereanos",
        logo: "images/logo-restaurante.jpg"
      },
      dishes: [
        { id: 1, name: "Bandeja Bucareña", description: "Carne, arroz, plátano, ensalada", price: 22000, category: "Principal", image_url: "", is_today: true, available: true },
        { id: 2, name: "Arepa con Queso", description: "Arepa asada con queso costeño", price: 6000, category: "Entrada", image_url: "", is_today: false, available: true }
      ],
      nextId: 3
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(sample, null, 2));
  }
}
ensureData();

function readData(){
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function writeData(data){
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
const os = require('os');

// API: obtener menú completo
app.get('/api/menu', (req, res) => {
  const data = readData(); // lee data.json
  // devolvemos restaurant, dishes y también menu_weekday/menu_weekend
  res.json({ 
    restaurant: data.restaurant, 
    dishes: data.dishes,
    menu_weekday: data.menu_weekday || {},
    menu_weekend: data.menu_weekend || {}
  });
});

app.get('/api/menu/today', (req, res) => {
  const data = readData();
  const day = new Date().toLocaleDateString('en-US',{weekday:'long'}).toLowerCase();

  let menu;
  if (['saturday','sunday'].includes(day)) {
    menu = data.menu_weekend?.[day];
  } else {
    menu = data.menu_weekday?.[day];
  }

  if (!menu || !menu.items || menu.items.length === 0) {
    return res.json([]);
  }

  // Convertimos texto a estructura
  const result = menu.items.map(item => ({
    name: item.name,
    price: item.price
  }));

  res.json(result);
});

// Admin login (simple)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if(password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta' });
  const data = readData();
  res.json({ ok: true, data });
});

// Admin: actualizar restaurant info
app.post('/api/admin/restaurant', (req, res) => {
  const { password, restaurant } = req.body;
  if(password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta' });
  const data = readData();
  data.restaurant = Object.assign({}, data.restaurant, restaurant);
  writeData(data);
  res.json({ ok: true, restaurant: data.restaurant });
});

// Admin: crear/editar plato
app.post('/api/admin/dish', (req, res) => {
  const { password, dish } = req.body;
  if(password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta' });
  const data = readData();
  if(dish.id){
    const idx = data.dishes.findIndex(x => x.id === dish.id);
    if(idx === -1) return res.status(404).json({ error: 'Plato no encontrado' });
    data.dishes[idx] = Object.assign({}, data.dishes[idx], dish);
    writeData(data);
    return res.json({ ok: true, dish: data.dishes[idx] });
  } else {
    const newDish = Object.assign({}, dish, { id: data.nextId++ });
    data.dishes.push(newDish);
    writeData(data);
    return res.json({ ok: true, dish: newDish });
  }
});

// Admin: borrar plato
app.post('/api/admin/dish/delete', (req, res) => {
  const { password, id } = req.body;
  if(password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta' });
  const data = readData();
  data.dishes = data.dishes.filter(d => d.id !== id);
  writeData(data);
  res.json({ ok: true });
});



// Admin: guardar menú entre semana (weekday)
app.post('/api/admin/menu_weekday', (req, res) => {
  const { password, menu } = req.body;
  if(password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta' });
  const data = readData();
  data.menu_weekday = menu;
  writeData(data);
  res.json({ ok: true });
});

// Admin: guardar menú fin de semana
app.post('/api/admin/menu_weekend', (req, res) => {
  const { password, menu } = req.body;
  if(password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta' });
  const data = readData();
  data.menu_weekend = menu;
  writeData(data);
  res.json({ ok: true });
});
// Fallback: servir index.html (already static)
app.use((req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// define el puerto (asegúrate de que esto esté antes de usar PORT)
const PORT = process.env.PORT || 4000;

// Mensajes de depuración (logs)
console.log('iniciando server.js — comprobación log 1'); // si aún quieres este log inicial
console.log('a punto de iniciar servidor en puerto', PORT);

// función auxiliar para obtener IPs IPv4 locales
function getLocalIPs() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results;
}

// Iniciar servidor escuchando en todas las interfaces (0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log(`Server running on port ${PORT}`);
  console.log(`Accessible on these local IPs: ${ips.join(', ')}`);
  if (ips.length > 0) {
    console.log(`Open from another device: http://${ips[0]}:${PORT}`);
  } else {
    console.log('No non-internal IPv4 interface found. Try http://<tu_ip_local>:' + PORT);
    const PORT = process.env.PORT || 4000;
  }
});
