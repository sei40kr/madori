import {
	Box,
	Button,
	Flex,
	IconButton,
	Separator,
	Switch,
	Tabs,
	Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { floorName, usePlanStore } from "@/lib/plan-store";
import { Icon } from "./icon";

// Floor tabs (drag to reorder), add/delete, and the toggle for the first floor's outline.
export function FloorBar() {
	const store = usePlanStore();
	const floors =
		store.plans.find((plan) => plan.id === store.curId)?.floors ?? [];
	const [drag, setDrag] = useState<{ from: number; over: number } | null>(null);
	const multi = floors.length > 1,
		current = floorName(store.floor);
	return (
		<Flex
			position="absolute"
			top="3"
			left="3"
			maxW="calc(100% - 180px)"
			direction="column"
			align="flex-start"
			gap="2"
			zIndex="12"
		>
			<Tabs.Root
				value={floors[store.floor]?.id ?? null}
				onValueChange={({ value }) =>
					store.openFloor(floors.findIndex((floor) => floor.id === value))
				}
				variant="enclosed"
				size="sm"
				// The recipe's horizontal display rule outranks a plain `display` prop.
				_horizontal={{ display: "flex" }}
				alignItems="center"
				gap="1"
				maxW="full"
				minW="0"
				p="3px"
				bg="bg"
				borderWidth="1px"
				rounded="l2"
				shadow="xs"
				css={{ "--tabs-height": "26px" }}
			>
				<Box title="フロア" color="fg.muted" pl="1.5" pr="1" flexShrink={0}>
					<Icon name="layers" />
				</Box>
				<Tabs.List
					aria-label="フロア"
					gap="0.5"
					minW="0"
					overflowX="auto"
					p="2px"
					rounded="l2"
					css={{ scrollbarWidth: "none" }}
				>
					{floors.map((floor, i) => {
						const over = drag && drag.over === i && drag.from !== i;
						return (
							<Tabs.Trigger
								key={floor.id}
								value={floor.id}
								title="ドラッグで順序を変更"
								draggable
								minW="44px"
								px="2.5"
								flexShrink={0}
								rounded="l1"
								fontSize="13px"
								boxShadow={
									over
										? `inset ${drag.from > i ? 2 : -2}px 0 0 var(--chakra-colors-blue-500)`
										: undefined
								}
								opacity={drag?.from === i ? 0.5 : 1}
								onDragStart={(event) => {
									event.dataTransfer.effectAllowed = "move";
									setDrag({ from: i, over: i });
								}}
								onDragOver={(event) => {
									if (!drag) return;
									event.preventDefault();
									if (drag.over !== i) setDrag({ ...drag, over: i });
								}}
								onDrop={(event) => {
									if (!drag) return;
									event.preventDefault();
									setDrag(null);
									store.moveFloor(drag.from, i);
								}}
								onDragEnd={() => setDrag(null)}
							>
								{floorName(i)}
							</Tabs.Trigger>
						);
					})}
				</Tabs.List>
				<IconButton
					size="xs"
					variant="ghost"
					aria-label="フロアを追加"
					title="フロアを追加"
					onClick={store.addFloor}
				>
					<Icon name="plus" />
				</IconButton>
				<IconButton
					size="xs"
					variant="ghost"
					aria-label={`${current}を削除`}
					title={
						multi ? `${current}を削除` : "フロアが1つのときは削除できません"
					}
					disabled={!multi}
					onClick={store.deleteFloor}
				>
					<Icon name="trash" />
				</IconButton>
			</Tabs.Root>
			{store.floor > 0 &&
				floors[0]?.items.some((item) => item.type === "room") && (
					<Switch.Root
						size="sm"
						checked={store.showGuide}
						onCheckedChange={store.toggleGuide}
						h="8"
						px="3"
						bg="bg"
						borderWidth="1px"
						rounded="l2"
						shadow="xs"
						title={`${floorName(0)}の外形を表示`}
					>
						<Switch.HiddenInput />
						<Switch.Label fontWeight="medium">外形</Switch.Label>
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
					</Switch.Root>
				)}
		</Flex>
	);
}

export function ToolHint({
	hint,
	onCancel,
}: {
	hint: string;
	onCancel: () => void;
}) {
	return (
		<Flex
			position="absolute"
			top="3"
			left="50%"
			transform="translateX(-50%)"
			align="center"
			gap="2.5"
			py="1.5"
			pr="1.5"
			pl="3.5"
			bg="gray.900"
			color="white"
			rounded="full"
			shadow="md"
			fontSize="13px"
			whiteSpace="nowrap"
			zIndex="15"
		>
			<span>{hint}</span>
			<Button
				size="2xs"
				rounded="full"
				bg="gray.700"
				color="white"
				_hover={{ bg: "gray.600" }}
				onClick={onCancel}
			>
				キャンセル (Esc)
			</Button>
		</Flex>
	);
}

export function ZoomControls({
	zoom,
	onZoomIn,
	onZoomOut,
	onFit,
}: {
	zoom: number;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onFit: () => void;
}) {
	return (
		<Flex
			position="absolute"
			top="3"
			right="3"
			align="center"
			bg="bg"
			borderWidth="1px"
			rounded="l2"
			shadow="xs"
			zIndex="10"
		>
			<IconButton
				size="xs"
				variant="ghost"
				aria-label="縮小"
				title="縮小"
				onClick={onZoomOut}
			>
				<Icon name="minus" />
			</IconButton>
			<Text
				minW="11"
				textAlign="center"
				textStyle="xs"
				fontWeight="medium"
				color="fg.muted"
				fontVariantNumeric="tabular-nums"
			>
				{Math.round(zoom * 100)}%
			</Text>
			<IconButton
				size="xs"
				variant="ghost"
				aria-label="拡大"
				title="拡大"
				onClick={onZoomIn}
			>
				<Icon name="plus" />
			</IconButton>
			<Separator orientation="vertical" h="5" />
			<IconButton
				size="xs"
				variant="ghost"
				aria-label="全体を表示"
				title="全体を表示"
				onClick={onFit}
			>
				<Icon name="fit" />
			</IconButton>
		</Flex>
	);
}
