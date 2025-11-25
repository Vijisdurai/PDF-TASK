import { useCallback } from 'react';

export interface DocxStorageCoords {
    xPercent: number;
    yPercent: number;
}

export interface ScreenCoords {
    x: number;
    y: number;
}

export const useDocxCoordinates = (
    containerRef: React.RefObject<HTMLElement>,
    documentWidth: number,
    documentHeight: number
) => {
    const screenToStorage = useCallback(
        (screenX: number, screenY: number): DocxStorageCoords => {
            const container = containerRef.current;
            if (!container) {
                return { xPercent: 0, yPercent: 0 };
            }

            const rect = container.getBoundingClientRect();

            // Calculate relative position within the container
            const relativeX = screenX - rect.left;
            const relativeY = screenY - rect.top;

            // Convert to percentage of the document dimensions
            // Note: documentWidth/Height should be the current rendered size (including zoom)
            const xPercent = (relativeX / documentWidth) * 100;
            const yPercent = (relativeY / documentHeight) * 100;

            return {
                xPercent: Math.max(0, Math.min(100, xPercent)),
                yPercent: Math.max(0, Math.min(100, yPercent))
            };
        },
        [containerRef, documentWidth, documentHeight]
    );

    const storageToScreen = useCallback(
        (coords: DocxStorageCoords): ScreenCoords => {
            // Convert percentage to screen pixels based on current document dimensions
            const x = (coords.xPercent / 100) * documentWidth;
            const y = (coords.yPercent / 100) * documentHeight;

            return { x, y };
        },
        [documentWidth, documentHeight]
    );

    return { screenToStorage, storageToScreen };
};
