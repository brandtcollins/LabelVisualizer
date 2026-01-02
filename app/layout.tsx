import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "Label Visualizer",
  description: "Visualize your custom labels on real products",
  icons: {
    icon: "/images/olg-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-light-gray">
        <div className="bg-primary w-full h-16 flex items-center px-6">
          <Image
            src="/images/ol-logo-white.svg"
            alt="Online Labels"
            width={150}
            height={40}
            className="h-8 w-auto"
          />
          <h1 className="text-2xl text-white ml-6 italic">Label Visualizer</h1>
        </div>
        {children}
      </body>
    </html>
  );
}
