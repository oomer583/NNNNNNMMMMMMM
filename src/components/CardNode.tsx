import React, { useCallback, useRef, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Trash2, Image as ImageIcon, X, Palette, Maximize, Minimize, Square } from 'lucide-react';
import { CardData, CATEGORY_COLORS, CardSize } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const COLORS = [
  { name: 'Default', value: '#e5e7eb' },
  { name: 'Sage', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Slate', value: '#475569' },
];

const SIZES: { label: string; value: CardSize; icon: any }[] = [
  { label: 'Small', value: 'small', icon: Minimize },
  { label: 'Medium', value: 'medium', icon: Square },
  { label: 'Large', value: 'large', icon: Maximize },
];

export default function CardNode({ 
  id, 
  data, 
  selected 
}: NodeProps & { data: CardData }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showColors, setShowColors] = useState(false);
  const [showSizes, setShowSizes] = useState(false);

  const updateData = useCallback((updates: Partial<CardData>) => {
    const event = new CustomEvent('nodeDataUpdate', {
      detail: { id, updates },
    });
    window.dispatchEvent(event);
  }, [id]);

  const onDelete = useCallback(() => {
    const event = new CustomEvent('nodeDelete', {
      detail: { id },
    });
    window.dispatchEvent(event);
  }, [id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateData({ image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getWidth = () => {
    switch (data.size) {
      case 'small': return '180px';
      case 'large': return '320px';
      default: return '240px';
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "group relative rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.04)] border-2 p-4 transition-all duration-300 bg-white",
        selected && "ring-1 ring-black shadow-2xl scale-[1.02]",
      )}
      style={{ 
        borderColor: data.color || (CATEGORY_COLORS[data.category as any] + '40' || '#e5e7eb'),
        width: getWidth(),
        backgroundColor: data.color ? (data.color + '05') : 'white'
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!-bottom-1.5" />
      <Handle type="target" position={Position.Left} className="!-left-1.5" />
      <Handle type="source" position={Position.Right} className="!-right-1.5" />

      {/* Editorial Label */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5">
          <div 
             className="w-1.5 h-1.5 rounded-full" 
             style={{ backgroundColor: data.color || (CATEGORY_COLORS[data.category as any] || '#9ca3af') }}
          />
          <span 
            className="text-[9px] font-bold uppercase tracking-[0.1em]"
            style={{ color: data.color || (CATEGORY_COLORS[data.category as any] || '#9ca3af') }}
          >
            {data.type === 'title' ? 'Heading' : data.type === 'description' ? 'Draft' : (data.category !== 'none' ? data.category : 'Entry')}
          </span>
        </div>
        <div className="flex gap-1 group-hover:opacity-100 opacity-40 transition-opacity">
          {data.type && data.type !== 'standard' && (
            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/5 text-black/40">
              {data.type}
            </span>
          )}
          {data.size && data.size !== 'medium' && (
            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/5 text-black/40">
              {data.size}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Image Preview */}
        <AnimatePresence>
          {data.type !== 'title' && data.image && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative overflow-hidden rounded-md group/img mb-3"
            >
              <img 
                src={data.image} 
                alt="Card content" 
                className="w-full h-auto object-cover max-h-40 grayscale-[20%] hover:grayscale-0 transition-all"
              />
              <button
                onClick={() => updateData({ image: undefined })}
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title */}
        {data.type !== 'description' && (
          <input
            value={data.title}
            onChange={(e) => updateData({ title: e.target.value })}
            placeholder={data.type === 'title' ? 'Section Title...' : 'Concept Name...'}
            className={cn(
              "w-full font-serif italic bg-transparent border-none focus:outline-none focus:placeholder-transparent text-[#1A1A1A]",
              data.type === 'title' ? "text-2xl font-bold border-b border-black/5 pb-2" : "text-lg",
              data.size === 'small' && "text-base"
            )}
          />
        )}

        {/* Content */}
        {data.type !== 'title' && (
          <textarea
            value={data.content}
            onChange={(e) => updateData({ content: e.target.value })}
            placeholder={data.type === 'description' ? 'Write your full description here...' : 'Elaborate on this idea...'}
            className={cn(
              "w-full min-h-[40px] leading-relaxed bg-transparent border-none focus:outline-none resize-none overflow-hidden italic",
              data.type === 'description' ? "text-sm text-black/80 not-italic" : "text-[13px] text-black/70",
              data.size === 'small' && "text-[11px]"
            )}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
        )}
      </div>

      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={() => setShowSizes(!showSizes)}
            className={cn(
              "p-1.5 hover:bg-black/5 text-black/30 hover:text-black rounded transition-colors",
              showSizes && "bg-black/5 text-black"
            )}
            title="Card Size"
          >
            <Square size={14} />
          </button>
          
          <AnimatePresence>
            {showSizes && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full mt-1 right-0 bg-white border border-black/10 shadow-xl rounded-lg p-1 z-50 min-w-[100px]"
              >
                {SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      updateData({ size: s.value });
                      setShowSizes(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-[10px] font-bold flex items-center gap-2 hover:bg-black/5 rounded-md transition-colors",
                      data.size === s.value || (!data.size && s.value === 'medium') ? "text-black" : "text-black/40"
                    )}
                  >
                    <s.icon size={12} />
                    {s.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowColors(!showColors)}
            className={cn(
              "p-1.5 hover:bg-black/5 text-black/30 hover:text-black rounded transition-colors",
              showColors && "bg-black/5 text-black"
            )}
            title="Card Color"
          >
            <Palette size={14} />
          </button>
          
          <AnimatePresence>
            {showColors && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full mt-1 right-0 bg-white border border-black/10 shadow-xl rounded-lg p-1.5 flex gap-1 z-50 overflow-hidden"
              >
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      updateData({ color: c.value });
                      setShowColors(false);
                    }}
                    className={cn(
                      "w-4 h-4 rounded-full border border-black/10 transition-transform hover:scale-125 hover:z-10",
                      data.color === c.value && "ring-2 ring-black"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 hover:bg-black/5 text-black/30 hover:text-black rounded transition-colors"
        >
          <ImageIcon size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-red-50 text-black/30 hover:text-red-500 rounded transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Category selector */}
      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar border-t border-black/5 pt-3 group-hover:opacity-100 opacity-0 transition-opacity">
        {(Object.keys(CATEGORY_COLORS) as Array<keyof typeof CATEGORY_COLORS>).map((cat) => (
          <button
            key={cat}
            onClick={() => updateData({ category: cat })}
            className={cn(
              "text-[8px] font-bold uppercase py-0.5 px-1.5 rounded tracking-tighter transition-all flex-shrink-0 whitespace-nowrap",
              data.category === cat ? "bg-black text-white" : "bg-black/5 text-black/40 hover:bg-black/10 hover:text-black"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
