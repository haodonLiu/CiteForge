import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Code,
  Table,
} from 'lucide-react';

interface ToolbarItem {
  icon: typeof Bold;
  title: string;
  action: () => void;
  shortcut?: string;
}

interface ToolbarGroup {
  label: string;
  items: ToolbarItem[];
}

interface EditorToolbarProps {
  onExecCommand: (command: string, value?: string) => void;
  onToggleSource: () => void;
  showSource: boolean;
}

export default function EditorToolbar({
  onExecCommand,
  onToggleSource,
  showSource,
}: EditorToolbarProps) {
  const execCommand = (command: string, value?: string) => {
    onExecCommand(command, value);
  };

  const toolbarGroups: ToolbarGroup[] = [
    {
      label: '格式',
      items: [
        { icon: Bold, title: '粗体', action: () => execCommand('bold'), shortcut: 'Ctrl+B' },
        { icon: Italic, title: '斜体', action: () => execCommand('italic'), shortcut: 'Ctrl+I' },
      ],
    },
    {
      label: '标题',
      items: [
        { icon: Heading1, title: '一级标题', action: () => execCommand('formatBlock', 'h1') },
        { icon: Heading2, title: '二级标题', action: () => execCommand('formatBlock', 'h2') },
        { icon: Heading3, title: '三级标题', action: () => execCommand('formatBlock', 'h3') },
      ],
    },
    {
      label: '列表',
      items: [
        { icon: List, title: '无序列表', action: () => execCommand('insertUnorderedList') },
        { icon: ListOrdered, title: '有序列表', action: () => execCommand('insertOrderedList') },
      ],
    },
    {
      label: '插入',
      items: [
        { icon: Quote, title: '引用', action: () => execCommand('formatBlock', 'blockquote') },
        { icon: Link, title: '链接', action: () => {
          const url = prompt('输入链接地址:');
          if (url) execCommand('createLink', url);
        }},
        { icon: Image, title: '图片', action: () => {
          const url = prompt('输入图片地址:');
          if (url) execCommand('insertImage', url);
        }},
        { icon: Code, title: '代码块', action: () => execCommand('formatBlock', 'pre') },
        { icon: Table, title: '表格', action: () => {
          const markdown = '\n| 列1 | 列2 |\n| --- | --- |\n| 内容 | 内容 |\n';
          execCommand('insertText', markdown);
        }},
      ],
    },
  ];

  return (
    <div className="h-9 flex items-center gap-1 px-2 border-b border-border bg-surface/30 shrink-0">
      {toolbarGroups.map((group, groupIdx) => (
        <div key={group.label} className="flex items-center gap-0.5">
          {groupIdx > 0 && <div className="w-px h-4 bg-border mx-1" />}
          {group.items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                onClick={item.action}
                title={`${item.title}${item.shortcut ? ` (${item.shortcut})` : ''}`}
                className="w-7 h-7 flex items-center justify-center rounded text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
      ))}

      {/* Source Toggle */}
      <div className="ml-auto flex items-center gap-1">
        <div className="w-px h-4 bg-border mx-1" />
        <button
          onClick={onToggleSource}
          title={showSource ? '隐藏源码' : '显示源码'}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
            showSource
              ? 'bg-primary/10 text-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          <Code size={14} />
        </button>
      </div>
    </div>
  );
}
