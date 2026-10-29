import type { Metadata } from "next";
import { Provider } from "@/components/provider";

export const metadata: Metadata = {
	title: "madori",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<Provider>{children}</Provider>
			</body>
		</html>
	);
}
