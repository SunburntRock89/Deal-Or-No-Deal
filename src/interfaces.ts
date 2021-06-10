export interface Game {
	player: string,
	channel: string,

	boxesInPlay: Box[],
	boxesOpened: Box[],

	last5Opened: Box[],
	playersBox: Box,
}

export interface Box {
	x: number,
	y: number,
	relativeX: number,
	relativeY: number,
	value: number,
	colour: string,
	number: number,
}
