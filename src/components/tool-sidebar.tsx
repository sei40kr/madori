import { Box, Button, Flex, Kbd, Stack, Text } from "@chakra-ui/react";
import { usePlanStore } from "@/lib/plan-store";
import { Icon } from "./icon";

export function ToolSidebar() {
	const tool = usePlanStore((state) => state.tool);
	const onSelect = usePlanStore((state) => state.setTool);
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
			<Stack gap="2">
				<Text textStyle="xs" fontWeight="semibold" color="fg.muted">
					ツール
				</Text>
				<Stack gap="0.5">
					<Button
						size="sm"
						variant="ghost"
						justifyContent="flex-start"
						gap="2.5"
						px="2.5"
						bg={tool === "select" ? "blue.subtle" : undefined}
						color={tool === "select" ? "blue.fg" : "fg"}
						aria-pressed={tool === "select"}
						onClick={() => onSelect("select")}
					>
						<Icon name="select" />
						<Box as="span" flex="1" textAlign="left">
							選択・移動
						</Box>
						<Kbd size="sm">V</Kbd>
					</Button>
					<Button
						size="sm"
						variant="ghost"
						justifyContent="flex-start"
						gap="2.5"
						px="2.5"
						bg={tool === "room" ? "blue.subtle" : undefined}
						color={tool === "room" ? "blue.fg" : "fg"}
						aria-pressed={tool === "room"}
						onClick={() => onSelect("room")}
					>
						<Icon name="room" />
						<Box as="span" flex="1" textAlign="left">
							部屋
						</Box>
						<Kbd size="sm">R</Kbd>
					</Button>
					<Button
						size="sm"
						variant="ghost"
						justifyContent="flex-start"
						gap="2.5"
						px="2.5"
						bg={tool === "door" ? "blue.subtle" : undefined}
						color={tool === "door" ? "blue.fg" : "fg"}
						aria-pressed={tool === "door"}
						onClick={() => onSelect("door")}
					>
						<Icon name="door" />
						<Box as="span" flex="1" textAlign="left">
							ドア
						</Box>
						<Kbd size="sm">D</Kbd>
					</Button>
					<Button
						size="sm"
						variant="ghost"
						justifyContent="flex-start"
						gap="2.5"
						px="2.5"
						bg={tool === "window" ? "blue.subtle" : undefined}
						color={tool === "window" ? "blue.fg" : "fg"}
						aria-pressed={tool === "window"}
						onClick={() => onSelect("window")}
					>
						<Icon name="window" />
						<Box as="span" flex="1" textAlign="left">
							窓
						</Box>
						<Kbd size="sm">W</Kbd>
					</Button>
					<Button
						size="sm"
						variant="ghost"
						justifyContent="flex-start"
						gap="2.5"
						px="2.5"
						bg={tool === "wall" ? "blue.subtle" : undefined}
						color={tool === "wall" ? "blue.fg" : "fg"}
						aria-pressed={tool === "wall"}
						onClick={() => onSelect("wall")}
					>
						<Icon name="wall" />
						<Box as="span" flex="1" textAlign="left">
							仕切り
						</Box>
						<Kbd size="sm">L</Kbd>
					</Button>
					<Button
						size="sm"
						variant="ghost"
						justifyContent="flex-start"
						gap="2.5"
						px="2.5"
						bg={tool === "pillar" ? "blue.subtle" : undefined}
						color={tool === "pillar" ? "blue.fg" : "fg"}
						aria-pressed={tool === "pillar"}
						onClick={() => onSelect("pillar")}
					>
						<Icon name="pillar" />
						<Box as="span" flex="1" textAlign="left">
							柱
						</Box>
						<Kbd size="sm">P</Kbd>
					</Button>
					<Button
						size="sm"
						variant="ghost"
						justifyContent="flex-start"
						gap="2.5"
						px="2.5"
						bg={tool === "furniture" ? "blue.subtle" : undefined}
						color={tool === "furniture" ? "blue.fg" : "fg"}
						aria-pressed={tool === "furniture"}
						onClick={() => onSelect("furniture")}
					>
						<Icon name="box" />
						<Box as="span" flex="1" textAlign="left">
							家具
						</Box>
						<Kbd size="sm">F</Kbd>
					</Button>
				</Stack>
			</Stack>
			<Stack mt="auto" gap="1.5" textStyle="xs" color="fg.muted">
				<Text>Space + ドラッグ / 空白をドラッグ：画面移動</Text>
				<Text>ホイール・ピンチ：ズーム</Text>
				<Text>矢印キー：10cm移動（Shiftで1m）</Text>
			</Stack>
		</Flex>
	);
}
