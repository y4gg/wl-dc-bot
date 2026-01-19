import { SlashCommandSubcommandBuilder, MessageFlags } from 'discord.js';
import { dataManager } from '../../models/DataManager';

export default {
  data: new SlashCommandSubcommandBuilder()
    .setName('roles')
    .setDescription('Manage admin and support roles')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Role type to manage')
        .setRequired(true)
        .addChoices(
          { name: 'Admin', value: 'admin' },
          { name: 'Support', value: 'support' }
        )
    )
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Add or remove role')
        .setRequired(true)
        .addChoices(
          { name: 'Add', value: 'add' },
          { name: 'Remove', value: 'remove' },
          { name: 'List', value: 'list' }
        )
    )
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to add or remove')
        .setRequired(false)
    ),

  async execute(interaction: any) {
    const type = interaction.options.getString('type');
    const action = interaction.options.getString('action');
    const role = interaction.options.getRole('role');

    const settings = dataManager.getSettings();

    if (action === 'list') {
      const roleType = type === 'admin' ? 'Admin' : 'Support';
      const roles = type === 'admin' ? settings.adminRoles : settings.supportRoles;
      
      if (roles.length === 0) {
        await interaction.reply({ content: `No ${roleType.toLowerCase()} roles configured.`, flags: [MessageFlags.Ephemeral] });
        return;
      }

      const roleList = roles.map(roleId => {
        const r = interaction.guild.roles.cache.get(roleId);
        return r ? `- ${r.name} (${roleId})` : `- Unknown role (${roleId})`;
      }).join('\n');

      await interaction.reply({ content: `${roleType} roles:\n${roleList}`, flags: [MessageFlags.Ephemeral] });
      return;
    }

    if (!role) {
      await interaction.reply({ content: 'Please select a role to add or remove.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    const targetArray = type === 'admin' ? settings.adminRoles : settings.supportRoles;

    if (action === 'add') {
      if (targetArray.includes(role.id)) {
        await interaction.reply({ content: 'This role is already added.', flags: [MessageFlags.Ephemeral] });
        return;
      }

      const newArray = [...targetArray, role.id];
      
      if (type === 'admin') {
        dataManager.updateSettings({ adminRoles: newArray });
      } else {
        dataManager.updateSettings({ supportRoles: newArray });
      }

      await interaction.reply({ content: `Role **${role.name}** has been added as ${type}.`, flags: [MessageFlags.Ephemeral] });
    } else if (action === 'remove') {
      if (!targetArray.includes(role.id)) {
        await interaction.reply({ content: 'This role is not configured.', flags: [MessageFlags.Ephemeral] });
        return;
      }

      const newArray = targetArray.filter(id => id !== role.id);
      
      if (type === 'admin') {
        dataManager.updateSettings({ adminRoles: newArray });
      } else {
        dataManager.updateSettings({ supportRoles: newArray });
      }

      await interaction.reply({ content: `Role **${role.name}** has been removed from ${type}.`, flags: [MessageFlags.Ephemeral] });
    }
  }
};
