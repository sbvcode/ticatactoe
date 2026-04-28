const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'store.json');

const defaultData = {
  users: [],
  products: [
    {
      id: 'sku_starter_hoodie',
      name: 'Starter Hoodie',
      description: 'Soft cotton hoodie with embroidered logo.',
      priceCents: 4500,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900'
    },
    {
      id: 'sku_wireless_mouse',
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with quiet clicks.',
      priceCents: 3200,
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=900'
    },
    {
      id: 'sku_notebook_set',
      name: 'Notebook Set',
      description: 'Set of 3 premium lined notebooks.',
      priceCents: 1800,
      image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=900'
    }
  ]
};

function ensureDbFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
  }
}

function readDb() {
  ensureDbFile();
  const file = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(file);
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function getProducts() {
  return readDb().products;
}

function getProductById(id) {
  return getProducts().find((p) => p.id === id);
}

function getUserByEmail(email) {
  return readDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function getUserByGoogleId(googleId) {
  return readDb().users.find((u) => u.googleId && u.googleId === googleId);
}

function createUser(user) {
  const db = readDb();
  db.users.push(user);
  writeDb(db);
  return user;
}

module.exports = {
  getProducts,
  getProductById,
  getUserByEmail,
  getUserByGoogleId,
  createUser
};
