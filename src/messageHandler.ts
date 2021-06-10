import { Client, Message, PartialMessage } from "discord.js";
import GameController from "./gameController";

export default class MessageHandler {
	constructor(client: Client) {
		this.client = client;
	}
	client: Client;

	async handleMessage(msg: Message | PartialMessage): Promise<Message> {
		if (msg.content !== "!start") return;

		new GameController(this.client, msg).startGame();
	}
}

// 430x300 boxes
// 20px spacing
// 22 identical boxes :)
// 21 in play + one player box
// ((430 * 5) + 4(20)) = 2230px x-axis
// ((300* 6) + 4(20)) = 1900x axis

// 5x5 grid
