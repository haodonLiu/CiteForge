import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { useAppStore, type AppTheme } from '@/lib/store';
import type { AppSettings } from '@/lib/types';

type TabId = 'llm' | 'chroma' | 'theme' | 'about';

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: 'llm', label: 'LLM 配置' },
  { id: 'chroma', label: '向量数据库' },
  { id: 'theme', label: '外观' },
  { id: 'about', label: '关于' },
];

const themes: { id: AppTheme; name: string; desc: string }[] = [
  { id: 'ivory_press', name: 'Ivory Press', desc: '象牙烫金，学术奢华' },
  { id: 'midnight_scholar', name: 'Midnight Scholar', desc: '深蓝黑底，低蓝光' },
  { id: 'green_garden', name: 'Green Garden', desc: '低刺激，长时间编辑' },
  { id: 'high_contrast', name: 'High Contrast', desc: '高对比，金色强调' },
];

const defaultSettings: AppSettings = {
  llm: {
    provider: 'Ollama',
    base_url: 'http://localhost:11434',
    api_key: undefined,
    model: 'llama3',
    timeout_secs: 60,
  },
  chroma: {
    url: 'http://localhost:8000',
    collection: 'citeforge',
    embedding_dimension: 1536,
  },
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('llm');
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const currentTheme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await invoke<{ llm: any; chroma: any }>('get_settings');
      setSettings({
        llm: {
          provider: data.llm.provider === 'OpenAI' || data.llm.provider === 'Anthropic' || data.llm.provider === 'Ollama'
            ? data.llm.provider as 'OpenAI' | 'Anthropic' | 'Ollama'
            : 'Ollama',
          base_url: data.llm.base_url || 'http://localhost:11434',
          api_key: data.llm.api_key || undefined,
          model: data.llm.model || 'llama3',
          timeout_secs: data.llm.timeout_secs ?? 60,
        },
        chroma: {
          url: data.chroma.url || 'http://localhost:8000',
          collection: data.chroma.collection || 'citeforge',
          embedding_dimension: data.chroma.embedding_dimension || 1536,
        },
      });
    } catch (e) {
      console.error('failed to load settings:', e);
      setMessage({ type: 'error', text: '加载配置失败' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setMessage(null);
      const settingsToSave = {
      llm: {
        provider: settings.llm.provider,
        base_url: settings.llm.base_url,
        api_key: settings.llm.api_key || null,
        model: settings.llm.model,
        timeout_secs: settings.llm.timeout_secs ?? null,
      },
      chroma: {
        url: settings.chroma.url,
        collection: settings.chroma.collection,
        embedding_dimension: settings.chroma.embedding_dimension,
      },
    };
    await invoke('save_settings', { settings: settingsToSave });
      setMessage({ type: 'success', text: '配置已保存' });
    } catch (e) {
      console.error('failed to save settings:', e);
      setMessage({ type: 'error', text: `保存失败: ${e}` });
    } finally {
      setSaving(false);
    }
  }

  function updateLlm<K extends keyof AppSettings['llm']>(key: K, value: AppSettings['llm'][K]) {
    setSettings(s => ({
      ...s,
      llm: { ...s.llm, [key]: value },
    }));
  }

  function updateChroma<K extends keyof AppSettings['chroma']>(key: K, value: AppSettings['chroma'][K]) {
    setSettings(s => ({
      ...s,
      chroma: { ...s.chroma, [key]: value },
    }));
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">设置</h1>
          <p className="text-sm text-text-muted mt-1">配置应用参数和选项</p>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-success/10 text-success border border-success/20'
            : 'bg-error/10 text-error border border-error/20'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <Card className="flex items-center justify-center py-12">
          <div className="text-text-muted">加载中...</div>
        </Card>
      ) : (
        <>
          {activeTab === 'llm' && (
            <Card className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">LLM 提供商</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        提供商
                      </label>
                      <Select
                        value={settings.llm.provider}
                        onChange={e => updateLlm('provider', e.target.value as any)}
                        className="w-full"
                      >
                        <option value="OpenAI">OpenAI</option>
                        <option value="Anthropic">Anthropic</option>
                        <option value="Ollama">Ollama</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        模型
                      </label>
                      <Input
                        value={settings.llm.model}
                        onChange={e => updateLlm('model', e.target.value)}
                        placeholder="e.g., llama3, gpt-4"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        超时 (秒)
                      </label>
                      <Input
                        type="number"
                        value={settings.llm.timeout_secs || ''}
                        onChange={e => updateLlm('timeout_secs', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      API 地址
                    </label>
                    <Input
                      value={settings.llm.base_url}
                      onChange={e => updateLlm('base_url', e.target.value)}
                      placeholder="http://localhost:11434"
                    />
                    <p className="text-xs text-text-muted mt-1">
                      {settings.llm.provider === 'Ollama'
                        ? 'Ollama 默认地址: http://localhost:11434'
                        : settings.llm.provider === 'OpenAI'
                        ? 'OpenAI 地址: https://api.openai.com/v1'
                        : 'Anthropic 地址: https://api.anthropic.com'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      API Key {settings.llm.provider === 'Ollama' && <Badge variant="warning">可选</Badge>}
                    </label>
                    <Input
                      type="password"
                      value={settings.llm.api_key ?? ''}
                      onChange={e => updateLlm('api_key', e.target.value || undefined)}
                      placeholder={settings.llm.provider === 'Ollama' ? '留空使用本地模型' : 'sk-...'}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'chroma' && (
            <Card className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">向量数据库配置</h2>
                <p className="text-sm text-text-muted mb-6">
                  ChromaDB 用于文档语义搜索。服务需要在后台运行。
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      ChromaDB 地址
                    </label>
                    <Input
                      value={settings.chroma.url}
                      onChange={e => updateChroma('url', e.target.value)}
                      placeholder="http://localhost:8000"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        Collection 名称
                      </label>
                      <Input
                        value={settings.chroma.collection}
                        onChange={e => updateChroma('collection', e.target.value)}
                        placeholder="citeforge"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        向量维度
                      </label>
                      <Select
                        value={settings.chroma.embedding_dimension.toString()}
                        onChange={e => updateChroma('embedding_dimension', parseInt(e.target.value))}
                        className="w-full"
                      >
                        <option value="768">768 (e5-base, all-MiniLM)</option>
                        <option value="1024">1024 (e5-large)</option>
                        <option value="1536">1536 (OpenAI, ada-002)</option>
                        <option value="3072">3072 (voyage-3)</option>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-surface rounded-lg border border-border">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-muted">状态:</span>
                      <Badge variant={settings.chroma.url ? 'success' : 'error'}>
                        {settings.chroma.url ? '已配置' : '未配置'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'theme' && (
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-6">选择主题</h2>
              <div className="grid grid-cols-2 gap-4">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      currentTheme === t.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 bg-surface'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-4 h-4 rounded-full ${
                        t.id === 'ivory_press' ? 'bg-[#faf8f5] border border-[#e0d8cc]' :
                        t.id === 'midnight_scholar' ? 'bg-[#0b1120]' :
                        t.id === 'green_garden' ? 'bg-[#f0f4f1]' :
                        'bg-black'
                      }`} />
                      <span className="font-medium text-text-primary">{t.name}</span>
                      {currentTheme === t.id && (
                        <Badge variant="primary" className="ml-auto">当前</Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-muted">{t.desc}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-3xl">
                    📚
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">CiteForge</h2>
                    <p className="text-text-secondary mt-1">科研助手终端</p>
                    <p className="text-sm text-text-muted mt-2">
                      自带 Agent 的文献研究助手，支持 PDF 阅读、Markdown 编辑、文献管理。
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-semibold text-text-secondary mb-3">版本信息</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">应用版本</span>
                    <span className="text-text-primary">0.1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Tauri</span>
                    <span className="text-text-primary">2.x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">React</span>
                    <span className="text-text-primary">18.x</span>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-semibold text-text-secondary mb-3">技术栈</h3>
                <div className="flex flex-wrap gap-2">
                  {['Rust', 'Tauri 2', 'React', 'TypeScript', 'Vite', 'SQLite', 'ChromaDB'].map(tech => (
                    <Badge key={tech} variant="default">{tech}</Badge>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Save Button */}
          {activeTab !== 'about' && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存设置'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}