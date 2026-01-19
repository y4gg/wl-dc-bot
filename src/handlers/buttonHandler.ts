import { ButtonInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags } from 'discord.js';
import { dataManager } from '../models/DataManager';

export async function handleCreateTicket(interaction: ButtonInteraction) {
  const settings = dataManager.getSettings();

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

  const existingTicket = dataManager.getTicketsByUser(interaction.user.id).find(t => t.status !== 'closed');
  
  if (existingTicket) {
    await interaction.reply({ 
      content: `You already have an open ticket: **<#${existingTicket.channelId}>**`, 
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
