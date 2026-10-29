import { Box } from "@chakra-ui/react";
import { useGesture } from "@use-gesture/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import {
	attachedTo,
	axisLock,
	moveItem,
	moveWallEnd,
	resizeItem,
	shift,
	snap,
} from "@/lib/geometry";
import { GRID, usePlanStore } from "@/lib/plan-store";
import type {
	Furniture,
	Item,
	Pillar,
	Point,
	Room,
	Tool,
	View,
	Wall,
} from "@/lib/types";
import { ToolHint, ZoomControls } from "./canvas-overlays";
import { PlanSvg } from "./plan-svg";

type Drag =
	// `deselect` is set when the pan started on empty canvas, where a tap clears the selection.
	| { mode: "pan"; view: View; deselect: boolean }
	| { mode: "room" | "wall"; origin: Point }
	| {
			mode: "move";
			id: string;
			origin: Point;
			before: Item[];
			attached: string[];
			changed: boolean;
	  }
	| {
			mode: "resize";
			handle: string;
			original: Room | Pillar | Furniture;
			before: Item[];
	  }
	| { mode: "wallEnd"; handle: "p1" | "p2"; original: Wall; before: Item[] };

const TOOL_KEYS: Record<string, Tool> = {
	v: "select",
	r: "room",
	d: "door",
	w: "window",
	l: "wall",
	p: "pillar",
	f: "furniture",
};

const HINTS: Partial<Record<Tool, string>> = {
	room: `ドラッグして部屋を描きます（${GRID}cm単位）`,
	wall: "ドラッグして仕切りを描きます（水平・垂直）",
	furniture: "クリックで家具を配置（名前とサイズは配置後に変更）",
	pillar: "クリックで柱を配置（部屋の角に吸着）",
	door: "壁をクリックしてドアを配置（開き戸／引き戸は配置後に切替）",
	window: "壁をクリックして窓を配置",
};

const ARROWS: Record<string, [number, number]> = {
	ArrowLeft: [-1, 0],
	ArrowRight: [1, 0],
	ArrowUp: [0, -1],
	ArrowDown: [0, 1],
};

