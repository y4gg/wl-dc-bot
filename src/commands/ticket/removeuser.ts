import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { dataManager } from '../../models/DataManager';
import { hasAdminOrSupport } from '../../utils/permissionChecks';

export default {
  data: new SlashCommandBuilder()
    .setName('removeuser')
    .setDescription('Remove a user from the ticket')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to remove')
        .setRequired(true)
    ),

  async execute(interaction: any) {
    const channel = interaction.channel;
    const ticket = dataManager.getTicketByChannelId(channel.id);

    if (!ticket) {
      await interaction.reply({ content: 'This is not a ticket channel.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    if (!hasAdminOrSupport(interaction)) {
      await interaction.reply({ content: 'You do not have permission to remove users from tickets.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    const user = interaction.options.getUser('user');
    
    if (user.id === ticket.userId) {
      await interaction.reply({ content: 'Cannot remove the ticket creator.', flags: [MessageFlags.Ephemeral] });
      return;
    }
    
    try {
      await channel.permissionOverwrites.delete(user.id);
      await interaction.reply({ content: `${user.username} has been removed from the ticket.` });
    } catch (error) {
      console.error('Failed to remove user:', error);
      await interaction.reply({ content: 'Failed to remove user from the ticket.', flags: [MessageFlags.Ephemeral] });
    }
  }
};
