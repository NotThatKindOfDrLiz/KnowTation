import React from 'react';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import NostrProvider from '@/components/NostrProvider';
import AppRouter from './AppRouter';

// Create a client for react-query
const queryClient = new QueryClient();

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <NostrProvider>
          <AppRouter />
          <Toaster />
        </NostrProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}