import {
	Badge,
	Box,
	Button,
	Flex,
	IconButton,
	Input,
	Menu,
	Portal,
	Separator,
	Text,
} from "@chakra-ui/react";
import { type RefObject, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { exportPdf, exportPng } from "@/lib/export";
import { toJo } from "@/lib/geometry";
import { floorM2, floorName, openFloors, usePlanStore } from "@/lib/plan-store";
import { Icon } from "./icon";
import { byUpdated, PlanLibrary } from "./plan-library";

export function Header({
	svgRef,
}: {
	svgRef: RefObject<SVGSVGElement | null>;
}) {
	// Narrow selectors keep drags, which replace `items` on every move, from re-rendering the header.
	const store = usePlanStore(
		useShallow(
			({ name, past, future, newPlan, openPlan, setName, undo, redo }) => ({
				name,
				past,
				future,
				newPlan,
				openPlan,
				setName,
				undo,
				redo,
			}),
		),
	);
	const [libraryOpen, setLibraryOpen] = useState(false);
	const recent = usePlanStore(
		useShallow((state) =>
			byUpdated(state.plans.filter((plan) => plan.id !== state.curId)).slice(
				0,
				5,
			),
		),
	);
	const totalM2 = usePlanStore((state) =>
		openFloors(state).reduce((sum, floor) => sum + floorM2(floor.items), 0),
	);
	const exportWith = (write: typeof exportPng) => {
		const state = usePlanStore.getState();
		if (svgRef.current)
			write(svgRef.current, {
				// Furniture is hidden from the plan-mode export, so it must not widen the crop either.
				items:
					state.mode === "plan"
						? state.items.filter((item) => item.type !== "furniture")
						: state.items,
				name: state.name,
				floor:
					openFloors(state).length > 1 ? floorName(state.floor) : undefined,
				view: state.view,
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
			<Menu.Root>
				<Menu.Trigger asChild>
					<Button size="xs" variant="outline" flexShrink={0}>
						<Icon name="folder" size={14} />
						間取り
						<Icon name="chevron" size={14} />
					</Button>
				</Menu.Trigger>
				<Portal>
					<Menu.Positioner>
						<Menu.Content minW="240px">
							<Menu.Item value="new" onSelect={store.newPlan}>
								<Icon name="new" size={14} />
								新規作成
							</Menu.Item>
							<Menu.Item value="open" onSelect={() => setLibraryOpen(true)}>
								<Icon name="folder" size={14} />
								開く…
							</Menu.Item>
							{recent.length > 0 && (
								<Menu.ItemGroup>
									<Menu.Separator />
									<Menu.ItemGroupLabel
										textStyle="xs"
										fontWeight="medium"
										color="fg.subtle"
									>
										最近の間取り
									</Menu.ItemGroupLabel>
									{recent.map((plan) => {
										const date = new Date(plan.updated);
										return (
											<Menu.Item
												key={plan.id}
												value={plan.id}
												onSelect={() => store.openPlan(plan.id)}
											>
												<Box flex="1" minW="0" maxW="200px" truncate>
													{plan.name}
												</Box>
												<Menu.ItemCommand fontVariantNumeric="tabular-nums">
													{date.getMonth() + 1}/{date.getDate()}
												</Menu.ItemCommand>
											</Menu.Item>
										);
									})}
								</Menu.ItemGroup>
							)}
						</Menu.Content>
					</Menu.Positioner>
				</Portal>
			</Menu.Root>
			<PlanLibrary open={libraryOpen} onOpenChange={setLibraryOpen} />
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
