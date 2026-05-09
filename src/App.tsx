import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TitleBar } from '@/components/TitleBar';
import Sidebar from '@/components/layout/Sidebar';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import TaskLayout from '@/components/layout/TaskLayout';
import { useTaskEvents } from '@/hooks/useTaskEvents';
import Home from '@/pages/Home';
import Library from '@/pages/Library';
import Reader from '@/pages/Reader';
import Editor from '@/pages/Editor';
import Agent from '@/pages/Agent';
import Settings from '@/pages/Settings';
import TaskDashboard from '@/pages/TaskDashboard';

function AppContent() {
  useTaskEvents();
  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          {/* Global routes */}
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />

          {/* Task-scoped routes */}
          <Route path="/task/:taskId" element={<TaskLayout />}>
            <Route index element={<TaskDashboard />} />
            <Route path="literature" element={<Library />} />
            <Route path="reader/:docId" element={<Reader />} />
            <Route path="editor" element={<Editor />} />
            <Route path="agent" element={<Agent />} />
          </Route>

          {/* Legacy redirects for compatibility */}
          <Route path="/reader/:docId" element={<Reader />} />
          <Route path="/editor/:id" element={<EditorLegacyRedirect />} />
          <Route path="/agent" element={<Agent />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function EditorLegacyRedirect() {
  // Old /editor/:id route — redirect to task-scoped editor if possible
  // For now, just render Editor standalone
  return <Editor />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="flex flex-col h-screen overflow-hidden">
          <TitleBar />
          <AppContent />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
