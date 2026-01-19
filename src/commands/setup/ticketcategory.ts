import { SlashCommandSubcommandBuilder } from 'discord.js';
import { dataManager } from '../../models/DataManager';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('ticketcategory')
    .setDescription('Set the category for ticket channels')
    .addChannelOption(option =>
      option.setName('category')
        .setDescription('Category to create tickets in')
        .setRequired(true)
    ),

  async execute(interaction: any) {
    const category = interaction.options.getChannel('category');

    if (!category || category.type !== 4) {
      await interaction.reply({ content: 'Please select a category channel.', ephemeral: true });
      return;
    }

    dataManager.updateSettings({ categoryId: category.id });
    await interaction.reply({ content: `Ticket category has been set to **${category.name}**.`, ephemeral: true });
  }
};
