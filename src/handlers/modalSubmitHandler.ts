import { ModalSubmitInteraction, MessageFlags } from 'discord.js';
import { dataManager } from '../models/DataManager';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export async function handleFormModalSubmit(interaction: ModalSubmitInteraction) {
  const formId = interaction.customId.replace('form_modal_', '');
  const form = dataManager.getFormById(formId);

  if (!form) {
    await interaction.reply({ 
      content: 'This form no longer exists.', 
      flags: [MessageFlags.Ephemeral] 
    });
    return;
  }

  const responses: Record<string, string> = {};
  form.questions.forEach((_, index) => {
    responses[form.questions[index].label] = interaction.fields.getTextInputValue(`question_${index}`);
  });

  const submission = {
    formId,
    formName: form.name,
    userId: interaction.user.id,
    userName: interaction.user.username,
    responses,
    submittedAt: Date.now()
  };

  const submissionsPath = join(process.cwd(), 'data', 'form_submissions.json');
  let submissions = [];

  try {
    const file = readFileSync(submissionsPath, 'utf-8');
    submissions = JSON.parse(file);
  } catch (error) {
    submissions = [];
  }

  submissions.push(submission);
  writeFileSync(submissionsPath, JSON.stringify(submissions, null, 2));

  dataManager.addFormSubmission(formId, interaction.user.id);

  await interaction.reply({ 
    content: `Your submission for **${form.name}** has been received. Thank you!`, 
    flags: [MessageFlags.Ephemeral] 
  });
}
