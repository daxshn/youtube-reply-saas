'use client';

import React, { useEffect, useState } from 'react';
import SettingsForm from '@/components/settings-form';
import { UserSettings } from '@/lib/types';
import { Settings } from 'lucide-react';

const DEFAULT_SETTINGS: UserSettings = {
  id: '',
  user_id: '',
  openai_api_key: '',
  openai_base_url: 'https://api.openai.com/v1',
  openai_model: 'gpt-4o-mini',
  custom_prompt: 'You are an AI assistant replying to YouTube comments for a tech creator. Keep replies concise (1-2 sentences), friendly, helpful, and engage with the viewer directly. Use natural American English.',
  temperature: 0.7,
  max_tokens: 150,
  reply_length: '1-3 sentences',
  default_tone: 'auto',
  auto_fetch_interval_minutes: 5,
  spam_filter_enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.error('Settings fetch error:', err));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" /> AI Reply & SaaS Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure AI models, custom creator prompts, temperature, reply length, and automated sync intervals
        </p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
