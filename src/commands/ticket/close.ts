import { SlashCommandBuilder } from 'discord.js';
import { dataManager } from '../../models/DataManager';
import { canCloseTicket } from '../../utils/permissionChecks';
import { generateTranscript, saveTranscriptToFile, formatTranscriptAsText } from '../../utils/transcriptGenerator';

export default {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close the current ticket'),

  async execute(interaction: any) {
    const channel = interaction.channel;
    const ticket = dataManager.getTicketByChannelId(channel.id);

    if (!ticket) {
      await interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
      return;
    }

    if (!canCloseTicket(interaction, ticket.userId)) {
      await interaction.reply({ content: 'You do not have permission to close this ticket.', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const transcript = await generateTranscript(channel as any, ticket.id, ticket.userId);
    const filepath = saveTranscriptToFile(transcript);
    
    dataManager.addTranscript(transcript);
    dataManager.updateTicket(ticket.id, { status: 'closed', transcript: filepath });

    try {
      const user = await interaction.client.users.fetch(ticket.userId);
      await user.send({
        content: `Your ticket **${ticket.id}** has been closed.\n\nHere is a transcript of your conversation:`,
        files: [filepath]
      });
    } catch (error) {
      console.error('Failed to send transcript to user:', error);
    }

    await channel.send({
      content: `Ticket has been closed by ${interaction.user.username}.\nTranscript has been saved and sent to the ticket creator.`
    });

    await channel.delete();
    dataManager.deleteTicket(ticket.id);

    await interaction.followUp({ content: 'Ticket closed successfully.', ephemeral: true });
  }
};
