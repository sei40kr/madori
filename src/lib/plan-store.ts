import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
	boundsOf,
	MIN_SIZE,
	pillarSnap,
	planBounds,
	shift,
	snap,
	wallAt,
} from "./geometry";
import { FURNITURE } from "./presets";
import { sample } from "./sample";
import type { Item, Line, Point, Rect, Tool, View } from "./types";

export const GRID = 10;

type Dimension = "w" | "h" | "len";
type Patch = Partial<Item> | ((item: Item) => Partial<Item>);

export type Plan = { id: string; name: string; items: Item[]; updated: number };

type PlanState = {
	// The open plan's items and name; kept in sync with its entry in `plans`.
	items: Item[];
	name: string;
	plans: Plan[];
	curId: string;
	past: Item[][];
	future: Item[][];
	sel: string | null;
	tool: Tool;
	view: View;
	draft: Rect | null;
	draftLine: Line | null;
	clipboard: Item | null;
	pasteCount: number;
	pillarSize: { w: number; h: number };
	// Rapid edits to the same field within this window share one undo step.
	lastEdit: { key: string; at: number } | null;

	commit: (next: (items: Item[]) => Item[], key?: string) => void;
	preview: (items: Item[]) => void;
	record: (before: Item[]) => void;
	undo: () => void;
	redo: () => void;
	newPlan: () => void;
	openPlan: (id: string) => void;
	deletePlan: (id: string) => void;
	setName: (name: string) => void;
	select: (id: string | null) => void;
	setTool: (tool: Tool) => void;
	cancel: () => void;
	setView: (view: View) => void;
	zoomAt: (mx: number, my: number, factor: number) => void;
	fit: (width: number, height: number) => void;
	setDraft: (draft: Rect | null) => void;
	setDraftLine: (line: Line | null) => void;
	addRoom: (rect: Rect) => void;
	addWall: (line: Line) => void;
	addFixture: (type: "door" | "window", point: Point) => void;
	addPillar: (point: Point) => void;
	addFurniture: (point: Point) => void;
	update: (patch: Patch, key?: string) => void;
	setDimension: (field: Dimension, cm: number) => void;
	setWallLength: (cm: number) => void;
	setSize: (w: number, h: number) => void;
	nudge: (dx: number, dy: number) => void;
	duplicate: () => void;
	remove: () => void;
	copy: () => void;
	cut: () => void;
	paste: (at: Point | null) => void;
};

