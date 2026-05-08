import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SubmitPanel } from '@/features/scraper/components/SubmitPanel';
import { useSubmitScrape } from '@/features/scraper/hooks/useSubmitScrape';

// Mock the custom hook
vi.mock('@/features/scraper/hooks/useSubmitScrape', () => ({
  useSubmitScrape: vi.fn(),
}));

describe('SubmitPanel', () => {
  it('renders correctly with initial text', () => {
    (useSubmitScrape as any).mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });

    render(<SubmitPanel urlsText="https://example.com" setUrlsText={vi.fn()} />);
    
    expect(screen.getByRole('textbox')).toHaveValue('https://example.com');
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('calls setUrlsText when textarea changes', () => {
    (useSubmitScrape as any).mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
    const setUrlsText = vi.fn();
    render(<SubmitPanel urlsText="" setUrlsText={setUrlsText} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new-url' } });
    expect(setUrlsText).toHaveBeenCalledWith('new-url');
  });

  it('disables button and shows loading state when pending', () => {
    (useSubmitScrape as any).mockReturnValue({
      isPending: true,
      mutate: vi.fn(),
    });

    render(<SubmitPanel urlsText="url" setUrlsText={vi.fn()} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Submitting…');
  });

  it('triggers mutate when button is clicked', () => {
    const mutate = vi.fn();
    (useSubmitScrape as any).mockReturnValue({
      isPending: false,
      mutate,
    });

    render(<SubmitPanel urlsText="url" setUrlsText={vi.fn()} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mutate).toHaveBeenCalled();
  });

  it('shows success message when mutation succeeds', () => {
    (useSubmitScrape as any).mockReturnValue({
      isPending: false,
      isSuccess: true,
      data: { accepted: 5 },
      mutate: vi.fn(),
    });

    render(<SubmitPanel urlsText="url" setUrlsText={vi.fn()} />);
    
    expect(screen.getByText(/Accepted:/)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows error message when mutation fails', () => {
    (useSubmitScrape as any).mockReturnValue({
      isPending: false,
      isError: true,
      mutate: vi.fn(),
    });

    render(<SubmitPanel urlsText="url" setUrlsText={vi.fn()} />);
    
    expect(screen.getByText('Submit failed. Check URLs and try again.')).toBeInTheDocument();
  });
});
