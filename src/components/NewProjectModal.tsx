import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Folder, Tag } from 'lucide-react';
import { cn } from '../lib/utils';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, category: string) => Promise<void>;
}

export default function NewProjectModal({ isOpen, onClose, onSubmit }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(name.trim(), category);
      onClose();
      setName('');
      setCategory('General');
    } catch (err: any) {
      setError(err?.message || 'Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#F8F7F4] rounded-[32px] p-8 shadow-2xl z-[101] border border-black/5"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-2xl font-serif italic font-bold">New Narrative</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-all text-black/40 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2 ml-1">
                  Project Title
                </label>
                <div className="relative">
                  <Folder className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. My Next Masterpiece"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-black/5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 shadow-sm transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2 ml-1">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['General', 'Work', 'Personal', 'Story', 'Research', 'Tech'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border",
                        category === cat 
                          ? "bg-black text-white border-black shadow-lg" 
                          : "bg-white border-black/5 text-black/40 hover:border-black/20"
                      )}
                    >
                      <Tag size={14} className={cn(category === cat ? "opacity-100" : "opacity-30")} />
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-medium border border-red-100 italic">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="w-full py-4 bg-black text-white rounded-full font-bold text-sm shadow-xl hover:translate-y-[-2px] active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmitting ? 'Initializing...' : 'Create Project'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
