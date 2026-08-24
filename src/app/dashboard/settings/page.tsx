'use client';

import React, { useEffect, useState } from 'react';
import SettingsForm from '@/components/settings-form';
import { INITIAL_DEFAULT_SETTINGS } from '@/lib/mock-data';
import { UserSettings } from '@/lib/types';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(INITIAL_DEFAULT_SETTINGS);

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
