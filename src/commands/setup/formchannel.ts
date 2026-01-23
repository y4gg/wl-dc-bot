import { SlashCommandSubcommandBuilder, MessageFlags } from 'discord.js';
import { dataManager } from '../../models/DataManager';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('formchannel')
    .setDescription('Set the channel where forms will be posted')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to post forms to')
        .setRequired(true)
    ),

  async execute(interaction: any) {
    const channel = interaction.options.getChannel('channel');

    if (!channel || channel.type !== 0) {
      await interaction.reply({ content: 'Please select a text channel.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    dataManager.updateSettings({
      formChannelId: channel.id
    });

    await interaction.reply({ content: `Forms will be posted to <#${channel.id}>.`, flags: [MessageFlags.Ephemeral] });
  }
};
