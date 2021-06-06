import { Client, Message, MessageAttachment, MessageEmbed, MessageReaction, PartialMessage, TextChannel, User } from "discord.js";
import Jimp from "jimp";
import { Font } from "@jimp/plugin-print";
import { readFile, writeFile } from "fs/promises";
import { INSPECT_MAX_BYTES } from "node:buffer";

interface Game {
	player: string,
	channel: string,

	boxesInPlay: Box[],
	boxesOpened: Box[],
	playersBox: number,
}

interface Box {
	x: number,
	y: number,
	relativeX: number,
	relativeY: number,
	value: number,
	color: string,
	number: number,
}

const defaultGame: Game = {
	player: "",
	channel: "",

	boxesInPlay: [],
	boxesOpened: [],
	playersBox: 0,
};

export default class MessageHandler {
	constructor(client: Client) {
		this.client = client;
		Jimp.loadFont(`${__dirname}/font.fnt`).then(font => { this.font = font; });
	}
	client: Client;
	font: Font;

	async handleMessage(msg: Message | PartialMessage): Promise<Message> {
		if (msg.content !== "!start") return;

		const allGames = JSON.parse((await readFile("./games.json")).toString());

		const gameInProgress: Game|null = allGames.find(game => game.player === msg.author.id || game.channel === msg.channel.id);
		if (gameInProgress) {
			return msg.reply("You are already playing a game!");
		}

		const playersGame = defaultGame;
		playersGame.player = msg.author.id;
		playersGame.channel = msg.channel.id;
		msg.reply("Which box would you like to play as? (reply with a number from 1-22)");

		const playersBox = await this.chooseBoxNumber(msg, playersGame);
		playersGame.playersBox = playersBox;

		const valuesAvailable = [
			0.01, 0.10, 0.50, 1, 5, 10, 50, 100, 250, 500, 750,
			1000, 3000, 5000, 10000, 15000, 20000, 35000, 50000, 75000, 100000, 250000,
		];

		let boxNumber = 0;
		for (let column = 0; column < 5; column++) {
			for (let row = 0; row < 5; row++) {
				boxNumber++;
				if (column == 4) {
					row = 2;
				}
				if (boxNumber === playersGame.playersBox) {
					row--;
					continue;
				}

				let x = ((row + 3) * 20) + (row * 430);
				if (column == 4) {
					x = ((2 + 3) * 20) + (2 * 430);
				}
				const y = ((column + 3) * 20) + (column * 300);

				const value = valuesAvailable[Math.floor(Math.random() * valuesAvailable.length)];
				valuesAvailable.splice(valuesAvailable.indexOf(value), 1);

				playersGame.boxesInPlay.push({
					number: boxNumber,
					x,
					y,
					relativeX: column,
					relativeY: row,
					color: value >= 1000 ? "red" : "blue",
					value,
				});
				if (column == 4) { break; }
			}
		}
		allGames.push(playersGame);

		writeFile("./games.json", JSON.stringify(allGames));

		const boxGrid = await this.boxesDraw(playersGame);

		const out: Buffer = await boxGrid.getBufferAsync("image/png");
		const embed = new MessageEmbed()
			.setColor(0xFF0000)
			.attachFiles([new MessageAttachment(out, "board.png")])
			.setImage("attachment://board.png");

		msg.channel.send(embed);

		return msg.reply("Game started!");
	}

	async chooseBoxNumber(msg: Message | PartialMessage, playersGame: Game): Promise<number> {
		return msg.channel.awaitMessages(nmsg => nmsg.author.id === msg.author.id, { time: 30000, max: 1, errors: ["time"] })
			.then(m => {
				const playersBox = Number(m.first().content);
				if (isNaN(playersBox) || playersBox < 1 || playersBox > 22) {
					msg.reply("Invalid selection! (reply with a number from 1-22)");
					return this.chooseBoxNumber(msg, playersGame);
				}
				return playersBox;
			}).catch(() => 0);
	}

	async boxesDraw(playersGame: Game): Promise<Jimp> {
		// const backgroundImg = new Jimp(2230, 1900, 0xFFFFFF);
		const backgroundImg = new Jimp(2370, 1720, 0xFFFFFF);

		// Changing row changes the amount of columns and vice versa
		// I do not have the energy to change this
		for (const i of playersGame.boxesInPlay) {
			const thisBox = await Jimp.read("./box.png");

			const letterY = 85;
			let letterX = 115;
			if (i.number < 10) {
				letterX = 170;
			}

			thisBox.print(this.font, letterX, letterY, {
				text: i.number.toString(),
				alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
				alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
			});
			backgroundImg.composite(thisBox, i.x, i.y);
		}

		return backgroundImg;
	}
}

// 430x300 boxes
// 20px spacing
// 22 identical boxes :)
// 21 in play + one player box
// ((430 * 5) + 4(20)) = 2230px x-axis
// ((300* 6) + 4(20)) = 1900x axis

// 5x5 grid
