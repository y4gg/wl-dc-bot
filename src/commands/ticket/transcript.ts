import { SlashCommandBuilder } from 'discord.js';
import { dataManager } from '../../models/DataManager';
import { generateTranscript, saveTranscriptToFile } from '../../utils/transcriptGenerator';
import { hasAdminOrSupport } from '../../utils/permissionChecks';

export default {
  data: new SlashCommandBuilder()
    .setName('transcript')
    .setDescription('Generate and send the ticket transcript'),

  async execute(interaction: any) {
    const channel = interaction.channel;
    const ticket = dataManager.getTicketByChannelId(channel.id);

    if (!ticket) {
      await interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
      return;
    }

    if (!hasAdminOrSupport(interaction)) {
      await interaction.reply({ content: 'You do not have permission to generate transcripts.', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      const transcript = await generateTranscript(channel as any, ticket.id, ticket.userId);
      const filepath = saveTranscriptToFile(transcript);
      
      dataManager.addTranscript(transcript);

      await interaction.followUp({
        content: `Here is the transcript for ticket ${ticket.id}:`,
        files: [filepath]
      });

      try {
        const user = await interaction.client.users.fetch(ticket.userId);
        await user.send({
          content: `A transcript of your ticket has been generated:`,
          files: [filepath]
        });
      } catch (error) {
        console.error('Failed to send transcript to user:', error);
      }
    } catch (error) {
      console.error('Failed to generate transcript:', error);
      await interaction.followUp({ content: 'Failed to generate transcript.', ephemeral: true });
    }
  }
};
