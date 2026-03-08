export type ElementType = 'text' | 'image' | 'video' | 'shape' | 'html';

export interface ElementStyle {
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  opacity?: number;
  borderRadius?: number;
}

export interface ElementAnimation {
  type: 'fadeIn' | 'slideUp' | 'slideLeft' | 'zoomIn' | 'rotateIn' | 'none';
  duration: number;
  delay: number;
}

export interface SlideElement {
  id: string;
  type: ElementType;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  style: ElementStyle;
  animation: ElementAnimation;
  contentScale?: number;
  contentOffsetX?: number;
  contentOffsetY?: number;
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  background?: string;
  isHtmlMode?: boolean;
}

export interface Presentation {
  id: string;
  title: string;
  category: string;
  description?: string;
  slides: Slide[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  views?: number;
  duration?: string;
  isFeatured?: boolean;
}
