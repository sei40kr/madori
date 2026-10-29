import {
	ArrowLeftRight,
	Box,
	ChevronDown,
	Copy,
	createLucideIcon,
	DoorOpen,
	FilePlus,
	FileText,
	Folder,
	Grid2x2,
	Image,
	type LucideIcon,
	Maximize,
	Minus,
	MousePointer2,
	Plus,
	Redo,
	RotateCw,
	Trash,
	Undo,
} from "lucide-react";

// Floor-plan shapes Lucide has no icon for.
const Room = createLucideIcon("room", [
	["rect", { key: "1", x: 3, y: 3, width: 18, height: 18, rx: 2 }],
	["path", { key: "2", d: "M9 3v6H3" }],
]);
const Wall = createLucideIcon("wall", [
	["path", { key: "3", d: "M5 19 19 5" }],
	["circle", { key: "4", cx: 5, cy: 19, r: 2 }],
	["circle", { key: "5", cx: 19, cy: 5, r: 2 }],
]);
const Pillar = createLucideIcon("pillar", [
	["rect", { key: "6", x: 4, y: 4, width: 16, height: 16, rx: 1 }],
	["rect", { key: "7", x: 4, y: 4, width: 7, height: 7, fill: "currentColor" }],
]);

const ICONS: Record<string, LucideIcon> = {
	select: MousePointer2,
	room: Room,
	door: DoorOpen,
	window: Grid2x2,
	box: Box,
	undo: Undo,
	redo: Redo,
	image: Image,
	pdf: FileText,
	new: FilePlus,
	trash: Trash,
	copy: Copy,
	rotate: RotateCw,
	flip: ArrowLeftRight,
	plus: Plus,
	minus: Minus,
	fit: Maximize,
	wall: Wall,
	pillar: Pillar,
	folder: Folder,
	chevron: ChevronDown,
};

export function Icon({ name, size = 16 }: { name: string; size?: number }) {
	const Svg = ICONS[name];
	return Svg ? (
		<Svg size={size} style={{ flexShrink: 0, display: "block" }} aria-hidden />
	) : null;
}
