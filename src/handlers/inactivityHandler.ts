import { Client, TextChannel } from 'discord.js';
import { dataManager } from '../models/DataManager';
import { generateTranscript, saveTranscriptToFile } from '../utils/transcriptGenerator';

export function startInactivityCheck(client: Client) {
  setInterval(async () => {
    const settings = dataManager.getSettings();
    const inactiveTickets = dataManager.getInactiveTickets(settings.autoCloseHours);

    for (const ticket of inactiveTickets) {
      try {
        const channel = await client.channels.fetch(ticket.channelId) as TextChannel;
        
        if (!channel) {
          console.log(`Channel ${ticket.channelId} not found, deleting ticket ${ticket.id}`);
          dataManager.deleteTicket(ticket.id);
          continue;
        }

        const inactiveHours = Math.floor((Date.now() - ticket.lastActivity) / (1000 * 60 * 60));
        
        await channel.send({
          content: `⚠️ **Ticket Auto-Close Warning**\n\nThis ticket has been inactive for ${inactiveHours} hours. It will be automatically closed in 24 hours if there is no activity.`
        });

        setTimeout(async () => {
          const updatedTicket = dataManager.getTicketById(ticket.id);
          
          if (!updatedTicket || updatedTicket.status === 'closed') {
            return;
          }

          const currentInactiveHours = Math.floor((Date.now() - updatedTicket.lastActivity) / (1000 * 60 * 60));
          
          if (currentInactiveHours >= settings.autoCloseHours + 24) {
            try {
              const updatedChannel = await client.channels.fetch(updatedTicket.channelId) as TextChannel;
              
              if (updatedChannel) {
                const transcript = await generateTranscript(updatedChannel, updatedTicket.id, updatedTicket.userId);
                const filepath = saveTranscriptToFile(transcript);
                
                dataManager.addTranscript(transcript);
                dataManager.updateTicket(updatedTicket.id, { status: 'closed', transcript: filepath });

                try {
                  const user = await client.users.fetch(updatedTicket.userId);
                  await user.send({
                    content: `Your ticket **${updatedTicket.id}** has been automatically closed due to inactivity.\n\nHere is a transcript of your conversation:`,
                    files: [filepath]
                  });
                } catch (error) {
                  console.error('Failed to send transcript to user:', error);
                }

                await updatedChannel.send({
                  content: `Ticket has been automatically closed due to inactivity.\nTranscript has been saved and sent to the ticket creator.`
                });

                await updatedChannel.delete();
                dataManager.deleteTicket(updatedTicket.id);
              }
            } catch (error) {
              console.error(`Failed to auto-close ticket ${updatedTicket.id}:`, error);
            }
          }
        }, 24 * 60 * 60 * 1000);
      } catch (error) {
        console.error(`Failed to check inactivity for ticket ${ticket.id}:`, error);
      }
    }
  }, 60 * 60 * 1000);
}
