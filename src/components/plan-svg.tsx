import type { ReactNode, Ref } from "react";
import { ROOM_WALL, roomM2, selectionBounds, toJo } from "@/lib/geometry";
import type {
	Door,
	Furniture,
	Item,
	ItemType,
	Line,
	Pillar,
	Rect,
	Room,
	View,
	Wall,
	Window,
} from "@/lib/types";

const palette = {
	white: "#ffffff",
	gray50: "#fafafa",
	gray100: "#f4f4f5",
	gray200: "#e4e4e7",
	gray300: "#d4d4d8",
	gray400: "#a1a1aa",
	gray500: "#71717a",
	gray600: "#52525b",
	gray700: "#3f3f46",
	gray800: "#27272a",
	gray900: "#18181b",
	blue500: "#3b82f6",
	blue600: "#2563eb",
};

// Shapes are drawn in world units (cm); `z` converts screen px to world units
// so strokes and labels keep a constant on-screen size.
type Scale = { z: number };
type Shape<T extends Item = Item> = Scale & { item: T; cursor?: string };
const screenPx = (pixels: number, z: number) => pixels / z;
const formatMetres = (cm: number) => `${(cm / 100).toFixed(2)} m`;

function Label({
	x,
	y,
	size,
	fill,
	weight,
	z,
	transform,
	noExport,
	children,
}: Scale & {
	x: number;
	y: number;
	size: number;
	fill: string;
	weight: number;
	transform?: string;
	noExport?: boolean;
	children: ReactNode;
}) {
	return (
		<text
			x={x}
			y={y}
			fontSize={screenPx(size, z)}
			fill={fill}
			fontWeight={weight}
			textAnchor="middle"
			dominantBaseline="central"
			pointerEvents="none"
			transform={transform}
			data-noexport={noExport ? "1" : undefined}
		>
			{children}
		</text>
	);
}

function RoomLabels({
	item: room,
	z,
	showDims,
}: Shape<Room> & { showDims: boolean }) {
	const cx = room.x + room.w / 2,
		cy = room.y + room.h / 2,
		m2 = roomM2(room),
		dx = room.x + screenPx(11, z);
	return (
		<>
			{room.w * z > 76 && room.h * z > 48 ? (
				<>
					<Label
						x={cx}
						y={cy - screenPx(9, z)}
						size={13}
						fill={palette.gray900}
						weight={600}
						z={z}
					>
						{room.name}
					</Label>
					<Label
						x={cx}
						y={cy + screenPx(9, z)}
						size={11.5}
						fill={palette.gray600}
						weight={400}
						z={z}
					>
						{`${m2.toFixed(1)}㎡ · ${toJo(m2).toFixed(1)}畳`}
					</Label>
				</>
			) : (
				room.w * z > 30 && (
					<Label
						x={cx}
						y={cy}
						size={11}
						fill={palette.gray900}
						weight={600}
						z={z}
					>
						{room.name}
					</Label>
				)
			)}
			{showDims && room.w * z > 64 && (
				<Label
					x={cx}
					y={room.y + screenPx(11, z)}
					size={10.5}
					fill={palette.gray500}
					weight={500}
					z={z}
				>
					{formatMetres(room.w)}
				</Label>
			)}
			{showDims && room.h * z > 64 && (
				<Label
					x={dx}
					y={cy}
					size={10.5}
					fill={palette.gray500}
					weight={500}
					z={z}
					transform={`rotate(-90 ${dx} ${cy})`}
				>
					{formatMetres(room.h)}
				</Label>
			)}
		</>
	);
}