export function Canvas({
	svgRef,
}: {
	svgRef: RefObject<SVGSVGElement | null>;
}) {
	const store = usePlanStore();
	const containerRef = useRef<HTMLDivElement>(null);
	const drag = useRef<Drag | null>(null);
	const hover = useRef<Point | null>(null);
	const spaceHeld = useRef(false);
	const [panning, setPanning] = useState(false);
	const [coarse, setCoarse] = useState(false);

	const local = ([clientX, clientY]: [number, number]): Point => {
		const rect = svgRef.current?.getBoundingClientRect();
		return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
	};
	const toWorld = ({ x, y }: Point): Point => {
		const { ox, oy, z } = usePlanStore.getState().view;
		return { x: (x - ox) / z, y: (y - oy) / z };
	};
	const fit = () => {
		const rect = containerRef.current?.getBoundingClientRect();
		if (rect?.width) store.fit(rect.width, rect.height);
	};
	const zoomCentre = (factor: number) => {
		const rect = containerRef.current?.getBoundingClientRect();
		if (rect) store.zoomAt(rect.width / 2, rect.height / 2, factor);
	};

	// Fits the plan once the canvas first has a size.
	// biome-ignore lint/correctness/useExhaustiveDependencies: runs once on mount
	useEffect(() => {
		setCoarse(window.matchMedia("(pointer: coarse)").matches);
		const element = containerRef.current;
		if (!element) return;
		const observer = new ResizeObserver(() => {
			if (!element.getBoundingClientRect().width) return;
			observer.disconnect();
			fit();
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	// Fits each plan as it is opened. Not on mount: a write before rehydration would overwrite the saved plans.
	useEffect(
		() =>
			usePlanStore.subscribe((state, prev) => {
				const rect = containerRef.current?.getBoundingClientRect();
				if (state.curId !== prev.curId && rect?.width)
					state.fit(rect.width, rect.height);
			}),
		[],
	);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const state = usePlanStore.getState();
			const target = event.target as HTMLElement | null;
			const typing =
				!!target &&
				(target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.isContentEditable);
			if (typing) return;
			const mod = event.metaKey || event.ctrlKey,
				key = event.key.toLowerCase();
			if (mod) {
				const action = {
					z: event.shiftKey ? state.redo : state.undo,
					y: state.redo,
					d: state.duplicate,
					c: state.copy,
					x: state.cut,
					v: () => state.paste(hover.current),
				}[key];
				if (!action) return;
				event.preventDefault();
				action();
				return;
			}
			if (event.key === " ") {
				spaceHeld.current = true;
				event.preventDefault();
			} else if (event.key === "Delete" || event.key === "Backspace") {
				event.preventDefault();
				state.remove();
			} else if (event.key === "Escape") {
				drag.current = null;
				state.cancel();
			} else if (TOOL_KEYS[key]) state.setTool(TOOL_KEYS[key]);
			else if (ARROWS[event.key] && state.sel) {
				event.preventDefault();
				const step = GRID * (event.shiftKey ? 10 : 1);
				state.nudge(ARROWS[event.key][0] * step, ARROWS[event.key][1] * step);
			}
		};
		const onKeyUp = (event: KeyboardEvent) => {
			if (event.key === " ") spaceHeld.current = false;
		};
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
		};
	}, []);

	const startDrag = (event: PointerEvent, point: Point): Drag | null => {
		const state = usePlanStore.getState(),
			target = event.target as Element;
		if (event.button === 1 || spaceHeld.current)
			return { mode: "pan", view: state.view, deselect: false };
		const itemElement = target.closest("[data-id]");
		const hit = state.items.find(
			(item) => item.id === itemElement?.getAttribute("data-id"),
		);
		const grab = (item: Item): Drag => {
			state.select(item.id);
			return {
				mode: "move",
				id: item.id,
				origin: point,
				before: state.items,
				attached: attachedTo(item, state.items),
				changed: false,
			};
		};
		const tool = state.tool;
		if (tool !== "select") {
			// With a placing tool active, grabbing an existing object switches to moving it.
			const placesOver =
				!hit ||
				(hit.type === "room" && !itemElement?.hasAttribute("data-wall")) ||
				((tool === "door" || tool === "window") &&
					(hit.type === "room" || hit.type === "wall"));
			if (hit && !placesOver) return grab(hit);
			if (tool === "pillar") state.addPillar(point);
			else if (tool === "furniture") state.addFurniture(point);
			else if (tool === "door" || tool === "window")
				state.addFixture(tool, point);
			else {
				const origin = { x: snap(point.x, GRID), y: snap(point.y, GRID) };
				if (tool === "room") state.setDraft({ ...origin, w: 0, h: 0 });
				else
					state.setDraftLine({
						x1: origin.x,
						y1: origin.y,
						x2: origin.x,
						y2: origin.y,
					});
				return { mode: tool, origin };
			}
			return null;
		}
		const handle = target.closest("[data-handle]")?.getAttribute("data-handle");
		const sel = state.items.find((item) => item.id === state.sel);
		if (handle && sel?.type === "wall")
			return {
				mode: "wallEnd",
				handle: handle as "p1" | "p2",
				original: sel,
				before: state.items,
			};
		if (
			handle &&
			(sel?.type === "room" ||
				sel?.type === "pillar" ||
				sel?.type === "furniture")
		)
			return { mode: "resize", handle, original: sel, before: state.items };
		if (hit) return grab(hit);
		return { mode: "pan", view: state.view, deselect: true };
	};

	const moveDrag = (
		current: Drag,
		point: Point,
		movement: [number, number],
	) => {
		const state = usePlanStore.getState();
		const replace = (before: Item[], next: Item) =>
			state.preview(before.map((item) => (item.id === next.id ? next : item)));
		switch (current.mode) {
			case "pan":
				if (Math.hypot(...movement) > 3) setPanning(true);
				state.setView({
					...current.view,
					ox: current.view.ox + movement[0],
					oy: current.view.oy + movement[1],
				});
				break;
			case "room": {
				const x = snap(point.x, GRID),
					y = snap(point.y, GRID),
					{ origin } = current;
				state.setDraft({
					x: Math.min(x, origin.x),
					y: Math.min(y, origin.y),
					w: Math.abs(x - origin.x),
					h: Math.abs(y - origin.y),
				});
				break;
			}
			case "wall": {
				const end = axisLock(current.origin, point, GRID);
				state.setDraftLine({
					x1: current.origin.x,
					y1: current.origin.y,
					x2: end.x,
					y2: end.y,
				});
				break;
			}
			case "move": {
				const dx = point.x - current.origin.x,
					dy = point.y - current.origin.y;
				current.changed ||=
					snap(dx, GRID) !== 0 ||
					snap(dy, GRID) !== 0 ||
					Math.hypot(dx, dy) > 5;
				if (!current.changed) return;
				state.preview(
					current.before.map((item) =>
						item.id === current.id
							? moveItem(item, dx, dy, current.before, GRID)
							: current.attached.includes(item.id)
								? shift(item, snap(dx, GRID), snap(dy, GRID))
								: item,
					),
				);
				break;
			}
			case "resize":
				replace(
					current.before,
					resizeItem(current.original, current.handle, point, GRID),
				);
				break;
			case "wallEnd":
				replace(
					current.before,
					moveWallEnd(current.original, current.handle, point, GRID),
				);
		}
	};

	const endDrag = (current: Drag, movement: [number, number]) => {
		const state = usePlanStore.getState();
		switch (current.mode) {
			case "pan":
				setPanning(false);
				if (current.deselect && Math.hypot(...movement) <= 3)
					state.select(null);
				break;
			case "room": {
				const rect = state.draft;
				state.setDraft(null);
				if (rect && rect.w >= 50 && rect.h >= 50) state.addRoom(rect);
				break;
			}
			case "wall": {
				const line = state.draftLine;
				state.setDraftLine(null);
				if (line && Math.hypot(line.x2 - line.x1, line.y2 - line.y1) >= 30)
					state.addWall(line);
				break;
			}
			case "move":
				if (current.changed) state.record(current.before);
				break;
			default:
				if (state.items !== current.before) state.record(current.before);
		}
	};

	useGesture(
		{
			onDrag: ({ event, xy, first, last, movement, pinching }) => {
				if (pinching) return;
				const point = toWorld(local(xy));
				if (first) drag.current = startDrag(event as PointerEvent, point);
				else if (drag.current) moveDrag(drag.current, point, movement);
				if (last && drag.current) {
					endDrag(drag.current, movement);
					drag.current = null;
				}
			},
			onPinch: ({ origin, offset: [z], first, memo }) => {
				const screen = local(origin);
				if (first) {
					// A second finger turns the gesture into a pinch; undo whatever the first one started.
					const current = drag.current;
					if (current && "before" in current)
						usePlanStore.getState().preview(current.before);
					drag.current = null;
					store.setDraft(null);
					store.setDraftLine(null);
				}
				// The world point under the fingers when the pinch began stays under them.
				const anchor: Point = first ? toWorld(screen) : memo;
				store.setView({
					z,
					ox: screen.x - anchor.x * z,
					oy: screen.y - anchor.y * z,
				});
				return anchor;
			},
			onWheel: ({ event, delta: [dx, dy], pinching }) => {
				if (pinching) return;
				event.preventDefault();
				// A large pure-vertical delta is a mouse wheel; anything else is a trackpad pan.
				if (event.metaKey || (Math.abs(dx) < 0.5 && Math.abs(dy) >= 40)) {
					const screen = local([event.clientX, event.clientY]);
					store.zoomAt(screen.x, screen.y, Math.exp(-dy * 0.0015));
				} else {
					const { view } = usePlanStore.getState();
					store.setView({ ...view, ox: view.ox - dx, oy: view.oy - dy });
				}
			},
			onMove: ({ xy }) => {
				hover.current = toWorld(local(xy));
			},
			onHover: ({ hovering }) => {
				if (!hovering) hover.current = null;
			},
		},
		{
			target: svgRef,
			// Non-passive so preventDefault stops page zoom/scroll.
			eventOptions: { passive: false },
			// Left button draws and moves; middle button pans.
			drag: { pointer: { buttons: [1, 4], keys: false } },
			pinch: {
				from: () => [usePlanStore.getState().view.z, 0],
				scaleBounds: { min: 0.15, max: 4 },
			},
		},
	);

	const hint = HINTS[store.tool];
	return (
		<Box
			ref={containerRef}
			position="relative"
			flex="1"
			minW="0"
			overflow="hidden"
		>
			<Box position="absolute" inset="0">
				<PlanSvg
					svgRef={svgRef}
					items={store.items}
					view={store.view}
					sel={store.items.find((item) => item.id === store.sel) ?? null}
					tool={store.tool}
					draft={store.draft}
					draftLine={store.draftLine}
					panning={panning}
					gridSize={GRID}
					showDims
					coarse={coarse}
				/>
			</Box>
			{hint && (
				<ToolHint hint={hint} onCancel={() => store.setTool("select")} />
			)}
			<ZoomControls
				zoom={store.view.z}
				onZoomIn={() => zoomCentre(1.25)}
				onZoomOut={() => zoomCentre(0.8)}
				onFit={fit}
			/>
		</Box>
	);
}
