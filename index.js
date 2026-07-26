const fs = require('fs');
const path = require('path');
const http = require('http');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const database = require('./database');
require('dotenv').config();

// Dummy HTTP health check server for Render Web Service (Free Tier)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('🤖 Bot GatoPreto está online e ativo!');
}).listen(PORT, () => {
  console.log(`🌐 Servidor HTTP de verificação ativo na porta ${PORT}`);
});

// Initialize the local JSON database
database.init();

// Initialize Discord Client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Setup command collection
client.commands = new Collection();

// Load slash commands dynamically
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[AVISO] O comando em ${filePath} está em falta com as propriedades obrigatórias "data" or "execute".`);
    }
  }
}

// Load event handlers dynamically
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Register ready event inside index.js for quick status logging
client.once('ready', () => {
  console.log(`🤖 Bot iniciado com sucesso! Sessão iniciada como ${client.user.tag}`);
});

// Log in to Discord
if (!process.env.DISCORD_TOKEN) {
  console.error('ERRO: A variável DISCORD_TOKEN não está definida no ficheiro .env!');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('Falha ao iniciar sessão no Discord:', err);
});
