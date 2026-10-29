import { Button, Flex, IconButton, Separator, Text } from "@chakra-ui/react";
import { Icon } from "./icon";

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
