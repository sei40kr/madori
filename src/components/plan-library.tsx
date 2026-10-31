import {
	Badge,
	Box,
	Button,
	CloseButton,
	Dialog,
	Flex,
	IconButton,
	Portal,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { floorM2, type Plan, usePlanStore } from "@/lib/plan-store";
import { Icon } from "./icon";

export const byUpdated = (plans: Plan[]) =>
	plans.toSorted((a, b) => b.updated - a.updated);

const pad = (n: number) => String(n).padStart(2, "0");

export function PlanLibrary({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const plans = usePlanStore((state) => state.plans);
	const curId = usePlanStore((state) => state.curId);
	const openPlan = usePlanStore((state) => state.openPlan);
	const newPlan = usePlanStore((state) => state.newPlan);
	const deletePlan = usePlanStore((state) => state.deletePlan);
	// Kept after closing so the name stays put while the confirmation animates out.
	const [deleting, setDeleting] = useState<Plan | null>(null);
	const [confirming, setConfirming] = useState(false);
	return (
		<>
			<Dialog.Root
				open={open}
				onOpenChange={(event) => onOpenChange(event.open)}
				size="md"
				placement="center"
				scrollBehavior="inside"
			>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content>
							<Dialog.Header borderBottomWidth="1px" py="4">
								<Dialog.Title textStyle="md">間取り一覧</Dialog.Title>
								<Badge>{plans.length}</Badge>
							</Dialog.Header>
							<Dialog.CloseTrigger asChild>
								<CloseButton size="sm" />
							</Dialog.CloseTrigger>
							<Dialog.Body p="2">
								<Stack gap="0">
									{byUpdated(plans).map((plan) => {
										const current = plan.id === curId,
											m2 = plan.floors.reduce(
												(sum, floor) => sum + floorM2(floor.items),
												0,
											),
											date = new Date(plan.updated);
										return (
											<Flex
												key={plan.id}
												align="center"
												gap="3"
												py="2"
												px="4"
												rounded="l2"
												bg={current ? "blue.subtle" : undefined}
												_hover={current ? undefined : { bg: "bg.subtle" }}
											>
												<Stack gap="1" flex="1" minW="0">
													<Text textStyle="sm" fontWeight="medium" truncate>
														{plan.name}
													</Text>
													<Text
														textStyle="xs"
														color="fg.muted"
														fontVariantNumeric="tabular-nums"
													>
														{plan.floors.length > 1 &&
															`${plan.floors.length}フロア · `}
														{m2.toFixed(1)}㎡ · {date.getFullYear()}/
														{date.getMonth() + 1}/{date.getDate()}{" "}
														{pad(date.getHours())}:{pad(date.getMinutes())} 更新
													</Text>
												</Stack>
												{current ? (
													<Badge colorPalette="blue" flexShrink={0}>
														編集中
													</Badge>
												) : (
													<Button
														size="xs"
														variant="outline"
														onClick={() => {
															openPlan(plan.id);
															onOpenChange(false);
														}}
													>
														開く
													</Button>
												)}
												<IconButton
													size="xs"
													variant="ghost"
													color="fg.muted"
													_hover={{ bg: "bg.error", color: "fg.error" }}
													aria-label="削除"
													title="削除"
													onClick={() => {
														setDeleting(plan);
														setConfirming(true);
													}}
												>
													<Icon name="trash" />
												</IconButton>
											</Flex>
										);
									})}
								</Stack>
							</Dialog.Body>
							<Box borderTopWidth="1px" px="6" py="4">
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										newPlan();
										onOpenChange(false);
									}}
								>
									<Icon name="new" size={14} />
									新規作成
								</Button>
							</Box>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
			<Dialog.Root
				role="alertdialog"
				open={confirming}
				onOpenChange={(event) => setConfirming(event.open)}
				size="xs"
				placement="center"
			>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content>
							<Dialog.Header>
								<Dialog.Title>間取りを削除</Dialog.Title>
							</Dialog.Header>
							<Dialog.Body>
								<Text textStyle="sm">
									「{deleting?.name}」を削除しますか？この操作は取り消せません。
								</Text>
							</Dialog.Body>
							<Dialog.Footer>
								<Dialog.ActionTrigger asChild>
									<Button size="sm" variant="outline">
										キャンセル
									</Button>
								</Dialog.ActionTrigger>
								<Button
									size="sm"
									colorPalette="red"
									onClick={() => {
										if (deleting) deletePlan(deleting.id);
										setConfirming(false);
									}}
								>
									削除
								</Button>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
}
