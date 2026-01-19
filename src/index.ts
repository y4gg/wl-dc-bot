import { Client, GatewayIntentBits, Partials, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { dataManager } from './models/DataManager';
import { handleCreateTicket } from './handlers/buttonHandler';
import { handleTagSelection } from './handlers/selectMenuHandler';
import { startInactivityCheck } from './handlers/inactivityHandler';
import setupCommand from './commands/setupCommand';
import closeCommand from './commands/ticket/close';
import claimCommand from './commands/ticket/claim';
import adduserCommand from './commands/ticket/adduser';
import removeuserCommand from './commands/ticket/removeuser';
import renameCommand from './commands/ticket/rename';
import transcriptCommand from './commands/ticket/transcript';

config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const commands = [
  setupCommand.data.toJSON(),
  closeCommand.data.toJSON(),
  claimCommand.data.toJSON(),
  adduserCommand.data.toJSON(),
  removeuserCommand.data.toJSON(),
  renameCommand.data.toJSON(),
  transcriptCommand.data.toJSON()
];

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  
  await registerCommands();
  startInactivityCheck(client);
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId === 'create_ticket') {
        await handleCreateTicket(interaction);
      } else if (interaction.customId === 'close_ticket') {
        await closeCommand.execute(interaction);
      } else if (interaction.customId === 'claim_ticket') {
        await claimCommand.execute(interaction);
      }
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'select_tag') {
        await handleTagSelection(interaction);
      }
    } else if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      switch (commandName) {
        case 'setup':
          await setupCommand.execute(interaction);
          break;
        case 'close':
          await closeCommand.execute(interaction);
          break;
        case 'claim':
          await claimCommand.execute(interaction);
          break;
        case 'adduser':
          await adduserCommand.execute(interaction);
          break;
        case 'removeuser':
          await removeuserCommand.execute(interaction);
          break;
        case 'rename':
          await renameCommand.execute(interaction);
          break;
        case 'transcript':
          await transcriptCommand.execute(interaction);
          break;
      }
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'An error occurred while processing your request.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
    }
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  const ticket = dataManager.getTicketByChannelId(message.channelId);
  if (ticket) {
    dataManager.updateTicketActivity(message.channelId);
  }
});

client.login(TOKEN);
