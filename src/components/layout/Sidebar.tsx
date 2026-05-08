'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/library', label: '文献库', icon: '📚' },
  { href: '/reader', label: '阅读器', icon: '📖' },
  { href: '/editor', label: '编辑器', icon: '✏️' },
  { href: '/agent', label: 'Agent', icon: '🤖' },
  { href: '/settings', label: '设置', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-surface border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary">CiteForge</h1>
        <p className="text-sm text-secondary">科研助手终端</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href
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
