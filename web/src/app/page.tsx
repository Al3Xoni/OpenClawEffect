"use client";

// Build Version: 1.0.1 - Main Branch Trigger
import dynamic from 'next/dynamic';
import { HowItWorksBar } from "@/components/layout/HowItWorksBar";
import { CryptoTicker } from "@/components/layout/CryptoTicker";
import { InfoSection } from "@/components/layout/InfoSection";
import { Roadmap } from "@/components/layout/Roadmap";
import { Footer } from "@/components/layout/Footer";
import GameCanvas from "@/components/game/GameCanvas";
import { ClawdHeader } from "@/components/ui/ClawdHeader";

// Prevent SSR for Navbar to fix Wallet hydration mismatch
const Navbar = dynamic(() => import('@/components/layout/Navbar').then(mod => mod.Navbar), { ssr: false });

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-black text-white selection:bg-cyan-500/30">
      
      {/* 1. Navbar */}
      <Navbar />

      <div className="pt-[72px]"> {/* Spacing for fixed navbar */}
        
        {/* 2. Hero / Game Area */}
        <div className="relative flex flex-col h-[90vh] min-h-[600px] w-full border-b border-white/10 shadow-2xl overflow-hidden">
            
            {/* Ticker-style instructions above game */}
            <HowItWorksBar />
            
            {/* The Game Itself */}
            <div className="flex-1 relative w-full h-full bg-slate-900">
                
                {/* CLAWDEBALL HERO TITLE (Overlay in Sky) */}
                <div className="absolute top-[10%] left-0 w-full z-30 pointer-events-none opacity-90 hover:opacity-100 transition-opacity duration-500 scale-75 md:scale-100 origin-top">
                    <ClawdHeader />
                </div>

                <GameCanvas />
            </div>

            {/* Visual fade at bottom to blend with content */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent pointer-events-none z-20"></div>
        
        </div>

        {/* 3. Content Sections */}
        <CryptoTicker />
        <InfoSection />
        <Roadmap />
        <Footer />

      </div>
    </main>
  );
}