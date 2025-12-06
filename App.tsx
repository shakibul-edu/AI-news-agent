import React from 'react';
import { Dashboard } from './components/Dashboard';

// This acts as the Root Page component for client-side mounting (index.html -> index.tsx -> App.tsx)
// For Next.js App Router, app/page.tsx is the entry point.
// Maintaining this file allows the app to render in both environments.

export default function App() {
  return <Dashboard />;
}