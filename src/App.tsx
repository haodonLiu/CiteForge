import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TitleBar } from '@/components/TitleBar';
import Sidebar from '@/components/layout/Sidebar';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { useTaskEvents } from '@/hooks/useTaskEvents';
import Home from '@/pages/Home';
import Library from '@/pages/Library';
import Reader from '@/pages/Reader';
import Editor from '@/pages/Editor';
import Agent from '@/pages/Agent';
import Settings from '@/pages/Settings';

function AppContent() {
  useTaskEvents();
  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/reader/:id" element={<Reader />} />
          <Route path="/editor/:id" element={<Editor />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="flex flex-col h-screen">
          <TitleBar />
          <AppContent />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
