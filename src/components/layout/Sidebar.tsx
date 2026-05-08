import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/library', label: '文献库', icon: '📚' },
  { to: '/reader/1', label: '阅读器', icon: '📖' },
  { to: '/editor/1', label: '编辑器', icon: '✏️' },
  { to: '/agent', label: 'Agent', icon: '🤖' },
  { to: '/settings', label: '设置', icon: '⚙️' },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-64 h-screen bg-surface border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary">CiteForge</h1>
        <p className="text-sm text-secondary">科研助手终端</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.to
                    ? 'bg-primary text-white'
                    : 'text-secondary hover:bg-surface-hover'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted">
          CiteForge v0.1.0
        </div>
      </div>
    </aside>
  );
}
