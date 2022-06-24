# Sudo for Discord

[![](https://sonarcloud.io/api/project_badges/measure?project=clairelizbet_discord-sudo&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=clairelizbet_discord-sudo)
[![](https://sonarcloud.io/api/project_badges/measure?project=clairelizbet_discord-sudo&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=clairelizbet_discord-sudo)

Control access to admin privileges on your server with Sudo for Discord.

Trusted members of your Discord guild can be given access to `/sudo` which grants temporary admin access so that each member is no longer required to have admin access all the time.

## Setup

[![Add to Server](https://i.imgur.com/FnjVKEb.png)](https://discord.com/oauth2/authorize?client_id=984508139472838656&permissions=268435456&scope=bot%20applications.commands)

After adding the bot to your server, place the newly created "sudo" role above the admin role you would like the bot to manage

![To do this, go to Server Settings > Roles and drag "sudo" adove the admin role](https://i.imgur.com/DxKcOVq.gif)

Next, you'll need to choose which users or roles have permission to use sudo. To change this, visit Server Settings > Integrations > sudo.

![Here you can control who has access to the command](https://i.imgur.com/bPRhPFv.png)

## Usage

### `/sudo`

Temporarily grants admin access.

Parameters:

- `duration`
  - How many minutes to grant admin access for
  - Optional
  - Valid range: `1` to `120` (default `5`)

The bot will either use the admin role you've configured or attempt to find an admin role that it has permission to manage, preferring those with "admin" in the name, and assign that role the guild member calling the command.

### `/privileges drop`

Alias: `/unsudo`

Immediately drops your admin privileges.

### `/sudo-config`

Manages Sudo for Discord configuration.

#### `/sudo-config set-admin-role`

Sets the role assigned when granting admin.

Parameters:

- `role`
  - The admin role to grant (bot must have permission to manage the role)

#### `/sudo-config enable-admin-role-autoselect`

Causes the bot to use any available admin role when granting admin. This is the default behavior.

## Running a private instance

You will need to create an app in the [Discord Developer Portal](https://discord.com/developers/applications).

Then you can run Sudo for Discord using either Node directly or using Docker.

### Using Docker

Set the `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` environment variables to the values for your Discord app.

Create a persistent volume for the bot to use.

```sh
docker volume create discord-sudo
```

Then run the container, attaching the volume and passing the environment variables.

```sh
docker run \
  -e DISCORD_CLIENT_ID -e DISCORD_CLIENT_SECRET \
  --mount source=discord-sudo,target=/app/storage \
  clairelizbet/discord-sudo
```

### Using Node

To run using Node, your host machine will need **Node 16** installed.

After setting the `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` environment variables, the bot can be started.

```sh
npm install
npm run build
npm prune --omit=dev ## Optionally remove dev dependencies
npm start
```

## License

[![MIT License](https://raw.githubusercontent.com/clairelizbet/licenses/main/mit/mit.svg)](license.md)
