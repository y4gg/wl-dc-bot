import { ButtonInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags } from 'discord.js';
import { dataManager } from '../models/DataManager';

function getTicketBanMessage(): string {
  return 'You are banned from opening tickets on this bot. Please contact an administrator if you believe this is a mistake.';
}

function getTicketLimitMessage(limit: number): string {
  return `You have reached the open ticket limit (**${limit}**). Please close one of your existing tickets before opening another.`;
}

export async function handleCreateTicket(interaction: ButtonInteraction) {
  const settings = await dataManager.getSettings();

  if (!settings.categoryId) {
    await interaction.reply({ 
      content: 'Ticket category has not been configured. Please use /setup ticketcategory first.', 
      flags: [MessageFlags.Ephemeral] 
    });
    return;
  }

  if (settings.tags.length === 0) {
    await interaction.reply({ 
      content: 'No tags have been configured. Please use /setup tags first.', 
      flags: [MessageFlags.Ephemeral] 
    });
    return;
  }

  if (settings.bannedUserIds.includes(interaction.user.id)) {
    await interaction.reply({ 
      content: getTicketBanMessage(),
      flags: [MessageFlags.Ephemeral] 
    });
    return;
  }

  const openTickets = await dataManager.getOpenTicketsByUser(interaction.user.id);

  if (openTickets.length >= settings.maxOpenTicketsPerUser) {
    await interaction.reply({ 
      content: getTicketLimitMessage(settings.maxOpenTicketsPerUser),
      flags: [MessageFlags.Ephemeral] 
    });
    return;
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('select_tag')
    .setPlaceholder('Select a tag for your ticket')
    .addOptions(
      settings.tags.map(tag => 
        new StringSelectMenuOptionBuilder()
          .setLabel(tag)
          .setValue(tag)
      )
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(selectMenu);

  await interaction.reply({
    content: 'Please select a tag for your ticket:',
    components: [row],
    flags: [MessageFlags.Ephemeral]
  });
}
