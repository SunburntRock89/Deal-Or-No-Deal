import config from "./config";
import MessageHandler from "./MessageHandler";
import { Client, Intents, Message, PartialMessage } from "discord.js";
import { writeFile } from "fs/promises";
const FLAGS = Intents.FLAGS;

const client = new Client({ disableMentions: "everyone", ws: {
	intents: [
		FLAGS.GUILDS,
		FLAGS.GUILD_MESSAGES,
		FLAGS.GUILD_MESSAGE_REACTIONS,
	],
} });

const handler = new MessageHandler(client);
writeFile("./games.json", JSON.stringify([]));
client.on("ready", () => console.log(`Logged in as ${client.user?.tag}!`));
client.on("guildCreate", guild => {
	guild.owner.send({
		embed: {
			color: 0xeb9f1c,
			title: "👋 Hey there!",
			description: "Thanks for inviting my bot! I hope it serves you well.",
			fields: [{
				name: "📋 Setup:",
				value: "Please ensure the bot has permission to embed links in any channels you intend to use it in.",
			},
			{
				name: "❓ Did you know?",
				value: "If you give the bot permission to delete messages, it will automatically shorten links too!",
			}],
			footer: {
				text: "Have fun! -- SunburntRock89#7062",
			},
		},
	}).catch(null);
});
client.on("message", async(msg: Message) => handler.handleMessage(msg));

client.login(config.token);

// https://discord.com/api/oauth2/authorize?client_id=828678339950018630&permissions=387136&scope=bot
