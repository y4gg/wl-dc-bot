import { GuildMember, Interaction } from 'discord.js';
import { dataManager } from '../models/DataManager';

export function isAdmin(member: GuildMember): boolean {
  const settings = dataManager.getSettings();
  return member.roles.cache.some(role => settings.adminRoles.includes(role.id));
}

export function isSupport(member: GuildMember): boolean {
  const settings = dataManager.getSettings();
  return member.roles.cache.some(role => 
    settings.supportRoles.includes(role.id) || settings.adminRoles.includes(role.id)
  );
}

export function canManageTicket(interaction: Interaction, ticketUserId: string): boolean {
  if (!interaction.member || !('roles' in interaction.member)) return false;
  
  const member = interaction.member as GuildMember;
  const isTicketCreator = member.id === ticketUserId;
  
  return isAdmin(member) || isSupport(member) || isTicketCreator;
}

export function canClaimTicket(interaction: Interaction): boolean {
  if (!interaction.member || !('roles' in interaction.member)) return false;
  
  const member = interaction.member as GuildMember;
  return isSupport(member);
}

export function canViewTicket(interaction: Interaction, ticketUserId: string): boolean {
  if (!interaction.member || !('roles' in interaction.member)) return false;
  
  const member = interaction.member as GuildMember;
  const isTicketCreator = member.id === ticketUserId;
  
  return isAdmin(member) || isSupport(member) || isTicketCreator;
}

export function canCloseTicket(interaction: Interaction, ticketUserId: string): boolean {
  if (!interaction.member || !('roles' in interaction.member)) return false;
  
  const member = interaction.member as GuildMember;
  const isTicketCreator = member.id === ticketUserId;
  const settings = dataManager.getSettings();
  const userCanClose = settings.userCanClose;
  
  if (isAdmin(member) || isSupport(member)) return true;
  
  if (isTicketCreator && userCanClose) return true;
  
  return false;
}

export function hasAdminOrSupport(interaction: Interaction): boolean {
  if (!interaction.member || !('roles' in interaction.member)) return false;
  
  const member = interaction.member as GuildMember;
  return isAdmin(member) || isSupport(member);
}
