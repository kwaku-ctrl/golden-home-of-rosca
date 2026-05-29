// Mock in-memory database for local testing
const users = new Map();

module.exports = {
  users,
  
  addUser: (user) => {
    users.set(user.email, user);
    return user;
  },
  
  findUserByEmail: (email) => {
    return users.get(email);
  },
  
  findUserById: (id) => {
    for (const user of users.values()) {
      if (user.id === id) return user;
    }
    return null;
  },
  
  updateUser: (id, updates) => {
    for (const [key, user] of users.entries()) {
      if (user.id === id) {
        const updated = { ...user, ...updates };
        users.set(key, updated);
        return updated;
      }
    }
    return null;
  }
};
