import { Client, Message, MessageAttachment, MessageEmbed, PartialMessage } from "discord.js";
import Jimp from "jimp";
import { Font } from "@jimp/plugin-print";
import { readFile, writeFile } from "fs/promises";
import { Box, Game } from "./interfaces";
import moneyPositions from "./moneyPositions";

const defaultGame: Game = {
	player: "",
	channel: "",

	boxesInPlay: [],
	boxesOpened: [],
	last5Opened: [],
	playersBox: {
		x: 0,
		y: 0,
		relativeX: 0,
		relativeY: 0,
		colour: "",
		number: 0,
		value: 0,
	},
};

export default class GameController {
	client: Client;
	font: Font;
	msg: Message | PartialMessage;

	valuesAvailable = [
		0.01, 0.10, 0.50, 1, 5, 10, 50, 100, 250, 500, 750,
		1000, 3000, 5000, 10000, 15000, 20000, 35000, 50000, 75000, 100000, 250000,
	];

	player: string;
	channel: string;
	boxesInPlay: Box[];
	boxesOpened: Box[];

	last5Opened: Box[];
	playersBox: Box;

	constructor(client: Client, msg: Message | PartialMessage) {
		this.client = client;
		this.msg = msg;
		Jimp.loadFont(`${__dirname}/font.fnt`).then(font => { this.font = font; });
	}

