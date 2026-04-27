import React from 'react';
import { motion } from 'motion/react';
import { MousePointer2, Sparkles, Layout, Database, Shield } from 'lucide-react';
import { handleGoogleLogin } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#1A1A1A] font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="h-[80px] flex items-center justify-between px-8 md:px-16 border-b border-black/5 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="font-serif italic text-2xl font-bold tracking-tight">LinkBoard</div>
        <div className="flex items-center gap-6">
          {user ? (
            <button 
              onClick={() => window.location.reload()} // Just a quick refresher to trigger app state change if needed
              className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-bold hover:shadow-xl transition-all"
            >
              Go to Dashboard
            </button>
          ) : (
            <button 
              onClick={handleGoogleLogin}
              className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-bold hover:shadow-xl transition-all flex items-center gap-2"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 md:px-16 pt-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold mb-6 border border-emerald-100">
              <Sparkles size={14} />
              <span>Free Cloud Sync Enabled</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-serif italic leading-[1.1] mb-8 font-bold">
              Where thoughts <br />
              <span className="text-black/40">become architecture.</span>
            </h1>
            <p className="text-lg text-black/60 leading-relaxed mb-10 max-w-lg">
              Capture fragmented sparks, visualize interconnected logic, and build narratives on an infinite, editorial-style canvas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleGoogleLogin}
                className="px-10 py-4 bg-black text-white rounded-full text-lg font-bold hover:bg-black/80 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:translate-y-[-2px]"
              >
                Start Creating Free
              </button>
              <div className="flex -space-x-2 items-center px-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-black/5 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="" />
                  </div>
                ))}
                <span className="ml-4 text-xs font-medium text-black/40 italic">Joined by 200+ creators</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square bg-white rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-black/5 p-8 relative overflow-hidden">
               {/* Visual Mockup */}
               <div className="absolute top-12 left-12 w-48 h-32 bg-emerald-50 rounded-2xl border border-emerald-100 p-4 rotate-[-6deg] shadow-lg">
                 <div className="w-12 h-2 bg-emerald-200 rounded-full mb-3" />
                 <div className="w-full h-1 bg-emerald-100 rounded-full mb-1" />
                 <div className="w-2/3 h-1 bg-emerald-100 rounded-full" />
               </div>
               <div className="absolute top-40 right-12 w-48 h-32 bg-blue-50 rounded-2xl border border-blue-100 p-4 rotate-[4deg] shadow-lg">
                 <div className="w-12 h-2 bg-blue-200 rounded-full mb-3" />
                 <div className="w-full h-1 bg-blue-100 rounded-full mb-1" />
                 <div className="w-3/4 h-1 bg-blue-100 rounded-full" />
               </div>
               <div className="absolute bottom-12 left-20 w-56 h-36 bg-amber-50 rounded-2xl border border-amber-100 p-6 rotate-[-2deg] shadow-xl">
                 <div className="w-16 h-3 bg-amber-200 rounded-full mb-4" />
                 <div className="space-y-2">
                   <div className="w-full h-1.5 bg-amber-100 rounded-full" />
                   <div className="w-full h-1.5 bg-amber-100 rounded-full" />
                   <div className="w-1/2 h-1.5 bg-amber-100 rounded-full" />
                 </div>
               </div>
               {/* Decorative lines */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                 <path d="M200 150 C 300 150, 300 250, 400 250" stroke="black" strokeWidth="2" fill="transparent" strokeDasharray="5,5" />
                 <path d="M150 300 C 150 400, 250 400, 250 450" stroke="black" strokeWidth="2" fill="transparent" strokeDasharray="5,5" />
               </svg>
            </div>
            {/* Floaties */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 w-20 h-20 bg-black rounded-3xl shadow-2xl flex items-center justify-center text-white"
            >
              <MousePointer2 size={32} />
            </motion.div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="mt-40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Layout, title: "Infinite Canvas", desc: "No boundaries for your creative flow. Zoom, pan, and build at scale." },
            { icon: Database, title: "Persistence", desc: "Secure Firebase backend ensures your work is synced across all devices." },
            { icon: Sparkles, title: "Auto-Layout", desc: "Instantly organize chaos into structured narratives with dagre-powered layouting." },
            { icon: Shield, title: "Private & Secure", desc: "Your data is yours. Industry standard auth and encryption protecting every node." }
          ].map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[32px] bg-white border border-black/5 hover:border-black/20 hover:shadow-xl transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center mb-6">
                <feat.icon size={24} className="text-black/60" />
              </div>
              <h3 className="text-lg font-bold mb-3">{feat.title}</h3>
              <p className="text-sm text-black/40 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-black/5 text-center">
        <p className="text-sm font-medium text-black/20 italic">Designed for deep work. Crafted with intentionality.</p>
      </footer>
    </div>
  );
}
