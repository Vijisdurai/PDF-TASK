# Pan Issue Debugging Guide

## Possible Issues

### Issue 1: Pan Offset Calculation
The current pan offset might be calculated incorrectly because:
- We're centering the document with `flex items-center justify-center`
- Then applying a transform on top
- The clamping logic assumes document starts at (0,0)

### Issue 2: Conflicting Positioning
```typescript
// Container centers content
className="flex items-center justify-center"

// Then we apply transform
style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
```

This creates a conflict where the document is:
1. First centered by flexbox
2. Then offset by transform
3. Clamping logic doesn't account for the centering

### Issue 3: Pan Offset Not Updating
Check if:
- `onPanChange` is being called
- The parent component is updating the `panOffset` prop
- React is re-rendering with the new offset

## How to Debug

### Step 1: Check if pan events are firing
Add console.log to see if events are being triggered:
```typescript
const handleMouseMove = useCallback((event: React.MouseEvent) => {
  console.log('Mouse move:', { isDragging, isPannable });
  if (!isDragging || !isPannable) return;
  // ... rest of code
});
```

### Step 2: Check if pan offset is changing
```typescript
console.log('Pan offset:', panOffset);
```

### Step 3: Check if clamping is too restrictive
The clamping might be preventing any movement:
```typescript
console.log('Clamp values:', { 
  minX, maxX, minY, maxY, 
  rawX, rawY, 
  clampedX, clampedY 
});
```

### Step 4: Check document vs container size
```typescript
console.log('Sizes:', {
  docWidth, docHeight,
  containerWidth, containerHeight,
  isPannable
});
```

## Quick Fix Options

### Option 1: Remove Flexbox Centering
Change from:
```typescript
className="flex items-center justify-center"
```
To:
```typescript
className="relative"
```

And manually center the document when it's smaller than viewport.

### Option 2: Use Scroll-Based Approach
Replace transform-based pan with native scrolling:
```typescript
<div style={{ overflow: 'auto' }}>
  <div style={{ 
    width: docWidth, 
    height: docHeight,
    transform: `scale(${zoomScale})`
  }}>
    <canvas />
  </div>
</div>
```

### Option 3: Fix Clamping Logic
Account for the flexbox centering in the clamp calculation:
```typescript
// Get the actual position of the document after flexbox centering
const flexOffsetX = (containerWidth - docWidth) / 2;
const flexOffsetY = (containerHeight - docHeight) / 2;

// Adjust clamping to account for flex offset
if (docWidth > containerWidth) {
  const minX = -(docWidth - containerWidth);
  const maxX = 0;
  clampedX = Math.max(minX, Math.min(maxX, rawX));
} else {
  clampedX = 0; // Let flexbox handle centering
}
```

## Recommended Solution

I recommend switching to a **scroll-based approach** which is simpler and more reliable:

1. Remove manual pan offset management
2. Use native browser scrolling
3. Only manage zoom scale
4. Use `scrollTo()` for programmatic positioning

This is how Chrome PDF viewer works and it's much more robust.