function FurnitureShape({ item: furniture, z, cursor }: Shape<Furniture>) {
	const { w, h } = furniture;

	// Keep the label upright and along the long side.
	const turn = h > w ? 90 : 0;
	return (
		<g
			data-id={furniture.id}
			transform={`translate(${furniture.cx} ${furniture.cy})`}
			style={{ cursor }}
		>
			<rect
				x={-w / 2}
				y={-h / 2}
				width={w}
				height={h}
				rx={2}
				fill={palette.gray100}
				stroke={palette.gray500}
				strokeWidth={screenPx(1.25, z)}
			/>
			{Math.min(w, h) * z > 26 && (
				<Label
					x={0}
					y={0}
					size={10.5}
					fill={palette.gray700}
					weight={500}
					z={z}
					transform={`rotate(${-turn})`}
				>
					{furniture.name}
				</Label>
			)}
		</g>
	);
}

function Partition({
	item: wall,
	z,
	cursor,
	showDims,
}: Shape<Wall> & { showDims: boolean }) {
	const len = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
	const mx = (wall.x1 + wall.x2) / 2,
		my = (wall.y1 + wall.y2) / 2,
		horizontal = wall.y1 === wall.y2;
	const lx = horizontal ? mx : mx + 4 + screenPx(11, z),
		ly = horizontal ? my - 4 - screenPx(10, z) : my;
	return (
		<>
			{/* Wider invisible stroke as the hit area. */}
			<line
				data-id={wall.id}
				x1={wall.x1}
				y1={wall.y1}
				x2={wall.x2}
				y2={wall.y2}
				stroke="transparent"
				strokeWidth={Math.max(8, screenPx(16, z))}
				style={{ cursor }}
			/>
			<line
				data-id={wall.id}
				x1={wall.x1}
				y1={wall.y1}
				x2={wall.x2}
				y2={wall.y2}
				stroke={palette.gray800}
				strokeWidth={8}
				strokeLinecap="square"
				style={{ cursor }}
			/>
			{showDims && len * z > 64 && (
				<Label
					x={lx}
					y={ly}
					size={10.5}
					fill={palette.gray500}
					weight={500}
					z={z}
					transform={horizontal ? undefined : `rotate(-90 ${lx} ${ly})`}
				>
					{formatMetres(len)}
				</Label>
			)}
		</>
	);
}

function PillarShape({ item: pillar, z, cursor }: Shape<Pillar>) {
	return (
		<>
			<rect
				data-id={pillar.id}
				x={pillar.cx - pillar.w / 2}
				y={pillar.cy - pillar.h / 2}
				width={pillar.w}
				height={pillar.h}
				fill={palette.gray800}
				style={{ cursor }}
			/>
			{Math.min(pillar.w, pillar.h) * z > 22 && (
				<Label
					x={pillar.cx}
					y={pillar.cy}
					size={10}
					fill={palette.white}
					weight={600}
					z={z}
				>
					柱
				</Label>
			)}
		</>
	);
}

