import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Label Visualizer",
  description: "Visualize your custom labels on real products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
