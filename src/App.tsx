import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import Home from '@/pages/Home';
import Library from '@/pages/Library';
import Reader from '@/pages/Reader';
import Editor from '@/pages/Editor';
import Agent from '@/pages/Agent';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="flex h-screen">
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
      </BrowserRouter>
    </ThemeProvider>
  );
}
