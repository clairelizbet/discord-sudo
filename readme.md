# 🔓 Sudo for Discord

[![](https://sonarcloud.io/api/project_badges/measure?project=clairelizbet_discord-sudo&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=clairelizbet_discord-sudo)
[![](https://sonarcloud.io/api/project_badges/measure?project=clairelizbet_discord-sudo&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=clairelizbet_discord-sudo)

Control access to admin privileges on your server with Sudo for Discord.

Trusted members of your guild can use `/sudo` to temporarily gain admin access when needed, offering a more secure alternative to direct access and preventing accidental administrative actions.

## ⚙ Setup

[![Add to Server](https://i.imgur.com/FnjVKEb.png)](https://discord.com/oauth2/authorize?client_id=984508139472838656&permissions=268435456&scope=bot%20applications.commands)

↕ After adding the bot, place the auto-created `sudo` role **above** the admin role you would like the bot to manage

![To do this, go to Server Settings > Roles and drag "sudo" adove the admin role](https://i.imgur.com/DxKcOVq.gif)

🔑 Next, choose which users or roles have permission to use sudo in Server Settings > Integrations > Sudo

![Here you can control who has access to the command](https://i.imgur.com/bPRhPFv.png)

## ℹ Usage

### `/sudo`

> Temporarily grants admin access.
>
> Parameters:
>
> - `duration`
>   - How many minutes to grant admin access for
>   - Optional
>   - Valid range: `1` to `120` (default `5`)
>
> The bot will either use the admin role you've configured or attempt to find an admin role that it has permission to manage, preferring those with "admin" in the name, and assign that role the guild member calling the command.

### `/privileges drop`

Alias: `/unsudo`

> Immediately drops your admin privileges.

### `/sudo-config`

> Manages Sudo for Discord configuration.

#### `/sudo-config set-admin-role`

> Sets the role assigned when granting admin.
>
> Parameters:
>
> - `role`
>   - The admin role to grant (bot must have permission to manage the role)

#### `/sudo-config enable-admin-role-autoselect`

> Causes the bot to use any available admin role when granting admin. This is the default behavior.

## ☁ Running a private instance

> 🌐 There is a [public instance available](https://discord.com/oauth2/authorize?client_id=984508139472838656&permissions=268435456&scope=bot%20applications.commands). This is the recommended way to add the bot.

If you would rather self-host Sudo, you will first need to create an app in the [Discord Developer Portal](https://discord.com/developers/applications).

Then you can run Sudo for Discord either containerized with Docker or using Node directly.

**🛠 Setting up the environment**

Before running the bot, you will need to set these required **environment variables** for the app.

> These variables are typically configured in your hypervisor or container manager.

`DISCORD_CLIENT_ID`

`DISCORD_CLIENT_SECRET`

Check [.env.example](.env.example) for a full list of optional environment variables for configuring the bot.

### 🛳 Using Docker

Run the container, attaching a persistent volume for storage and passing the environment variables.

```sh
docker run \
  -e DISCORD_CLIENT_ID -e DISCORD_CLIENT_SECRET \
  --mount source=discord-sudo-data,target=/app/storage \
  clairelizbet/discord-sudo
```

### 📦 Using Node

To run using Node, your host machine will need **Node 16** installed.

```sh
# Installs third-party packages the bot depends on
npm install
# Compiles TypeScript to JS that Node can run
npm run build
# Optionally, remove dev dependencies
npm prune --omit=dev
```

Run the bot with `npm start`

## 📋 License

[![MIT License - Some rights reserved](https://raw.githubusercontent.com/clairelizbet/licenses/main/mit/mit.svg)](license.md)
