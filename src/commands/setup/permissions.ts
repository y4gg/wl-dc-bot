import { SlashCommandSubcommandBuilder } from 'discord.js';
import { dataManager } from '../../models/DataManager';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('permissions')
    .setDescription('Configure ticket permissions')
    .addStringOption(option =>
      option.setName('setting')
        .setDescription('Permission setting to configure')
        .setRequired(true)
        .addChoices(
          { name: 'User Can Close', value: 'userCanClose' }
        )
    )
    .addStringOption(option =>
      option.setName('value')
        .setDescription('Set value')
        .setRequired(true)
        .addChoices(
          { name: 'Enable', value: 'true' },
          { name: 'Disable', value: 'false' }
        )
    )
    .addStringOption(option =>
      option.setName('view')
        .setDescription('View current settings')
        .setRequired(false)
        .addChoices(
          { name: 'Yes', value: 'yes' },
          { name: 'No', value: 'no' }
        )
    ),

  async execute(interaction: any) {
    const view = interaction.options.getString('view');
    const settings = dataManager.getSettings();

    if (view === 'yes') {
      const permissionsList = `
**Current Ticket Permissions:**
━━━━━━━━━━━━━━━━━━
• User Can Close: ${settings.userCanClose ? '✅ Enabled' : '❌ Disabled'}
`;

      await interaction.reply({ content: permissionsList, ephemeral: true });
      return;
    }

    const setting = interaction.options.getString('setting');
    const value = interaction.options.getString('value');

    if (setting === 'userCanClose') {
      const newValue = value === 'true';
      dataManager.updateSettings({ userCanClose: newValue });
      
      await interaction.reply({ 
        content: `User can close tickets has been **${newValue ? 'enabled' : 'disabled'}**.`, 
        ephemeral: true 
      });
    }
  }
};