// Drawn along +x centred on the origin; the wrapper rotates/flips it into place.
function FixtureSymbol({ item: fixture, z }: Shape<Door | Window>) {
	const length = fixture.len,
		thickness = 12,
		hitT = Math.max(thickness, screenPx(10, z)),
		thin = screenPx(1, z);
	const gap = (
		<rect
			x={-length / 2}
			y={-thickness / 2}
			width={length}
			height={thickness}
			fill={palette.white}
		/>
	);
	const jambs = (
		<>
			<line
				x1={-length / 2}
				y1={-thickness / 2}
				x2={-length / 2}
				y2={thickness / 2}
				stroke={palette.gray800}
				strokeWidth={screenPx(1.5, z)}
			/>
			<line
				x1={length / 2}
				y1={-thickness / 2}
				x2={length / 2}
				y2={thickness / 2}
				stroke={palette.gray800}
				strokeWidth={screenPx(1.5, z)}
			/>
		</>
	);
	if (fixture.type === "window")
		return (
			<>
				<rect
					x={-length / 2}
					y={-hitT}
					width={length}
					height={2 * hitT}
					fill="transparent"
				/>
				<rect
					x={-length / 2}
					y={-thickness / 2}
					width={length}
					height={thickness}
					fill={palette.white}
					stroke={palette.gray700}
					strokeWidth={thin}
				/>
				<line
					x1={-length / 2}
					y1={0}
					x2={length / 2}
					y2={0}
					stroke={palette.gray700}
					strokeWidth={thin}
				/>
			</>
		);
	if (fixture.kind === "slide") {
		const arrowLength = screenPx(5, z),
			arrowSpread = screenPx(4, z);
		return (
			<>
				<rect
					x={-length / 2}
					y={-hitT}
					width={length}
					height={2 * hitT}
					fill="transparent"
				/>
				{gap}
				<rect
					x={length / 2}
					y={-thickness / 2 + 1}
					width={length * 0.9}
					height={4}
					fill="none"
					stroke={palette.gray400}
					strokeWidth={thin}
					strokeDasharray={`${screenPx(3, z)} ${screenPx(2, z)}`}
				/>
				<rect
					x={-length / 2}
					y={-thickness / 2 + 1}
					width={length}
					height={4}
					fill={palette.white}
					stroke={palette.gray800}
					strokeWidth={screenPx(1.5, z)}
				/>
				<path
					d={`M ${-length / 4} ${thickness / 2 + screenPx(6, z)} H ${length / 4} m ${-arrowLength} ${-arrowSpread} l ${arrowLength} ${arrowSpread} l ${-arrowLength} ${arrowSpread}`}
					fill="none"
					stroke={palette.gray500}
					strokeWidth={screenPx(1.25, z)}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				{jambs}
			</>
		);
	}
	if (fixture.kind === "fold")
		return (
			<>
				<rect
					x={-length / 2}
					y={-length * 0.45}
					width={length}
					height={length * 0.45 + thickness / 2}
					fill="transparent"
				/>
				{gap}
				<path
					d={`M ${-length / 2} 0 L ${-length / 4} ${-length * 0.43} L 0 0`}
					fill="none"
					stroke={palette.gray800}
					strokeWidth={screenPx(2.5, z)}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<line
					x1={0}
					y1={0}
					x2={length / 2}
					y2={0}
					stroke={palette.gray400}
					strokeWidth={thin}
					strokeDasharray={`${screenPx(3, z)} ${screenPx(2, z)}`}
				/>
				{jambs}
			</>
		);
	return (
		<>
			<rect
				x={-length / 2}
				y={-length}
				width={length}
				height={length + thickness / 2}
				fill="transparent"
			/>
			{gap}
			<path
				d={`M ${length / 2} 0 A ${length} ${length} 0 0 0 ${-length / 2} ${-length}`}
				fill="none"
				stroke={palette.gray400}
				strokeWidth={thin}
				strokeDasharray={`${screenPx(4, z)} ${screenPx(3, z)}`}
			/>
			<line
				x1={-length / 2}
				y1={0}
				x2={-length / 2}
				y2={-length}
				stroke={palette.gray800}
				strokeWidth={screenPx(2.5, z)}
				strokeLinecap="round"
			/>
			{jambs}
		</>
	);
}

function Fixture({ item: fixture, z, cursor }: Shape<Door | Window>) {
	const flip = fixture.type === "door" ? fixture.flip : 0;
	return (
		<g
			data-id={fixture.id}
			transform={`translate(${fixture.x} ${fixture.y}) rotate(${fixture.axis === "v" ? 90 : 0})`}
			style={{ cursor }}
		>
			<g transform={`scale(${flip & 1 ? -1 : 1} ${flip & 2 ? -1 : 1})`}>
				<FixtureSymbol item={fixture} z={z} />
			</g>
		</g>
	);
}

