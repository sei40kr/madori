import type { FurnitureKind, FurnitureSpec, SizePreset } from "./types";

export const FURNITURE: Record<FurnitureKind, FurnitureSpec> = {
	fridge: {
		label: "冷蔵庫",
		sizes: [
			{ label: "小型 〜150L", w: 50, h: 60 },
			{ label: "中型 〜350L", w: 60, h: 66 },
			{ label: "大型 〜500L", w: 65, h: 70 },
			{ label: "特大 600L〜", w: 75, h: 75 },
		],
	},
	washer: {
		label: "洗濯機",
		sizes: [
			{ label: "縦型 小型", w: 55, h: 55 },
			{ label: "縦型 標準", w: 60, h: 60 },
			{ label: "ドラム式", w: 64, h: 72 },
			{ label: "防水パン", w: 74, h: 64 },
		],
	},
	bed: {
		label: "ベッド",
		sizes: [
			{ label: "シングル", w: 97, h: 195 },
			{ label: "セミダブル", w: 120, h: 195 },
			{ label: "ダブル", w: 140, h: 195 },
			{ label: "クイーン", w: 160, h: 195 },
		],
	},
	sofa: {
		label: "ソファ",
		sizes: [
			{ label: "1人掛け", w: 80, h: 80 },
			{ label: "2人掛け", w: 150, h: 85 },
			{ label: "3人掛け", w: 190, h: 85 },
		],
	},
	dining: {
		label: "ダイニングテーブル",
		sizes: [
			{ label: "2人用", w: 75, h: 75 },
			{ label: "4人用", w: 120, h: 75 },
			{ label: "6人用", w: 180, h: 80 },
		],
	},
	desk: {
		label: "デスク",
		sizes: [
			{ label: "小", w: 100, h: 60 },
			{ label: "中", w: 120, h: 60 },
			{ label: "大", w: 140, h: 70 },
		],
	},
	tvStand: {
		label: "テレビ台",
		sizes: [
			{ label: "120cm", w: 120, h: 40 },
			{ label: "150cm", w: 150, h: 40 },
			{ label: "180cm", w: 180, h: 45 },
		],
	},
	shelf: {
		label: "収納棚",
		sizes: [
			{ label: "小", w: 60, h: 30 },
			{ label: "中", w: 90, h: 40 },
			{ label: "大", w: 120, h: 45 },
		],
	},
	other: { label: "家具", sizes: [] },
};
export const PILLAR_SIZES: SizePreset[] = [
	{ label: "木造 10.5cm角", w: 10.5, h: 10.5 },
	{ label: "木造 12cm角", w: 12, h: 12 },
	{ label: "鉄骨 40cm角", w: 40, h: 40 },
	{ label: "RC 60cm角", w: 60, h: 60 },
];
