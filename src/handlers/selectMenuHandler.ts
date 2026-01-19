import { StringSelectMenuInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';
import { dataManager } from '../models/DataManager';

export async function handleTagSelection(interaction: StringSelectMenuInteraction) {
  const selectedTag = interaction.values[0];
  const settings = dataManager.getSettings();

  if (!settings.categoryId) {
    await interaction.reply({ 
      content: 'Ticket category has not been configured.', 
      ephemeral: true 
    });
    return;
  }

  const guild = interaction.guild;
  const category = guild.channels.cache.get(settings.categoryId);

  if (!category || category.type !== ChannelType.GuildCategory) {
    await interaction.reply({ 
      content: 'Invalid ticket category.', 
      ephemeral: true 
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const channelName = `ticket-${interaction.user.username}-${Date.now().toString().slice(-4)}`;
  
  try {
    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ['ViewChannel', 'SendMessages']
        },
        {
          id: interaction.user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles', 'EmbedLinks']
        },
        ...settings.adminRoles.map(roleId => ({
          id: roleId,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages']
        })),
        ...settings.supportRoles.map(roleId => ({
          id: roleId,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages']
        }))
      ]
    });

    const ticket = dataManager.createTicket({
      channelId: ticketChannel.id,
      userId: interaction.user.id,
      userName: interaction.user.username,
      tag: selectedTag,
      status: 'open'
    });

    const closeButton = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger);

    const claimButton = new ButtonBuilder()
      .setCustomId('claim_ticket')
      .setLabel('Claim Ticket')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(closeButton, claimButton);

    await ticketChannel.send({
      content: `**Ticket #${ticket.id}**\n\nWelcome, ${interaction.user}! Your ticket has been created with the tag: **${selectedTag}**\n\nPlease describe your issue and our support team will be with you shortly.`,
      components: [row]
    });

    await interaction.editReply({
      content: `Your ticket has been created: **${ticketChannel}**`
    });
  } catch (error) {
    console.error('Failed to create ticket:', error);
    await interaction.editReply({
      content: 'Failed to create ticket. Please contact an administrator.'
    });
  }
}
