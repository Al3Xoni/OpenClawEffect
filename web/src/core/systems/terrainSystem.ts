// Defines the mathematical function for the terrain and helpers to generate the path.

const TERRAIN_WAVE_FUNCTION = (x: number): number => {
    // Wave 1: Base rolling hills
    const freq1 = 0.002;
    const amp1 = 40;
    // Wave 2: Medium variations
    const freq2 = 0.008;
    const amp2 = 25;
    // Wave 3: Small, high-frequency "bumpiness"
    const freq3 = 0.02;
    const amp3 = 10;

    const wave1 = Math.sin(x * freq1) * amp1;
    const wave2 = Math.cos(x * freq2) * amp2;
    const wave3 = Math.sin(x * freq3) * amp3;

    return wave1 + wave2 + wave3;
};

/**
 * Returns the screen Y coordinate of the terrain at a given world X coordinate.
 * This is the single source of truth for the terrain's height.
 */
export const getTerrainScreenY = (worldX: number, worldOffset: number, screenWidth: number, screenHeight: number): number => {
    const screenX = worldX - worldOffset;

    // 1. Calculate the base linear slope based on screen position
    const startY = screenHeight * 0.90;
    const endY = screenHeight * 0.40;
    const slope = (endY - startY) / screenWidth;
    const linearY = slope * screenX + startY;

    // 2. Add the procedural wave "noise" based on world position
    const proceduralY = TERRAIN_WAVE_FUNCTION(worldX);

    // 3. Combine them for the final Y position on screen
    return linearY - proceduralY;
};

/**
 * Generates the SVG path data for the terrain visible on screen.
 * Takes zoom into account to generate extra terrain on the sides so edges don't show when camera pulls back.
 */
export const generateTerrainPath = (screenWidth: number, screenHeight: number, worldOffset: number, zoom: number = 1): string => {
    // Calculate the actual visible width in world units when zoomed out
    const visibleWidth = screenWidth / zoom;
    const extraWidth = (visibleWidth - screenWidth) / 2;
    
    // We need to render from slightly to the left to slightly to the right of the actual screen bounds
    // to ensure the path covers the entire scalable area.
    const startX = Math.floor(-extraWidth);
    const endX = Math.ceil(screenWidth + extraWidth);

    // Start drawing the closed shape from the bottom-left corner of the visible area
    let path = `M ${startX} ${screenHeight}`; 

    // Step size can be increased for performance if needed, keeping 1 for high quality
    for (let x = startX; x <= endX; x+=2) {
        const worldX = x + worldOffset;
        const finalScreenY = getTerrainScreenY(worldX, worldOffset, screenWidth, screenHeight);
        path += ` L ${x} ${finalScreenY}`;
    }

    // Extend the shape DEEP downwards to ensure no bottom gap appears when zooming out
    const deepBottom = screenHeight * 4;
    path += ` L ${endX} ${deepBottom} L ${startX} ${deepBottom} Z`;

    return path;
};
