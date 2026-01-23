import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { dataManager } from '../../models/DataManager';

export default {
  data: new SlashCommandBuilder()
    .setName('create')
    .setDescription('Create a new form')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Name of the form')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Description of what the form is for')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('questions')
        .setDescription('Questions separated by commas (max 5)')
        .setRequired(true)
    ),

  async execute(interaction: any) {
    const settings = dataManager.getSettings();

    if (!settings.formChannelId) {
      await interaction.reply({ 
        content: 'Form channel has not been configured. Please use /setup formchannel first.', 
        flags: [MessageFlags.Ephemeral] 
      });
      return;
    }

    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const questionsStr = interaction.options.getString('questions');

    const questions = questionsStr.split(',').map((q: string) => q.trim()).filter((q: string) => q.length > 0);

    if (questions.length === 0) {
      await interaction.reply({ 
        content: 'Please provide at least one question.', 
        flags: [MessageFlags.Ephemeral] 
      });
      return;
    }

    if (questions.length > 5) {
      await interaction.reply({ 
        content: 'A form can have a maximum of 5 questions.', 
        flags: [MessageFlags.Ephemeral] 
      });
      return;
    }

    const form = dataManager.createForm(
      name,
      description,
      questions,
      settings.formChannelId,
      interaction.user.id
    );

    const button = new ButtonBuilder()
      .setCustomId(`submit_form_${form.id}`)
      .setLabel('Submit Form')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    const channel = interaction.client.channels.cache.get(settings.formChannelId);
    
    if (!channel || !channel.isTextBased()) {
      await interaction.reply({ 
        content: 'Form channel not found or is not a text channel.', 
        flags: [MessageFlags.Ephemeral] 
      });
      return;
    }

    const message = await channel.send({
      content: `**${name}**\n${description}`,
      components: [row]
    });

    dataManager.updateFormMessage(form.id, message.id);

    await interaction.reply({ 
      content: `Form **${name}** has been created in <#${settings.formChannelId}>.`, 
      flags: [MessageFlags.Ephemeral] 
    });
  }
};
