import { Message, TextChannel } from 'discord.js';
import { Transcript } from '../types';
import { writeFileSync } from 'fs';
import { cwd } from 'process';
import { join } from 'path';

export async function generateTranscript(channel: TextChannel, ticketId: string, userId: string): Promise<Transcript> {
  const messages: Transcript['messages'] = [];
  
  let lastId: string | undefined;
  let hasMore = true;
  
  while (hasMore) {
    const fetchedMessages = await channel.messages.fetch({
      limit: 100,
      before: lastId
    });
    
    fetchedMessages.forEach(msg => {
      messages.push({
        author: msg.author.username,
        authorId: msg.author.id,
        content: msg.content,
        timestamp: msg.createdTimestamp,
        isBot: msg.author.bot
      });
    });
    
    lastId = fetchedMessages.last()?.id;
    hasMore = fetchedMessages.size === 100;
  }
  
  messages.reverse();
  
  const transcript: Transcript = {
    ticketId,
    channelId: channel.id,
    userId,
    createdAt: Date.now(),
    messages
  };
  
  return transcript;
}

export function saveTranscriptToFile(transcript: Transcript): string {
  const filename = `transcript-${transcript.ticketId}-${Date.now()}.txt`;
  const filepath = join(cwd(), 'data/transcripts', filename);
  
  let content = `Ticket Transcript - ${transcript.ticketId}\n`;
  content += `User ID: ${transcript.userId}\n`;
  content += `Channel ID: ${transcript.channelId}\n`;
  content += `Created: ${new Date(transcript.createdAt).toISOString()}\n`;
  content += '='.repeat(50) + '\n\n';
  
  transcript.messages.forEach(msg => {
    const timestamp = new Date(msg.timestamp).toLocaleString();
    const botTag = msg.isBot ? '[BOT] ' : '';
    content += `[${timestamp}] ${botTag}${msg.author} (${msg.authorId}):\n`;
    content += `${msg.content}\n`;
    content += '-'.repeat(50) + '\n';
  });
  
  writeFileSync(filepath, content);
  
  return filepath;
}

export function formatTranscriptAsText(transcript: Transcript): string {
  let content = `**Ticket Transcript** - ${transcript.ticketId}\n`;
  content += `User ID: ${transcript.userId}\n`;
  content += `Created: ${new Date(transcript.createdAt).toLocaleString()}\n`;
  content += '='.repeat(50) + '\n\n';
  
  transcript.messages.forEach(msg => {
    const timestamp = new Date(msg.timestamp).toLocaleString();
    const botTag = msg.isBot ? '[BOT] ' : '';
    content += `[${timestamp}] ${botTag}${msg.author}:\n`;
    content += `${msg.content}\n`;
    content += '-'.repeat(30) + '\n';
  });
  
  return content;
}
