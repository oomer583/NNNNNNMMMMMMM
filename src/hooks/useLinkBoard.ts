import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  addEdge, 
  Connection, 
  NodeChange, 
  EdgeChange, 
  applyNodeChanges, 
  applyEdgeChanges, 
  MarkerType,
  Node,
  Edge
} from '@xyflow/react';
import { LinkNode, LinkEdge, CardData, BoardState, CardType, BackgroundSettings } from '../types';

const STORAGE_KEY = 'linkboard_data';

export function useLinkBoard() {
  const [nodes, setNodes] = useState<LinkNode[]>([]);
  const [edges, setEdges] = useState<LinkEdge[]>([]);
  const [background, setBackground] = useState<BackgroundSettings>({
    type: 'dots',
    color: '#D1D5DB',
    edgeThickness: 3
  });
  const [historyState, setHistoryState] = useState<{
    history: BoardState[];
    index: number;
  }>({ history: [], index: -1 });
  const [defaultSize, setDefaultSize] = useState<'small' | 'medium' | 'large'>('medium');
  const isInternalChange = useRef(false);

  // Load from local storage and initialize history
  const storageLoaded = useRef(false);
  useEffect(() => {
    if (storageLoaded.current) return;
    
    const saved = localStorage.getItem(STORAGE_KEY);
    let initialNodes: LinkNode[] = [];
    let initialEdges: LinkEdge[] = [];
    let initialBackground: BackgroundSettings = { type: 'dots', color: '#D1D5DB' };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        initialNodes = parsed.nodes || [];
        initialEdges = parsed.edges || [];
        initialBackground = parsed.background || initialBackground;
        setNodes(initialNodes);
        setEdges(initialEdges);
        setBackground(initialBackground);
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
    
    setHistoryState({
      history: [{ nodes: initialNodes, edges: initialEdges, background: initialBackground }],
      index: 0
    });
    storageLoaded.current = true;
  }, []);

  // Auto-save
  useEffect(() => {
    if (storageLoaded.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges, background }));
    }
  }, [nodes, edges, background]);

  // Handle history for undo/redo
  const pushToHistory = useCallback((newNodes: LinkNode[], newEdges: LinkEdge[], newBackground?: BackgroundSettings) => {
    if (isInternalChange.current) return;
    
    setHistoryState(prev => {
      const nextHistory = prev.history.slice(0, prev.index + 1);
      const bg = newBackground || background;
      const newState = { nodes: [...newNodes], edges: [...newEdges], background: { ...bg } };
      
      // Don't push if it's the same as the last state (basic optimization)
      const last = nextHistory[nextHistory.length - 1];
      if (last && 
          JSON.stringify(last.nodes) === JSON.stringify(newState.nodes) && 
          JSON.stringify(last.edges) === JSON.stringify(newState.edges) &&
          JSON.stringify(last.background) === JSON.stringify(newState.background)) {
        return prev;
      }

      return {
        history: [...nextHistory, newState].slice(-50),
        index: Math.min(nextHistory.length, 49)
      };
    });
  }, [background]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds) as LinkNode[];
        if (changes.some(c => c.type === 'remove' || c.type === 'position' && (c as any).dragging === false)) {
          pushToHistory(nextNodes, edges);
        }
        return nextNodes;
      });
    },
    [pushToHistory, edges]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const nextEdges = applyEdgeChanges(changes, eds) as LinkEdge[];
        if (changes.some(c => c.type === 'remove')) {
          pushToHistory(nodes, nextEdges);
        }
        return nextEdges;
      });
    },
    [pushToHistory, nodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const sourceNode = nodes.find(n => n.id === params.source);
        const color = sourceNode?.data.color && sourceNode.data.color !== '#e5e7eb' 
          ? sourceNode.data.color 
          : '#000000';

        const nextEdges = addEdge({
          id: `e-${params.source}-${params.target}-${Date.now()}`,
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
          type: 'deletable',
          animated: true,
          style: { stroke: color, strokeWidth: 3 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: color,
            width: 20,
            height: 20,
          },
        } as LinkEdge, eds);
        pushToHistory(nodes, nextEdges);
        return nextEdges;
      });
    },
    [pushToHistory, nodes]
  );

  const addCard = useCallback((x: number, y: number, type: CardType = 'standard') => {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    const newNode: LinkNode = {
      id,
      type: 'card',
      position: { x, y },
      data: {
        title: type === 'title' ? 'New Title' : '',
        content: '',
        category: 'none',
        color: '#e5e7eb',
        type: type,
        size: defaultSize
      },
    };
    setNodes(nds => {
      const nextNodes = [...nds, newNode];
      pushToHistory(nextNodes, edges);
      return nextNodes;
    });
  }, [pushToHistory, edges]);

  const deleteNode = useCallback((id: string) => {
    setNodes(nds => {
      const nextNodes = nds.filter(node => node.id !== id);
      setEdges(eds => {
        const nextEdges = eds.filter(edge => edge.source !== id && edge.target !== id);
        pushToHistory(nextNodes, nextEdges);
        return nextEdges;
      });
      return nextNodes;
    });
  }, [pushToHistory]);

  const updateNodeData = useCallback((id: string, updates: Partial<CardData>) => {
    setNodes(nds => {
      const nextNodes = nds.map(node => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...updates } };
        }
        return node;
      });

      if (updates.color) {
        setEdges(eds => eds.map(edge => {
          if (edge.source === id) {
            const color = updates.color === '#e5e7eb' ? '#000000' : updates.color;
            return {
              ...edge,
              style: { ...edge.style, stroke: color },
              markerEnd: typeof edge.markerEnd === 'object' ? { ...edge.markerEnd, color: color } : edge.markerEnd
            };
          }
          return edge;
        }));
      }

      return nextNodes;
    });
  }, []);

  const undo = useCallback(() => {
    if (historyState.index > 0) {
      isInternalChange.current = true;
      const prev = historyState.history[historyState.index - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      if (prev.background) setBackground(prev.background);
      setHistoryState(h => ({ ...h, index: h.index - 1 }));
      setTimeout(() => { isInternalChange.current = false; }, 0);
    }
  }, [historyState]);

  const redo = useCallback(() => {
    if (historyState.index < historyState.history.length - 1) {
      isInternalChange.current = true;
      const next = historyState.history[historyState.index + 1];
      setNodes(next.nodes);
      setEdges(next.edges);
      if (next.background) setBackground(next.background);
      setHistoryState(h => ({ ...h, index: h.index + 1 }));
      setTimeout(() => { isInternalChange.current = false; }, 0);
    }
  }, [historyState]);

  const exportData = useCallback(() => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkboard-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }, [nodes, edges]);

  const importData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.nodes && parsed.edges) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          setHistoryState({
            history: [{ nodes: parsed.nodes, edges: parsed.edges }],
            index: 0
          });
        }
      } catch (err) {
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
  }, []);

  // Listen for custom events from nodes
  useEffect(() => {
    const handleUpdate = (e: any) => updateNodeData(e.detail.id, e.detail.updates);
    const handleDelete = (e: any) => deleteNode(e.detail.id);

    window.addEventListener('nodeDataUpdate', handleUpdate);
    window.addEventListener('nodeDelete', handleDelete);
    
    return () => {
      window.removeEventListener('nodeDataUpdate', handleUpdate);
      window.removeEventListener('nodeDelete', handleDelete);
    };
  }, [deleteNode, updateNodeData]);

  const loadState = useCallback((state: BoardState) => {
    isInternalChange.current = true;
    setNodes(state.nodes || []);
    setEdges(state.edges || []);
    if (state.background) setBackground(state.background);
    
    setHistoryState({
      history: [{ ...state }],
      index: 0
    });
    
    setTimeout(() => { isInternalChange.current = false; }, 50);
  }, []);

  const setBackgroundWithHistory = useCallback((bg: BackgroundSettings) => {
    setBackground(bg);
    pushToHistory(nodes, edges, bg);
  }, [nodes, edges, pushToHistory]);

  return {
    nodes,
    edges,
    background,
    setBackground: setBackgroundWithHistory,
    loadState,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addCard,
    undo,
    redo,
    exportData,
    importData,
    onNodeDragStop: useCallback(() => {
      pushToHistory(nodes, edges);
    }, [nodes, edges, pushToHistory]),
    canUndo: historyState.index > 0,
    canRedo: historyState.index < historyState.history.length - 1,
    defaultSize,
    setDefaultSize,
  };
}