const uid = () =>
	`i${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// State for a just-opened plan; undo history and tool state never carry over between plans.
const open = (plan: Plan) => ({
	items: plan.items,
	name: plan.name,
	curId: plan.id,
	past: [],
	future: [],
	sel: null,
	tool: "select" as const,
	draft: null,
	draftLine: null,
	lastEdit: null,
});
const blank = (): Plan => ({
	id: uid(),
	name: "新しい間取り",
	items: [],
	updated: Date.now(),
});

export const usePlanStore = create<PlanState>()(
	persist(
		(set, get) => {
			const selected = () => get().items.find((item) => item.id === get().sel);
			const add = (item: Item, keepTool = false) => {
				get().commit((items) => [...items, item]);
				set((state) => ({
					sel: item.id,
					tool: keepTool ? state.tool : "select",
				}));
			};
			const first: Plan = {
				id: uid(),
				name: "わが家の間取り",
				items: sample(),
				updated: Date.now(),
			};
			return {
				...open(first),
				plans: [first],
				past: [],
				future: [],
				sel: null,
				tool: "select",
				view: { ox: 80, oy: 80, z: 0.8 },
				draft: null,
				draftLine: null,
				clipboard: null,
				pasteCount: 0,
				pillarSize: { w: 40, h: 40 },
				lastEdit: null,

				commit: (next, key) => {
					const now = Date.now(),
						last = get().lastEdit;
					const coalesce = key && last?.key === key && now - last.at < 1200;
					set((state) => ({
						items: next(state.items),
						past: coalesce
							? state.past
							: [...state.past.slice(-99), state.items],
						future: coalesce ? state.future : [],
						lastEdit: key ? { key, at: now } : null,
					}));
				},
				// Drags change items live without history, then record the pre-drag items once.
				preview: (items) => set({ items }),
				record: (before) =>
					set((state) => ({
						past: [...state.past.slice(-99), before],
						future: [],
						lastEdit: null,
					})),
				undo: () =>
					set((state) => {
						const restored = state.past.at(-1);
						if (!restored) return {};
						return {
							items: restored,
							past: state.past.slice(0, -1),
							future: [state.items, ...state.future],
							sel: restored.some((item) => item.id === state.sel)
								? state.sel
								: null,
							lastEdit: null,
						};
					}),
				redo: () =>
					set((state) => {
						const [restored, ...future] = state.future;
						if (!restored) return {};
						return {
							items: restored,
							past: [...state.past, state.items],
							future,
							sel: restored.some((item) => item.id === state.sel)
								? state.sel
								: null,
							lastEdit: null,
						};
					}),
				newPlan: () => {
					const plan = blank();
					set((state) => ({ ...open(plan), plans: [plan, ...state.plans] }));
				},
				openPlan: (id) => {
					const plan = get().plans.find((p) => p.id === id);
					if (plan) set(open(plan));
				},
				// Deleting the open plan opens the most recently updated one left, or a blank one.
				deletePlan: (id) => {
					const plans = get().plans.filter((p) => p.id !== id);
					if (id !== get().curId) return set({ plans });
					const next = plans.toSorted((a, b) => b.updated - a.updated)[0];
					if (next) return set({ ...open(next), plans });
					const plan = blank();
					set({ ...open(plan), plans: [plan] });
				},
				setName: (name) => set({ name }),
				select: (id) =>
					set((state) => ({ sel: id, tool: id ? "select" : state.tool })),
				setTool: (tool) =>
					set((state) => ({
						tool,
						sel: tool === "select" ? state.sel : null,
						draft: null,
						draftLine: null,
					})),
				cancel: () =>
					set({ sel: null, tool: "select", draft: null, draftLine: null }),
				setView: (view) => set({ view }),
				zoomAt: (mx, my, factor) =>
					set(({ view }) => {
						const z = Math.min(4, Math.max(0.15, view.z * factor));
						const ratio = z / view.z;
						return {
							view: {
								z,
								ox: mx - (mx - view.ox) * ratio,
								oy: my - (my - view.oy) * ratio,
							},
						};
					}),
				fit: (width, height) => {
					const bounds = planBounds(get().items, 40);
					// Leave room for the overlays at the top.
					const top = 56,
						bottom = 24;
					const availWidth = width - 48,
						availHeight = Math.max(100, height - top - bottom);
					const z = Math.min(
						4,
						Math.max(
							0.15,
							Math.min(availWidth / bounds.w, availHeight / bounds.h),
						),
					);
					set({
						view: {
							z,
							ox: (width - bounds.w * z) / 2 - bounds.x * z,
							oy: top + (availHeight - bounds.h * z) / 2 - bounds.y * z,
						},
					});
				},
				setDraft: (draft) => set({ draft }),
				setDraftLine: (draftLine) => set({ draftLine }),

				addRoom: (rect) => {
					const count = get().items.filter(
						(item) => item.type === "room",
					).length;
					add({ id: uid(), type: "room", name: `部屋 ${count + 1}`, ...rect });
				},
				addWall: (line) => add({ id: uid(), type: "wall", ...line }, true),
				addFixture: (type, point) => {
					const at = wallAt(point.x, point.y, get().items, GRID) || {
						x: snap(point.x, GRID),
						y: snap(point.y, GRID),
						axis: "h" as const,
					};
					add(
						type === "door"
							? { id: uid(), type, kind: "swing", len: 80, flip: 0, ...at }
							: { id: uid(), type, len: 120, ...at },
					);
				},
				addPillar: (point) => {
					const { w, h } = get().pillarSize;
					const at = pillarSnap(point.x, point.y, w, h, get().items) || {
						cx: snap(point.x, GRID),
						cy: snap(point.y, GRID),
					};
					add({ id: uid(), type: "pillar", ...at, w, h }, true);
				},
				addFurniture: (point) =>
					add({
						id: uid(),
						type: "furniture",
						kind: "other",
						name: FURNITURE.other.label,
						cx: snap(point.x, GRID),
						cy: snap(point.y, GRID),
						w: 90,
						h: 45,
					}),

				update: (patch, key) => {
					const id = get().sel;
					get().commit(
						(items) =>
							items.map((item) =>
								item.id === id
									? // Patches only carry fields of the selected item's own type.
										({
											...item,
											...(typeof patch === "function" ? patch(item) : patch),
										} as Item)
									: item,
							),
						key && `${id}:${key}`,
					);
				},
				setDimension: (field, cm) => {
					const item = selected();
					if (!item) return;
					const min =
						item.type === "room" ||
						item.type === "furniture" ||
						item.type === "pillar"
							? MIN_SIZE[item.type]
							: MIN_SIZE.fixture;
					const value = Math.max(min, cm);
					get().update({ [field]: value } as Partial<Item>, field);
					if (item.type === "pillar")
						set({ pillarSize: { w: item.w, h: item.h, [field]: value } });
				},
				// Keeps the first endpoint and the wall's direction; moves the second.
				setWallLength: (cm) =>
					get().update((item) => {
						if (item.type !== "wall") return {};
						const length = Math.max(MIN_SIZE.wall, cm),
							horizontal = item.y1 === item.y2,
							sign =
								(horizontal ? item.x2 - item.x1 : item.y2 - item.y1) < 0
									? -1
									: 1;
						return horizontal
							? { x2: item.x1 + sign * length }
							: { y2: item.y1 + sign * length };
					}, "wallLength"),
				setSize: (w, h) =>
					get().update((item) => {
						if (item.type !== "pillar") return { w, h };
						set({ pillarSize: { w, h } });
						// Re-snap a corner pillar so it stays tucked into the corner at its new size.
						const corner = pillarSnap(item.cx, item.cy, w, h, get().items);
						return corner &&
							Math.hypot(corner.cx - item.cx, corner.cy - item.cy) < 40
							? { w, h, ...corner }
							: { w, h };
					}),
				nudge: (dx, dy) => {
					const id = get().sel;
					if (!id) return;
					get().commit(
						(items) =>
							items.map((item) =>
								item.id === id ? shift(item, dx, dy) : item,
							),
						`${id}:nudge`,
					);
				},
				duplicate: () => {
					const item = selected();
					if (!item) return;
					const copy: Item =
						item.type === "room"
							? { ...item, x: item.x + item.w, name: `${item.name}（コピー）` }
							: item.type === "furniture" || item.type === "pillar"
								? shift(item, 30, 30)
								: item.type === "wall"
									? item.y1 === item.y2
										? shift(item, 0, 50)
										: shift(item, 50, 0)
									: item.axis === "h"
										? shift(item, item.len + 20, 0)
										: shift(item, 0, item.len + 20);
					add({ ...copy, id: uid() }, true);
				},
				remove: () => {
					const id = get().sel;
					if (!id) return;
					get().commit((items) => items.filter((item) => item.id !== id));
					set({ sel: null });
				},
				copy: () => {
					const item = selected();
					if (item) set({ clipboard: structuredClone(item), pasteCount: 0 });
				},
				cut: () => {
					get().copy();
					get().remove();
				},
				// Centres the copy on `at`, or cascades from the original when the cursor is off-canvas.
				paste: (at) => {
					const source = get().clipboard;
					if (!source) return;
					const items = get().items,
						bounds = boundsOf(source);
					let dx: number, dy: number;
					if (at) {
						dx = snap(at.x - (bounds.x + bounds.w / 2), GRID);
						dy = snap(at.y - (bounds.y + bounds.h / 2), GRID);
					} else {
						const count = get().pasteCount + 1;
						set({ pasteCount: count });
						dx = dy = 30 * count;
					}
					let copy: Item = { ...shift(source, dx, dy), id: uid() };
					if (copy.type === "door" || copy.type === "window") {
						const anchor = wallAt(copy.x, copy.y, items, GRID);
						if (anchor) copy = { ...copy, ...anchor };
					}
					if (copy.type === "pillar") {
						const corner = pillarSnap(copy.cx, copy.cy, copy.w, copy.h, items);
						if (corner) copy = { ...copy, ...corner };
					}
					add(copy);
				},
			};
		},
		{
			name: "madori.plan.v1",
			version: 1,
			partialize: (state) => ({ plans: state.plans, curId: state.curId }),
			// v0 held a single plan; keep it as the first saved plan.
			migrate: (persisted, version) => {
				if (version > 0) return persisted;
				const { items, name } = persisted as { items: Item[]; name: string };
				const id = uid();
				return { plans: [{ id, name, items, updated: Date.now() }], curId: id };
			},
			merge: (persisted, current) => {
				const { plans, curId } = persisted as Pick<
					PlanState,
					"plans" | "curId"
				>;
				const plan = plans.find((p) => p.id === curId) ?? plans[0];
				return plan ? { ...current, plans, ...open(plan) } : current;
			},
			// Hydrated after mount so the server render and the first client render match.
			skipHydration: true,
		},
	),
);

// Saves edits to the open plan back into its entry as they happen.
usePlanStore.subscribe(({ items, name, plans, curId }) => {
	const plan = plans.find((p) => p.id === curId);
	if (!plan || (plan.items === items && plan.name === name)) return;
	usePlanStore.setState({
		plans: plans.map((p) =>
			p.id === curId ? { ...p, items, name, updated: Date.now() } : p,
		),
	});
});
