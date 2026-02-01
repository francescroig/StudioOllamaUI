/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
import { Languages } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function LanguageSelector() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#1a1c23] border border-gray-700 rounded-lg p-2 shadow-lg">
      <Languages size={16} className="text-gray-400" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'es' | 'en')}
        className="bg-transparent text-gray-300 text-xs font-bold outline-none cursor-pointer"
        title={t('language')}
      >
        <option value="es">🇪🇸 ES</option>
        <option value="en">🇬🇧 EN</option>
      </select>
    </div>
  );
}
