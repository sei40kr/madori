import type { Metadata } from "next";
import { Provider } from "@/components/provider";

export const metadata: Metadata = {
	title: "Madori",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="ja" suppressHydrationWarning>
			<body>
				<Provider>{children}</Provider>
			</body>
		</html>
	);
}
