import { SlashCommandSubcommandBuilder, MessageFlags } from 'discord.js';
import { dataManager } from '../../models/DataManager';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('tags')
    .setDescription('Configure ticket tags')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Add or remove tags')
        .setRequired(true)
        .addChoices(
          { name: 'Add', value: 'add' },
          { name: 'Remove', value: 'remove' },
          { name: 'Clear', value: 'clear' }
        )
    )
    .addStringOption(option =>
      option.setName('tag')
        .setDescription('Tag to add or remove')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('list')
        .setDescription('List all tags')
        .setRequired(false)
        .addChoices(
          { name: 'Yes', value: 'yes' },
          { name: 'No', value: 'no' }
        )
    ),

  async execute(interaction: any) {
    const action = interaction.options.getString('action');
    const tag = interaction.options.getString('tag');
    const list = interaction.options.getString('list');

    const settings = dataManager.getSettings();

    if (list === 'yes') {
      if (settings.tags.length === 0) {
        await interaction.reply({ content: 'No tags configured.', flags: [MessageFlags.Ephemeral] });
        return;
      }
      
      const tagList = settings.tags.map((t, i) => `${i + 1}. ${t}`).join('\n');
      await interaction.reply({ content: `Current tags:\n${tagList}`, flags: [MessageFlags.Ephemeral] });
      return;
    }

    if (action === 'clear') {
      dataManager.updateSettings({ tags: [] });
      await interaction.reply({ content: 'All tags have been cleared.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    if (!tag) {
      await interaction.reply({ content: 'Please provide a tag to add or remove.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    if (action === 'add') {
      if (settings.tags.includes(tag)) {
        await interaction.reply({ content: 'This tag already exists.', flags: [MessageFlags.Ephemeral] });
        return;
      }
      
      const newTags = [...settings.tags, tag];
      dataManager.updateSettings({ tags: newTags });
      await interaction.reply({ content: `Tag "${tag}" has been added.`, flags: [MessageFlags.Ephemeral] });
    } else if (action === 'remove') {
      if (!settings.tags.includes(tag)) {
        await interaction.reply({ content: 'This tag does not exist.', flags: [MessageFlags.Ephemeral] });
        return;
      }
      
      const newTags = settings.tags.filter(t => t !== tag);
      dataManager.updateSettings({ tags: newTags });
      await interaction.reply({ content: `Tag "${tag}" has been removed.`, flags: [MessageFlags.Ephemeral] });
    }
  }
};
