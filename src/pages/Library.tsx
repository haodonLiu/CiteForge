import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import LiteratureList from '@/components/library/LiteratureList';

export default function Library() {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const { pathname } = useLocation();

  // Determine if we're in a task context
  const isTaskContext = pathname.startsWith('/task/');

  const handleSelect = (id: string) => {
    if (isTaskContext && taskId) {
      navigate(`/task/${taskId}/reader/${id}`);
    } else {
      navigate(`/reader/${id}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {isTaskContext && taskId && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface/50 shrink-0">
          <button
            onClick={() => navigate(`/task/${taskId}`)}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={12} />
            返回概览
          </button>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} className="text-primary" />
            <span className="text-sm font-semibold text-text-primary">项目文献</span>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <LiteratureList onSelect={handleSelect} />
      </div>
    </div>
  );
}
