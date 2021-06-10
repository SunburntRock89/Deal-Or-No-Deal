import Jimp from "jimp";
import { Font } from "@jimp/plugin-print";
import { writeFile, access, mkdir } from "fs/promises";

(async() => {
	const font = await Jimp.loadFont(`./build/font.fnt`);
	// for (let playersBox = 1; playersBox < 23; playersBox++) {
	// 	console.log(playersBox);
	// 	const boxesInPlay = [];
	// 	let boxNumber = 0;
	// 	for (let column = 0; column < 5; column++) {
	// 		for (let row = 0; row < 5; row++) {
	// 			boxNumber++;
	// 			if (column == 4) {
	// 				row = 2;
	// 			}
	// 			if (boxNumber === playersBox) {
	// 				row--;
	// 				continue;
	// 			}

	// 			let x = ((row + 3) * 20) + (row * 430);
	// 			if (column == 4) {
	// 				x = ((2 + 3) * 20) + (2 * 430);
	// 			}
	// 			const y = ((column + 3) * 20) + (column * 300);

	// 			boxesInPlay.push({
	// 				number: boxNumber,
	// 				x,
	// 				y,
	// 				relativeX: column,
	// 				relativeY: row,
	// 			});
	// 			if (column == 4) { break; }
	// 		}
	// 	}

	// 	const backgroundImg = new Jimp(2370, 1720, 0xFFFFFF);

	// 	// Changing row changes the amount of columns and vice versa
	// 	// I do not have the energy to change this
	// 	for (const i of boxesInPlay) {
	// 		const thisBox = await Jimp.read("./box.png");

	// 		const letterY = 85;
	// 		let letterX = 115;
	// 		if (i.number < 10) {
	// 			letterX = 170;
	// 		}

	// 		thisBox.print(font, letterX, letterY, {
	// 			text: i.number.toString(),
	// 			alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
	// 			alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
	// 		});
	// 		backgroundImg.composite(thisBox, i.x, i.y);
	// 	}

	// 	if (access(`./images/${playersBox}`).catch(() => false)) {
	// 		await mkdir(`./images/${playersBox}`);
	// 	}
	// 	writeFile(`./images/${playersBox}/baseBoard.png`, await backgroundImg.getBufferAsync("image/png"));
	// }

	// for (let i = 1; i <= 23; i++) {
	// 	// let i = 44;
	// 	const boxImage = await Jimp.read("./boxImages/box.png");

	// 	const letterY = 85;
	// 	let letterX = 115;
	// 	if (i < 10) {
	// 		letterX = 170;
	// 	}

	// 	boxImage.print(font, letterX, letterY, {
	// 		text: i.toString(),
	// 		alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
	// 		alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
	// 	});

	// 	writeFile(`./boxImages/${i}.png`, await boxImage.getBufferAsync("image/png"));
	// }

	const valuesBlue = [
		0.01, 0.10, 0.50, 1, 5, 10, 50, 100, 250, 500, 750,
	];
	const valuesRed = [
		1000, 3000, 5000, 10000, 15000, 20000, 35000, 50000, 75000, 100000, 250000,
	];
	const yPositions = {};

	for (const i of valuesBlue) {
		yPositions[i] = (1.5 + valuesRed.indexOf(i)) * (105 + 15);
	}
	for (const i of valuesRed) {
		yPositions[i] = (1.5 + valuesRed.indexOf(i)) * (105 + 15);
	}

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require("fs/promises").writeFile("./positions.json", JSON.stringify(yPositions));
})();
