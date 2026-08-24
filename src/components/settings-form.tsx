'use client';

import React, { useState, useEffect } from 'react';
import { UserSettings } from '@/lib/types';
import { useToast } from './providers';
import { Save, Sparkles, Key, Server, Cpu } from 'lucide-react';

interface SettingsFormProps {
  initialSettings: UserSettings;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<UserSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(initialSettings);
  }, [initialSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Settings saved successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to save settings', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* 1. AI Model & API Endpoint Settings */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AI Model & API Provider</h3>
            <p className="text-xs text-slate-400">Configure OpenAI compatible provider and model settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* OpenAI API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" /> API Key (Optional Override)
            </label>
            <input
              type="password"
              value={formData.openai_api_key || ''}
              onChange={(e) => setFormData({ ...formData, openai_api_key: e.target.value })}
              placeholder="sk-proj-..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500">Leave blank to use system OPENAI_API_KEY environment variable.</p>
          </div>

          {/* Model Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> AI Model
            </label>
            <select
              value={formData.openai_model}
              onChange={(e) => setFormData({ ...formData, openai_model: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="gpt-4o-mini">gpt-4o-mini (Fast & Recommended)</option>
              <option value="gpt-4o">gpt-4o (High Intelligence)</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
              <option value="claude-3-5-sonnet">claude-3-5-sonnet (via compatible API)</option>
              <option value="llama-3.3-70b">llama-3.3-70b (via Groq/OpenRouter)</option>
            </select>
          </div>

          {/* Base URL */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-400" /> OpenAI Compatible Base URL
            </label>
            <input
              type="text"
              value={formData.openai_base_url}
              onChange={(e) => setFormData({ ...formData, openai_base_url: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Custom Prompt & Persona Configuration */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">System Prompt & Creator Persona</h3>
            <p className="text-xs text-slate-400">Customize how the AI sounds when generating comment replies</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Custom Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Creator System Prompt</span>
              <span className="text-[11px] text-slate-500">Enforces natural American English</span>
            </label>
            <textarea
              rows={4}
              value={formData.custom_prompt}
              onChange={(e) => setFormData({ ...formData, custom_prompt: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Temperature Slider */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Temperature</span>
                <span className="text-indigo-400 font-mono font-bold">{formData.temperature}</span>
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Lower = deterministic, Higher = creative</p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Max Tokens</label>
              <input
                type="number"
                value={formData.max_tokens}
                onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) || 150 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Reply Length */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Reply Length Target</label>
              <select
                value={formData.reply_length}
                onChange={(e) => setFormData({ ...formData, reply_length: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="1-3 sentences">1 to 3 Sentences (Standard)</option>
                <option value="1-2 sentences">1 to 2 Sentences (Short & Punchy)</option>
                <option value="2-4 sentences">2 to 4 Sentences (Detailed)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all duration-200 disabled:opacity-50 active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Settings...' : 'Save Configuration'}</span>
        </button>
      </div>
    </form>
  );
}
