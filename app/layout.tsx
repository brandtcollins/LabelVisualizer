import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import Link from "next/link";

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
        <div className="bg-primary w-full h-16 flex items-center px-6 justify-between">
          <div className="flex">
            {" "}
            <Image
              src="/images/ol-logo-white.svg"
              alt="Online Labels"
              width={150}
              height={40}
              className="h-8 w-auto"
            />
            <h1 className="text-2xl text-white ml-6 italic">
              Label Visualizer
            </h1>
          </div>
          <Link
            href="/generated"
            className="inline-flex items-center gap-2 px-4 py-2  transition-colors hover:bg-primary-600 text-white rounded"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            View Gallery
          </Link>
        </div>
        {children}
      </body>
    </html>
  );
}
