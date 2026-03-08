import { useEffect, useCallback } from 'react';
import { usePresentationContext } from '../contexts/PresentationContext';

export function usePresentation(initialId?: string) {
  const context = usePresentationContext();

  const {
    presentations,
    activePresentation,
    setActivePresentationById,
    addSlide: contextAddSlide,
    addElement: contextAddElement,
    updateElement: contextUpdateElement,
    moveElement: contextMoveElement,
    deleteElement: contextDeleteElement,
    duplicateElement: contextDuplicateElement,
    createPresentation,
    duplicatePresentation,
    deletePresentation,
    updatePresentationMetadata: contextUpdatePresentationMetadata,
    setSlideMode: contextSetSlideMode,
    addHtmlSlide: contextAddHtmlSlide,
    reorderElement: contextReorderElement,
    deleteSlide: contextDeleteSlide,
    undo,
    redo,
    toggleFeatured,
    canUndo,
    canRedo
  } = context;

  // Set active presentation based on initialId
  useEffect(() => {
    if (initialId) {
      setActivePresentationById(initialId);
    }
  }, [initialId, setActivePresentationById]);

  // Wrapper functions that pass the active presentation ID automatically
  const addSlide = useCallback(() => {
    if (activePresentation) contextAddSlide(activePresentation.id);
  }, [activePresentation, contextAddSlide]);

  const addElement = useCallback((slideIndex: number, element: any) => {
    if (activePresentation) contextAddElement(activePresentation.id, slideIndex, element);
  }, [activePresentation, contextAddElement]);

  const updateElement = useCallback((slideIndex: number, elementId: string, updates: any) => {
    if (activePresentation) contextUpdateElement(activePresentation.id, slideIndex, elementId, updates);
  }, [activePresentation, contextUpdateElement]);

  const moveElement = useCallback((slideIndex: number, elementId: string, x: number, y: number) => {
    if (activePresentation) contextMoveElement(activePresentation.id, slideIndex, elementId, x, y);
  }, [activePresentation, contextMoveElement]);

  const deleteElement = useCallback((slideIndex: number, elementId: string) => {
    if (activePresentation) contextDeleteElement(activePresentation.id, slideIndex, elementId);
  }, [activePresentation, contextDeleteElement]);

  const duplicateElement = useCallback((slideIndex: number, elementId: string) => {
    if (activePresentation) contextDuplicateElement(activePresentation.id, slideIndex, elementId);
  }, [activePresentation, contextDuplicateElement]);

  const setSlideMode = useCallback((slideIndex: number, isHtmlMode: boolean) => {
    if (activePresentation) contextSetSlideMode(activePresentation.id, slideIndex, isHtmlMode);
  }, [activePresentation, contextSetSlideMode]);

  const addHtmlSlide = useCallback(() => {
    if (activePresentation) contextAddHtmlSlide(activePresentation.id);
  }, [activePresentation, contextAddHtmlSlide]);

  const reorderElement = useCallback((slideIndex: number, elementId: string, direction: 'up' | 'down') => {
    if (activePresentation) contextReorderElement(activePresentation.id, slideIndex, elementId, direction);
  }, [activePresentation, contextReorderElement]);

  const deleteSlide = useCallback((slideIndex: number) => {
    if (activePresentation) contextDeleteSlide(activePresentation.id, slideIndex);
  }, [activePresentation, contextDeleteSlide]);

  const updatePresentationMetadata = useCallback((updates: any) => {
    if (activePresentation) contextUpdatePresentationMetadata(activePresentation.id, updates);
  }, [activePresentation, contextUpdatePresentationMetadata]);

  return {
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
    setActivePresentationById,
    setSlideMode,
    addHtmlSlide,
    deleteSlide,
    updatePresentationMetadata,
    toggleFeatured,
    undo,
    redo,
    canUndo,
    canRedo
  };
}
