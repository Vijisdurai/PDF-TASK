# Manual Testing Guide for Task 4: Annotation Rendering and Display

## Prerequisites
1. Start the backend server: `cd backend && python main.py`
2. Start the frontend server: `cd frontend && npm run dev`
3. Upload an image document to the system

## Test 4.1: Verify marker rendering for all annotations

### Test Case 1: Zero annotations
1. Open an image document that has no annotations
2. **Expected**: No annotation markers should be visible on the image

### Test Case 2: One annotation
1. Open an image document
2. Double-click on the image to create one annotation
3. Enter some text and save
4. **Expected**: Exactly one marker labeled "1" should appear at the clicked location

### Test Case 3: Multiple annotations
1. Open an image document
2. Create 5 annotations by double-clicking at different locations
3. **Expected**: 
   - 5 markers should be visible
   - Each marker should be numbered 1, 2, 3, 4, 5
   - Marker count should match annotation count (5)

### Test Case 4: All annotations displayed
1. Create annotations at various positions:
   - Top left corner
   - Top right corner
   - Bottom left corner
   - Bottom right corner
   - Center
2. **Expected**: All 5 markers should be visible regardless of position

## Test 4.2: Verify marker numbering and ordering

### Test Case 1: Sequential numbering
1. Create 3 annotations in quick succession
2. **Expected**: Markers numbered 1, 2, 3 in the order they were created

### Test Case 2: Chronological ordering
1. Create annotation A at 10:00 AM
2. Create annotation B at 10:05 AM
3. Create annotation C at 10:10 AM
4. **Expected**: 
   - Annotation A is numbered "1"
   - Annotation B is numbered "2"
   - Annotation C is numbered "3"

### Test Case 3: Ordering with page reload
1. Create 3 annotations in order: A, B, C
2. Reload the page
3. **Expected**: Markers still numbered 1, 2, 3 in chronological order (A=1, B=2, C=3)

### Test Case 4: Verify numbering persists across zoom/pan
1. Create 3 annotations
2. Zoom in and pan around
3. **Expected**: Marker numbers remain consistent (1, 2, 3) regardless of zoom/pan

## Test 4.3: Verify marker color display

### Test Case 1: Custom color display
1. Create an annotation (default color is yellow #FFEB3B)
2. **Expected**: Marker should display with yellow background

### Test Case 2: Default color
1. Check the code or database for an annotation without a color property
2. **Expected**: Marker should display with black background (#000000)

### Test Case 3: Various colors
1. Modify annotation colors in the database or code to test:
   - Red (#FF0000)
   - Green (#00FF00)
   - Blue (#0000FF)
   - Yellow (#FFEB3B)
   - Purple (#9C27B0)
2. **Expected**: Each marker displays with its assigned color

### Test Case 4: Light vs Dark colors
1. Create annotations with light colors (e.g., #FFEB3B, #FFFFFF)
2. Create annotations with dark colors (e.g., #000000, #8B0000)
3. **Expected**: 
   - Light colored markers should have dark text (black) for contrast
   - Dark colored markers should have light text (white) for contrast
   - All marker numbers should be readable

### Test Case 5: Mixed colors
1. Create 5 annotations with different colors
2. **Expected**: Each marker displays its unique color while maintaining sequential numbering

## Verification Checklist

### Task 4.1: Marker Rendering
- [ ] Zero annotations: No markers displayed
- [ ] One annotation: Exactly one marker displayed
- [ ] Multiple annotations: All markers displayed
- [ ] Marker count equals annotation count
- [ ] All annotations for document are visible

### Task 4.2: Marker Numbering
- [ ] Markers numbered sequentially (1, 2, 3, ...)
- [ ] Numbering follows creation timestamp order
- [ ] Order maintained after page reload
- [ ] Order maintained during zoom/pan operations
- [ ] Handles annotations created in different orders

### Task 4.3: Marker Color
- [ ] Custom colors display correctly
- [ ] Default color (black) used when not specified
- [ ] Various color values work (red, green, blue, yellow, purple)
- [ ] Light colors have dark text for contrast
- [ ] Dark colors have light text for contrast
- [ ] Mixed colors display correctly

## Notes
- All tests should be performed with zoom and pan operations to ensure markers remain correctly positioned
- Test in both normal and fullscreen modes
- Verify behavior persists across page reloads
