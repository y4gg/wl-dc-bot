import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { dataManager } from '../../models/DataManager';
import { hasAdminOrSupport } from '../../utils/permissionChecks';

export default {
  data: new SlashCommandBuilder()
    .setName('adduser')
    .setDescription('Add a user to the ticket')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to add')
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
      await interaction.reply({ content: 'You do not have permission to add users to tickets.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    const user = interaction.options.getUser('user');
    
    try {
      await channel.permissionOverwrites.create(user.id, { ViewChannel: true, SendMessages: true });
      await interaction.reply({ content: `${user.username} has been added to the ticket.` });
    } catch (error) {
      console.error('Failed to add user:', error);
      await interaction.reply({ content: 'Failed to add user to the ticket.', flags: [MessageFlags.Ephemeral] });
    }
  }
};
