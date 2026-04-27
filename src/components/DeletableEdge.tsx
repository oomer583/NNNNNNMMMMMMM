import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  useReactFlow,
} from '@xyflow/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <g className="group">
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          stroke: selected ? '#000' : (style.stroke || '#000'),
          strokeWidth: selected ? 4 : (style.strokeWidth || 3),
          transition: 'stroke-width 0.2s, stroke 0.2s',
        }} 
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            className={cn(
              "w-6 h-6 bg-white border border-black/10 rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer",
              selected ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
            )}
            onClick={onEdgeClick}
            title="Delete connection"
          >
            <X size={12} strokeWidth={3} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </g>
  );
}
