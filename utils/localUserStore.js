const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const STORE_PATH = path.join(__dirname, '..', 'data', 'users.json');

const ensureStoreFile = async () => {
  try {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.access(STORE_PATH);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(STORE_PATH, '[]', 'utf8');
      return;
    }
    throw error;
  }
};

const readUsers = async () => {
  await ensureStoreFile();
  const data = await fs.readFile(STORE_PATH, 'utf8');
  const parsed = JSON.parse(data);
  return Array.isArray(parsed) ? parsed : [];
};

const writeUsers = async (users) => {
  await ensureStoreFile();
  await fs.writeFile(STORE_PATH, JSON.stringify(users, null, 2), 'utf8');
};

const normalizeUser = (user) => ({
  ...user,
  email: user.email?.toLowerCase()
});

exports.findUserByEmail = async (email) => {
  const users = await readUsers();
  return users.find((user) => user.email?.toLowerCase() === String(email).toLowerCase()) || null;
};

exports.findUserById = async (id) => {
  const users = await readUsers();
  return users.find((user) => user.id === id) || null;
};

exports.createUser = async (userData) => {
  const users = await readUsers();
  const user = normalizeUser({
    id: userData.id || crypto.randomUUID(),
    ...userData,
    created_at: userData.created_at || new Date().toISOString(),
    updated_at: userData.updated_at || new Date().toISOString()
  });

  users.push(user);
  await writeUsers(users);
  return user;
};

exports.updateUser = async (id, updates) => {
  const users = await readUsers();
  const index = users.findIndex((user) => user.id === id);

  if (index === -1) {
    return null;
  }

  const updatedUser = normalizeUser({
    ...users[index],
    ...updates,
    updated_at: new Date().toISOString()
  });

  users[index] = updatedUser;
  await writeUsers(users);
  return updatedUser;
};
