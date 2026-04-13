import { SlashCommandSubcommandBuilder, MessageFlags } from 'discord.js';
import { dataManager } from '../../models/DataManager';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('limit')
    .setDescription('Configure the per-user open ticket limit')
    .addIntegerOption(option =>
      option.setName('value')
        .setDescription('Maximum number of open tickets a user can have')
        .setRequired(false)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option.setName('view')
        .setDescription('View the current ticket limit')
        .setRequired(false)
        .addChoices(
          { name: 'Yes', value: 'yes' }
        )
    ),

  async execute(interaction: any) {
    const view = interaction.options.getString('view');
    const value = interaction.options.getInteger('value');

    if (view === 'yes') {
      const settings = await dataManager.getSettings();
      await interaction.reply({
        content: `Current open ticket limit per user: **${settings.maxOpenTicketsPerUser}**`,
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    if (value === null) {
      await interaction.reply({
        content: 'Please provide a ticket limit value or use `view: yes`.',
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    if (value < 1) {
      await interaction.reply({
        content: 'The open ticket limit must be at least **1**.',
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    await dataManager.updateSettings({ maxOpenTicketsPerUser: value });
    await interaction.reply({
      content: `Open ticket limit per user has been set to **${value}**.`,
      flags: [MessageFlags.Ephemeral]
    });
  }
};
