interface PaperStructure {
  sections: { section_type: string }[];
}

interface DecompositionStatsProps {
  structure: PaperStructure;
}

export default function DecompositionStats({ structure }: DecompositionStatsProps) {
  const methodCount = structure.sections.filter(s => s.section_type === 'Methodology').length;
  const experimentCount = structure.sections.filter(s => s.section_type === 'Experiment').length;

  return (
    <div className="p-3 border-t border-border">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-text-muted">方法论</span>
          <span className="text-text-secondary">{methodCount} 节</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">实验</span>
          <span className="text-text-secondary">{experimentCount} 节</span>
        </div>
      </div>
    </div>
  );
}
