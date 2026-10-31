import type {
	Axis,
	Door,
	Furniture,
	Item,
	Pillar,
	Point,
	Rect,
	Room,
	Wall,
	Window,
} from "./types";

export const snap = (value: number, step: number) =>
	Math.round(value / step) * step;
export const roomM2 = (room: Room) => (room.w * room.h) / 10000;
export const toJo = (m2: number) => m2 / 1.62;
// A room's wall is drawn outside its rect, so w and h stay the interior size.
export const ROOM_WALL = 10;

export function shift(item: Item, dx: number, dy: number): Item {
	if (item.type === "room") return { ...item, x: item.x + dx, y: item.y + dy };
	if (item.type === "furniture" || item.type === "pillar")
		return { ...item, cx: item.cx + dx, cy: item.cy + dy };
	if (item.type === "wall")
		return {
			...item,
			x1: item.x1 + dx,
			y1: item.y1 + dy,
			x2: item.x2 + dx,
			y2: item.y2 + dy,
		};
	return { ...item, x: item.x + dx, y: item.y + dy };
}

export function boundsOf(item: Item): Rect {
	if (item.type === "wall")
		return {
			x: Math.min(item.x1, item.x2) - 4,
			y: Math.min(item.y1, item.y2) - 4,
			w: Math.abs(item.x2 - item.x1) + 8,
			h: Math.abs(item.y2 - item.y1) + 8,
		};
	if (item.type === "room")
		return { x: item.x, y: item.y, w: item.w, h: item.h };
	if (item.type === "furniture" || item.type === "pillar") {
		return {
			x: item.cx - item.w / 2,
			y: item.cy - item.h / 2,
			w: item.w,
			h: item.h,
		};
	}
	const length = item.len,
		thickness = 14;
	return item.axis === "h"
		? {
				x: item.x - length / 2,
				y: item.y - thickness / 2,
				w: length,
				h: thickness,
			}
		: {
				x: item.x - thickness / 2,
				y: item.y - length / 2,
				w: thickness,
				h: length,
			};
}

// Like boundsOf, but a door's box includes its swing/slide sweep.
export function selectionBounds(item: Item): Rect {
	if (item.type !== "door") return boundsOf(item);
	const length = item.len,
		thickness = 12,
		flip = item.flip,
		sx = flip & 1 ? -1 : 1,
		sy = flip & 2 ? -1 : 1;
	const pts =
		item.kind === "fold"
			? [
					[-length / 2, -length * 0.45],
					[length / 2, thickness / 2],
				]
			: item.kind === "slide"
				? [
						[-length / 2, -thickness / 2],
						[length / 2 + length * 0.9, thickness / 2 + 10],
					]
				: [
						[-length / 2, -length],
						[length / 2, thickness / 2],
					];
	const xs: number[] = [],
		ys: number[] = [];
	for (const x of [pts[0][0], pts[1][0]])
		for (const y of [pts[0][1], pts[1][1]]) {
			const along = x * sx,
				across = y * sy;
			const [rx, ry] = item.axis === "v" ? [-across, along] : [along, across];
			xs.push(item.x + rx);
			ys.push(item.y + ry);
		}
	const x1 = Math.min(...xs),
		y1 = Math.min(...ys);
	return { x: x1, y: y1, w: Math.max(...xs) - x1, h: Math.max(...ys) - y1 };
}

export function planBounds(items: Item[], margin: number): Rect {
	if (!items.length)
		return { x: -margin, y: -margin, w: 600 + 2 * margin, h: 400 + 2 * margin };
	let x1 = 1e9,
		y1 = 1e9,
		x2 = -1e9,
		y2 = -1e9;
	for (const item of items) {
		const box = boundsOf(item);
		const extra =
			item.type === "door" ? item.len : item.type === "room" ? ROOM_WALL : 0;
		x1 = Math.min(x1, box.x - extra);
		y1 = Math.min(y1, box.y - extra);
		x2 = Math.max(x2, box.x + box.w + extra);
		y2 = Math.max(y2, box.y + box.h + extra);
	}
	return {
		x: x1 - margin,
		y: y1 - margin,
		w: x2 - x1 + 2 * margin,
		h: y2 - y1 + 2 * margin,
	};
}

