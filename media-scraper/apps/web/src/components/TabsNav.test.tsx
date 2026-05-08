import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TabsNav } from '@/components/TabsNav';

describe('TabsNav', () => {
  it('renders all tab buttons', () => {
    const setTab = vi.fn();
    render(<TabsNav tab="submit" setTab={setTab} />);

    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Media')).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    const setTab = vi.fn();
    const { rerender } = render(<TabsNav tab="submit" setTab={setTab} />);

    const submitBtn = screen.getByText('Submit');
    expect(submitBtn).toHaveClass('bg-indigo-600');

    rerender(<TabsNav tab="jobs" setTab={setTab} />);
    const jobsBtn = screen.getByText('Jobs');
    expect(jobsBtn).toHaveClass('bg-indigo-600');
    expect(submitBtn).not.toHaveClass('bg-indigo-600');
  });

  it('calls setTab when a button is clicked', () => {
    const setTab = vi.fn();
    render(<TabsNav tab="submit" setTab={setTab} />);

    fireEvent.click(screen.getByText('Jobs'));
    expect(setTab).toHaveBeenCalledWith('jobs');

    fireEvent.click(screen.getByText('Media'));
    expect(setTab).toHaveBeenCalledWith('media');
  });
});
