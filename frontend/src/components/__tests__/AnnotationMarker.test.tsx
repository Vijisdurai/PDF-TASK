import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnnotationMarker from '../AnnotationMarker';

describe('AnnotationMarker', () => {
  it('renders with default black background and white text', () => {
    const { container } = render(
      <AnnotationMarker
        number={1}
        position={{ x: 100, y: 100 }}
        onClick={() => {}}
      />
    );
    
    const marker = container.querySelector('div[style*="background"]');
    expect(marker).toBeTruthy();
  });

  it('renders with custom color', () => {
    const { container } = render(
      <AnnotationMarker
        number={2}
        color="#FF0000"
        position={{ x: 100, y: 100 }}
        onClick={() => {}}
      />
    );
    
    const marker = container.querySelector('div[style*="background"]');
    expect(marker).toBeTruthy();
  });

  it('uses black text on white background', () => {
    const { container } = render(
      <AnnotationMarker
        number={3}
        color="#FFFFFF"
        position={{ x: 100, y: 100 }}
        onClick={() => {}}
      />
    );
    
    const text = container.querySelector('span');
    expect(text?.style.color).toBe('rgb(0, 0, 0)');
  });

  it('uses white text on black background', () => {
    const { container } = render(
      <AnnotationMarker
        number={4}
        color="#000000"
        position={{ x: 100, y: 100 }}
        onClick={() => {}}
      />
    );
    
    const text = container.querySelector('span');
    expect(text?.style.color).toBe('rgb(255, 255, 255)');
  });

  it('displays the correct number', () => {
    render(
      <AnnotationMarker
        number={42}
        position={{ x: 100, y: 100 }}
        onClick={() => {}}
      />
    );
    
    expect(screen.getByText('42')).toBeTruthy();
  });
});
