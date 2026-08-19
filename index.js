const fs = require('fs');
const path = require('path');
const http = require('http');
const { Client, Collection, GatewayIntentBits, ActivityType } = require('discord.js');
const database = require('./database');
require('dotenv').config();

// Servidor HTTP de verificação de integridade / Keep-alive
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('👑 PaimonBot está online e pronta para explorar Teyvat!');
}).listen(PORT, () => {
  console.log(`🌐 Servidor HTTP do PaimonBot ativo na porta ${PORT}`);
});

// Inicializar a base de dados local
database.init();

// Inicializar cliente Discord com os intents necessários
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Coleção de comandos
client.commands = new Collection();

// Carregar comandos slash dinamicamente de todas as subpastas
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  if (fs.lstatSync(commandsPath).isDirectory()) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(`[AVISO] O comando em ${filePath} não contém as propriedades obrigatórias "data" ou "execute".`);
      }
    }
  }
}

// Carregar manipuladores de eventos dinamicamente
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

// Evento Ready com status e atividade temática da Paimon em PT-BR
client.once('clientReady', () => {
  console.log(`✨ A Paimon acordou! Sessão iniciada como ${client.user.tag}`);
  
  if (client.user) {
    client.user.setPresence({
      activities: [{ name: 'comendo comida de emergência 🍰 | /paimon', type: ActivityType.Playing }],
      status: 'online'
    });
  }
});

// Iniciar sessão no Discord
if (!process.env.DISCORD_TOKEN) {
  console.error('ERRO: A variável DISCORD_TOKEN não está definida no arquivo .env!');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('Falha ao iniciar sessão no Discord:', err);
});
