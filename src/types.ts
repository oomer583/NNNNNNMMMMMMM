import { Node, Edge } from '@xyflow/react';

export type CardCategory =
  | 'idea'
  | 'task'
  | 'goal'
  | 'note'
  | 'problem'
  | 'solution'
  | 'character'
  | 'event'
  | 'location'
  | 'resource'
  | 'logic'
  | 'obstacle'
  | 'milestone'
  | 'persona'
  | 'none';
export type CardType = 'standard' | 'title' | 'description';
export type CardSize = 'small' | 'medium' | 'large';

export interface CardData {
  title: string;
  content: string;
  image?: string;
  category: CardCategory;
  type?: CardType;
  color?: string;
  size?: CardSize;
}

export type LinkNode = Node<Record<string, unknown> & CardData>;
export type LinkEdge = Edge & {
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
};

export interface BackgroundSettings {
  type: 'solid' | 'pattern' | 'mesh' | 'dots';
  color: string;
  secondaryColor?: string;
  edgeThickness?: number;
}

export interface BoardState {
  nodes: LinkNode[];
  edges: LinkEdge[];
  background?: BackgroundSettings;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  updatedAt: number;
  userId: string;
  category?: string;
}

export const CATEGORY_COLORS: Record<CardCategory, string> = {
  idea: '#fef9c3', // yellow
  task: '#dbeafe', // blue
  goal: '#dcfce7', // green
  note: '#f3f4f6', // gray
  problem: '#fee2e2', // red
  solution: '#e0f2fe', // sky
  character: '#fef3c7', // amber
  event: '#fae8ff', // pink
  location: '#ecfdf5', // emerald
  resource: '#f0f9ff', // light blue
  logic: '#f5f3ff', // violet
  obstacle: '#fff7ed', // orange
  milestone: '#f0fdf4', // mint
  persona: '#fff1f2', // rose
  none: '#ffffff',
};
