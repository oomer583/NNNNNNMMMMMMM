import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Folder, Clock, Trash2, LogOut, Search, Grid, List as ListIcon, ChevronRight, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { logout } from '../lib/firebase';
import { cn } from '../lib/utils';

interface DashboardProps {
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
}

export default function Dashboard({ onSelectProject, onCreateProject }: DashboardProps) {
  const { user } = useAuth();
  const { projects, loading, deleteProject } = useProjects();
  const [view, setView] = React.useState<'grid' | 'list'>('grid');
  const [search, setSearch] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const categories = ['All', ...new Set(projects.map(p => (p as any).category || 'General'))];
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === null || activeCategory === 'All' || ((p as any).category || 'General') === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const exportAll = () => {
    const data = JSON.stringify(projects, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkboard-full-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#1A1A1A] font-sans">
      <header className="h-[80px] border-b border-black/5 bg-white flex items-center justify-between px-8 md:px-12 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="font-serif italic text-2xl font-bold tracking-tight">LinkBoard</div>
          <div className="w-px h-6 bg-black/10" />
          <div className="flex items-center gap-2 text-black/40 text-sm font-medium italic">
            Dashboard
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 pr-6 border-r border-black/5">
            <div className="text-right">
              <div className="text-xs font-bold leading-none">{user?.displayName}</div>
              <div className="text-[10px] text-black/40 uppercase tracking-widest mt-1">Free Tier</div>
            </div>
            <img src={user?.photoURL || ''} alt="" className="w-10 h-10 rounded-xl border border-black/5 shadow-sm" />
            <button 
              onClick={() => logout()}
              className="p-2 hover:bg-black/5 rounded-lg text-black/40 hover:text-black transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
            <button 
              onClick={exportAll}
              className="hidden lg:flex p-2 hover:bg-black/5 rounded-lg text-black/40 hover:text-black transition-colors"
              title="Backup All Projects"
            >
              <Database size={18} />
            </button>
          </div>
          
          <button 
            onClick={onCreateProject}
            className="px-6 py-2.5 bg-black text-white rounded-full text-sm font-bold flex items-center gap-2 hover:shadow-xl transition-all hover:translate-y-[-1px]"
          >
            <Plus size={16} strokeWidth={3} />
            New Project
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 md:px-12 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-serif italic font-bold mb-2">My Projects</h1>
            <p className="text-sm text-black/40 italic">You have {projects.length} persistent narratives saved.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={16} />
              <input 
                type="text"
                placeholder="Find a project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black/10 w-64 shadow-sm"
              />
            </div>

            <div className="bg-white p-1 rounded-xl border border-black/5 flex items-center shadow-sm">
              <button 
                onClick={() => setView('grid')}
                className={cn("p-1.5 rounded-lg transition-all", view === 'grid' ? "bg-black text-white" : "text-black/40 hover:text-black")}
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setView('list')}
                className={cn("p-1.5 rounded-lg transition-all", view === 'list' ? "bg-black text-white" : "text-black/40 hover:text-black")}
              >
                <ListIcon size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Categories / Folders */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                (activeCategory === cat || (cat === 'All' && activeCategory === null))
                  ? "bg-black text-white shadow-lg"
                  : "bg-white border border-black/5 text-black/40 hover:border-black/20"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-white border border-black/5 rounded-[32px] flex items-center justify-center mb-6 shadow-sm">
              <Folder size={40} className="text-black/10" />
            </div>
            <h2 className="text-xl font-serif italic text-black/80 mb-2 font-bold">No narratives found</h2>
            <p className="text-sm text-black/40 max-w-sm mb-8">Start your first project to begin building your visual architecture.</p>
            <button 
              onClick={onCreateProject}
              className="px-8 py-3 bg-black text-white rounded-full text-sm font-bold shadow-xl hover:translate-y-[-2px] transition-all"
            >
              Initialize First Board
            </button>
          </div>
        ) : (
          <div className={cn(
            view === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "space-y-4"
          )}>
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((proj) => (
                <motion.div
                  layout
                  key={proj.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "group relative transition-all duration-300",
                    view === 'grid' ? "bg-white border border-black/5 rounded-[32px] p-8 hover:border-black/20 hover:shadow-2xl hover:translate-y-[-4px]" : "bg-white border border-black/5 rounded-2xl p-4 flex items-center gap-6 hover:shadow-lg"
                  )}
                  onClick={() => onSelectProject(proj.id)}
                >
                  <div className={cn(
                    "flex flex-col h-full",
                    view === 'list' && "flex-row items-center flex-1"
                  )}>
                    <div className={cn("bg-black/5 rounded-2xl flex items-center justify-center mb-6 text-black/20 group-hover:bg-black group-hover:text-white transition-all", view === 'grid' ? "w-16 h-16" : "w-12 h-12 mb-0")}>
                      <Folder size={view === 'grid' ? 32 : 24} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-serif italic text-xl font-bold mb-2 group-hover:text-black transition-colors">{proj.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-black/30 font-medium">
                        <Clock size={12} />
                        <span>Last updated {new Date(proj.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {view === 'grid' && (
                      <div className="mt-8 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-black/20">LinkBoard Project</span>
                        <ChevronRight size={18} className="text-black/20 group-hover:text-black translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                      </div>
                    )}

                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteProject(proj.id); }}
                      className={cn(
                        "p-2 bg-white border border-black/5 rounded-xl text-black/20 hover:text-red-500 hover:border-red-500 transition-all shadow-sm",
                        view === 'grid' ? "absolute top-4 right-4 opacity-0 group-hover:opacity-100" : "relative"
                      )}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