type Edge = { axis: Axis; at: number; from: number; to: number };

export function wallEdge(wall: Wall): Edge[] {
	if (wall.y1 === wall.y2)
		return [
			{
				axis: "h",
				at: wall.y1,
				from: Math.min(wall.x1, wall.x2),
				to: Math.max(wall.x1, wall.x2),
			},
		];
	if (wall.x1 === wall.x2)
		return [
			{
				axis: "v",
				at: wall.x1,
				from: Math.min(wall.y1, wall.y2),
				to: Math.max(wall.y1, wall.y2),
			},
		];
	return [];
}

// Centre lines of a room's walls, spanning its interior, or of a partition.
function hostEdges(host: Room | Wall): Edge[] {
	if (host.type === "wall") return wallEdge(host);
	const half = ROOM_WALL / 2;
	return [
		{ axis: "h", at: host.y - half, from: host.x, to: host.x + host.w },
		{
			axis: "h",
			at: host.y + host.h + half,
			from: host.x,
			to: host.x + host.w,
		},
		{ axis: "v", at: host.x - half, from: host.y, to: host.y + host.h },
		{
			axis: "v",
			at: host.x + host.w + half,
			from: host.y,
			to: host.y + host.h,
		},
	];
}

// Nearest room edge or partition close enough to anchor a door or window, or null.
export function wallAt(x: number, y: number, items: Item[], step: number) {
	let best: { x: number; y: number; axis: Axis } | null = null,
		bestDist = 60;
	for (const host of items) {
		if (host.type !== "room" && host.type !== "wall") continue;
		for (const edge of hostEdges(host)) {
			const along = edge.axis === "h" ? x : y,
				perp = edge.axis === "h" ? y : x;
			const foot = Math.max(edge.from, Math.min(edge.to, along));
			const dist = Math.hypot(along - foot, perp - edge.at);
			if (dist < bestDist) {
				bestDist = dist;
				const snapped = snap(foot, step);
				best =
					edge.axis === "h"
						? { x: snapped, y: edge.at, axis: "h" }
						: { x: edge.at, y: snapped, axis: "v" };
			}
		}
	}
	return best;
}

function onEdge(fixture: Door | Window, host: Room | Wall) {
	return hostEdges(host).some(
		(edge) =>
			edge.axis === fixture.axis &&
			Math.abs((fixture.axis === "h" ? fixture.y : fixture.x) - edge.at) < 1 &&
			(fixture.axis === "h" ? fixture.x : fixture.y) >= edge.from - 1 &&
			(fixture.axis === "h" ? fixture.x : fixture.y) <= edge.to + 1,
	);
}

// Doors and windows sitting on a room's or partition's edge move with it.
export function attachedTo(host: Item, items: Item[]) {
	return host.type === "room" || host.type === "wall"
		? items
				.filter(
					(fixture) =>
						(fixture.type === "door" || fixture.type === "window") &&
						onEdge(fixture, host),
				)
				.map((fixture) => fixture.id)
		: [];
}

// Nearest interior room-corner position close enough to snap to, or null.
export function pillarSnap(
	cx: number,
	cy: number,
	w: number,
	h: number,
	items: Item[],
) {
	let best: { cx: number; cy: number } | null = null,
		bestDist = 50;
	for (const room of items) {
		if (room.type !== "room") continue;
		for (const [x, y, sx, sy] of [
			[room.x, room.y, 1, 1],
			[room.x + room.w, room.y, -1, 1],
			[room.x, room.y + room.h, 1, -1],
			[room.x + room.w, room.y + room.h, -1, -1],
		]) {
			const tx = x + (sx * w) / 2,
				ty = y + (sy * h) / 2,
				dist = Math.hypot(cx - tx, cy - ty);
			if (dist < bestDist) {
				bestDist = dist;
				best = { cx: tx, cy: ty };
			}
		}
	}
	return best;
}

export const MIN_SIZE = {
	room: 50,
	furniture: 10,
	pillar: 5,
	fixture: 30,
	wall: 30,
};

