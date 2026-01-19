import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { dataManager } from '../../models/DataManager';
import { canManageTicket } from '../../utils/permissionChecks';

export default {
  data: new SlashCommandBuilder()
    .setName('rename')
    .setDescription('Rename the ticket channel')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('New channel name')
        .setRequired(true)
    ),

  async execute(interaction: any) {
    const channel = interaction.channel;
    const ticket = dataManager.getTicketByChannelId(channel.id);

    if (!ticket) {
      await interaction.reply({ content: 'This is not a ticket channel.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    if (!canManageTicket(interaction, ticket.userId)) {
      await interaction.reply({ content: 'You do not have permission to rename this ticket.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    const newName = interaction.options.getString('name');
    const sanitizedName = newName.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 100);
    
    try {
      await channel.setName(sanitizedName);
      await interaction.reply({ content: `Ticket channel has been renamed to **${sanitizedName}**.` });
    } catch (error) {
      console.error('Failed to rename channel:', error);
      await interaction.reply({ content: 'Failed to rename the ticket channel.', flags: [MessageFlags.Ephemeral] });
    }
  }
};
