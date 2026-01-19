import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, TextChannel } from 'discord.js';
import { Ticket } from '../types';
import { dataManager } from '../models/DataManager';

export function createTicketEmbed(ticket: Ticket): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('📝 Ticket Information')
    .setTimestamp();

  const statusEmoji = ticket.status === 'open' ? '🟢' : '🔵';
  const statusText = ticket.status === 'open' ? 'Open' : 'Claimed';
  
  let claimedByText = 'Not claimed';
  if (ticket.claimedBy) {
    claimedByText = `<@${ticket.claimedBy}>`;
  }

  embed.addFields([
    { name: 'Ticket ID', value: ticket.id, inline: true },
    { name: 'Tag', value: ticket.tag, inline: true },
    { name: 'Created by', value: `<@${ticket.userId}>`, inline: true },
    { name: 'Status', value: `${statusEmoji} ${statusText}`, inline: true },
    { name: 'Claimed by', value: claimedByText, inline: true }
  ]);

  return embed;
}

export function getTicketButtons(ticket: Ticket, settings: any): ActionRowBuilder<ButtonBuilder> {
  const closeButton = new ButtonBuilder()
    .setCustomId('close_ticket')
    .setLabel('Close Ticket')
    .setStyle(ButtonStyle.Danger);

  const claimButton = new ButtonBuilder()
    .setCustomId('claim_ticket')
    .setLabel('Claim Ticket')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(ticket.status === 'claimed');

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(closeButton, claimButton);

  return row;
}

export async function updateTicketEmbed(
  client: Client, 
  ticket: Ticket
): Promise<void> {
  try {
    const channel = await client.channels.fetch(ticket.channelId) as TextChannel;
    if (!channel || !ticket.embedMessageId) return;

    const settings = dataManager.getSettings();
    const embed = createTicketEmbed(ticket);
    const buttons = getTicketButtons(ticket, settings);

    const message = await channel.messages.fetch(ticket.embedMessageId);
    if (message) {
      await message.edit({
        embeds: [embed],
        components: [buttons]
      });
    }
  } catch (error) {
    console.error('Failed to update ticket embed:', error);
  }
}
