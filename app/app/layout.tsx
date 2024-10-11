'use client';
import localFont from "next/font/local";
import Sidebar from "../components/Sidebar";
import "./globals.css";
import { usePathname } from 'next/navigation';


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
      children,
    }: Readonly<{
      children: React.ReactNode;
    }>)
    {
    const pathname = usePathname();
    const isHomePage = pathname === '/';
  return (
      <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"/>
          <title>AnnotationsApp</title>
      </head>
      <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-y-hidden bg-neutral-100`}>

      <Sidebar></Sidebar>


      <div className={`fixed bg-zinc-950 top-0 left-0 w-[20px] ${isHomePage? "h-0 animate-[animateVertical_0.125s_forwards]" : "h-svh"}`}></div>

      <div
          className={`fixed bg-zinc-950 bottom-0 left-0 h-[20px] ${isHomePage ? "w-0 animate-[animateHorizontal_0.125s_forwards_0.125s]" : "w-svw"}`}></div>

      <div
          className={`fixed bg-zinc-950 bottom-0 right-0 w-[20px] ${isHomePage ? "h-0 animate-[animateVertical_0.125s_forwards_0.25s]" : "h-svh"}`}></div>

      <div
          className={`fixed bg-zinc-950 top-0 right-0 h-[20px] ${isHomePage ? "w-0 animate-[animateHorizontal_0.125s_forwards_0.375s]" : "w-svw"}`}></div>
      <div className={"p-[20px] pl-[70px] w-svw h-svh"}>
          {children}
      </div>

      </body>
      </html>
  );
}
