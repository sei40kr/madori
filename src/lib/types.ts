export type View = { ox: number; oy: number; z: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type Line = { x1: number; y1: number; x2: number; y2: number };
export type Point = { x: number; y: number };

// Positions and sizes are in centimetres.
interface ItemBase {
	id: string;
}

export interface Room extends ItemBase, Rect {
	type: "room";
	name: string;
}

// An axis-aligned partition.
export interface Wall extends ItemBase, Line {
	type: "wall";
}

// A rectangle placed by its centre. Turning it a quarter is swapping w and h.
interface Block extends ItemBase {
	cx: number;
	cy: number;
	w: number;
	h: number;
}

export interface Pillar extends Block {
	type: "pillar";
}

export type FurnitureKind =
	| "fridge"
	| "washer"
	| "bed"
	| "sofa"
	| "dining"
	| "desk"
	| "tvStand"
	| "shelf"
	| "other";

export interface Furniture extends Block {
	type: "furniture";
	kind: FurnitureKind;
	name: string;
}

export type Axis = "h" | "v";

// Sits on a wall, centred on (x, y) and running `len` along `axis`. Rotating it moves it to the other axis.
interface WallFixture extends ItemBase {
	x: number;
	y: number;
	len: number;
	axis: Axis;
}

export type DoorKind = "swing" | "slide" | "fold";

export interface Door extends WallFixture {
	type: "door";
	kind: DoorKind;
	// Bit 1 mirrors along the wall, bit 2 swaps to the wall's other side.
	flip: number;
}

export interface Window extends WallFixture {
	type: "window";
}

export type Item = Room | Wall | Pillar | Furniture | Door | Window;
export type ItemType = Item["type"];

export type Tool = "select" | ItemType;

// Common real-world sizes in cm, as width × depth.
export type SizePreset = { label: string; w: number; h: number };
export type FurnitureSpec = { label: string; sizes: SizePreset[] };
