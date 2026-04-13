import { SlashCommandSubcommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { dataManager } from '../../models/DataManager';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('ticketchannel')
    .setDescription('Send the Create Ticket button message')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to send the message to')
        .setRequired(true)
    ),

  async execute(interaction: any) {
    const channel = interaction.options.getChannel('channel');

    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({ content: 'Please select a text channel.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    const botMember = interaction.guild?.members.me;
    const permissions = botMember ? channel.permissionsFor(botMember) : null;

    if (!permissions || !permissions.has(PermissionFlagsBits.ViewChannel) || !permissions.has(PermissionFlagsBits.SendMessages)) {
      await interaction.reply({
        content: 'I do not have permission to send messages in that channel. Please update the channel permissions and try again.',
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('Create Ticket')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(button);

    try {
      const message = await channel.send({
        content: 'Click the button below to create a support ticket.',
        components: [row]
      });

      await dataManager.updateSettings({
        channelId: channel.id,
        messageId: message.id
      });

      await interaction.reply({ content: 'Create Ticket button has been sent!', flags: [MessageFlags.Ephemeral] });
    } catch (error) {
      console.error('Failed to send create ticket button message:', error);
      await interaction.reply({
        content: 'Failed to send the Create Ticket button in that channel. Please verify my channel permissions and try again.',
        flags: [MessageFlags.Ephemeral]
      });
    }
  }
};