function Selection({ item: sel, z, coarse }: Shape & { coarse: boolean }) {
	if (sel.type === "wall") {
		const radius = screenPx(coarse ? 11 : 7, z);
		return (
			<>
				<line
					data-noexport="1"
					x1={sel.x1}
					y1={sel.y1}
					x2={sel.x2}
					y2={sel.y2}
					stroke={palette.blue500}
					strokeWidth={screenPx(3, z)}
					pointerEvents="none"
				/>
				{(
					[
						["p1", sel.x1, sel.y1],
						["p2", sel.x2, sel.y2],
					] as const
				).map(([handle, x, y]) => (
					<circle
						key={handle}
						data-handle={handle}
						data-noexport="1"
						cx={x}
						cy={y}
						r={radius}
						fill={palette.white}
						stroke={palette.blue500}
						strokeWidth={screenPx(1.5, z)}
						style={{ cursor: "crosshair" }}
					/>
				))}
			</>
		);
	}
	const bounds = selectionBounds(sel);
	if (sel.type === "door" || sel.type === "window") {
		const pad = screenPx(4, z);
		return (
			<rect
				data-noexport="1"
				x={bounds.x - pad}
				y={bounds.y - pad}
				width={bounds.w + 2 * pad}
				height={bounds.h + 2 * pad}
				fill="none"
				stroke={palette.blue500}
				strokeWidth={screenPx(1.5, z)}
				strokeDasharray={`${screenPx(4, z)} ${screenPx(3, z)}`}
				pointerEvents="none"
			/>
		);
	}
	const handleSize = screenPx(coarse ? 20 : 12, z);
	return (
		<>
			<rect
				data-noexport="1"
				x={bounds.x}
				y={bounds.y}
				width={bounds.w}
				height={bounds.h}
				fill="none"
				stroke={palette.blue500}
				strokeWidth={screenPx(2, z)}
				pointerEvents="none"
			/>
			{(
				[
					["nw", bounds.x, bounds.y],
					["ne", bounds.x + bounds.w, bounds.y],
					["sw", bounds.x, bounds.y + bounds.h],
					["se", bounds.x + bounds.w, bounds.y + bounds.h],
				] as const
			).map(([handle, x, y]) => (
				<rect
					key={handle}
					data-handle={handle}
					data-noexport="1"
					x={x - handleSize / 2}
					y={y - handleSize / 2}
					width={handleSize}
					height={handleSize}
					rx={screenPx(2, z)}
					fill={palette.white}
					stroke={palette.blue500}
					strokeWidth={screenPx(1.5, z)}
					style={{
						cursor:
							handle === "nw" || handle === "se"
								? "nwse-resize"
								: "nesw-resize",
					}}
				/>
			))}
		</>
	);
}

function DraftLine({ line, z }: Scale & { line: Line }) {
	const len = Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
	return (
		<>
			<line
				data-noexport="1"
				{...line}
				stroke={palette.blue500}
				strokeWidth={8}
				strokeOpacity={0.5}
				strokeLinecap="square"
				pointerEvents="none"
			/>
			{len > 0 && (
				<Label
					x={(line.x1 + line.x2) / 2}
					y={(line.y1 + line.y2) / 2 - screenPx(18, z)}
					size={12}
					fill={palette.blue600}
					weight={600}
					z={z}
					noExport
				>
					{formatMetres(len)}
				</Label>
			)}
		</>
	);
}

function DraftRoom({ rect, z }: Scale & { rect: Rect }) {
	return (
		<>
			<rect
				data-noexport="1"
				x={rect.x}
				y={rect.y}
				width={rect.w}
				height={rect.h}
				fill="rgba(59,130,246,0.08)"
				stroke={palette.blue500}
				strokeWidth={screenPx(1.5, z)}
				strokeDasharray={`${screenPx(5, z)} ${screenPx(4, z)}`}
				pointerEvents="none"
			/>
			{rect.w > 0 && rect.h > 0 && (
				<Label
					x={rect.x + rect.w / 2}
					y={rect.y + rect.h / 2}
					size={12}
					fill={palette.blue600}
					weight={600}
					z={z}
					noExport
				>
					{`${(rect.w / 100).toFixed(2)} × ${(rect.h / 100).toFixed(2)} m`}
				</Label>
			)}
		</>
	);
}

