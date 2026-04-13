import { GuildMember, Interaction } from 'discord.js';
import { dataManager } from '../models/DataManager';

export async function isAdmin(member: GuildMember): Promise<boolean> {
  const settings = await dataManager.getSettings();
  return member.roles.cache.some(role => settings.adminRoles.includes(role.id));
}

export async function isSupport(member: GuildMember): Promise<boolean> {
  const settings = await dataManager.getSettings();
  return member.roles.cache.some(role => 
    settings.supportRoles.includes(role.id) || settings.adminRoles.includes(role.id)
  );
}

export async function canManageTicket(interaction: Interaction, ticketUserId: string): Promise<boolean> {
  if (!interaction.member || !('roles' in interaction.member)) return false;
  
  const member = interaction.member as GuildMember;
  const isTicketCreator = member.id === ticketUserId;
  
  return await isAdmin(member) || await isSupport(member) || isTicketCreator;
}

export async function canClaimTicket(interaction: Interaction): Promise<boolean> {
  if (!interaction.member || !('roles' in interaction.member)) return false;
  
  const member = interaction.member as GuildMember;
  return await isSupport(member);
}

export async function canViewTicket(interaction: Interaction, ticketUserId: string): Promise<boolean> {
  if (!interaction.member || !('roles' in interaction.member)) return false;
  
  const member = interaction.member as GuildMember;
  const isTicketCreator = member.id === ticketUserId;
  
  return await isAdmin(member) || await isSupport(member) || isTicketCreator;
}

export async function canCloseTicket(interaction: Interaction, ticketUserId: string): Promise<boolean> {
  if (!interaction.member || !('roles' in interaction.member)) return false;
  
  const member = interaction.member as GuildMember;
  const isTicketCreator = member.id === ticketUserId;
  const settings = await dataManager.getSettings();
  const userCanClose = settings.userCanClose;
  
  if (await isAdmin(member) || await isSupport(member)) return true;
  
  if (isTicketCreator && userCanClose) return true;
  
  return false;
}

export async function hasAdminOrSupport(interaction: Interaction): Promise<boolean> {
  if (!interaction.member || !('roles' in interaction.member)) return false;
  
  const member = interaction.member as GuildMember;
  return await isAdmin(member) || await isSupport(member);
}
