import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Import pages
import Dashboard from '@/pages/Dashboard';
import AddReference from '@/pages/AddReference';
import EditReference from '@/pages/EditReference';
import ViewReference from '@/pages/ViewReference';
import ImportReference from '@/pages/ImportReference';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />
  },
  {
    path: "/add",
    element: <AddReference />
  },
  {
    path: "/edit/:id",
    element: <EditReference />
  },
  {
    path: "/view/:id",
    element: <ViewReference />
  },
  {
    path: "/import",
    element: <ImportReference />
  },
  {
    path: "/settings",
    element: <Settings />
  },
  {
    path: "*",
    element: <NotFound />
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}