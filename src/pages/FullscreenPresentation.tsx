import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Settings, Info, PlayCircle, Maximize, ChevronLeft, ChevronRight, SkipBack, SkipForward, Layers } from 'lucide-react';
import { usePresentation } from '../hooks/usePresentation';

export function FullscreenPresentation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activePresentation } = usePresentation(id);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setActiveSlideIndex(prev => Math.min(prev + 1, (activePresentation?.slides.length || 1) - 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveSlideIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => console.warn(err));
        }
        navigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePresentation, navigate]);

  useEffect(() => {
    if (activePresentation) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn(`Erro ao entrar em tela cheia: ${err.message}`);
        });
      }
    }
  }, [activePresentation]);

  if (!activePresentation) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0d1117',
          color: 'var(--accent)',
          fontFamily: 'sans-serif'
        }}
      >
        <Layers size={48} className="animate-pulse mb-4 text-accent" />
        <span className="text-xl font-bold tracking-widest text-text-primary">Carregando Apresentação...</span>
        <span className="text-[10px] text-text-secondary mt-2 mb-8">ID: {id}</span>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-all text-sm font-bold"
        >
          Voltar para Home
        </button>
      </div>
    );
  }

  const currentSlide = activePresentation.slides[activeSlideIndex];
  const [scale, setScale] = useState(0.8);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  useEffect(() => {
    const calculateScale = () => {
      // Robust calculation using window source of truth
      const w = window.innerWidth;
      const h = window.innerHeight; // Use full height as header is gone

      const s = Math.min(w / 900, h / 506); // Use 100% of the screen
      const finalScale = isNaN(s) || s <= 0 ? 1.0 : s;
      setScale(finalScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    const timer = setTimeout(calculateScale, 100);
    const timer2 = setTimeout(calculateScale, 1000);

    return () => {
      window.removeEventListener('resize', calculateScale);
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [activePresentation]);

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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: currentSlide?.background || '#000000', // Use slide background for entire screen
        color: 'white',
        fontFamily: 'sans-serif',
        zIndex: 9999
      }}
    >
      {/* Invisible Hover Zone for Exit Button */}
      <div
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '100px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'start',
          justifyContent: 'end',
          padding: '24px 32px',
          pointerEvents: 'auto'
        }}
      >
        <button
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.warn(err));
            }
            navigate(-1);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '16px',
            height: '40px',
            padding: '0 24px',
            backgroundColor: 'var(--accent)',
            color: 'var(--bg-primary)',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            opacity: isHeaderHovered ? 1 : 0,
            transition: 'all 0.3s ease-in-out',
            pointerEvents: isHeaderHovered ? 'auto' : 'none',
          }}
        >
          <X size={20} />
          <span>Sair</span>
        </button>
      </div>

      {/* Main Slide Area */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, position: 'relative' }}>
        <div
          style={{
            width: '900px',
            height: '506px',
            position: 'relative',
            backgroundColor: currentSlide?.background || '#000000',
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            flexShrink: 0
          }}
        >
          {currentSlide ? (
            currentSlide.isHtmlMode ? (
              // PURE HTML MODE RENDER
              (() => {
                const htmlElement = currentSlide?.elements?.find(el => el.type === 'html');
                if (htmlElement) {
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '900px',
                        height: '506px',
                        backgroundColor: currentSlide.background || '#000000',
                        zIndex: 1
                      }}
                    >
                      <iframe
                        srcDoc={buildHtmlSrcDoc(htmlElement.content, htmlElement.contentScale || 100, htmlElement.contentOffsetX || 0, htmlElement.contentOffsetY || 0)}
                        style={{ border: 'none', width: '100%', height: '100%', pointerEvents: 'none', display: 'block' }}
                        title="Full HTML Slide"
                      />
                    </div>
                  );
                }
                return (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                    Elemento HTML não encontrado
                  </div>
                );
              })()
            ) : (currentSlide?.elements?.length || 0) > 0 ? (
              currentSlide?.elements?.map((el) => (
                <div
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    zIndex: el.zIndex,
                    ...el.style,
                    animation: `${el.animation.type} ${el.animation.duration}ms ease ${el.animation.delay}ms both`
                  }}
                  className="flex flex-col justify-center"
                >
                  {el.type === 'text' && (
                    <div style={{ width: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: el.style.color || 'white' }}>
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
                      style={{ border: 'none', width: '100%', height: '100%', display: 'block' }}
                      title="HTML Element"
                    />
                  )}
                </div>
              ))
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                <span style={{ opacity: 0.5 }}>Slide Vazio</span>
                <span className="text-[8px] absolute bottom-2 opacity-30">ID: {currentSlide.id}</span>
              </div>
            )
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <span className="text-xl font-bold uppercase tracking-widest mb-2">Slide Não Encontrado</span>
              <span className="text-xs opacity-50">Apresentação: {activePresentation.title}</span>
              <span className="text-xs opacity-50">Tentando carregar slide no índice: {activeSlideIndex}</span>
            </div>
          )}
        </div>
      </main>

      {/* Footer Controls */}
      <footer
        style={{
          position: 'absolute',
          bottom: '48px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          width: '100%',
          maxWidth: '896px',
          padding: '0 32px',
          transition: 'opacity 0.3s'
        }}
        className="opacity-0 hover:opacity-100"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: 'max-content' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(22, 27, 34, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid #30363d',
            borderRadius: '16px',
            padding: '16px 32px',
            gap: '32px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setActiveSlideIndex(0)}
                style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}
              >
                <SkipBack size={20} />
              </button>
              <button
                onClick={() => setActiveSlideIndex(prev => Math.max(prev - 1, 0))}
                style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}
              >
                <ChevronLeft size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto', maxWidth: '384px' }}>
              {activePresentation.slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlideIndex(idx)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: activeSlideIndex === idx ? 'var(--accent)' : 'rgba(22, 27, 34, 0.5)',
                    color: activeSlideIndex === idx ? 'var(--bg-primary)' : '#8b949e'
                  }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setActiveSlideIndex(prev => Math.min(prev + 1, activePresentation.slides.length - 1))}
                style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}
              >
                <ChevronRight size={24} />
              </button>
              <button
                onClick={() => setActiveSlideIndex(activePresentation.slides.length - 1)}
                style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}
              >
                <SkipForward size={20} />
              </button>
            </div>

            <div style={{ height: '32px', width: '1px', backgroundColor: '#30363d' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', justify: 'center', padding: '4px 12px', backgroundColor: '#163032', borderRadius: '8px', border: '1px solid #30363d' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent)', letterSpacing: '0.1em' }}>{activeSlideIndex + 1} / {activePresentation.slides.length}</span>
            </div>
          </div>

          {/* Progress Light Bar */}
          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(22, 48, 50, 0.3)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              backgroundColor: 'var(--accent)',
              width: `${((activeSlideIndex + 1) / Math.max(1, activePresentation.slides.length)) * 100}%`,
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 8px var(--accent), 0 0 16px var(--border-color), 0 0 32px var(--border-color)'
            }} />
          </div>
        </div>
      </footer>
    </div>
  );
}
