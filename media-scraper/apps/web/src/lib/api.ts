import axios from 'axios';

export type MediaType = 'image' | 'video';

export interface MediaItem {
  id: string;
  type: MediaType;
  mediaUrl: string;
  sourceUrl: string;
  createdAt: string;
}

export interface MediaResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: MediaItem[];
}

export type ScrapeJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ScrapeJob {
  id: string;
  url: string;
  status: ScrapeJobStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobsResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: ScrapeJob[];
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  timeout: 5000
});

export const submitScrape = async (urls: string[]): Promise<{ accepted: number; jobIds: string[] }> => {
  const response = await client.post('/scrape', { urls });
  return response.data as { accepted: number; jobIds: string[] };
};

export const getMedia = async (params: {
  page: number;
  limit: number;
  type?: MediaType;
  search?: string;
}): Promise<MediaResponse> => {
  const response = await client.get<MediaResponse>('/media', { params });
  return response.data;
};

export const getJobs = async (params: {
  page: number;
  limit: number;
  status?: ScrapeJobStatus;
  search?: string;
}): Promise<JobsResponse> => {
  const response = await client.get<JobsResponse>('/jobs', { params });
  return response.data;
};

export const getJob = async (id: string): Promise<ScrapeJob & { media: MediaItem[] }> => {
  const response = await client.get(`/jobs/${encodeURIComponent(id)}`);
  return response.data as ScrapeJob & { media: MediaItem[] };
};

export const retryJob = async (id: string): Promise<{ accepted: number; jobId: string }> => {
  const response = await client.post(`/jobs/${encodeURIComponent(id)}/retry`);
  return response.data as { accepted: number; jobId: string };
};