function GridDefs({ step, z }: Scale & { step: number }) {
	return (
		<defs>
			<pattern
				id="gMinor"
				width={step}
				height={step}
				patternUnits="userSpaceOnUse"
			>
				<path
					d={`M${step} 0H0V${step}`}
					fill="none"
					stroke={palette.gray200}
					strokeWidth={screenPx(0.75, z)}
				/>
			</pattern>
			<pattern
				id="gMajor"
				width={100}
				height={100}
				patternUnits="userSpaceOnUse"
			>
				{z * step >= 6 && <rect width={100} height={100} fill="url(#gMinor)" />}
				<path
					d="M100 0H0V100"
					fill="none"
					stroke={palette.gray300}
					strokeWidth={screenPx(1, z)}
				/>
			</pattern>
		</defs>
	);
}

export type PlanSvgProps = {
	svgRef: Ref<SVGSVGElement>;
	items: Item[];
	view: View;
	sel: Item | null;
	tool: string;
	draft: Rect | null;
	draftLine: Line | null;
	panning: boolean;
	gridSize: number;
	showDims: boolean;
	coarse: boolean;
};

export function PlanSvg(props: PlanSvgProps) {
	const { z, ox, oy } = props.view;
	const cursor = props.tool === "select" ? "move" : undefined;
	const ofType = <T extends ItemType>(type: T) =>
		props.items.filter(
			(item): item is Extract<Item, { type: T }> => item.type === type,
		);
	const rooms = ofType("room");
	return (
		<svg
			ref={props.svgRef}
			width="100%"
			height="100%"
			role="img"
			aria-label="間取り図"
			style={{
				display: "block",
				touchAction: "none",
				userSelect: "none",
				background: palette.gray50,
				cursor: props.panning
					? "grabbing"
					: props.tool === "select"
						? "default"
						: "crosshair",
			}}
		>
			<GridDefs step={props.gridSize} z={z} />
			<g transform={`translate(${ox} ${oy}) scale(${z})`}>
				<rect
					data-noexport="1"
					x={-20000}
					y={-20000}
					width={40000}
					height={40000}
					fill="url(#gMajor)"
				/>
				{/* All floors before all walls so shared walls are never covered. */}
				{rooms.map((room) => (
					<rect
						key={`f${room.id}`}
						data-id={room.id}
						x={room.x}
						y={room.y}
						width={room.w}
						height={room.h}
						fill={palette.white}
						style={{ cursor }}
					/>
				))}
				{rooms.map((room) => (
					<rect
						key={`w${room.id}`}
						data-id={room.id}
						data-wall="1"
						x={room.x - ROOM_WALL / 2}
						y={room.y - ROOM_WALL / 2}
						width={room.w + ROOM_WALL}
						height={room.h + ROOM_WALL}
						fill="none"
						stroke={palette.gray800}
						strokeWidth={ROOM_WALL}
						style={{ cursor }}
					/>
				))}
				{rooms.map((room) => (
					<RoomLabels
						key={`l${room.id}`}
						item={room}
						z={z}
						showDims={props.showDims}
					/>
				))}
				{ofType("furniture").map((item) => (
					<FurnitureShape key={item.id} item={item} z={z} cursor={cursor} />
				))}
				{ofType("wall").map((item) => (
					<Partition
						key={item.id}
						item={item}
						z={z}
						cursor={cursor}
						showDims={props.showDims}
					/>
				))}
				{ofType("pillar").map((item) => (
					<PillarShape key={item.id} item={item} z={z} cursor={cursor} />
				))}
				{props.items
					.filter(
						(item): item is Door | Window =>
							item.type === "door" || item.type === "window",
					)
					.map((item) => (
						<Fixture key={item.id} item={item} z={z} cursor={cursor} />
					))}
				{props.sel && (
					<Selection item={props.sel} z={z} coarse={props.coarse} />
				)}
				{props.draftLine && <DraftLine line={props.draftLine} z={z} />}
				{props.draft && <DraftRoom rect={props.draft} z={z} />}
			</g>
		</svg>
	);
}
