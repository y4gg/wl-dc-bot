import { SlashCommandSubcommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
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
    const settings = dataManager.getSettings();

    if (!channel || channel.type !== 0) {
      await interaction.reply({ content: 'Please select a text channel.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('Create Ticket')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(button);

    const message = await channel.send({
      content: 'Click the button below to create a support ticket.',
      components: [row]
    });

    dataManager.updateSettings({
      channelId: channel.id,
      messageId: message.id
    });

    await interaction.reply({ content: 'Create Ticket button has been sent!', flags: [MessageFlags.Ephemeral] });
  }
};
