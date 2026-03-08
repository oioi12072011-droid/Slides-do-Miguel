import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Presentation, Slide, SlideElement } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../services/supabase';

// Helper for debouncing saves
function useDebounceCallback<T extends (...args: any[]) => any>(callback: T, delay: number) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
}

interface PresentationContextType {
    presentations: Presentation[];
    activePresentation: Presentation | null;
    addSlide: (presentationId: string) => void;
    addElement: (presentationId: string, slideIndex: number, element: Partial<SlideElement>) => void;
    updateElement: (presentationId: string, slideIndex: number, elementId: string, updates: Partial<SlideElement>) => void;
    moveElement: (presentationId: string, slideIndex: number, elementId: string, x: number, y: number) => void;
    deleteElement: (presentationId: string, slideIndex: number, elementId: string) => void;
    duplicateElement: (presentationId: string, slideIndex: number, elementId: string) => void;
    createPresentation: (title: string, category: string, thumbnail?: string, description?: string) => Presentation;
    duplicatePresentation: (id: string) => void;
    deletePresentation: (id: string) => void;
    updatePresentationMetadata: (presentationId: string, updates: Partial<Pick<Presentation, 'title' | 'category' | 'description' | 'thumbnail'>>) => void;
    setActivePresentationById: (id: string | null) => void;
    addHtmlSlide: (presentationId: string) => void;
    reorderElement: (presentationId: string, slideIndex: number, elementId: string, direction: 'up' | 'down') => void;
    deleteSlide: (presentationId: string, slideIndex: number) => void;
    setSlideMode: (presentationId: string, slideIndex: number, isHtmlMode: boolean) => void;
    undo: () => void;
    redo: () => void;
    toggleFeatured: (id: string) => void;
    canUndo: boolean;
    canRedo: boolean;
}

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

