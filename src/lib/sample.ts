import type { Item } from "./types";

export function sample(): Item[] {
	let count = 0;
	const id = () => `s${count++}`;
	return [
		{ id: id(), type: "room", name: "LDK", x: 0, y: 0, w: 540, h: 450 },
		{ id: id(), type: "room", name: "洋室", x: 550, y: 0, w: 350, h: 300 },
		{ id: id(), type: "room", name: "玄関", x: 550, y: 310, w: 110, h: 140 },
		{
			id: id(),
			type: "room",
			name: "洗面・浴室",
			x: 670,
			y: 310,
			w: 140,
			h: 140,
		},
		{ id: id(), type: "room", name: "トイレ", x: 820, y: 310, w: 80, h: 140 },
		{ id: id(), type: "window", x: 270, y: -5, len: 180, axis: "h" },
		{ id: id(), type: "window", x: -5, y: 225, len: 150, axis: "v" },
		{ id: id(), type: "window", x: 720, y: -5, len: 150, axis: "h" },
		{
			id: id(),
			type: "door",
			kind: "swing",
			x: 545,
			y: 150,
			len: 80,
			axis: "v",
			flip: 0,
		},
		{
			id: id(),
			type: "door",
			kind: "swing",
			x: 545,
			y: 380,
			len: 80,
			axis: "v",
			flip: 0,
		},
		{
			id: id(),
			type: "door",
			kind: "swing",
			x: 600,
			y: 455,
			len: 80,
			axis: "h",
			flip: 0,
		},
		{
			id: id(),
			type: "door",
			kind: "swing",
			x: 665,
			y: 380,
			len: 70,
			axis: "v",
			flip: 0,
		},
		{
			id: id(),
			type: "door",
			kind: "swing",
			x: 815,
			y: 380,
			len: 60,
			axis: "v",
			flip: 0,
		},
		{
			id: id(),
			type: "furniture",
			kind: "fridge",
			name: "冷蔵庫",
			cx: 40,
			cy: 40,
			w: 60,
			h: 66,
		},
		{
			id: id(),
			type: "furniture",
			kind: "washer",
			name: "洗濯機",
			cx: 770,
			cy: 345,
			w: 64,
			h: 64,
		},
		{
			id: id(),
			type: "furniture",
			kind: "shelf",
			name: "収納ラック",
			cx: 800,
			cy: 265,
			w: 180,
			h: 45,
		},
	];
}

// The upper floor of `sample`, inside its footprint.
export function sample2(): Item[] {
	let count = 0;
	const id = () => `t${count++}`;
	const door = (x: number, y: number, len: number, axis: "h" | "v"): Item => ({
		id: id(),
		type: "door",
		kind: "swing",
		x,
		y,
		len,
		axis,
		flip: 0,
	});
	return [
		{ id: id(), type: "room", name: "主寝室", x: 0, y: 0, w: 450, h: 300 },
		{
			id: id(),
			type: "room",
			name: "子ども部屋",
			x: 460,
			y: 0,
			w: 440,
			h: 300,
		},
		{ id: id(), type: "room", name: "WIC", x: 270, y: 310, w: 180, h: 140 },
		{
			id: id(),
			type: "room",
			name: "ホール・階段",
			x: 460,
			y: 310,
			w: 350,
			h: 140,
		},
		{ id: id(), type: "room", name: "トイレ", x: 820, y: 310, w: 80, h: 140 },
		{ id: id(), type: "window", x: 225, y: -5, len: 180, axis: "h" },
		{ id: id(), type: "window", x: 680, y: -5, len: 150, axis: "h" },
		door(360, 305, 70, "h"),
		door(560, 305, 80, "h"),
		door(455, 380, 70, "v"),
		door(815, 380, 60, "v"),
	];
}
