import {
	Badge,
	Box,
	Button,
	Flex,
	IconButton,
	Input,
	Separator,
	Text,
} from "@chakra-ui/react";
import type { RefObject } from "react";
import { exportPdf, exportPng } from "@/lib/export";
import { roomM2, toJo } from "@/lib/geometry";
import { usePlanStore } from "@/lib/plan-store";
import { Icon } from "./icon";

export function Header({
	svgRef,
}: {
	svgRef: RefObject<SVGSVGElement | null>;
}) {
	const store = usePlanStore();
	const totalM2 = store.items.reduce(
		(sum, item) => (item.type === "room" ? sum + roomM2(item) : sum),
		0,
	);
	const exportWith = (write: typeof exportPng) => {
		if (svgRef.current)
			write(svgRef.current, {
				items: store.items,
				name: store.name,
				view: store.view,
			});
	};
	return (
		<Flex
			as="header"
			align="center"
			gap="3"
			h="14"
			px="4"
			borderBottomWidth="1px"
			flexShrink={0}
			minW="0"
		>
			<Text
				fontWeight="semibold"
				fontSize="15px"
				whiteSpace="nowrap"
				flexShrink={0}
			>
				Madori
			</Text>
			<Separator orientation="vertical" h="6" />
			<Input
				size="xs"
				aria-label="プラン名"
				value={store.name}
				onChange={(event) => store.setName(event.target.value)}
				w="200px"
				minW="80px"
				flexShrink={1}
				fontSize="sm"
				fontWeight="medium"
				borderColor="transparent"
				_hover={{ borderColor: "border" }}
			/>
			<Badge size="md" flexShrink={0} whiteSpace="nowrap">
				延床 {totalM2.toFixed(2)}㎡ · {toJo(totalM2).toFixed(1)}畳
			</Badge>
			<Box flex="1" />
			<Flex align="center" gap="0.5" flexShrink={0}>
				<IconButton
					size="xs"
					variant="ghost"
					aria-label="元に戻す"
					title="元に戻す (⌘Z)"
					disabled={!store.past.length}
					onClick={store.undo}
				>
					<Icon name="undo" />
				</IconButton>
				<IconButton
					size="xs"
					variant="ghost"
					aria-label="やり直し"
					title="やり直し (⇧⌘Z)"
					disabled={!store.future.length}
					onClick={store.redo}
				>
					<Icon name="redo" />
				</IconButton>
			</Flex>
			<Flex align="center" gap="2" flexShrink={0}>
				<Button size="xs" variant="outline" onClick={store.reset}>
					<Icon name="new" size={14} />
					新規
				</Button>
				<Button
					size="xs"
					variant="outline"
					onClick={() => exportWith(exportPng)}
				>
					<Icon name="image" size={14} />
					画像
				</Button>
				<Button size="xs" onClick={() => exportWith(exportPdf)}>
					<Icon name="pdf" size={14} />
					PDF
				</Button>
			</Flex>
		</Flex>
	);
}
