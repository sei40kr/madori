"use client";

import { Box, Flex } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { usePlanStore } from "@/lib/plan-store";
import { Canvas } from "./canvas";
import { Header } from "./header";
import { PlanSummary, SelectionPanel } from "./properties-panel";
import { ToolSidebar } from "./tool-sidebar";

export function Editor() {
	const svgRef = useRef<SVGSVGElement>(null);
	const hasSelection = usePlanStore((state) => state.sel !== null);

	useEffect(() => {
		usePlanStore.persist.rehydrate();
	}, []);

	return (
		<Flex
			direction="column"
			h="100vh"
			w="full"
			overflow="hidden"
			bg="bg"
			color="fg"
		>
			<Header svgRef={svgRef} />
			<Flex position="relative" flex="1" minH="0">
				<ToolSidebar />
				<Canvas svgRef={svgRef} />
				<Box
					w="288px"
					flexShrink={0}
					borderLeftWidth="1px"
					p="5"
					overflowY="auto"
				>
					{hasSelection ? <SelectionPanel /> : <PlanSummary />}
				</Box>
			</Flex>
		</Flex>
	);
}
