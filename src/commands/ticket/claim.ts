import { SlashCommandBuilder } from 'discord.js';
import { dataManager } from '../../models/DataManager';
import { canClaimTicket } from '../../utils/permissionChecks';

export default {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim the current ticket'),

  async execute(interaction: any) {
    const channel = interaction.channel;
    const ticket = dataManager.getTicketByChannelId(channel.id);

    if (!ticket) {
      await interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
      return;
    }

    if (ticket.status === 'closed') {
      await interaction.reply({ content: 'This ticket is already closed.', ephemeral: true });
      return;
    }

    if (!canClaimTicket(interaction)) {
      await interaction.reply({ content: 'You do not have permission to claim tickets.', ephemeral: true });
      return;
    }

    if (ticket.claimedBy === interaction.user.id) {
      await interaction.reply({ content: 'You have already claimed this ticket.', ephemeral: true });
      return;
    }

    dataManager.updateTicket(ticket.id, { 
      status: 'claimed',
      claimedBy: interaction.user.id 
    });

    await interaction.reply({ 
      content: `Ticket has been claimed by ${interaction.user.username}.` 
    });
  }
};