	async startGame(): Promise<void> {
		const allGames = JSON.parse((await readFile("./games.json")).toString());

		const gameInProgress: Game|null = allGames.find(game => game.player === this.msg.author.id || game.channel === this.msg.channel.id);
		if (gameInProgress) {
			this.msg.reply("You are already playing a game!");
			return;
		}

		Object.assign(this, defaultGame);
		this.player = this.msg.author.id;
		this.channel = this.msg.channel.id;
		this.msg.reply("Which box would you like to play as? (reply with a number from 1-22)");

		const valuesAvailable = [
			0.01, 0.10, 0.50, 1, 5, 10, 50, 100, 250, 500, 750,
			1000, 3000, 5000, 10000, 15000, 20000, 35000, 50000, 75000, 100000, 250000,
		];

		const playersBox = await this.chooseBoxNumber();
		const playerBoxValue = valuesAvailable[Math.floor(Math.random() * valuesAvailable.length)];
		valuesAvailable.splice(valuesAvailable.indexOf(playerBoxValue), 1);

		this.playersBox = {
			value: playerBoxValue,
			colour: playerBoxValue >= 1000 ? "red" : "blue",
			number: playersBox,
			x: 0, y: 0, relativeX: 0, relativeY: 0,
		};

		let boxNumber = 0;
		for (let column = 0; column < 5; column++) {
			for (let row = 0; row < 5; row++) {
				boxNumber++;
				if (column == 4) {
					row = 2;
				}
				if (boxNumber === this.playersBox.number) {
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

				const colour = value >= 1000 ? "red" : "blue";

				// first at 0 0, second at 105, 0

				this.boxesInPlay.push({
					number: boxNumber,
					x,
					y,
					relativeX: column,
					relativeY: row,
					colour,
					value,
				});
				if (column == 4) { break; }
			}
		}
		allGames.push({
			player: this.player,
			channel: this.channel,
			boxesInPlay: this.boxesInPlay,
			boxesOpened: this.boxesOpened,

			last5Opened: this.last5Opened,
			playersBox: this.playersBox,
		});

		writeFile("./games.json", JSON.stringify(allGames));


		this.msg.reply("Game started!");
		const embed = new MessageEmbed()
			.setColor(0xFF0000)
			.attachFiles([new MessageAttachment(await this.screenDraw(), "board.png")])
			.setImage("attachment://board.png");
		this.msg.channel.send(embed);

		this.openBox();
	}

	async chooseBoxNumber(): Promise<number> {
		return this.msg.channel.awaitMessages(nmsg => nmsg.author.id === this.msg.author.id, { time: 30000, max: 1, errors: ["time"] })
			.then(m => {
				const playersBox = Number(m.first().content);
				if (isNaN(playersBox) || playersBox < 1 || playersBox > 22) {
					this.msg.reply("Invalid selection! (reply with a number from 1-22)");
					return this.chooseBoxNumber();
				}
				return playersBox;
			}).catch(() => 0);
	}

	async boxesDraw(): Promise<Jimp> {
		const backgroundImg = new Jimp(2350, 1720, 0xFFFFFF);

		for (const i of this.boxesInPlay) {
			backgroundImg.composite(await Jimp.read(`./boxImages/${i.number}.png`), i.x, i.y);
		}

		return backgroundImg;
	}

	async moneyBoardDraw(): Promise<Jimp[]> {
		const blues = new Jimp(584, 1720, 0xFFFFFF);
		const reds = new Jimp(584, 1720, 0xFFFFFF);

		const allBoxes = Array.from(this.boxesInPlay);
		allBoxes.push(this.playersBox);
		for (const i of allBoxes) {
			switch (i.colour) {
				case "blue": {
					blues.composite(await Jimp.read(`./moneyImages/${i.value < 1 ? `${i.value * 100}p` : `£${i.value}`}.png`), 0, moneyPositions[i.value]);
					break;
				}
				case "red": {
					reds.composite(await Jimp.read(`./moneyImages/£${i.value}.png`), 0, moneyPositions[i.value]);
					break;
				}
			}
		}
		return [blues, reds];
	}

	async screenDraw(): Promise<Buffer> {
		const backgroundImg = new Jimp(3578, 1720, 0xFFFFFF);

		const boxes = await this.boxesDraw();
		const moneyBoards = await this.moneyBoardDraw();

		backgroundImg.composite(moneyBoards[0], 10, 0); // Blue board
		backgroundImg.composite(moneyBoards[1], 2974, 0); // Red board
		backgroundImg.composite(boxes, 614, 0); // Boxes


		return backgroundImg.getBufferAsync("image/png");
	}

	async openBox(remaining = 5): Promise<void> {
		this.msg.reply(`Choose a box to open (${remaining} remaining)`);
		this.msg.channel.awaitMessages(nmsg => nmsg.author.id === this.msg.author.id, { time: 30000, max: 1, errors: ["time"] })
			.then(async results => {
				const playBox = this.boxesInPlay.find(box => box.number === Number(results.first().content));
				if (!playBox) {
					this.msg.reply("Invalid selection");
					this.openBox(remaining);
					return;
				}

				const tempMsg = await this.msg.channel.send("Opening box...");
				setTimeout(() => {
					if (playBox.colour === "blue") {
						tempMsg.edit(`🟦 ${playBox.value > 1.00 ? `£${playBox.value}` : `${playBox.value * 100}p`} 🟦`);
					} else {
						tempMsg.edit(`🟥 £${playBox.value > 9999 ? `${playBox.value.toLocaleString("en")}` : `${playBox.value}`} 🟥`);
					}
				}, 1000);

				this.boxesInPlay.splice(this.boxesInPlay.indexOf(playBox), 1);
				this.last5Opened.push(playBox);
				if (this.last5Opened.length == 6) {
					this.last5Opened.splice(0, 1);
				}
				this.boxesOpened.push(playBox);

				remaining--;
				const embed = new MessageEmbed()
					.setColor(0xFF0000)
					.attachFiles([new MessageAttachment(await this.screenDraw(), "board.png")])
					.setImage("attachment://board.png");
				this.msg.channel.send(embed);
				this.openBox(remaining);
				if (remaining > 0) {
					this.openBox(remaining);
				} else {
					this.bankerCall();
				}
			})
			.catch(() => {
				this.msg.reply("⏰ Timeout!");
				this.endGamePremature();
			});
	}

	async bankerCall(): Promise<void> {
		// TODO: have the banker call
	}

	endGamePremature(): void {
		this.msg.channel.send({
			embed: {
				color: 0xFF0000,
				title: "❌ Game Over!",
				description: "You did not choose a box in time.",
			},
		});
	}
}
