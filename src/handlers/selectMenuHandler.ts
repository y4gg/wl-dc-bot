import { StringSelectMenuInteraction, ChannelType, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { dataManager } from '../models/DataManager';
import { createTicketEmbed, getTicketButtons } from '../utils/ticketEmbed';

export async function handleTagSelection(interaction: StringSelectMenuInteraction) {
  const selectedTag = interaction.values[0];
  const settings = dataManager.getSettings();

  if (!settings.categoryId) {
    await interaction.reply({ 
      content: 'Ticket category has not been configured.', 
      flags: [MessageFlags.Ephemeral] 
    });
    return;
  }

  const guild = interaction.guild;
  const category = guild.channels.cache.get(settings.categoryId);

  if (!category || category.type !== ChannelType.GuildCategory) {
    await interaction.reply({ 
      content: 'Invalid ticket category.', 
      flags: [MessageFlags.Ephemeral] 
    });
    return;
  }

  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  const channelName = `ticket-${interaction.user.username}-${Date.now().toString().slice(-4)}`;
  
  try {
    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: interaction.client.user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles', 'ManageMessages']
        },
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

    const embed = createTicketEmbed(ticket);
    const buttons = getTicketButtons(ticket, settings);

    const embedMessage = await ticketChannel.send({
      embeds: [embed],
      components: [buttons]
    });

    dataManager.updateTicket(ticket.id, { embedMessageId: embedMessage.id });

    await ticketChannel.send({
      content: `Welcome, ${interaction.user}! Your ticket has been created with the tag: **${selectedTag}**\n\nPlease describe your issue and our support team will be with you shortly.`
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
