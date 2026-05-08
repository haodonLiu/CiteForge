export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">欢迎使用 CiteForge</h1>
      <p className="text-secondary mb-8">
        自带 Agent 的科研助手终端，支持 PDF 阅读、Markdown 编辑、文献管理。
      </p>

      <div className="grid grid-cols-2 gap-6">
        <a href="/library" className="p-6 bg-card rounded-lg border border-border hover:border-primary transition-colors">
          <h2 className="text-xl font-semibold mb-2">📚 文献库</h2>
          <p className="text-secondary">管理和浏览您的研究文献</p>
        </a>

        <a href="/reader" className="p-6 bg-card rounded-lg border border-border hover:border-primary transition-colors">
          <h2 className="text-xl font-semibold mb-2">📖 阅读器</h2>
          <p className="text-secondary">阅读 PDF 并添加批注</p>
        </a>

        <a href="/editor" className="p-6 bg-card rounded-lg border border-border hover:border-primary transition-colors">
          <h2 className="text-xl font-semibold mb-2">✏️ 编辑器</h2>
          <p className="text-secondary">Markdown 和 LaTeX 实时预览</p>
        </a>

        <a href="/agent" className="p-6 bg-card rounded-lg border border-border hover:border-primary transition-colors">
          <h2 className="text-xl font-semibold mb-2">🤖 Agent</h2>
          <p className="text-secondary">与 AI 助手对话</p>
        </a>
      </div>
    </div>
  );
}
