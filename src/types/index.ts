export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  sourceCalendar: 'google' | 'apple' | 'outlook' | 'native';
  color?: string;
  timestamp: number;
}

export interface Position {
  dateX: string; // ISO date string for coordinate-based positioning
  offsetY: number;
  zIndex: number;
}

export interface DecorativeElement {
  id: string;
  type: 'sticker' | 'shape' | 'text';
  position: Position;
  svgPath?: string;
  imageUrl?: string;
  content?: string;
  style: {
    width: number;
    height: number;
    rotation: number;
    opacity: number;
  };
}

export interface HandwritingStroke {
  id: string;
  position: Position;
  bezierCurves: BezierCurve[];
  pressure: number[];
  color: string;
  width: number;
}

export interface BezierCurve {
  startX: number;
  startY: number;
  controlPoint1X: number;
  controlPoint1Y: number;
  controlPoint2X: number;
  controlPoint2Y: number;
  endX: number;
  endY: number;
}

export interface TaskItem {
  id: string;
  content: string;
  completed: boolean;
  date: string;
  priority: 'low' | 'medium' | 'high';
}

export interface VisualTheme {
  id: string;
  name: string;
  svgTemplate: string;
  cssVariables: Record<string, string>;
  fontPairings: {
    header: string;
    body: string;
  };
}

export interface LayerState {
  events: CalendarEvent[];
  decorations: DecorativeElement[];
  handwriting: HandwritingStroke[];
  tasks: TaskItem[];
  visibility: {
    events: boolean;
    decorations: boolean;
    handwriting: boolean;
    tasks: boolean;
  };
}

export interface CalendarSyncConfig {
  provider: 'google' | 'apple' | 'outlook';
  apiEndpoint: string;
  accessToken: string;
  refreshToken: string;
  conflictResolution: 'source' | 'local' | 'timestamp';
}

export interface UserSubscription {
  tier: 'free' | 'premium';
  features: string[];
  expiresAt?: Date;
}

export interface SyncOperation {
  type: 'create' | 'update' | 'delete';
  layer: keyof Omit<LayerState, 'visibility'>;
  entityId: string;
  data: any;
  timestamp: number;
}

// Add the missing types
export type Sticker = DecorativeElement;

export type ViewMode = 'monthly' | 'weekly' | 'daily';