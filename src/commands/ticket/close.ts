import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { dataManager } from '../../models/DataManager';
import { canCloseTicket } from '../../utils/permissionChecks';
import { generateTranscript, saveTranscriptToFile } from '../../utils/transcriptGenerator';

export default {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close the current ticket'),

  async execute(interaction: any) {
    const channel = interaction.channel;
    const ticket = dataManager.getTicketByChannelId(channel.id);

    if (!ticket) {
      await interaction.reply({ content: 'This is not a ticket channel.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    if (!canCloseTicket(interaction, ticket.userId)) {
      await interaction.reply({ content: 'You do not have permission to close this ticket.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    const permissions = channel.permissionsFor(interaction.client.user);
    if (!permissions || !permissions.has('ViewChannel') || !permissions.has('ReadMessageHistory')) {
      await interaction.reply({ 
        content: 'I do not have permission to access this channel. Please contact an administrator.', 
        flags: [MessageFlags.Ephemeral] 
      });
      return;
    }

    await interaction.deferReply();

    let transcript;
    let filepath;

    try {
      transcript = await generateTranscript(channel as any, ticket.id, ticket.userId);
      filepath = saveTranscriptToFile(transcript);
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
    } catch (error) {
      console.error('Failed to generate transcript:', error);
      await channel.send({
        content: `Ticket has been closed by ${interaction.user.username}.\nFailed to save transcript due to permission issues.`
      });
    }

    try {
      await channel.delete();
    } catch (error) {
      console.error('Failed to delete channel:', error);
    }
    
    dataManager.deleteTicket(ticket.id);
  }
};
