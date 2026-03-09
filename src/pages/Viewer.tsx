import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePresentation } from '../hooks/usePresentation';
import { PlayCircle, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

export function Viewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activePresentation: presentation } = usePresentation(id);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const activeSlide = presentation?.slides[activeSlideIndex];

  const getSlideContentBounds = () => {
    // If it's a full HTML slide, default to the standard 16:9 aspect ratio
    if (!activeSlide?.elements?.length || activeSlide?.isHtmlMode) {
      return { x: 0, y: 0, w: 1280, h: 720 };
    }

    let minX = 1280, minY = 720, maxX = 0, maxY = 0;
    activeSlide.elements.forEach(el => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    });

    const padding = 40;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(1280, maxX + padding);
    maxY = Math.min(720, maxY + padding);

    return { x: minX, y: minY, w: Math.max(maxX - minX, 400), h: Math.max(maxY - minY, 225) };
  };

  const bounds = getSlideContentBounds();

  // Calculate initial dimensions to avoid "0px" first render
  const getInitialDimensions = () => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const maxH = vh - 120; // Minimal offset for header
    const maxW = vw * 0.98;
    let w = maxW;
    let h = w * (bounds.h / bounds.w);
    if (h > maxH) {
      h = maxH;
      w = h * (bounds.w / bounds.h);
    }
    return { width: w, height: h, scale: w / bounds.w };
  };

  const [dimensions, setDimensions] = useState(getInitialDimensions());

  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const maxH = vh - 120; // Maximum size
      const maxW = vw * 0.98;

      let w = maxW;
      let h = w * (bounds.h / bounds.w);

      if (h > maxH) {
        h = maxH;
        w = h * (bounds.w / bounds.h);
      }

      setDimensions({ width: w, height: h, scale: w / bounds.w });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [bounds.w, bounds.h, activeSlideIndex, presentation]);

  if (!presentation) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0d1117]">
      <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
    </div>
  );

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
      '<html><head><meta charset="UTF-8">',
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

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#0d1117] font-sans">
      <header className="h-16 flex items-center justify-between px-8 bg-[#0d1117] shrink-0 border-b border-white/5 z-20">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/5 text-text-secondary transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-text-primary text-base font-bold leading-tight">{presentation.title}</h2>
            <p className="text-accent text-[10px] font-medium uppercase tracking-widest">{presentation.category}</p>
          </div>
        </div>

        <button
          onClick={() => {
            navigate(`/present/${presentation.id}`);
          }}
          className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-accent text-bg-primary font-bold hover:brightness-110 transition-all shadow-lg shadow-accent/20"
        >
          <PlayCircle size={20} />
          <span className="text-sm">Apresentar</span>
        </button>
      </header>

      <main className="flex-1 relative flex flex-col items-center justify-center p-0 overflow-hidden">
        {/* Smart Crop Container */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_100px_-20px_rgba(34,211,238,0.5)] transition-all duration-300"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            backgroundColor: activeSlide?.background || '#000000'
          }}
        >
          {/* Internal content offset and scaled */}
          <div
            className="absolute origin-top-left"
            style={{
              width: `${bounds.w}px`,
              height: `${bounds.h}px`,
              transform: `scale(${dimensions.scale})`
            }}
          >
            <div
              className="absolute"
              style={{ left: -bounds.x, top: -bounds.y, width: '1280px', height: '720px' }}
            >
              {activeSlide?.isHtmlMode ? (
                activeSlide?.elements?.find(el => el.type === 'html') && (
                  <div className="absolute inset-0 z-1">
                    <iframe
                      srcDoc={(() => {
                        const el = activeSlide?.elements?.find(e => e.type === 'html');
                        if (!el) return '';
                        return buildHtmlSrcDoc(el.content, el.contentScale || 100, el.contentOffsetX || 0, el.contentOffsetY || 0);
                      })()}
                      style={{ border: 'none', width: '100%', height: '100%', pointerEvents: 'none', display: 'block' }}
                      title="Full HTML Slide"
                    />
                  </div>
                )
              ) : (
                activeSlide?.elements?.map((el) => (
                  <div
                    key={el.id}
                    className="absolute"
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      zIndex: el.zIndex,
                      ...el.style
                    }}
                  >
                    {el.type === 'text' && (
                      <div
                        className="w-full h-full flex items-center justify-center text-center"
                        style={{
                          fontSize: el.style.fontSize,
                          color: el.style.color || 'white',
                          fontFamily: el.style.fontFamily,
                          fontWeight: el.style.fontWeight,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          textAlign: el.style.textAlign as any || 'center'
                        }}
                      >
                        {el.content}
                      </div>
                    )}
                    {el.type === 'image' && (
                      <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: el.style.borderRadius }} />
                    )}
                    {el.type === 'video' && (
                      <video
                        src={el.content}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: el.style.borderRadius }}
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    )}
                    {el.type === 'shape' && (
                      <div style={{ width: '100%', height: '100%', backgroundColor: el.style.backgroundColor, opacity: el.style.opacity, borderRadius: el.style.borderRadius }}></div>
                    )}
                    {el.type === 'html' && (
                      <iframe
                        srcDoc={buildHtmlSrcDoc(el.content, el.contentScale)}
                        style={{ border: 'none', width: '100%', height: '100%', pointerEvents: 'none', display: 'block' }}
                        title="HTML Element"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Custom Navigation Overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4 drop-shadow-2xl">
          <div className="flex items-center gap-4 px-6 py-2 bg-[#141d24]/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl">
            <button
              onClick={() => setActiveSlideIndex(prev => Math.max(prev - 1, 0))}
              disabled={activeSlideIndex === 0}
              className="p-1.5 text-text-secondary hover:text-accent disabled:opacity-20 transition-all hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={22} />
            </button>

            <div className="flex gap-2">
              {presentation?.slides?.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlideIndex(i)}
                  className={`w-7 h-7 rounded-md font-bold text-[10px] flex items-center justify-center transition-all ${i === activeSlideIndex
                    ? 'bg-accent text-bg-primary shadow-[0_0_15px_rgba(34,211,238,0.4)] scale-110'
                    : 'bg-white/10 text-text-secondary hover:bg-white/20'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveSlideIndex(prev => Math.min(prev + 1, (presentation?.slides?.length || 1) - 1))}
              disabled={activeSlideIndex === (presentation?.slides?.length || 1) - 1}
              className="p-1.5 text-text-secondary hover:text-accent disabled:opacity-20 transition-all hover:scale-110 active:scale-95"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {/* Progress Bar At the very bottom */}
          <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden shadow-sm">
            <div
              className="h-full bg-accent transition-all duration-700 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              style={{ width: `${((activeSlideIndex + 1) / Math.max(1, presentation?.slides?.length || 1)) * 100}%` }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
