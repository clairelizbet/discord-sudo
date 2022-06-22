# Sudo for Discord

Control access to admin privileges on your server with Sudo for Discord

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

The bot will attempt to find an admin role that it has permission to manage, preferring those with "admin" in the name, and assign that role the user calling the command.

### `/privileges drop`

Alias: `/unsudo`

Immediately drops your admin privileges.

The bot will remove the admin role it assigned you (see `/sudo` for a description of how it finds the admin role).

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
