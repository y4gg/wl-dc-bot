import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';
import * as setupCommands from './setup';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup ticket bot')
    .addSubcommand(setupCommands.tags.data)
    .addSubcommand(setupCommands.ticketchannel.data)
    .addSubcommand(setupCommands.ticketcategory.data)
    .addSubcommand(setupCommands.roles.data)
    .addSubcommand(setupCommands.permissions.data)
    .addSubcommand(setupCommands.formchannel.data),

  async execute(interaction: any) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'tags':
        await setupCommands.tags.execute(interaction);
        break;
      case 'ticketchannel':
        await setupCommands.ticketchannel.execute(interaction);
        break;
      case 'ticketcategory':
        await setupCommands.ticketcategory.execute(interaction);
        break;
      case 'roles':
        await setupCommands.roles.execute(interaction);
        break;
      case 'permissions':
        await setupCommands.permissions.execute(interaction);
        break;
      case 'formchannel':
        await setupCommands.formchannel.execute(interaction);
        break;
    }
  }
};
