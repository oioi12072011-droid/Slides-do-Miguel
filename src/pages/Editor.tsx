import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Type, Image as ImageIcon, Triangle, Folder, Layers,
  Eye, EyeOff, Plus, Undo, Redo, Cloud, Share2, Play,
  Trash2, Copy, LayoutGrid, PaintBucket, Maximize,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Settings,
  Filter, Code, Upload, Link2, X, Film, ArrowUp, ArrowDown
} from 'lucide-react';
import { usePresentation } from '../hooks/usePresentation';
import { SlideElement, ElementType } from '../types';
import { useAssets } from '../contexts/AssetsContext';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { Globe, User } from 'lucide-react';

export function VisualEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showDelete } = useModal();
  const {
    activePresentation,
    addSlide,
    addElement,
    updateElement,
    moveElement,
    deleteElement,
    duplicateElement,
    setSlideMode,
    addHtmlSlide,
    reorderElement,
    deleteSlide,
    updatePresentationMetadata,
    undo,
    redo,
    canUndo,
    canRedo
  } = usePresentation(id || '1');

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Metadata Modal State
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editThumbnail, setEditThumbnail] = useState('');

  const openMetadataModal = () => {
    if (activePresentation) {
      setEditTitle(activePresentation.title || '');
      setEditCategory(activePresentation.category || '');
      setEditDescription(activePresentation.description || '');
      setEditThumbnail(activePresentation.thumbnail || '');
      setIsMetadataModalOpen(true);
    }
  };

  const handleMetadataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePresentationMetadata({
      title: editTitle.trim() || 'Sem Título',
      category: editCategory.trim() || 'Sem Categoria',
      description: editDescription.trim(),
      thumbnail: editThumbnail
    });
    setIsMetadataModalOpen(false);
  };

  // Assets integration
  const { assets } = useAssets();
  const mediaAssets = assets.filter(a => a.type === 'image' || a.type === 'video');

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSnappedX, setIsSnappedX] = useState(false);
  const [isSnappedY, setIsSnappedY] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'animate'>('design');
  const [previewElementId, setPreviewElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(85);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [initialResizeData, setInitialResizeData] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    mouseX: 0,
    mouseY: 0
  });

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, ox: 0, oy: 0 });
  const [loadError, setLoadError] = useState(false);

  const currentSlide = activePresentation?.slides[activeSlideIndex];

  const cleanHTML = (html: string) => {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/g, "")
      .replace(/on\w+='[^']*'/g, "");
  };

  const buildHtmlSrcDoc = (content: string, initialScale: number = 100, initialOffsetX: number = 0, initialOffsetY: number = 0) => {
    const rawHtml = content || '';
    const isFullDoc = /<!doctype|<html>/i.test(rawHtml.trim());

    let bodyContent = rawHtml;
    let headExtras = '';

    if (isFullDoc) {
      const bodyMatch = rawHtml.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        bodyContent = bodyMatch[2];
      }
      const headMatch = rawHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
      const headSource = headMatch ? headMatch[1] : rawHtml;
      const tags = headSource.match(/<(link|style|script)[^>]*>([\s\S]*?<\/(style|script)>)?/gi) || [];
      headExtras = tags.join('\n');
    }

    const scaleScript = [
      '<script>',
      '(function() {',
      '  var state = { scale: ' + (initialScale / 100) + ', ox: ' + initialOffsetX + ', oy: ' + initialOffsetY + ' };',
      '  function doScale() {',
      '    var iw = window.innerWidth;',
      '    var ih = window.innerHeight;',
      '    var root = document.getElementById("visual-root");',
      '    if (!root || iw < 5 || ih < 5) return;',
      '',
      '    root.style.transform = "none";',
      '    root.style.display = "inline-block";',
      '    root.style.width = "max-content";',
      '    root.style.height = "max-content";',
      '',
      '    var bw = root.offsetWidth || root.scrollWidth;',
      '    var bh = root.offsetHeight || root.scrollHeight;',
      '    if (bw < 2 || bh < 2) return;',
      '',
      '    var baseScale = Math.min(iw / bw, ih / bh);',
      '    var finalScale = baseScale * state.scale;',
      '    var ox = (iw - bw * finalScale) / 2 + state.ox;',
      '    var oy = (ih - bh * finalScale) / 2 + state.oy;',
      '',
      '    root.style.display = "block";',
      '    root.style.width = bw + "px";',
      '    root.style.height = bh + "px";',
      '    root.style.transformOrigin = "top left";',
      '    root.style.transform = "scale(" + finalScale + ")";',
      '    root.style.position = "absolute";',
      '    root.style.left = ox + "px";',
      '    root.style.top = oy + "px";',
      '  }',
      '',
      '  window.addEventListener("message", function(e) {',
      '    if (e.data.type === "UPDATE_TRANSFORM") {',
      '      state.scale = e.data.scale / 100;',
      '      state.ox = e.data.offsetX;',
      '      state.oy = e.data.offsetY;',
      '      doScale();',
      '    }',
      '  });',
      '',
      '  window.addEventListener("resize", doScale);',
      '  document.addEventListener("DOMContentLoaded", doScale);',
      '  window.addEventListener("load", doScale);',
      '  setTimeout(doScale, 50);',
      '  setTimeout(doScale, 500);',
      '  setInterval(doScale, 2000);',
      '})();',
      '</script>'
    ].join('\n');

    const resetStyles = [
      '<style>',
      'html { margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: transparent !important; }',
      'body { margin: 0 !important; padding: 0 !important; overflow: visible !important; min-width: 100vw; min-height: 100vh; background: transparent; }',
      '#visual-root { overflow: visible !important; }',
      '</style>'
    ].join('\n');

    return [
      '<!DOCTYPE html><html><head><meta charset="UTF-8">',
      resetStyles,
      headExtras,
      scaleScript,
      '</head><body>',
      '<div id="visual-root" style="position: relative; width: max-content; height: max-content;">',
      bodyContent,
      '</div>',
      '</body></html>'
    ].join('\n');
  };

  const handlePreviewAnimation = (elementId: string) => {
    setPreviewElementId(null);
    setTimeout(() => setPreviewElementId(elementId), 10);
  };

  // Send real-time updates to HTML iframe via postMessage to avoid flickering/reloads
  useEffect(() => {
    if (currentSlide?.isHtmlMode && iframeRef.current) {
      const htmlElement = currentSlide?.elements?.find(el => el.type === 'html');
      if (htmlElement) {
        iframeRef.current.contentWindow?.postMessage({
          type: 'UPDATE_TRANSFORM',
          scale: htmlElement.contentScale || 100,
          offsetX: htmlElement.contentOffsetX || 0,
          offsetY: htmlElement.contentOffsetY || 0
        }, '*');
      }
    }
  }, [currentSlide?.elements?.find(el => el.type === 'html')?.contentScale,
  currentSlide?.elements?.find(el => el.type === 'html')?.contentOffsetX,
  currentSlide?.elements?.find(el => el.type === 'html')?.contentOffsetY]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!activePresentation) {
        setLoadError(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [activePresentation]);

  // Memoize buildHtmlSrcDoc to prevent iframe reloads unless content changes
  const htmlElement = currentSlide?.isHtmlMode ? currentSlide?.elements?.find(e => e.type === 'html') : null;
  const htmlSrcDoc = useMemo(() => {
    if (!currentSlide?.isHtmlMode || !htmlElement) return '';
    return buildHtmlSrcDoc(htmlElement.content, htmlElement.contentScale || 100, htmlElement.contentOffsetX || 0, htmlElement.contentOffsetY || 0);
  }, [htmlElement?.content, htmlElement?.contentScale, htmlElement?.contentOffsetX, htmlElement?.contentOffsetY, activeSlideIndex]);

  if (!activePresentation) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-bg-secondary text-accent gap-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
          <h2 className="text-xl font-bold tracking-widest uppercase">Carregando Mecanismo...</h2>
        </div>

        {loadError && (
          <div className="flex flex-col items-center gap-4 animate-fadeIn">
            <p className="text-slate-400 text-sm">Parece que o projeto está demorando para carregar.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-bg-tertiary border border-accent/30 text-accent rounded-lg hover:bg-accent/10 transition-all font-bold text-sm"
            >
              Voltar para a Home
            </button>
          </div>
        )}
      </div>
    );
  }

  const selectedElement = currentSlide?.elements?.find(el => el.id === selectedElementId);

  const handleSave = () => {
    setSaveStatus('saving');
    // Context auto-saves, this just provides visual user feedback
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  const handleAddText = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addElement(activeSlideIndex, {
      type: 'text',
      content: 'Novo Texto',
      style: { fontSize: 32, color: 'var(--accent)', fontFamily: 'Space Grotesk' }
    });
  };

  const handleAddMedia = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMediaPicker(prev => !prev);
  };

  const insertAssetMedia = (asset: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    addElement(activeSlideIndex, {
      type: asset.type as ElementType,
      content: asset.data || asset.thumbnail || '',
      width: asset.type === 'video' ? 640 : 400,
      height: asset.type === 'video' ? 360 : 300,
      style: { borderRadius: 12 }
    });
    setShowMediaPicker(false);
  };

  const handleAddShape = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addElement(activeSlideIndex, {
      type: 'shape',
      content: 'rect',
      width: 200,
      height: 200,
      style: { backgroundColor: 'currentColor', opacity: 0.5, borderRadius: 0 }
    });
  };

  const handleAddHTML = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addElement(activeSlideIndex, {
      type: 'html',
      content: '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; color: var(--accent); font-family: sans-serif;"><h1>Custom HTML</h1></div>',
      x: 0,
      y: 0,
      width: 900,
      height: 506,
      style: {},
      contentScale: 100,
      contentOffsetX: 0,
      contentOffsetY: 0
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!currentSlide?.isHtmlMode) return;
    const htmlElement = currentSlide?.elements?.find(el => el.type === 'html');
    if (!htmlElement) return;

    e.preventDefault();
    const delta = e.deltaY > 0 ? -5 : 5;
    const newScale = Math.min(400, Math.max(5, (htmlElement.contentScale || 100) + delta));
    updateElement(activeSlideIndex, htmlElement.id, { contentScale: newScale });
  };


  const handlePanMouseDown = (e: React.MouseEvent) => {
    if (!currentSlide?.isHtmlMode) return;
    const htmlElement = currentSlide?.elements?.find(el => el.type === 'html');
    if (!htmlElement) return;

    e.preventDefault();
    e.stopPropagation();
    setIsPanning(true);
    setPanStart({
      x: e.clientX,
      y: e.clientY,
      ox: htmlElement.contentOffsetX || 0,
      oy: htmlElement.contentOffsetY || 0
    });
  };

  // handlePanMouseMove and handlePanMouseUp are now merged into global handlers below

  const toggleSlideMode = () => {
    setSlideMode(activeSlideIndex, !currentSlide.isHtmlMode);
    setSelectedElementId(null);
  };

  const handleAddSlide = () => {
    addSlide();
    setTimeout(() => {
      setActiveSlideIndex(activePresentation.slides.length);
    }, 50);
  };

  const handleAddHtmlSlide = () => {
    addHtmlSlide();
    setTimeout(() => {
      setActiveSlideIndex(activePresentation.slides.length);
    }, 50);
  };

  const handleMouseDown = (e: React.MouseEvent, el: SlideElement) => {
    if (selectedElementId !== el.id) setSelectedElementId(el.id);
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const scale = zoom / 100;
    setDragOffset({
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: 'nw' | 'ne' | 'sw' | 'se') => {
    e.stopPropagation();
    e.preventDefault();
    if (!selectedElementId || !selectedElement) return;

    setIsResizing(true);
    setResizeDirection(direction);
    setInitialResizeData({
      x: selectedElement.x,
      y: selectedElement.y,
      width: selectedElement.width,
      height: selectedElement.height,
      mouseX: e.clientX,
      mouseY: e.clientY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const scale = zoom / 100;

    if (isResizing && selectedElementId && resizeDirection) {
      const dx = (e.clientX - initialResizeData.mouseX) / scale;
      const dy = (e.clientY - initialResizeData.mouseY) / scale;

      let newX = initialResizeData.x;
      let newY = initialResizeData.y;
      let newWidth = initialResizeData.width;
      let newHeight = initialResizeData.height;

      const minSize = 20;

      if (resizeDirection.includes('e')) {
        newWidth = Math.max(minSize, initialResizeData.width + dx);
      }
      if (resizeDirection.includes('w')) {
        const potentialWidth = initialResizeData.width - dx;
        if (potentialWidth > minSize) {
          newWidth = potentialWidth;
          newX = initialResizeData.x + dx;
        }
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(minSize, initialResizeData.height + dy);
      }
      if (resizeDirection.includes('n')) {
        const potentialHeight = initialResizeData.height - dy;
        if (potentialHeight > minSize) {
          newHeight = potentialHeight;
          newY = initialResizeData.y + dy;
        }
      }

      updateElement(activeSlideIndex, selectedElementId, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newWidth),
        height: Math.round(newHeight)
      });
      return;
    }

    if (isDragging && selectedElementId) {
      const canvas = document.getElementById('canvas-container');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        let x = Math.round((e.clientX - rect.left) / scale - dragOffset.x);
        let y = Math.round((e.clientY - rect.top) / scale - dragOffset.y);

        // Magnet Snapping (Centering)
        const snapThreshold = 15;
        const centerX = 450; // 900 / 2
        const centerY = 253; // 506 / 2

        let snappedX = false;
        let snappedY = false;

        // Snap Horizontal Center
        if (Math.abs((x + (selectedElement?.width || 0) / 2) - centerX) < snapThreshold) {
          x = centerX - (selectedElement?.width || 0) / 2;
          snappedX = true;
        }

        // Snap Vertical Center
        if (Math.abs((y + (selectedElement?.height || 0) / 2) - centerY) < snapThreshold) {
          y = centerY - (selectedElement?.height || 0) / 2;
          snappedY = true;
        }

        setIsSnappedX(snappedX);
        setIsSnappedY(snappedY);
        moveElement(activeSlideIndex, selectedElementId, x, y);
      }
    }

    if (isPanning && currentSlide?.isHtmlMode) {
      const htmlElement = currentSlide?.elements?.find(el => el.type === 'html');
      if (htmlElement) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        updateElement(activeSlideIndex, htmlElement.id, {
          contentOffsetX: panStart.ox + dx,
          contentOffsetY: panStart.oy + dy
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
    setIsPanning(false);
    setIsSnappedX(false);
    setIsSnappedY(false);
  };

  const handleUpdateStyle = (updates: any) => {
    if (selectedElementId) {
      updateElement(activeSlideIndex, selectedElementId, {
        style: { ...selectedElement?.style, ...updates }
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-bg-secondary text-white font-display">
      {/* Top Bar */}
      <header className="h-16 border-b border-border-color flex items-center justify-between px-6 bg-bg-secondary shrink-0">
        <div
          className="flex items-center gap-4 cursor-pointer group hover:bg-bg-tertiary/30 px-3 py-2 rounded-xl transition-all"
          onClick={openMetadataModal}
          title="Editar Informações do Projeto"
        >
          <div className="w-8 h-8 bg-accent rounded flex items-center justify-center text-bg-primary group-hover:shadow-[0_0_10px_var(--accent)] transition-all">
            <Layers size={20} fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-white text-sm font-bold leading-tight group-hover:text-accent transition-colors">{activePresentation?.title}</h2>
            <p className="text-accent text-[10px] font-medium tracking-widest uppercase">
              {activePresentation?.category} • <span className="text-slate-500 lowercase">clique para editar</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-2 rounded-lg border transition-colors ${canUndo ? 'bg-bg-tertiary/50 text-slate-400 hover:text-white border-border-color' : 'bg-bg-tertiary/20 text-slate-600 border-transparent cursor-not-allowed'}`}
            title="Desfazer"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-2 rounded-lg border transition-colors ${canRedo ? 'bg-bg-tertiary/50 text-slate-400 hover:text-white border-border-color' : 'bg-bg-tertiary/20 text-slate-600 border-transparent cursor-not-allowed'}`}
            title="Refazer"
          >
            <Redo size={16} />
          </button>
          <div className="w-px h-6 bg-bg-tertiary mx-2"></div>
          <button className="p-2 rounded-lg bg-bg-tertiary/50 text-slate-400 hover:text-white border border-border-color transition-colors"><Cloud size={16} /></button>
          <button className="p-2 rounded-lg bg-bg-tertiary/50 text-slate-400 hover:text-white border border-border-color transition-colors"><Share2 size={16} /></button>
          <button
            onClick={() => {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => {
                  console.warn(`Erro ao tentar entrar em tela cheia: ${err.message}`);
                });
              }
              navigate(`/present/${activePresentation?.id}`);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-tertiary text-white border border-border-color hover:bg-bg-tertiary/80 transition-colors text-sm font-bold ml-2"
          >
            <Play size={16} fill="white" /> Apresentar
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus !== 'idle'}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg flex items-center justify-center min-w-[130px] duration-300 ${saveStatus === 'saved' ? 'bg-green-500/20 text-green-400 shadow-green-500/20' : 'bg-accent text-bg-primary hover:bg-accent-hover shadow-accent/20'}`}
          >
            {saveStatus === 'saving' ? (
              <span className="flex items-center gap-2"><Cloud size={16} className="animate-pulse" /> Salvando...</span>
            ) : saveStatus === 'saved' ? (
              <span className="flex items-center gap-2">Salvo!</span>
            ) : (
              'Salvar Projeto'
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 flex flex-col border-r border-border-color bg-bg-secondary shrink-0">
          <div className="p-6 space-y-4">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddHtmlSlide(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all group shadow-md shadow-accent/10"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Code size={18} />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold uppercase tracking-widest">Novo Slide HTML</span>
                <span className="text-[8px] opacity-60">MODO FULL CANVAS</span>
              </div>
            </button>

            <div className="h-px bg-bg-tertiary w-full my-2"></div>
            <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest mb-4">Adicionar Elementos</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleAddText}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-bg-tertiary/50 border border-border-color hover:border-accent/50 transition-colors group"
              >
                <Type className="text-accent group-hover:scale-110 transition-transform" size={24} />
                <span className="text-xs font-bold text-white">Texto</span>
              </button>
              <button
                onClick={handleAddMedia}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-bg-tertiary/50 border border-border-color hover:border-accent/50 transition-colors group"
              >
                <ImageIcon className="text-accent group-hover:scale-110 transition-transform" size={24} />
                <span className="text-xs font-bold text-white">Mídia</span>
              </button>
              <button
                onClick={handleAddShape}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-bg-tertiary/50 border border-border-color hover:border-accent/50 transition-colors group"
              >
                <Triangle className="text-accent group-hover:scale-110 transition-transform" size={24} fill="currentColor" />
                <span className="text-xs font-bold text-white">Formas</span>
              </button>
              <button
                onClick={handleAddHTML}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-bg-tertiary/50 border border-border-color hover:border-accent/50 transition-colors group"
              >
                <Settings className="text-accent group-hover:scale-110 transition-transform" size={24} />
                <span className="text-xs font-bold text-white">HTML/Código</span>
              </button>
            </div>

            {/* Media Picker Panel */}
            {showMediaPicker && (
              <div className="border-t border-border-color p-4 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest">Seus Assets</h3>
                  <button onClick={() => setShowMediaPicker(false)} className="text-slate-400 hover:text-white"><X size={14} /></button>
                </div>
                {mediaAssets.length === 0 ? (
                  <p className="text-xs text-text-secondary text-center py-4">Nenhum arquivo em Assets.<br />Vá na aba Assets para fazer upload.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {mediaAssets.map(asset => (
                      <button
                        key={asset.id}
                        onClick={(e) => insertAssetMedia(asset, e)}
                        className="aspect-square rounded-lg bg-bg-tertiary overflow-hidden border border-border-color hover:border-accent/50 transition-all hover:scale-105 relative group flex items-center justify-center"
                      >
                        {asset.type === 'image' ? (
                          <img src={asset.thumbnail || asset.data} alt={asset.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Film size={24} className="text-accent" />
                            <span className="text-[8px] text-text-secondary truncate w-16 px-1">{asset.name}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus size={20} className="text-accent" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="pt-2 border-t border-border-color">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const url = prompt('Cole o link da imagem:');
                      if (url) {
                        addElement(activeSlideIndex, {
                          type: 'image',
                          content: url,
                          width: 400,
                          height: 300,
                          style: { borderRadius: 12 }
                        });
                        setShowMediaPicker(false);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs text-accent hover:bg-accent/10 rounded-lg transition-colors border border-accent/20"
                  >
                    <Link2 size={14} /> Colar link externo
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col border-t border-border-color min-h-0">
            <div className="p-6 pb-2 flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest">Camadas</h3>
              <button className="text-slate-400 hover:text-white"><Filter size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-1">
              {currentSlide?.elements?.map((el) => (
                <div
                  key={el.id}
                  onClick={() => setSelectedElementId(el.id)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${selectedElementId === el.id ? 'bg-bg-tertiary border border-accent/30 text-accent' : 'border border-transparent text-slate-400 hover:bg-bg-tertiary/50'}`}
                >
                  <div className="flex items-center gap-3">
                    {el.type === 'text' ? <Type size={16} /> :
                      el.type === 'html' ? <Code size={16} /> :
                        el.type === 'shape' ? <Triangle size={16} /> :
                          <ImageIcon size={16} />}
                    <span className="text-xs font-bold truncate w-32">
                      {el.type === 'html' ? 'Trecho de Código' :
                        el.type === 'image' ? 'Elemento de Imagem' :
                          el.type === 'shape' ? 'Elemento de Forma' :
                            el.content}
                    </span>
                  </div>
                  <Eye size={16} />
                </div>
              ))}
            </div>
          </div>

        </aside>

        {/* Main Canvas Area */}
        <main
          className="flex-1 flex flex-col relative bg-[#1d1d1d] overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        >
          {/* Canvas Toolbar */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 bg-bg-secondary/90 backdrop-blur-md border border-border-color rounded-full px-6 py-2.5 shadow-2xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(10, zoom - 10))}
                className="text-slate-400 hover:text-accent transition-colors"
              >
                <Plus size={14} className="rotate-45" />
              </button>
              <span className="text-xs text-slate-400 min-w-[6rem] text-center">Zoom <strong className="text-white ml-1">{zoom}%</strong></span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="text-slate-400 hover:text-accent transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="w-px h-4 bg-bg-tertiary"></div>
            <button
              onClick={() => { }}
              className="text-slate-400 hover:text-accent"
            >
              <LayoutGrid size={16} />
            </button>
            <button className="text-slate-400 hover:text-accent"><PaintBucket size={16} /></button>
            <button
              onClick={() => setZoom(85)}
              className="text-slate-400 hover:text-accent transition-colors"
              title="Redefinir Zoom"
            >
              <Maximize size={16} />
            </button>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <div
              id="canvas-container"
              className="bg-black relative shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border border-[#333]"
              style={{
                width: '900px',
                height: '506px',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
                backgroundColor: currentSlide?.background || '#000000',
                flexShrink: 0
              }}
            >
              {/* Snapping Guidelines */}
              {isSnappedX && (
                <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-accent/50 z-50"></div>
              )}
              {isSnappedY && (
                <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-accent/50 z-50"></div>
              )}

              {/* Canvas Content */}
              {currentSlide?.isHtmlMode ? (
                // PURE HTML MODE RENDER
                currentSlide?.elements?.find(el => el.type === 'html') && (
                  <div
                    onWheel={handleWheel}
                    onMouseDown={handlePanMouseDown}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '900px',
                      height: '506px',
                      backgroundColor: currentSlide.background || '#000000',
                      zIndex: 1,
                      cursor: isPanning ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      WebkitUserSelect: 'none'
                    }}
                    title="Arraste para mover, use o scroll para zoom"
                  >
                    <iframe
                      ref={iframeRef}
                      srcDoc={htmlSrcDoc}
                      style={{ border: 'none', width: '100%', height: '100%', pointerEvents: 'none', display: 'block' }}
                      title="Full HTML Slide"
                    />
                  </div>
                )
              ) : (
                // STANDARD MODE RENDER
                currentSlide?.elements?.map((el) => (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el)}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width}px`,
                      height: `${el.height}px`,
                      zIndex: el.zIndex,
                      ...el.style,
                      cursor: isDragging && selectedElementId === el.id ? 'grabbing' : 'grab',
                      animation: (previewElementId === el.id) ? `${el.animation.type} ${el.animation.duration}ms ease ${el.animation.delay}ms both` : 'none'
                    }}
                    className={`flex flex-col justify-center select-none ${selectedElementId === el.id ? 'outline outline-2 outline-accent' : 'outline outline-2 outline-transparent hover:outline-accent/30'}`}
                  >
                    {el.type === 'text' && (
                      <div style={{ pointerEvents: 'none', width: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {el.content}
                      </div>
                    )}
                    {el.type === 'image' && (
                      <img src={el.content} alt="" style={{ pointerEvents: 'none', width: '100%', height: '100%', objectFit: 'cover', borderRadius: el.style.borderRadius }} />
                    )}
                    {el.type === 'video' && (
                      <video
                        src={el.content}
                        style={{ pointerEvents: 'none', width: '100%', height: '100%', objectFit: 'cover', borderRadius: el.style.borderRadius }}
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    )}
                    {el.type === 'shape' && (
                      <div style={{ pointerEvents: 'none', width: '100%', height: '100%', backgroundColor: el.style.backgroundColor, opacity: el.style.opacity, borderRadius: el.style.borderRadius }}></div>
                    )}
                    {el.type === 'html' && (
                      <iframe
                        srcDoc={buildHtmlSrcDoc(el.content, el.contentScale)}
                        style={{ border: 'none', width: '100%', height: '100%', pointerEvents: 'none', display: 'block' }}
                        title="HTML Element"
                      />
                    )}

                    {selectedElementId === el.id && (
                      <>
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                          className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-accent rounded-full cursor-nwse-resize border border-bg-primary shadow-sm hover:scale-125 transition-transform z-10"
                        ></div>
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                          className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-accent rounded-full cursor-nesw-resize border border-bg-primary shadow-sm hover:scale-125 transition-transform z-10"
                        ></div>
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                          className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-accent rounded-full cursor-nesw-resize border border-bg-primary shadow-sm hover:scale-125 transition-transform z-10"
                        ></div>
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-accent rounded-full cursor-nwse-resize border border-bg-primary shadow-sm hover:scale-125 transition-transform z-10"
                        ></div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Slide Navigator */}
          <div className="h-28 border-t border-border-color bg-bg-secondary flex items-center justify-center gap-4 shrink-0 overflow-x-auto px-4">
            {activePresentation?.slides?.map((slide, idx) => {
              const THUMB_W = 96;
              const THUMB_H = 64;
              const SLIDE_W = 900;
              const SLIDE_H = 506;
              const thumbScale = Math.min(THUMB_W / SLIDE_W, THUMB_H / SLIDE_H);
              return (
                <div
                  key={slide.id}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`flex-shrink-0 cursor-pointer rounded-lg border-2 overflow-hidden relative transition-all ${activeSlideIndex === idx ? 'border-accent shadow-lg shadow-accent/20' : 'border-border-color hover:border-accent/50'}`}
                  style={{ width: THUMB_W, height: THUMB_H }}
                >
                  {/* Mini slide render */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: SLIDE_W,
                      height: SLIDE_H,
                      backgroundColor: slide.background || '#000000',
                      transform: `scale(${thumbScale})`,
                      transformOrigin: 'top left',
                      pointerEvents: 'none',
                    }}
                  >
                    {slide.elements?.map((el) => (
                      <div
                        key={el.id}
                        style={{
                          position: 'absolute',
                          left: el.x,
                          top: el.y,
                          width: el.width,
                          height: el.height,
                          zIndex: el.zIndex,
                          overflow: 'hidden',
                          ...el.style,
                        }}
                      >
                        {el.type === 'text' && (
                          <span style={{ fontSize: el.style.fontSize, color: el.style.color || 'white', fontFamily: el.style.fontFamily, fontWeight: el.style.fontWeight }}>
                            {el.content}
                          </span>
                        )}
                        {el.type === 'image' && (
                          <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        {el.type === 'shape' && (
                          <div style={{ width: '100%', height: '100%', backgroundColor: el.style.backgroundColor, opacity: el.style.opacity }} />
                        )}
                        {el.type === 'html' && (
                          <iframe
                            srcDoc={buildHtmlSrcDoc(el.content, el.contentScale, el.contentOffsetX, el.contentOffsetY)}
                            style={{ border: 'none', width: '100%', height: '100%', display: 'block' }}
                            title="thumb"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Slide number badge */}
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-bold px-1 rounded z-20">
                    {idx + 1}
                  </div>
                  {/* Delete Slide Button */}
                  {activePresentation.slides.length > 1 && activeSlideIndex === idx && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmed = await showDelete(
                          'Excluir Slide',
                          'Tem certeza que deseja excluir este slide? Esta ação não pode ser desfeita.'
                        );

                        if (confirmed) {
                          deleteSlide(idx);
                          if (idx > 0) setActiveSlideIndex(idx - 1);
                        }
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded hover:bg-red-500 transition-colors z-20"
                      title="Excluir Slide"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={handleAddSlide}
              className="w-12 h-12 rounded-full bg-bg-tertiary/50 border border-border-color flex items-center justify-center text-slate-400 hover:text-accent hover:border-accent transition-colors flex-shrink-0 ml-2"
            >
              <Plus size={20} />
            </button>
          </div>
        </main>

        {/* Right Properties Panel */}
        <aside className="w-80 flex flex-col border-l border-border-color bg-bg-secondary shrink-0">
          {currentSlide?.isHtmlMode ? (
            // HTML MODE PROPERTIES
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                  <Code size={14} /> Modo Slide HTML
                </h3>
                <button
                  onClick={toggleSlideMode}
                  className="px-3 py-1 rounded-lg bg-bg-tertiary border border-[#ff0055]/50 text-[#ff0055] text-[10px] font-bold"
                >
                  Sair do Modo HTML
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-4 min-h-0">
                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Código HTML/CSS/JS</label>
                  <textarea
                    value={currentSlide?.elements?.find(el => el.type === 'html')?.content || ''}
                    onChange={(e) => {
                      const htmlEl = currentSlide?.elements?.find(el => el.type === 'html');
                      if (htmlEl) {
                        updateElement(activeSlideIndex, htmlEl.id, { content: e.target.value });
                      }
                    }}
                    className="flex-1 w-full bg-bg-secondary border border-border-color rounded-xl p-4 text-xs font-mono text-accent focus:outline-none focus:border-accent/50 resize-none custom-scrollbar"
                    placeholder="Cole seu código aqui..."
                  />
                </div>
                <div className="p-4 rounded-xl bg-bg-tertiary/30 border border-border-color">
                  <p className="text-[10px] text-slate-400">
                    <strong className="text-white">Dica:</strong> Em modo HTML, este código preenche automaticamente todo o slide de 900x506 pixels.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // STANDARD MODE PROPERTIES
            <>
              <div className="flex border-b border-border-color">
                <button
                  onClick={() => setActiveTab('design')}
                  className={`flex-1 py-5 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'design' ? 'text-accent border-b-2 border-accent' : 'text-slate-500 hover:text-white'}`}
                >
                  Design
                </button>
                <button
                  onClick={() => setActiveTab('animate')}
                  className={`flex-1 py-5 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'animate' ? 'text-accent border-b-2 border-accent' : 'text-slate-500 hover:text-white'}`}
                >
                  Animar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                {!selectedElement && (
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                      <span className="text-accent">⚙</span> Configurações do Slide
                    </h3>
                    <button
                      onClick={toggleSlideMode}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-bg-tertiary border border-accent/30 text-white hover:border-accent transition-all group"
                    >
                      <Code size={16} className="text-accent" />
                      <span className="text-xs font-bold uppercase tracking-widest">Ativar Modo HTML Puro</span>
                    </button>
                  </div>
                )}
                {selectedElement && activeTab === 'design' && (
                  <div className="space-y-6">
                    {/* Position & Size */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                        <span className="text-accent">#</span> Posição &amp; Tamanho
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">X</label>
                          <input
                            type="number"
                            value={selectedElement?.x}
                            onChange={(e) => moveElement(activeSlideIndex, selectedElement?.id, Number(e.target.value), selectedElement?.y)}
                            className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-accent/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Y</label>
                          <input
                            type="number"
                            value={selectedElement?.y}
                            onChange={(e) => moveElement(activeSlideIndex, selectedElement?.id, selectedElement?.x, Number(e.target.value))}
                            className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-accent/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Largura</label>
                          <input
                            type="number"
                            value={selectedElement?.width}
                            onChange={(e) => updateElement(activeSlideIndex, selectedElement?.id, { width: Number(e.target.value) })}
                            className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-accent/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Altura</label>
                          <input
                            type="number"
                            value={selectedElement?.height}
                            onChange={(e) => updateElement(activeSlideIndex, selectedElement?.id, { height: Number(e.target.value) })}
                            className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-accent/50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Typography (Text) */}
                    {selectedElement.type === 'text' && (
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-white flex items-center gap-2 uppercase tracking-widest border-t border-border-color pt-6">
                          <span className="text-accent">A</span> Tipografia
                        </h3>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Conteúdo</label>
                          <textarea
                            value={selectedElement?.content}
                            onChange={(e) => updateElement(activeSlideIndex, selectedElement?.id, { content: e.target.value })}
                            rows={3}
                            className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Tamanho</label>
                            <input
                              type="number"
                              value={selectedElement?.style?.fontSize}
                              onChange={(e) => handleUpdateStyle({ fontSize: Number(e.target.value) })}
                              className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Cor</label>
                            <input
                              type="color"
                              value={selectedElement?.style?.color || 'currentColor'}
                              onChange={(e) => handleUpdateStyle({ color: e.target.value })}
                              className="w-full h-8 bg-bg-tertiary border border-border-color rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="flex bg-bg-tertiary rounded-xl p-1">
                          <button onClick={() => handleUpdateStyle({ textAlign: 'left' })} className={`flex-1 p-2 rounded-lg ${selectedElement.style.textAlign === 'left' ? 'bg-accent/20 text-accent' : 'text-slate-400'}`}><AlignLeft size={16} className="mx-auto" /></button>
                          <button onClick={() => handleUpdateStyle({ textAlign: 'center' })} className={`flex-1 p-2 rounded-lg ${selectedElement.style.textAlign === 'center' ? 'bg-accent/20 text-accent' : 'text-slate-400'}`}><AlignCenter size={16} className="mx-auto" /></button>
                          <button onClick={() => handleUpdateStyle({ textAlign: 'right' })} className={`flex-1 p-2 rounded-lg ${selectedElement.style.textAlign === 'right' ? 'bg-accent/20 text-accent' : 'text-slate-400'}`}><AlignRight size={16} className="mx-auto" /></button>
                        </div>
                      </div>
                    )}

                    {/* Media (Image) */}
                    {selectedElement.type === 'image' && (
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-white flex items-center gap-2 uppercase tracking-widest border-t border-border-color pt-6">
                          <span className="text-accent">IM</span> Configurações de Imagem
                        </h3>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">URL da Imagem</label>
                          <input
                            type="text"
                            value={selectedElement.content}
                            onChange={(e) => updateElement(activeSlideIndex, selectedElement.id, { content: e.target.value })}
                            className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Border Radius</label>
                          <input
                            type="number"
                            value={selectedElement.style.borderRadius || 0}
                            onChange={(e) => handleUpdateStyle({ borderRadius: Number(e.target.value) })}
                            className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-2 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Shapes */}
                    {selectedElement.type === 'shape' && (
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-white flex items-center gap-2 uppercase tracking-widest border-t border-border-color pt-6">
                          <span className="text-accent">SH</span> Estilo da Forma
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Preenchimento</label>
                            <input
                              type="color"
                              value={selectedElement?.style?.backgroundColor || 'currentColor'}
                              onChange={(e) => handleUpdateStyle({ backgroundColor: e.target.value })}
                              className="w-full h-8 bg-bg-tertiary border border-border-color rounded-lg cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Opacidade</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="1"
                              value={selectedElement.style.opacity || 1}
                              onChange={(e) => handleUpdateStyle({ opacity: Number(e.target.value) })}
                              className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-2 text-xs text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Border Radius</label>
                          <input
                            type="number"
                            value={selectedElement.style.borderRadius || 0}
                            onChange={(e) => handleUpdateStyle({ borderRadius: Number(e.target.value) })}
                            className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-2 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* HTML */}
                    {selectedElement.type === 'html' && (
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-white flex items-center gap-2 uppercase tracking-widest border-t border-border-color pt-6">
                          <span className="text-accent"><Settings size={12} /></span> Editor HTML
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateElement(activeSlideIndex, selectedElement.id, { x: 0, y: 0, width: 900, height: 506 })}
                            className="flex-1 py-2 px-3 rounded-lg bg-accent/10 border border-accent/30 text-accent text-[10px] font-bold hover:bg-accent/20 transition-all uppercase tracking-widest shadow-[0_0_10px_rgba(0,246,255,0.1)]"
                          >
                            Preencher Slide (Reset Pos)
                          </button>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Zoom do Conteúdo ({selectedElement.contentScale || 100}%)</label>
                          <input
                            type="range"
                            min="10"
                            max="200"
                            value={selectedElement.contentScale || 100}
                            onChange={(e) => updateElement(activeSlideIndex, selectedElement.id, { contentScale: Number(e.target.value) })}
                            className="w-full h-1.5 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Código Customizado</label>
                            <button
                              onClick={() => updateElement(activeSlideIndex, selectedElement.id, { content: cleanHTML(selectedElement.content) })}
                              className="text-[10px] text-accent font-bold hover:underline"
                            >
                              Limpar HTML Full
                            </button>
                          </div>
                          <textarea
                            value={selectedElement.content}
                            onChange={(e) => updateElement(activeSlideIndex, selectedElement.id, { content: e.target.value })}
                            rows={10}
                            className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-[10px] font-mono text-accent focus:outline-none focus:border-accent/50 resize-none custom-scrollbar"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedElement && activeTab === 'animate' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                        <span className="text-accent">
                          <Play size={12} fill="currentColor" />
                        </span> Animação de Entrada
                      </h3>

                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Tipo de Animação</label>
                        <select
                          value={selectedElement.animation.type}
                          onChange={(e) => updateElement(activeSlideIndex, selectedElement.id, { animation: { ...selectedElement.animation, type: e.target.value as any } })}
                          className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-3 text-sm text-white focus:outline-none appearance-none"
                        >
                          <option value="none">Nenhuma</option>
                          <option value="fadeIn">Esmaecer</option>
                          <option value="slideUp">Subir</option>
                          <option value="slideLeft">Deslizar Esquerda</option>
                          <option value="zoomIn">Aproximar</option>
                          <option value="rotateIn">Girar</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Duração (ms)</label>
                          <input
                            type="number"
                            step="100"
                            value={selectedElement?.animation?.duration}
                            onChange={(e) => updateElement(activeSlideIndex, selectedElement?.id, { animation: { ...selectedElement?.animation, duration: Number(e.target.value) } } as any)}
                            className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block font-bold">Atraso (ms)</label>
                          <input
                            type="number"
                            step="100"
                            value={selectedElement?.animation?.delay}
                            onChange={(e) => updateElement(activeSlideIndex, selectedElement?.id, { animation: { ...selectedElement?.animation, delay: Number(e.target.value) } } as any)}
                            className="w-full bg-bg-tertiary border border-border-color rounded-xl px-4 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => handlePreviewAnimation(selectedElement.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors text-xs font-bold"
                        >
                          <Play size={14} fill="currentColor" /> Preview Animation
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <p className="text-[10px] text-blue-400 font-bold leading-relaxed">
                        💡 Clique em Preview para testar o efeito de entrada neste elemento.
                      </p>
                    </div>
                  </div>
                )}

                {!selectedElement && (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs text-center px-4 italic space-y-4">
                    <Settings size={32} className="opacity-20 animate-spin-slow" />
                    <span>Selecione um elemento para editar suas propriedades</span>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border-color flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => selectedElement && reorderElement(activeSlideIndex, selectedElement.id, 'up')}
                    disabled={!selectedElement}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border-color bg-bg-tertiary/50 text-white hover:bg-bg-tertiary transition-colors text-xs font-bold disabled:opacity-20 disabled:cursor-not-allowed"
                    title="Trazer para Frente"
                  >
                    <ArrowUp size={16} /> Frente
                  </button>
                  <button
                    onClick={() => selectedElement && reorderElement(activeSlideIndex, selectedElement.id, 'down')}
                    disabled={!selectedElement}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border-color bg-bg-tertiary/50 text-white hover:bg-bg-tertiary transition-colors text-xs font-bold disabled:opacity-20 disabled:cursor-not-allowed"
                    title="Enviar para Trás"
                  >
                    <ArrowDown size={16} /> Trás
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => selectedElement && deleteElement(activeSlideIndex, selectedElement.id)}
                    disabled={!selectedElement}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border-color bg-bg-tertiary/50 text-white hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors text-xs font-bold disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                  <button
                    onClick={() => selectedElement && duplicateElement(activeSlideIndex, selectedElement.id)}
                    disabled={!selectedElement}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border-color bg-bg-tertiary/50 text-white hover:bg-bg-tertiary transition-colors text-xs font-bold disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <Copy size={16} /> Duplicar
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Metadata Edit Modal */}
      {isMetadataModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-secondary border border-border-color rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-border-color flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Settings className="text-accent" />
                Editar Informações do Projeto
              </h2>
              <button
                onClick={() => setIsMetadataModalOpen(false)}
                className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleMetadataSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary mb-2 uppercase tracking-widest">
                    Título da Apresentação
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Ex: Minha Incrível Apresentação"
                    className="w-full bg-bg-tertiary text-text-primary border border-border-color rounded-xl px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary mb-2 uppercase tracking-widest">
                    Categoria / Tema
                  </label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Ex: Tecnologia, Vendas, Pessoal"
                    className="w-full bg-bg-tertiary text-text-primary border border-border-color rounded-xl px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary mb-2 uppercase tracking-widest">
                    Descrição
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Sobre o que é este projeto?"
                    className="w-full bg-bg-tertiary text-text-primary border border-border-color rounded-xl px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm min-h-[100px] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary mb-2 uppercase tracking-widest">
                    Capa do Projeto (URL ou selecionar abaixo)
                  </label>
                  <div className="flex gap-3 mb-3">
                    <input
                      type="text"
                      value={editThumbnail}
                      onChange={(e) => setEditThumbnail(e.target.value)}
                      placeholder="Link da imagem da capa"
                      className="flex-1 bg-bg-tertiary text-text-primary border border-border-color rounded-xl px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                    />
                    {editThumbnail && (
                      <div className="w-32 aspect-video rounded-lg bg-bg-tertiary border border-border-color overflow-hidden flex-shrink-0 shadow-lg">
                        <img src={editThumbnail} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Escolher dos seus Assets:</label>
                    <div className="grid grid-cols-4 gap-2 max-h-[120px] overflow-y-auto p-2 bg-bg-tertiary/30 rounded-xl border border-border-color custom-scrollbar">
                      {assets.filter(a => a.type === 'image').map(asset => (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => setEditThumbnail(asset.data)}
                          className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${editThumbnail === asset.data ? 'border-accent shadow-[0_0_10px_var(--accent)]' : 'border-transparent hover:border-slate-600'}`}
                        >
                          <img src={asset.thumbnail || asset.data} alt={asset.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsMetadataModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-bg-tertiary text-white font-bold hover:bg-bg-tertiary/70 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-accent text-bg-primary font-bold hover:brightness-110 transition-all text-sm shadow-lg shadow-accent/20"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
