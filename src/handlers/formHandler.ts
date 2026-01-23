import { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } from 'discord.js';
import { dataManager } from '../models/DataManager';

export async function handleFormSubmitButton(interaction: ButtonInteraction) {
  const formId = interaction.customId.replace('submit_form_', '');
  const form = dataManager.getFormById(formId);

  if (!form) {
    await interaction.reply({ 
      content: 'This form no longer exists.', 
      flags: [MessageFlags.Ephemeral] 
    });
    return;
  }

  if (dataManager.hasUserSubmitted(formId, interaction.user.id)) {
    await interaction.reply({ 
      content: 'You have already submitted this form.', 
      flags: [MessageFlags.Ephemeral] 
    });
    return;
  }

  if (form.questions.length > 5) {
    await interaction.reply({ 
      content: 'This form has too many questions and cannot be displayed.', 
      flags: [MessageFlags.Ephemeral] 
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`form_modal_${formId}`)
    .setTitle(form.name);

  const inputs = form.questions.map((question, index) => {
    const input = new TextInputBuilder()
      .setCustomId(`question_${index}`)
      .setLabel(question.label)
      .setStyle(question.type === 'long' ? TextInputStyle.Paragraph : TextInputStyle.Short);

    return new ActionRowBuilder<TextInputBuilder>().addComponents(input);
  });

  modal.addComponents(...inputs);

  await interaction.showModal(modal);
}
