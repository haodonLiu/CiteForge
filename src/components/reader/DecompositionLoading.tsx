interface DecompositionProgress {
  stage: string;
  progress: number;
  message: string;
}

interface DecompositionLoadingProps {
  progress: DecompositionProgress | null;
}

export default function DecompositionLoading({ progress }: DecompositionLoadingProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-text-muted">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span className="text-sm">{progress?.message || '正在解析论文结构...'}</span>
      {progress && (
        <div className="w-full px-4">
          <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <span className="text-xs text-text-muted mt-1 block text-center">
            {progress.stage} — {progress.progress}%
          </span>
        </div>
      )}
    </div>
  );
}
