import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MediaGrid } from '@/features/media/components/MediaGrid';
import type { MediaItem } from '@/lib/api';

const mockItems: MediaItem[] = [
  {
    id: '1',
    type: 'image',
    mediaUrl: 'https://example.com/img1.jpg',
    sourceUrl: 'https://example.com',
    createdAt: '2026-05-08T10:00:00Z',
  },
  {
    id: '2',
    type: 'video',
    mediaUrl: 'https://example.com/vid1.mp4',
    sourceUrl: 'https://example.com',
    createdAt: '2026-05-08T10:00:00Z',
  },
];

describe('MediaGrid', () => {
  it('renders a list of media items', () => {
    render(<MediaGrid items={mockItems} />);
    
    expect(screen.getByText('image')).toBeInTheDocument();
    expect(screen.getByText('video')).toBeInTheDocument();
    expect(screen.getByText('https://example.com/img1.jpg')).toBeInTheDocument();
    expect(screen.getByText('Video preview disabled for smooth UI')).toBeInTheDocument();
  });

  it('renders an image element for type image', () => {
    const item = mockItems[0];
    if (!item) throw new Error('Mock item missing');
    render(<MediaGrid items={[item]} />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/img1.jpg');
  });

  it('renders an empty grid when no items are provided', () => {
    const { container } = render(<MediaGrid items={[]} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