export function PresentationProvider({ children }: { children: React.ReactNode }) {
    const [presentations, setPresentations] = useState<Presentation[]>([]);
    const [activePresentation, setActivePresentation] = useState<Presentation | null>(null);
    const [past, setPast] = useState<Presentation[][]>([]);
    const [future, setFuture] = useState<Presentation[][]>([]);

    const savePresentationDebounced = useDebounceCallback(async (p: Presentation) => {
        const { error } = await supabase.from('presentations').upsert({
            id: p.id,
            title: p.title,
            category: p.category,
            description: p.description,
            slides: p.slides as any,
            thumbnail: p.thumbnail,
            is_featured: p.isFeatured || false,
            created_at: p.createdAt,
            updated_at: p.updatedAt
        });
        if (error) console.error("Error saving presentation:", error);
    }, 1000);

    const loadPresentations = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('presentations').select('*').order('updated_at', { ascending: false });
            if (error) throw error;

            if (data && data.length > 0) {
                const parsed: Presentation[] = data.map(row => ({
                    id: row.id,
                    title: row.title,
                    category: row.category,
                    description: row.description || undefined,
                    slides: row.slides as unknown as Slide[],
                    thumbnail: row.thumbnail || undefined,
                    isFeatured: row.is_featured || false,
                    createdAt: row.created_at || Date.now(),
                    updatedAt: row.updated_at || Date.now()
                }));
                setPresentations(parsed);
                return parsed;
            } else {
                // Mock initial if completely empty in DB
                const mock: Presentation = {
                    id: uuidv4(),
                    title: 'Bem-vindo ao Slides do Miguel',
                    category: 'Tutorial',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop',
                    slides: [
                        {
                            id: uuidv4(),
                            elements: [
                                {
                                    id: 'el_1',
                                    type: 'text',
                                    content: 'CYBER_CORE 2077',
                                    x: 100,
                                    y: 100,
                                    width: 600,
                                    height: 150,
                                    zIndex: 1,
                                    style: {
                                        fontSize: 72,
                                        color: 'var(--accent)',
                                        fontFamily: 'Space Grotesk',
                                        fontWeight: 'bold',
                                        textAlign: 'center'
                                    },
                                    animation: { type: 'fadeIn', duration: 800, delay: 0 }
                                }
                            ]
                        }
                    ]
                };

                await supabase.from('presentations').insert({
                    id: mock.id,
                    title: mock.title,
                    category: mock.category,
                    description: mock.description,
                    slides: mock.slides as any,
                    thumbnail: mock.thumbnail,
                    is_featured: false,
                    created_at: mock.createdAt,
                    updated_at: mock.updatedAt
                });

                setPresentations([mock]);
                return [mock];
            }
        } catch (e) {
            console.error("Failed to refresh presentations", e);
        }
        return [];
    }, []);

    useEffect(() => {
        loadPresentations();
    }, [loadPresentations]);

    const setActivePresentationById = useCallback((id: string | null) => {
        if (!id) {
            setActivePresentation(null);
            return;
        }
        const found = presentations.find(p => p.id === id);
        if (found) {
            setActivePresentation(found);
        }
    }, [presentations]);

    const updatePresentationInList = useCallback((presentationId: string, updateFn: (p: Presentation) => Presentation) => {
        setPresentations(prev => {
            let updatedPresentation: Presentation | null = null;
            const updatedList = prev.map(p => {
                if (p.id === presentationId) {
                    updatedPresentation = updateFn(p);
                    return updatedPresentation;
                }
                return p;
            });
            // Only add to history if there was an actual change
            if (JSON.stringify(prev) !== JSON.stringify(updatedList)) {
                setPast(p => [...p.slice(-20), prev]); // keep last 20 states
                setFuture([]);
                if (updatedPresentation) {
                    savePresentationDebounced(updatedPresentation);
                }
            }
            return updatedList;
        });
    }, [savePresentationDebounced]);

    // Effect to keep activePresentation in sync with the list
    useEffect(() => {
        if (activePresentation) {
            const latest = presentations.find(p => p.id === activePresentation.id);
            if (latest && JSON.stringify(latest) !== JSON.stringify(activePresentation)) {
                setActivePresentation(latest);
            }
        }
    }, [presentations, activePresentation]);

    const addSlide = useCallback((presentationId: string) => {
        updatePresentationInList(presentationId, p => ({
            ...p,
            slides: [...p.slides, { id: uuidv4(), elements: [] }],
            updatedAt: Date.now()
        }));
    }, [updatePresentationInList]);

    const addElement = useCallback((presentationId: string, slideIndex: number, element: Partial<SlideElement>) => {
        updatePresentationInList(presentationId, p => {
            const newSlides = [...p.slides];
            if (!newSlides[slideIndex]) return p;
            const newElement: SlideElement = {
                id: uuidv4(),
                type: 'text',
                content: 'New Element',
                x: 50,
                y: 50,
                width: 200,
                height: 50,
                zIndex: newSlides[slideIndex].elements.length + 1,
                style: { fontSize: 24, color: '#ffffff' },
                animation: { type: 'fadeIn', duration: 500, delay: 0 },
                ...element as SlideElement
            };
            newSlides[slideIndex].elements = [...newSlides[slideIndex].elements, newElement];
            return { ...p, slides: newSlides, updatedAt: Date.now() };
        });
    }, [updatePresentationInList]);

    const updateElement = useCallback((presentationId: string, slideIndex: number, elementId: string, updates: Partial<SlideElement>) => {
        updatePresentationInList(presentationId, p => {
            if (!p.slides[slideIndex]) return p;
            const newSlides = [...p.slides];
            newSlides[slideIndex].elements = newSlides[slideIndex].elements.map(el => {
                if (el.id === elementId) {
                    const newStyle = updates.style ? { ...el.style, ...updates.style } : el.style;
                    const newAnimation = updates.animation ? { ...el.animation, ...updates.animation } : el.animation;
                    return { ...el, ...updates, style: newStyle, animation: newAnimation };
                }
                return el;
            });
            return { ...p, slides: newSlides, updatedAt: Date.now() };
        });
    }, [updatePresentationInList]);

    const moveElement = useCallback((presentationId: string, slideIndex: number, elementId: string, x: number, y: number) => {
        updatePresentationInList(presentationId, p => {
            if (!p.slides[slideIndex]) return p;
            const newSlides = [...p.slides];
            newSlides[slideIndex].elements = newSlides[slideIndex].elements.map(el =>
                el.id === elementId ? { ...el, x, y } : el
            );
            return { ...p, slides: newSlides, updatedAt: Date.now() };
        });
    }, [updatePresentationInList]);

    const deleteElement = useCallback((presentationId: string, slideIndex: number, elementId: string) => {
        updatePresentationInList(presentationId, p => {
            if (!p.slides[slideIndex]) return p;
            const newSlides = [...p.slides];
            newSlides[slideIndex].elements = newSlides[slideIndex].elements.filter(el => el.id !== elementId);
            return { ...p, slides: newSlides, updatedAt: Date.now() };
        });
    }, [updatePresentationInList]);

    const duplicateElement = useCallback((presentationId: string, slideIndex: number, elementId: string) => {
        updatePresentationInList(presentationId, p => {
            if (!p.slides[slideIndex]) return p;
            const newSlides = [...p.slides];
            const elementToCopy = newSlides[slideIndex].elements.find(el => el.id === elementId);
            if (elementToCopy) {
                const newElement = {
                    ...elementToCopy,
                    id: uuidv4(),
                    x: elementToCopy.x + 20,
                    y: elementToCopy.y + 20
                };
                newSlides[slideIndex].elements = [...newSlides[slideIndex].elements, newElement];
            }
            return { ...p, slides: newSlides, updatedAt: Date.now() };
        });
    }, [updatePresentationInList]);

    const updatePresentationMetadata = useCallback((presentationId: string, updates: Partial<Pick<Presentation, 'title' | 'category' | 'description' | 'thumbnail'>>) => {
        updatePresentationInList(presentationId, p => ({
            ...p,
            ...updates,
            updatedAt: Date.now()
        }));
    }, [updatePresentationInList]);

    const createPresentation = useCallback((title: string, category: string, thumbnail?: string, description?: string) => {
        const newPresentation: Presentation = {
            id: uuidv4(),
            title,
            category,
            description,
            thumbnail,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            slides: [{ id: uuidv4(), elements: [] }]
        };
        setPresentations(prev => {
            const updated = [...prev, newPresentation];
            return updated;
        });

        // Instant save to DB
        supabase.from('presentations').insert({
            id: newPresentation.id,
            title: newPresentation.title,
            category: newPresentation.category,
            description: newPresentation.description,
            slides: newPresentation.slides as any,
            thumbnail: newPresentation.thumbnail,
            is_featured: false,
            created_at: newPresentation.createdAt,
            updated_at: newPresentation.updatedAt
        }).then(({ error }) => { if (error) console.error(error); });

        return newPresentation;
    }, []);

    const duplicatePresentation = useCallback((id: string) => {
        setPresentations(prev => {
            const original = prev.find(p => p.id === id);
            if (!original) return prev;

            const newSlides = original.slides.map(slide => ({
                ...slide,
                id: uuidv4(),
                elements: slide.elements.map(el => ({ ...el, id: uuidv4() }))
            }));

            const newPresentation: Presentation = {
                ...original,
                id: uuidv4(),
                title: `${original.title} (Cópia)`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                slides: newSlides
            };

            const updated = [...prev, newPresentation];

            // Instant save to DB
            supabase.from('presentations').insert({
                id: newPresentation.id,
                title: newPresentation.title,
                category: newPresentation.category,
                description: newPresentation.description,
                slides: newPresentation.slides as any,
                thumbnail: newPresentation.thumbnail,
                is_featured: false,
                created_at: newPresentation.createdAt,
                updated_at: newPresentation.updatedAt
            }).then(({ error }) => { if (error) console.error(error); });

            return updated;
        });
    }, []);

    const deletePresentation = useCallback((id: string) => {
        setPresentations(prev => {
            const updated = prev.filter(p => p.id !== id);
            return updated;
        });

        supabase.from('presentations').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); });

        if (activePresentation?.id === id) {
            setActivePresentation(null);
        }
    }, [activePresentation]);

    const setSlideMode = useCallback((presentationId: string, slideIndex: number, isHtmlMode: boolean) => {
        updatePresentationInList(presentationId, p => {
            if (!p.slides[slideIndex]) return p;
            const newSlides = [...p.slides];
            newSlides[slideIndex] = { ...newSlides[slideIndex], isHtmlMode };

            if (isHtmlMode && !newSlides[slideIndex].elements.find(el => el.type === 'html')) {
                const htmlEl: SlideElement = {
                    id: uuidv4(),
                    type: 'html',
                    content: '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; color: var(--accent); font-family: sans-serif;"><h1>HTML Slide Mode</h1></div>',
                    x: 0,
                    y: 0,
                    width: 900,
                    height: 506,
                    zIndex: 1,
                    style: { fontSize: 24, color: '#ffffff' },
                    animation: { type: 'fadeIn', duration: 500, delay: 0 }
                };
                newSlides[slideIndex].elements = [htmlEl];
            }

            return { ...p, slides: newSlides, updatedAt: Date.now() };
        });
    }, [updatePresentationInList]);

    const addHtmlSlide = useCallback((presentationId: string) => {
        updatePresentationInList(presentationId, p => {
            const newSlideId = uuidv4();
            const htmlElement: SlideElement = {
                id: uuidv4(),
                type: 'html',
                content: '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; color: var(--accent); font-family: sans-serif;"><h1>Novo Slide HTML</h1><p>Edite o código no painel ao lado.</p></div>',
                x: 0,
                y: 0,
                width: 900,
                height: 506,
                zIndex: 1,
                style: { fontSize: 24, color: '#ffffff' },
                animation: { type: 'fadeIn', duration: 500, delay: 0 }
            };
            return {
                ...p,
                slides: [...p.slides, { id: newSlideId, isHtmlMode: true, elements: [htmlElement] }],
                updatedAt: Date.now()
            };
        });
    }, [updatePresentationInList]);

    const reorderElement = useCallback((presentationId: string, slideIndex: number, elementId: string, direction: 'up' | 'down') => {
        updatePresentationInList(presentationId, p => {
            if (!p.slides[slideIndex]) return p;
            const newSlides = [...p.slides];
            const elements = [...newSlides[slideIndex].elements];
            elements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

            const currentIndex = elements.findIndex(el => el.id === elementId);
            if (currentIndex < 0) return p;

            if (direction === 'up' && currentIndex < elements.length - 1) {
                [elements[currentIndex], elements[currentIndex + 1]] = [elements[currentIndex + 1], elements[currentIndex]];
            } else if (direction === 'down' && currentIndex > 0) {
                [elements[currentIndex], elements[currentIndex - 1]] = [elements[currentIndex - 1], elements[currentIndex]];
            } else {
                return p;
            }

            newSlides[slideIndex].elements = elements.map((el, i) => ({ ...el, zIndex: i + 1 }));
            return { ...p, slides: newSlides, updatedAt: Date.now() };
        });
    }, [updatePresentationInList]);

    const deleteSlide = useCallback((presentationId: string, slideIndex: number) => {
        updatePresentationInList(presentationId, p => {
            if (p.slides.length <= 1) return p;
            const newSlides = [...p.slides];
            newSlides.splice(slideIndex, 1);
            return { ...p, slides: newSlides, updatedAt: Date.now() };
        });
    }, [updatePresentationInList]);

    const undo = useCallback(() => {
        setPast(prevPast => {
            if (prevPast.length === 0) return prevPast;
            const newPast = [...prevPast];
            const previousState = newPast.pop()!;

            setPresentations(current => {
                setFuture(prevFuture => [current, ...prevFuture]);
                // Save to DB when undoing
                if (current.length === previousState.length) {
                    const changed = previousState.find((p, i) => JSON.stringify(p) !== JSON.stringify(current[i]));
                    if (changed) savePresentationDebounced(changed);
                }
                return previousState;
            });

            return newPast;
        });
    }, [savePresentationDebounced]);

    const toggleFeatured = useCallback((id: string) => {
        setPresentations(prev => {
            const isAlreadyFeatured = prev.find(p => p.id === id)?.isFeatured;
            let updatedP: Presentation | null = null;
            const updatedList = prev.map(p => {
                if (p.id === id) {
                    updatedP = { ...p, isFeatured: !isAlreadyFeatured, updatedAt: Date.now() };
                    return updatedP;
                }
                if (!isAlreadyFeatured && p.isFeatured) {
                    const unfeaturedP = { ...p, isFeatured: false, updatedAt: Date.now() };
                    savePresentationDebounced(unfeaturedP);
                    return unfeaturedP;
                }
                return p;
            });

            if (JSON.stringify(prev) !== JSON.stringify(updatedList)) {
                setPast(currPast => [...currPast.slice(-20), prev]);
                setFuture([]);
                if (updatedP) savePresentationDebounced(updatedP);
            }
            return updatedList;
        });
    }, [savePresentationDebounced]);

    const redo = useCallback(() => {
        setFuture(prevFuture => {
            if (prevFuture.length === 0) return prevFuture;
            const newFuture = [...prevFuture];
            const nextState = newFuture.shift()!;

            setPresentations(current => {
                setPast(prevPast => [...prevPast, current]);
                if (current.length === nextState.length) {
                    const changed = nextState.find((p, i) => JSON.stringify(p) !== JSON.stringify(current[i]));
                    if (changed) savePresentationDebounced(changed);
                }
                return nextState;
            });

            return newFuture;
        });
    }, [savePresentationDebounced]);

    return (
        <PresentationContext.Provider value={{
            presentations,
            activePresentation,
            addSlide,
            addElement,
            updateElement,
            moveElement,
            deleteElement,
            duplicateElement,
            createPresentation,
            duplicatePresentation,
            deletePresentation,
            updatePresentationMetadata,
            setActivePresentationById,
            refreshPresentations: loadPresentations,
            setSlideMode,
            addHtmlSlide,
            reorderElement,
            deleteSlide,
            undo,
            redo,
            toggleFeatured,
            canUndo: past.length > 0,
            canRedo: future.length > 0
        }}>
            {children}
        </PresentationContext.Provider>
    );
}

export function usePresentationContext() {
    const context = useContext(PresentationContext);
    if (context === undefined) {
        throw new Error('usePresentationContext must be used within a PresentationProvider');
    }
    return context;
}
