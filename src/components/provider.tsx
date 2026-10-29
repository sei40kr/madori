"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";

export function Provider({ children }: { children: React.ReactNode }) {
	return (
		// next-themes' script must precede emotion's SSR <style> tags or hydration fails.
		<ThemeProvider attribute="class" disableTransitionOnChange>
			<ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
		</ThemeProvider>
	);
}
