import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { dataManager } from '../models/DataManager';

export default {
  data: new SlashCommandBuilder()
    .setName('ticketban')
    .setDescription('Ban users from creating tickets')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Manage ticket bans')
        .setRequired(true)
        .addChoices(
          { name: 'Add', value: 'add' },
          { name: 'List', value: 'list' },
          { name: 'Remove', value: 'remove' }
        )
    )
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to ban or unban from creating tickets')
        .setRequired(false)
    ),

  async execute(interaction: any) {
    const action = interaction.options.getString('action');
    const user = interaction.options.getUser('user');
    const settings = await dataManager.getSettings();

    if (action === 'list') {
      if (settings.bannedUserIds.length === 0) {
        await interaction.reply({
          content: 'No users are banned from creating tickets.',
          flags: [MessageFlags.Ephemeral]
        });
        return;
      }

      const bannedUsers = settings.bannedUserIds
        .map(userId => `- <@${userId}> (${userId})`)
        .join('\n');

      await interaction.reply({
        content: `Users banned from creating tickets:\n${bannedUsers}`,
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    if (!user) {
      await interaction.reply({
        content: 'Please select a user to ban or unban.',
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    if (action === 'add') {
      if (settings.bannedUserIds.includes(user.id)) {
        await interaction.reply({
          content: 'This user is already banned from creating tickets.',
          flags: [MessageFlags.Ephemeral]
        });
        return;
      }

      await dataManager.updateSettings({
        bannedUserIds: [...settings.bannedUserIds, user.id]
      });

      await interaction.reply({
        content: `User **${user.username}** has been banned from creating tickets.`,
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    if (action === 'remove') {
      if (!settings.bannedUserIds.includes(user.id)) {
        await interaction.reply({
          content: 'This user is not banned from creating tickets.',
          flags: [MessageFlags.Ephemeral]
        });
        return;
      }

      await dataManager.updateSettings({
        bannedUserIds: settings.bannedUserIds.filter(userId => userId !== user.id)
      });

      await interaction.reply({
        content: `User **${user.username}** has been unbanned from creating tickets.`,
        flags: [MessageFlags.Ephemeral]
      });
    }
  }
};