// Snaps `point` to the grid and onto the horizontal or vertical line through `anchor`, whichever is closer.
export function axisLock(anchor: Point, point: Point, step: number): Point {
	const x = snap(point.x, step),
		y = snap(point.y, step);
	return Math.abs(x - anchor.x) >= Math.abs(y - anchor.y)
		? { x, y: anchor.y }
		: { x: anchor.x, y };
}

// Moves an item by a raw offset. Pillars stick to room corners and doors and windows to walls when close enough.
export function moveItem(
	item: Item,
	dx: number,
	dy: number,
	items: Item[],
	step: number,
): Item {
	if (item.type === "pillar") {
		const corner = pillarSnap(
			item.cx + dx,
			item.cy + dy,
			item.w,
			item.h,
			items,
		);
		if (corner) return { ...item, ...corner };
	}
	if (item.type === "door" || item.type === "window") {
		const anchor = wallAt(item.x + dx, item.y + dy, items, step);
		if (anchor) return { ...item, ...anchor };
	}
	return shift(item, snap(dx, step), snap(dy, step));
}

// Moves the edges named in `handle` (any of "n", "s", "e", "w") to `point`, keeping a minimum size.
export function resizeItem<T extends Room | Pillar | Furniture>(
	item: T,
	handle: string,
	point: Point,
	step: number,
): T {
	const bounds = boundsOf(item),
		min = MIN_SIZE[item.type];
	let x1 = bounds.x,
		y1 = bounds.y,
		x2 = bounds.x + bounds.w,
		y2 = bounds.y + bounds.h;
	const x = snap(point.x, step),
		y = snap(point.y, step);
	if (handle.includes("w")) x1 = Math.min(x, x2 - min);
	if (handle.includes("e")) x2 = Math.max(x, x1 + min);
	if (handle.includes("n")) y1 = Math.min(y, y2 - min);
	if (handle.includes("s")) y2 = Math.max(y, y1 + min);
	return item.type === "room"
		? { ...item, x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
		: { ...item, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2, w: x2 - x1, h: y2 - y1 };
}

// Moves one end of a wall to `point`, keeping the wall horizontal or vertical.
export function moveWallEnd(
	wall: Wall,
	handle: "p1" | "p2",
	point: Point,
	step: number,
): Wall {
	const fixed =
		handle === "p1" ? { x: wall.x2, y: wall.y2 } : { x: wall.x1, y: wall.y1 };
	const end = axisLock(fixed, point, step);
	return handle === "p1"
		? { ...wall, x1: end.x, y1: end.y }
		: { ...wall, x2: end.x, y2: end.y };
}

// SVG path of the outline of the union of `rooms`, traced along the grid their edges make.
export function outlinePath(rooms: Rect[]) {
	const sorted = (values: number[]) =>
		[...new Set(values)].sort((a, b) => a - b);
	const xs = sorted(rooms.flatMap((r) => [r.x, r.x + r.w])),
		ys = sorted(rooms.flatMap((r) => [r.y, r.y + r.h]));
	const inside = (i: number, j: number) => {
		if (i < 0 || j < 0 || i >= xs.length - 1 || j >= ys.length - 1)
			return false;
		const cx = (xs[i] + xs[i + 1]) / 2,
			cy = (ys[j] + ys[j + 1]) / 2;
		return rooms.some(
			(r) => cx > r.x && cx < r.x + r.w && cy > r.y && cy < r.y + r.h,
		);
	};
	let d = "";
	// Merge consecutive boundary cells into one segment per run.
	for (let j = 0; j < ys.length; j++) {
		let start: number | null = null;
		for (let i = 0; i < xs.length; i++) {
			const edge = i < xs.length - 1 && inside(i, j - 1) !== inside(i, j);
			if (edge && start === null) start = xs[i];
			if (!edge && start !== null) {
				d += `M${start} ${ys[j]}H${xs[i]}`;
				start = null;
			}
		}
	}
	for (let i = 0; i < xs.length; i++) {
		let start: number | null = null;
		for (let j = 0; j < ys.length; j++) {
			const edge = j < ys.length - 1 && inside(i - 1, j) !== inside(i, j);
			if (edge && start === null) start = ys[j];
			if (!edge && start !== null) {
				d += `M${xs[i]} ${start}V${ys[j]}`;
				start = null;
			}
		}
	}
	return d;
}
