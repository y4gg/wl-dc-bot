# Discord Ticket Bot

A feature-rich Discord ticket bot built with TypeScript, Bun, and discord.js.

## Features

- 🎫 Create tickets with customizable tags
- 🚧 Configurable per-user open ticket limits
- ⛔ Ticket bans for blocked users
- 🔒 Permission-based access control (Admin/Support roles)
- 📝 Automatic ticket transcripts on close
- ⏰ Auto-close inactive tickets with warnings
- 🎯 Ticket claiming system for support staff
- 👥 Add/remove users from tickets
- ✏️ Rename ticket channels
- 📊 Generate transcripts on demand

## Setup

### Prerequisites

- Node.js and npm, or Bun runtime
- Discord Bot Token and Client ID

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wl-dc-bot
```

2. Install dependencies:
```bash
bun install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Discord bot credentials:
```
DISCORD_BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
```

### Running the Bot

Development mode:
```bash
bun run dev
```

Production mode:
```bash
bun run build
bun run start
```

## Commands

### Setup Commands

Use `/setup` to configure your ticket bot:

- `/setup tags` - Configure ticket tags (dropdown options)
  - Add, remove, or clear tags
  - List all configured tags

- `/setup ticketchannel` - Send the "Create Ticket" button
  - Select a channel to send the button message

- `/setup ticketcategory` - Set ticket category
  - Choose which category to create ticket channels in

- `/setup roles` - Manage admin and support roles
  - Add or remove admin/support roles
  - List configured roles

- `/setup permissions` - Manage boolean ticket permissions
  - Configure whether users can close their own tickets

- `/setup limit` - Configure per-user open ticket limits
  - Set the maximum number of active tickets per user
  - View the current limit

- `/ticketban` - Manage ticket bans
  - Add or remove users from creating tickets
  - List banned users

### Ticket Commands

Available in ticket channels:

- `/close` - Close the current ticket
  - Generates and saves transcript
  - Sends transcript to ticket creator via DM

- `/claim` - Claim the ticket
  - Only available to support/admin roles
  - Marks ticket as claimed

- `/adduser` - Add a user to the ticket
  - Grants access to specified user

- `/removeuser` - Remove a user from the ticket
  - Removes access from specified user

- `/rename` - Rename the ticket channel
  - Change the channel name

- `/transcript` - Generate and send transcript
  - Creates transcript and sends to user

## Workflow

1. **Initial Setup**
   - Use `/setup tags` to add ticket categories
   - Use `/setup ticketcategory` to set where tickets are created
   - Use `/setup roles` to configure admin/support roles
   - Use `/setup limit` to configure how many open tickets each user can have
   - Use `/ticketban` to block specific users from creating tickets
   - Use `/setup ticketchannel` to send the Create Ticket button

2. **User Creates Ticket**
   - User clicks "Create Ticket" button
   - Bot checks whether the user is banned or already at their open-ticket limit
   - User selects a tag for their ticket
   - Ticket channel is created with proper permissions

3. **Support Process**
   - Support staff claims ticket with `/claim`
   - Staff communicates with user
   - Optionally add other users with `/adduser`

4. **Close Ticket**
   - Use `/close` to close ticket
   - Transcript is automatically generated and sent to user
   - Channel is deleted

## Auto-Close Feature

- Tickets inactive for 24 hours (configurable) receive a warning
- Tickets remain inactive for 48 hours total are automatically closed
- Transcripts are saved and sent to ticket creators
- Channels are deleted

## Data Storage

Data is stored locally in SQLite with Drizzle ORM:

- `data/bot.db` - Main database
  - Bot configuration
  - Active tickets
  - Archived transcript payloads

- `settings.json` and `data/tickets.json` are treated as legacy import sources only
  - If the database is empty on first startup, their contents are imported once
  - Runtime reads and writes no longer use these files

Transcript files are saved in `data/transcripts/` directory (local only, not in git).

## Permissions

### Admin Roles
- Can view all tickets
- Can claim, close, rename tickets
- Can add/remove users
- Can generate transcripts

### Support Roles
- Can view all tickets
- Can claim, close, rename tickets
- Can add/remove users
- Can generate transcripts

### Ticket Creator
- Can only view their own tickets
- Can close their own tickets
- Can rename their own tickets

## Troubleshooting

### Bot doesn't respond to commands
- Ensure bot has proper permissions in the server
- Check that `.env` contains correct credentials
- Verify bot is online with `/dev` commands if available

### Tickets not creating
- Check that ticket category is set with `/setup ticketcategory`
- Verify tags are configured with `/setup tags`
- Ensure bot has permission to create channels and manage permissions
- Confirm the user is not banned with `/ticketban`
- Confirm the user has not reached the configured limit from `/setup limit`

### Auto-close not working
- Check bot has sufficient permissions
- Verify `data/bot.db` is writable
- Check console for error messages

## Development

The bot uses:
- TypeScript for type safety
- Bun for fast development and runtime
- discord.js v14 for Discord API interactions
- SQLite + Drizzle ORM for persistence

## License

MIT
