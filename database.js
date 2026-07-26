const fs = require('fs');
const path = require('path');

// Initialize database file in the project folder
const dbPath = path.join(__dirname, 'database.json');

let data = {
  users: {}
};

// Load database from file
function init() {
  if (fs.existsSync(dbPath)) {
    try {
      const fileContent = fs.readFileSync(dbPath, 'utf8');
      data = JSON.parse(fileContent);
      if (!data.users) data.users = {};
    } catch (e) {
      console.error("Error reading database.json, initializing fresh db:", e);
      save();
    }
  } else {
    save();
  }
}

// Save database to file
function save() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error("Failed to write to database.json:", e);
  }
}

// Formula for XP needed to reach next level
function getXpNeededForNextLevel(level) {
  return 5 * (level ** 2) + 50 * level + 100;
}

// Get user data
function getUser(guildId, userId) {
  const key = `${guildId}-${userId}`;
  if (!data.users[key]) {
    data.users[key] = {
      guild_id: guildId,
      user_id: userId,
      xp: 0,
      level: 0,
      last_xp_time: 0
    };
    save();
  }
  return data.users[key];
}

// Add XP and check for level ups
function addXp(guildId, userId, amount) {
  const user = getUser(guildId, userId);
  let newXp = user.xp + amount;
  let currentLevel = user.level;
  let leveledUp = false;

  while (true) {
    const xpNeeded = getXpNeededForNextLevel(currentLevel);
    if (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      currentLevel++;
      leveledUp = true;
    } else {
      break;
    }
  }

  // Update in-memory database
  user.xp = newXp;
  user.level = currentLevel;
  save();

  return {
    leveledUp,
    oldLevel: user.level,
    newLevel: currentLevel,
    xp: newXp
  };
}

// Update the cooldown timestamp
function updateCooldown(guildId, userId, timestamp) {
  const user = getUser(guildId, userId);
  user.last_xp_time = timestamp;
  save();
}

// Get leaderboard for a specific guild
function getLeaderboard(guildId, limit = 10) {
  const guildUsers = Object.values(data.users).filter(u => u.guild_id === guildId);
  // Sort by level desc, then by xp desc
  guildUsers.sort((a, b) => {
    if (b.level !== a.level) {
      return b.level - a.level;
    }
    return b.xp - a.xp;
  });
  return guildUsers.slice(0, limit);
}

module.exports = {
  init,
  getUser,
  addXp,
  updateCooldown,
  getLeaderboard,
  getXpNeededForNextLevel
};
