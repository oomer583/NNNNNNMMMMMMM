import React, { useCallback, useRef, useState, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  Panel, 
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CardNode from './CardNode';
import DeletableEdge from './DeletableEdge';
import { useLinkBoard } from '../hooks/useLinkBoard';
import { 
  Plus, 
  Download, 
  Upload, 
  Search, 
  MousePointer2, 
  Undo2, 
  Redo2,
  Maximize2,
  Maximize,
  Minus,
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Target,
  Type,
  FileText,
  Square,
  Trash2,
  Settings,
  Layout,
  LogOut,
  User as UserIcon,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  AlertCircle,
  Lightbulb,
  Calendar,
  MapPin,
  Layers,
  Zap,
  Ban,
  Flag,
  Smile,
  Code,
  Sparkles,
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useReactFlow } from '@xyflow/react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { getLayoutedElements } from '../lib/layout';
import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';

const nodeTypes = {
  card: CardNode,
};

const edgeTypes = {
  deletable: DeletableEdge,
};

const CARD_TEMPLATES = [
  { id: 'standard', label: 'Standard', category: 'none', icon: Plus, color: 'emerald' },
  { id: 'idea', label: 'Idea Card', category: 'idea', icon: Sparkles, color: 'yellow' },
  { id: 'task', label: 'Task Item', category: 'task', icon: Layers, color: 'blue' },
  { id: 'goal', label: 'Objective', category: 'goal', icon: Target, color: 'green' },
  { id: 'problem', label: 'Core Problem', category: 'problem', icon: AlertCircle, color: 'red' },
  { id: 'solution', label: 'Big Idea', category: 'solution', icon: Lightbulb, color: 'sky' },
  { id: 'character', label: 'Character', category: 'character', icon: UserIcon, color: 'amber' },
  { id: 'event', label: 'Key Event', category: 'event', icon: Calendar, color: 'pink' },
  { id: 'location', label: 'Setting', category: 'location', icon: MapPin, color: 'emerald' },
  { id: 'resource', label: 'Resource', category: 'resource', icon: Layers, color: 'blue' },
  { id: 'logic', label: 'System Logic', category: 'logic', icon: Zap, color: 'violet' },
  { id: 'obstacle', label: 'Constraint', category: 'obstacle', icon: Ban, color: 'orange' },
  { id: 'milestone', label: 'Milestone', category: 'milestone', icon: Flag, color: 'mint' },
  { id: 'persona', label: 'Persona', category: 'persona', icon: Smile, color: 'rose' },
  { id: 'note', label: 'Simple Note', category: 'note', icon: FileText, color: 'gray' },
];

interface LinkBoardProps {
  projectId: string;
  onBack: () => void;
  onProjectSwitch: (id: string) => void;
  onCreateProject: () => void;
}

export default function LinkBoard({ projectId, onBack, onProjectSwitch, onCreateProject }: LinkBoardProps) {
  const { 
    nodes, 
    edges, 
    background,
    setBackground,
    loadState,
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addCard,
    undo,
    redo,
    exportData,
    importData,
    onNodeDragStop,
    canUndo,
    canRedo,
    defaultSize,
    setDefaultSize
  } = useLinkBoard();

  const { user, logout } = useAuth();
  const { projects, loading: projectsLoading, saveProject, createProject, deleteProject, getProject } = useProjects();
  
  const { zoomIn, zoomOut, fitView, setNodes, setEdges } = useReactFlow();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initial load
  useEffect(() => {
    const loadInitialProject = async () => {
      try {
        const state = await getProject(projectId);
        if (state) {
          loadState(state);
        } else {
          console.warn('Project not found or empty:', projectId);
        }
      } catch (err) {
        console.error('Failed to load project:', err);
      }
    };
    if (projectId) {
      loadInitialProject();
    }
  }, [projectId, getProject, loadState]);

  // Reactive Edge Thickness
  useEffect(() => {
    const thickness = background.edgeThickness || 3;
    setEdges((eds) => 
      eds.map((edge) => ({
        ...edge,
        style: { ...edge.style, strokeWidth: thickness }
      }))
    );
  }, [background.edgeThickness, setEdges]);

  // Auto-save to Firestore (only if nodes exist)
  useEffect(() => {
    if (user && projectId && nodes.length >= 0) {
      const timer = setTimeout(() => {
        saveProject(projectId, projects.find(p => p.id === projectId)?.name || 'Untitled', { nodes, edges, background });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, background, projectId, user, saveProject, projects]);

  const handleCreateProject = () => {
    onCreateProject();
  };

  const handleProjectClick = async (id: string) => {
    if (id === projectId) return;
    onProjectSwitch(id);
  };

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  const onExportImage = useCallback(() => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (viewport) {
      htmlToImage.toPng(viewport, {
        backgroundColor: background.color,
      }).then((dataUrl) => {
        download(dataUrl, `linkboard-${Date.now()}.png`);
      });
    }
  }, [background.color]);

  const filteredNodes = nodes.map(node => {
    const isVisible = searchQuery 
      ? (node.data.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         node.data.content?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    
    return {
      ...node,
      hidden: !isVisible,
      selected: searchQuery && isVisible ? true : node.selected,
      style: {
        ...node.style,
        opacity: isVisible ? 1 : 0.2,
      }
    };
  });

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event.preventDefault();
      setMenu({
        id: edge.id,
        top: event.clientY,
        left: event.clientX,
      });
    },
    [setMenu]
  );

  const deleteEdge = useCallback((id: string) => {
    onEdgesChange([{ id, type: 'remove' }]);
    setMenu(null);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  }, [onEdgesChange]);

  const deleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    const selectedEdges = edges.filter(e => e.selected);
    
    if (selectedNodes.length > 0) {
      onNodesChange(selectedNodes.map(n => ({ id: n.id, type: 'remove' })));
    }
    if (selectedEdges.length > 0) {
      onEdgesChange(selectedEdges.map(e => ({ id: e.id, type: 'remove' })));
    }
  }, [nodes, edges, onNodesChange, onEdgesChange]);

  const handleAddCard = useCallback((type: 'standard' | 'title' | 'description' = 'standard', category: any = 'none') => {
    const x = Math.random() * 400 + 100;
    const y = Math.random() * 400 + 100;
    
    // Add logic to use the category in the future or just pass it to addCard if hook supports it
    // For now, addCard in useLinkBoard might need an update to accept category
    addCard(x, y, type);
    
    // Quick hack: update the last added node with the category
    setNodes(nds => {
      const last = nds[nds.length - 1];
      if (last && last.id.startsWith('node-')) {
        return nds.map((n, i) => i === nds.length - 1 ? { ...n, data: { ...n.data, category } } : n);
      }
      return nds;
    });

    setSearchQuery('');
  }, [addCard, setNodes]);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importData(file);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8F7F4] text-[#1A1A1A]" onClick={() => setMenu(null)}>
      {/* Editorial Header */}
      <header className="h-[60px] border-b border-black/5 bg-white flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/40 hover:text-black"
            title="Back to Dashboard"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="font-serif italic text-[22px] font-bold tracking-tight">LinkBoard</div>
          <div className="w-[1px] h-6 bg-black/10" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium opacity-80 max-w-[120px] truncate">
              {projects.find(p => p.id === projectId)?.name || 'Workspace Board'}
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={14} />
            <input 
              type="text"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-black/5 border-none rounded-full text-xs focus:ring-1 focus:ring-black/10 focus:outline-none w-40 transition-all focus:w-56"
            />
          </div>

          <button 
            onClick={logout}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors text-black/60 hover:text-red-500"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors text-black/60 hover:text-black"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Left Sidebar - Project Manager */}
        <AnimatePresence>
          {showLeftSidebar && (
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              className="w-72 py-8 px-6 border-r border-black/5 flex flex-col gap-8 bg-white overflow-y-auto z-20 shadow-xl"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-serif italic text-lg font-bold">Projelerim</h4>
                  <p className="text-[9px] uppercase tracking-widest text-black/30 font-bold">Workspace</p>
                </div>
                <button 
                  onClick={() => setShowLeftSidebar(false)}
                  className="p-2 hover:bg-black/5 rounded-full text-black/20 hover:text-black transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="pt-4 space-y-1">
                  {projects.map(proj => (
                    <div 
                      key={proj.id} 
                      onClick={() => handleProjectClick(proj.id)}
                      className={cn(
                        "flex justify-between items-center py-2.5 px-3 rounded-xl text-[12px] cursor-pointer group transition-all",
                        projectId === proj.id ? "bg-[#F8F7F4] text-black font-bold border border-black/5" : "text-black/60 hover:bg-black/5"
                      )}
                    >
                      <span className="truncate max-w-[140px] italic">{proj.name}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteProject(proj.id); }}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-black/5">
                <h4 className="font-serif italic text-sm mb-4 text-black/40">Kategoriler</h4>
                <nav className="space-y-4">
                  {[
                    { label: 'Fikirler', type: 'idea', color: 'yellow' },
                    { label: 'Görevler', type: 'task', color: 'blue' },
                    { label: 'Karakterler', type: 'character', color: 'amber' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center text-[11px] font-bold text-black/60 group cursor-default">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full shadow-sm", `bg-${item.color}-400`)} />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] opacity-20">{nodes.filter(n => (n.data as any).category === item.type).length}</span>
                    </div>
                  ))}
                </nav>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Toggle Left Button */}
        {!showLeftSidebar && (
          <button
            onClick={() => setShowLeftSidebar(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-8 h-20 bg-white border border-black/10 rounded-r-xl shadow-xl flex items-center justify-center text-black/20 hover:text-black transition-all"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Canvas Area */}
        <div className="flex-1 relative flex">
          <div className="flex-1 relative">
            <ReactFlow
              nodes={filteredNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDragStop={onNodeDragStop}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onEdgeContextMenu={onEdgeContextMenu}
              fitView
              snapToGrid
              snapGrid={[12, 12]}
              colorMode="light"
              defaultEdgeOptions={{
                type: 'deletable',
                animated: true,
                style: { strokeWidth: background.edgeThickness || 3, stroke: '#000' }
              }}
            >
              <Background 
                variant={
                  background.type === 'dots' ? BackgroundVariant.Dots : 
                  background.type === 'pattern' ? BackgroundVariant.Lines : 
                  BackgroundVariant.Dots
                } 
                gap={24} 
                size={background.type === 'solid' ? 0 : 1}
                color={background.color === '#1F2937' ? '#374151' : background.color === '#F8F7F4' ? '#D1D5DB' : '#000000'} 
                style={{ backgroundColor: background.color }}
              />
            
            <Panel position="bottom-center" className="mb-4">
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md p-2 rounded-[24px] shadow-2xl border border-black/10 min-w-[600px] justify-between">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={undo}
                    disabled={!canUndo}
                    className="w-10 h-10 flex items-center justify-center text-black/60 hover:bg-black/5 disabled:opacity-20 rounded-xl transition-all"
                    title="Geri Al"
                  >
                    <Undo2 size={18} />
                  </button>
                  <button 
                    onClick={redo}
                    disabled={!canRedo}
                    className="w-10 h-10 flex items-center justify-center text-black/60 hover:bg-black/5 disabled:opacity-20 rounded-xl transition-all"
                    title="İleri Al"
                  >
                    <Redo2 size={18} />
                  </button>
                </div>
                
                <div className="w-px h-6 bg-black/10 mx-1" />

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => zoomIn()}
                    className="w-10 h-10 flex items-center justify-center text-black/60 hover:bg-black/5 rounded-xl transition-all"
                    title="Büyüt (+)"
                  >
                    <Plus size={18} />
                  </button>
                  <button 
                    onClick={() => zoomOut()}
                    className="w-10 h-10 flex items-center justify-center text-black/60 hover:bg-black/5 rounded-xl transition-all"
                    title="Küçült (-)"
                  >
                    <Minus size={18} />
                  </button>
                  <button 
                    onClick={() => fitView({ padding: 0.2 })}
                    className="w-10 h-10 flex items-center justify-center text-black/60 hover:bg-black/5 rounded-xl transition-all"
                    title="Ortala"
                  >
                    <Target size={18} />
                  </button>
                </div>

                <div className="w-px h-6 bg-black/10 mx-1" />

                <button 
                  onClick={onLayout}
                  className="w-12 h-12 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all group"
                  title="Düzenle (Otomatik)"
                >
                  <Layout size={20} className="group-hover:rotate-12 transition-transform" />
                </button>

                <div className="w-px h-6 bg-black/10 mx-1" />

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all shadow-md active:scale-95",
                      showLeftSidebar ? "bg-black text-white" : "bg-white text-black border border-black/10"
                    )}
                  >
                    <Layers size={16} />
                    <span>Projeler</span>
                  </button>
                  
                  <button
                    onClick={() => setShowRightSidebar(!showRightSidebar)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all shadow-md active:scale-95",
                      showRightSidebar ? "bg-black text-white" : "bg-white text-black border border-black/10"
                    )}
                  >
                    <Plus size={16} />
                    <span>Kütüphane</span>
                  </button>
                </div>

                <div className="w-px h-6 bg-black/10 mx-1" />

                <button 
                   onClick={deleteSelected}
                   className="w-10 h-10 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-xl transition-all"
                   title="Seçilenleri Sil"
                >
                  <Trash2 size={18} />
                </button>

                <div className="w-px h-6 bg-black/10 mx-2" />

                <div className="relative">
                  <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="w-12 h-12 flex items-center justify-center text-black/60 hover:bg-black/5 rounded-2xl transition-all group"
                    title="Dışa Aktar"
                  >
                    <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                  </button>

                  <AnimatePresence>
                    {showExportMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: -12, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-4 bg-white border border-black/10 shadow-2xl rounded-3xl p-2 w-64 z-[100] overflow-hidden"
                      >
                        <div className="p-3 mb-1 border-b border-black/5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">Dışa Aktarma Formatı</span>
                        </div>
                        <button
                          onClick={() => { onExportImage(); setShowExportMenu(false); }}
                          className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-blue-50 rounded-2xl flex items-center gap-4 transition-colors group"
                        >
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-100">
                            <ImageIcon size={20} />
                          </div>
                          <div>
                            <div className="text-black">Resim Olarak Aktar</div>
                            <div className="text-[9px] text-black/30 font-normal">Yüksek Çözünürlüklü PNG</div>
                          </div>
                        </button>
                        <button
                          onClick={() => { exportData(); setShowExportMenu(false); }}
                          className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-purple-50 rounded-2xl flex items-center gap-4 transition-colors group"
                        >
                          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-100">
                            <Code size={20} />
                          </div>
                          <div>
                            <div className="text-black">Kod Olarak Aktar</div>
                            <div className="text-[9px] text-black/30 font-normal">JSON Veri Formatı</div>
                          </div>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <button 
                  onClick={handleImportClick}
                  className="w-10 h-10 flex items-center justify-center text-black/40 hover:bg-black/5 rounded-xl transition-all"
                  title="İçe Aktar"
                >
                  <Upload size={18} />
                </button>
              </div>
            </Panel>
          </ReactFlow>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />

          {/* Right Sidebar - Card Library */}
          <AnimatePresence>
            {showRightSidebar && (
              <motion.div
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                className="w-80 bg-white border-l border-black/5 z-20 flex flex-col shadow-2xl relative"
              >
                <div className="p-6 border-b border-black/5 flex justify-between items-center bg-[#F8F7F4]/50">
                  <button 
                    onClick={() => setShowRightSidebar(false)}
                    className="p-2 hover:bg-black/5 rounded-full transition-all"
                  >
                    <ChevronRight size={20} className="text-black/40" />
                  </button>
                  <div className="text-right">
                    <h3 className="text-xl font-serif italic font-bold">Kütüphane</h3>
                    <p className="text-[10px] uppercase tracking-widest text-black/30 font-bold">Concept Library</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                  <div className="grid grid-cols-2 gap-3">
                    {CARD_TEMPLATES.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleAddCard('standard', item.category)}
                        className="flex flex-col gap-3 p-4 rounded-3xl border border-black/5 hover:border-black/20 hover:shadow-xl transition-all text-left group bg-white relative overflow-hidden"
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center mb-1 shadow-sm transition-transform group-hover:scale-110", 
                          `bg-${item.color}-50 text-${item.color}-700`
                        )}>
                          <item.icon size={24} />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-black/80">{item.label}</div>
                          <div className="text-[9px] text-black/30 font-medium tracking-tight">Ekle</div>
                        </div>
                        <div className={cn("absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity", `text-${item.color}-400`)}>
                          <Plus size={14} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-black text-white m-4 rounded-[24px] shadow-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                      <Sparkles size={16} />
                    </div>
                    <span className="text-xs font-bold italic font-serif">Pro Tip</span>
                  </div>
                  <p className="text-[10px] text-white/60 leading-relaxed text-right">
                    Bağlantı kurmak için kartların kenarlarındaki noktaları sürükle.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Sidebar Button (Right) */}
          {!showRightSidebar && (
            <button
              onClick={() => setShowRightSidebar(true)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-24 bg-white border border-black/10 rounded-l-2xl shadow-xl flex items-center justify-center text-black/40 hover:text-black hover:bg-black/5 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Settings Modal */}
          <AnimatePresence>
            {showSettings && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSettings(false)}
                  className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
                >
                  <div className="p-8 border-b border-black/5 flex justify-between items-center bg-[#F8F7F4]">
                    <h3 className="font-serif italic text-2xl font-bold">Preferences</h3>
                    <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-8">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-4 block">Canvas Background</span>
                      <div className="grid grid-cols-2 gap-3">
                        {['dots', 'pattern', 'solid'].map(type => (
                          <button
                            key={type}
                            onClick={() => setBackground({ ...background, type: type as any })}
                            className={cn(
                              "p-4 rounded-2xl border text-sm font-bold capitalize transition-all",
                              background.type === type ? "border-black bg-black text-white" : "border-black/5 hover:border-black/20"
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-4 block">Background Tint</span>
                      <div className="flex gap-2">
                        {['#D1D5DB', '#F8F7F4', '#1F2937', '#EEF2FF', '#FFF7ED'].map(color => (
                          <button
                            key={color}
                            onClick={() => setBackground({ ...background, color })}
                            className={cn(
                              "w-10 h-10 rounded-full border-2 transition-all",
                              background.color === color ? "border-black scale-110" : "border-transparent"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-4 block">Connection Style</span>
                      <div className="space-y-3">
                        <input 
                          type="range" 
                          min="1" 
                          max="8" 
                          step="1"
                          value={background.edgeThickness || 3}
                          onChange={(e) => setBackground({ ...background, edgeThickness: parseInt(e.target.value) })}
                          className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black"
                        />
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>Delicate</span>
                          <span>{background.edgeThickness || 3}px</span>
                          <span>Bold</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        onClick={() => { exportData(); setShowSettings(false); }}
                        className="w-full py-4 bg-emerald-50 text-emerald-700 font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-100 transition-colors"
                      >
                        <Download size={18} />
                        Download Project Backup
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Context Menu */}
          <AnimatePresence>
            {menu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed bg-white border border-black/10 shadow-xl rounded-lg py-1 z-50 min-w-[140px]"
                style={{ top: menu.top, left: menu.left }}
              >
                <button
                  onClick={() => deleteEdge(menu.id)}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <X size={14} />
                  Delete Connection
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Undo Toast */}
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl"
              >
                <span className="text-sm font-medium text-white/80">Connection deleted</span>
                <button
                  onClick={() => { undo(); setShowToast(false); }}
                  className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-bold transition-colors"
                >
                  <RotateCcw size={14} />
                  Undo
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {nodes.length === 0 && (
            <div className="absolute inset-0 z-0 pointer-events-none flex flex-col items-center justify-center text-center">
              <h2 className="font-serif italic text-3xl text-black/80 mb-2">Blank Canvas</h2>
              <p className="text-black/40 text-[13px] max-w-xs">Capture your narrative. Connect the dots between fragmented thoughts and evolving concepts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
