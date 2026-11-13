import {
	createListCollection,
	Flex,
	Kbd,
	Listbox,
	SegmentGroup,
	Stack,
	Text,
} from "@chakra-ui/react";
import { inMode, type Mode, usePlanStore } from "@/lib/plan-store";
import type { Tool } from "@/lib/types";
import { Icon } from "./icon";

const MODES = [
	{ value: "plan", label: "間取り" },
	{ value: "interior", label: "インテリア" },
];

const TOOLS: { value: Tool; label: string; icon: string; key: string }[] = [
	{ value: "select", label: "選択・移動", icon: "select", key: "V" },
	{ value: "room", label: "部屋", icon: "room", key: "R" },
	{ value: "door", label: "ドア", icon: "door", key: "D" },
	{ value: "window", label: "窓", icon: "window", key: "W" },
	{ value: "wall", label: "仕切り", icon: "wall", key: "L" },
	{ value: "pillar", label: "柱", icon: "pillar", key: "P" },
	{ value: "furniture", label: "家具", icon: "box", key: "F" },
];

export function ToolSidebar() {
	const tool = usePlanStore((state) => state.tool);
	const onSelect = usePlanStore((state) => state.setTool);
	const mode = usePlanStore((state) => state.mode);
	const setMode = usePlanStore((state) => state.setMode);
	const tools = createListCollection({
		items: TOOLS.filter((item) => inMode(mode, item.value)),
	});
	return (
		<Flex
			as="aside"
			direction="column"
			gap="6"
			w="232px"
			flexShrink={0}
			p="4"
			borderRightWidth="1px"
			overflowY="auto"
		>
			<SegmentGroup.Root
				size="sm"
				value={mode}
				onValueChange={(event) => event.value && setMode(event.value as Mode)}
			>
				<SegmentGroup.Indicator />
				<SegmentGroup.Items items={MODES} flex="1" whiteSpace="nowrap" />
			</SegmentGroup.Root>
			<Listbox.Root
				collection={tools}
				value={[tool]}
				onValueChange={(event) =>
					event.value[0] && onSelect(event.value[0] as Tool)
				}
				variant="plain"
				gap="2"
			>
				<Listbox.Label textStyle="xs" fontWeight="semibold" color="fg.muted">
					ツール
				</Listbox.Label>
				<Listbox.Content p="0" gap="0.5">
					{tools.items.map((item) => (
						<Listbox.Item
							key={item.value}
							item={item}
							h="9"
							gap="2.5"
							px="2.5"
							fontWeight="medium"
							_hover={{ bg: "bg.muted" }}
							_selected={{ bg: "blue.subtle", color: "blue.fg" }}
						>
							<Icon name={item.icon} />
							<Listbox.ItemText>{item.label}</Listbox.ItemText>
							<Kbd size="sm">{item.key}</Kbd>
						</Listbox.Item>
					))}
				</Listbox.Content>
			</Listbox.Root>
			<Stack mt="auto" gap="1.5" textStyle="xs" color="fg.muted">
				<Text>Space + ドラッグ / 空白をドラッグ：画面移動</Text>
				<Text>ホイール・ピンチ：ズーム</Text>
				<Text>矢印キー：10cm移動（Shiftで1m）</Text>
			</Stack>
		</Flex>
	);
}
