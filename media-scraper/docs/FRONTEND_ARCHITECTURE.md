# Frontend Architecture

## Structure

- Vite + React + TypeScript app in `apps/web`
- dashboard page with search/filter/pagination controls
- virtualized media grid for large datasets
- table view powered by TanStack Table

## Data Layer

- TanStack Query for async state/caching/retries
- API abstraction in `src/lib/api.ts`
- query key includes page, filter, search

## Pagination Strategy

- server-driven pagination with `page` + `limit`
- keeps memory and render count low

## Virtualization

- `react-window` grid renders only visible media cells
- critical for smooth UI with large media sets

## Error and Loading Handling

- explicit loading/error UI states
- manual refresh action
- disabled pagination actions at boundaries

## Responsive Notes

- dashboard layout uses Tailwind utility classes
- controls adapt to stacked/mobile and wider desktop grids
