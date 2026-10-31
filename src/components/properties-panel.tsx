import {
	Badge,
	Box,
	Button,
	Dialog,
	Field,
	Flex,
	Grid,
	IconButton,
	Input,
	Portal,
	SegmentGroup,
	SimpleGrid,
	Stack,
	Stat,
	Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { roomM2, toJo } from "@/lib/geometry";
import { floorName, usePlanStore } from "@/lib/plan-store";
import { FURNITURE, PILLAR_SIZES } from "@/lib/presets";
import type {
	DoorKind,
	FurnitureKind,
	FurnitureSpec,
	Item,
	ItemType,
	Room,
} from "@/lib/types";
import { Icon } from "./icon";

function AreaStat({ label, m2 }: { label: string; m2: number }) {
	return (
		<SimpleGrid
			columns={2}
			gap="3"
			p="3"
			bg="bg.subtle"
			borderWidth="1px"
			borderColor="border.muted"
			rounded="l3"
		>
			<Stat.Root gap="0.5">
				<Stat.Label>{label}</Stat.Label>
				<Stat.ValueText fontSize="lg">
					{m2.toFixed(2)}
					<Stat.ValueUnit>㎡</Stat.ValueUnit>
				</Stat.ValueText>
			</Stat.Root>
			<Stat.Root gap="0.5">
				<Stat.Label>畳数</Stat.Label>
				<Stat.ValueText fontSize="lg">
					{toJo(m2).toFixed(1)}
					<Stat.ValueUnit>畳</Stat.ValueUnit>
				</Stat.ValueText>
			</Stat.Root>
		</SimpleGrid>
	);
}

// Shows and takes metres for a value stored in cm. Keeps the raw text while focused,
// so partial entries like "1." survive.
function MetreField({
	label,
	cm,
	onChange,
}: {
	label: string;
	cm: number;
	onChange: (cm: number) => void;
}) {
	const [text, setText] = useState<string | null>(null);
	return (
		<Field.Root>
			<Field.Label>{label}</Field.Label>
			<Input
				size="sm"
				type="number"
				step="0.05"
				min={0}
				inputMode="decimal"
				value={text ?? (cm / 100).toFixed(2)}
				onChange={(event) => {
					setText(event.target.value);
					const metres = parseFloat(event.target.value);
					if (Number.isFinite(metres)) onChange(Math.round(metres * 1000) / 10);
				}}
				onBlur={() => setText(null)}
				fontVariantNumeric="tabular-nums"
			/>
		</Field.Root>
	);
}

const chip = (selected: boolean) =>
	selected
		? { bg: "blue.subtle", color: "blue.fg", borderColor: "blue.muted" }
		: { bg: "bg", color: "fg", borderColor: "border" };

const TYPE_LABEL: Record<ItemType, string> = {
	room: "部屋",
	door: "ドア",
	window: "窓",
	furniture: "家具",
	wall: "仕切り",
	pillar: "柱",
};
const DOOR_KINDS: { value: DoorKind; label: string }[] = [
	{ value: "swing", label: "開き戸" },
	{ value: "slide", label: "引き戸" },
	{ value: "fold", label: "折れ戸" },
];

const SEL_META: Record<Item["type"], string> = {
	furniture: "ドラッグで移動",
	room: "ドラッグで移動・角でサイズ変更",
	pillar: "ドラッグで移動・角でサイズ変更",
	wall: "端点をドラッグで長さ変更",
	door: "壁に沿ってドラッグで移動",
	window: "壁に沿ってドラッグで移動",
};

// Moves the selection by an offset in metres; negative values go left or up.
function MoveDialog({ onMove }: { onMove: (dx: number, dy: number) => void }) {
	const [open, setOpen] = useState(false);
	const [dx, setDx] = useState("0");
	const [dy, setDy] = useState("0");
	const cm = (text: string) => Math.round((parseFloat(text) || 0) * 1000) / 10;
	return (
		<Dialog.Root
			open={open}
			onOpenChange={(event) => {
				setOpen(event.open);
				if (event.open) {
					setDx("0");
					setDy("0");
				}
			}}
			size="xs"
			placement="center"
		>
			<Dialog.Trigger asChild>
				<Button size="xs" variant="outline">
					<Icon name="move" size={14} />
					移動
				</Button>
			</Dialog.Trigger>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content
						as="form"
						onSubmit={(event) => {
							event.preventDefault();
							onMove(cm(dx), cm(dy));
							setOpen(false);
						}}
					>
						<Dialog.Header>
							<Dialog.Title>移動</Dialog.Title>
						</Dialog.Header>
						<Dialog.Body>
							<SimpleGrid columns={2} gap="3">
								{(
									[
										["右へ (m)", dx, setDx],
										["下へ (m)", dy, setDy],
									] as const
								).map(([label, value, set]) => (
									<Field.Root key={label}>
										<Field.Label>{label}</Field.Label>
										<Input
											size="sm"
											type="number"
											step="0.05"
											inputMode="decimal"
											value={value}
											onChange={(event) => set(event.target.value)}
											fontVariantNumeric="tabular-nums"
										/>
									</Field.Root>
								))}
							</SimpleGrid>
							<Text textStyle="xs" color="fg.muted" mt="2">
								左・上へはマイナスで指定します。
							</Text>
						</Dialog.Body>
						<Dialog.Footer>
							<Dialog.ActionTrigger asChild>
								<Button size="sm" variant="outline">
									キャンセル
								</Button>
							</Dialog.ActionTrigger>
							<Button size="sm" type="submit" disabled={!cm(dx) && !cm(dy)}>
								移動
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
}

export function SelectionPanel() {
	const store = usePlanStore();
	const sel = store.items.find((item) => item.id === store.sel);
	if (!sel) return null;
	const isFixture = sel.type === "door" || sel.type === "window";
	const hasSize =
		sel.type === "room" || sel.type === "furniture" || sel.type === "pillar";
	const sizeList =
		sel.type === "pillar"
			? PILLAR_SIZES
			: sel.type === "furniture"
				? FURNITURE[sel.kind].sizes
				: [];
	const typeLabel =
		sel.type === "door" && sel.kind === "slide"
			? "引き戸"
			: sel.type === "door" && sel.kind === "fold"
				? "折れ戸"
				: TYPE_LABEL[sel.type];
	return (
		<Stack gap="4">
			<Flex align="center" gap="2">
				<Badge colorPalette="blue">{typeLabel}</Badge>
				<Text flex="1" minW="0" textStyle="xs" color="fg.muted">
					{SEL_META[sel.type]}
				</Text>
			</Flex>
			{sel.type === "furniture" && (
				<Stack gap="1.5">
					<Text textStyle="sm" fontWeight="medium">
						種類
					</Text>
					<Flex wrap="wrap" gap="1.5">
						{(
							Object.entries(FURNITURE) as [FurnitureKind, FurnitureSpec][]
						).map(([kind, spec]) => (
							<Button
								key={kind}
								size="2xs"
								variant="outline"
								{...chip(sel.kind === kind)}
								onClick={() => store.update({ kind, name: spec.label })}
							>
								{spec.label}
							</Button>
						))}
					</Flex>
				</Stack>
			)}
			{(sel.type === "room" || sel.type === "furniture") && (
				<Field.Root>
					<Field.Label>名前</Field.Label>
					<Input
						size="sm"
						value={sel.name || ""}
						placeholder="自由入力"
						onChange={(event) =>
							store.update({ name: event.target.value }, "name")
						}
					/>
				</Field.Root>
			)}
			{sizeList.length > 0 && (
				<Stack gap="1.5">
					<Text textStyle="sm" fontWeight="medium">
						一般的なサイズ
					</Text>
					<SimpleGrid columns={2} gap="1.5">
						{sizeList.map(({ label, w, h }) => (
							<Button
								key={label}
								variant="outline"
								h="auto"
								py="2"
								px="2.5"
								flexDirection="column"
								alignItems="flex-start"
								gap="1"
								textStyle="xs"
								{...chip("w" in sel && sel.w === w && sel.h === h)}
								onClick={() => store.setSize(w, h)}
							>
								<span>{label}</span>
								<Text
									as="span"
									fontSize="11px"
									fontWeight="normal"
									color="fg.muted"
									fontVariantNumeric="tabular-nums"
								>
									{w}×{h}cm
								</Text>
							</Button>
						))}
					</SimpleGrid>
				</Stack>
			)}
			{hasSize && (
				<Grid
					templateColumns="minmax(0,1fr) auto minmax(0,1fr)"
					gap="1.5"
					alignItems="end"
				>
					<MetreField
						label="幅 (m)"
						cm={sel.w}
						onChange={(cm) => store.setDimension("w", cm)}
					/>
					<IconButton
						size="sm"
						variant="ghost"
						color="fg.muted"
						aria-label="幅と奥行を入れ替え"
						title="幅と奥行を入れ替え"
						onClick={() => store.setSize(sel.h, sel.w)}
					>
						<Icon name="flip" />
					</IconButton>
					<MetreField
						label="奥行 (m)"
						cm={sel.h}
						onChange={(cm) => store.setDimension("h", cm)}
					/>
				</Grid>
			)}
			{sel.type === "wall" && (
				<MetreField
					label="長さ (m)"
					cm={Math.hypot(sel.x2 - sel.x1, sel.y2 - sel.y1)}
					onChange={store.setWallLength}
				/>
			)}
			{sel.type === "door" && (
				<Stack gap="1.5">
					<Text textStyle="sm" fontWeight="medium">
						種類
					</Text>
					<SegmentGroup.Root
						size="sm"
						value={sel.kind}
						onValueChange={(event) =>
							event.value && store.update({ kind: event.value as DoorKind })
						}
					>
						<SegmentGroup.Indicator />
						<SegmentGroup.Items items={DOOR_KINDS} flex="1" />
					</SegmentGroup.Root>
				</Stack>
			)}
			{isFixture && (
				<MetreField
					label="幅 (m)"
					cm={sel.len}
					onChange={(cm) => store.setDimension("len", cm)}
				/>
			)}
			{sel.type === "room" && <AreaStat label="面積" m2={roomM2(sel)} />}
			<Flex wrap="wrap" gap="2">
				{isFixture && (
					<Button
						size="xs"
						variant="outline"
						onClick={() =>
							store.update((item) =>
								!("axis" in item)
									? {}
									: item.axis === "h"
										? { axis: "v" }
										: {
												axis: "h",
												...("flip" in item && { flip: item.flip ^ 3 }),
											},
							)
						}
					>
						<Icon name="rotate" size={14} />
						90°回転
					</Button>
				)}
				{sel.type === "door" && (
					<Button
						size="xs"
						variant="outline"
						onClick={() =>
							store.update((item) =>
								"flip" in item ? { flip: (item.flip + 1) % 4 } : {},
							)
						}
					>
						<Icon name="flip" size={14} />
						向きを反転
					</Button>
				)}
				<MoveDialog onMove={store.nudge} />
				<Button size="xs" variant="outline" onClick={store.duplicate}>
					<Icon name="copy" size={14} />
					複製
				</Button>
				<Button
					size="xs"
					variant="outline"
					color="fg.error"
					_hover={{ bg: "bg.error", borderColor: "red.200" }}
					onClick={store.remove}
				>
					<Icon name="trash" size={14} />
					削除
				</Button>
			</Flex>
		</Stack>
	);
}

export function PlanSummary() {
	const items = usePlanStore((state) => state.items);
	const multi = usePlanStore(
		(state) =>
			(state.plans.find((plan) => plan.id === state.curId)?.floors.length ??
				0) > 1,
	);
	const floor = usePlanStore((state) => state.floor);
	const select = usePlanStore((state) => state.select);
	const rooms = items.filter((item): item is Room => item.type === "room");
	const totalM2 = rooms.reduce((sum, room) => sum + roomM2(room), 0);
	return (
		<Stack gap="4">
			<Text textStyle="sm" fontWeight="semibold">
				間取りの概要
			</Text>
			<AreaStat
				label={multi ? `${floorName(floor)}の床面積` : "延床面積"}
				m2={totalM2}
			/>
			<Stack gap="0.5">
				<Text textStyle="xs" fontWeight="semibold" color="fg.muted" mb="1">
					部屋
				</Text>
				{rooms.map((room) => (
					<Button
						key={room.id}
						size="sm"
						variant="ghost"
						justifyContent="flex-start"
						gap="2"
						px="2.5"
						fontWeight="normal"
						onClick={() => select(room.id)}
					>
						<Box as="span" flex="1" minW="0" truncate textAlign="left">
							{room.name}
						</Box>
						<Text
							as="span"
							textStyle="xs"
							color="fg.muted"
							fontVariantNumeric="tabular-nums"
						>
							{roomM2(room).toFixed(2)}㎡ · {toJo(roomM2(room)).toFixed(1)}畳
						</Text>
					</Button>
				))}
				{!rooms.length && (
					<Text textStyle="sm" color="fg.muted" py="2" px="2.5">
						「部屋」ツールでキャンバスをドラッグすると部屋を作成できます。
					</Text>
				)}
			</Stack>
			<Text textStyle="xs" color="fg.muted">
				部屋や家具をクリックすると、ここで寸法を編集できます。変更はブラウザに自動保存されます。
			</Text>
		</Stack>
	);
}
