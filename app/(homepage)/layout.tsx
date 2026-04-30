"use client";

import Footer from "./_components/footer";
import Header from "./_components/header";
import Inquires from "./_components/inquires";

export default function HomepageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return <>
          <div className="min-h-screen w-full flex flex-col bg-[#f3f3f3]  relative">
            <Header />
            <div className="flex-1 bg-white">
              <div>
              {children}
              </div>
            </div>
            <Inquires />
            <Footer />
          </div>
  </>;
}
