"use client"

import Header from "./(homepage)/_components/header";
import Footer from "./(homepage)/_components/footer";
import Inquires from "./(homepage)/_components/inquires";
import HomePage from "./(homepage)/home/page";

export default function Page() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f3f3f3] relative">
      <Header />
      <div className="flex-1 bg-white">
        <div>
          <HomePage />
        </div>
      </div>
      <Inquires />
      <Footer />
    </div>
  );
} 