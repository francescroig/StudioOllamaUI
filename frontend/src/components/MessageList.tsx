/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
import { useTranslation } from '../i18n';

export default function MessageList({ messages }: { messages: any[] }) {
  const { t } = useTranslation();
  
  if (!messages || messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 text-sm italic">
        {t('startConversation')}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {messages.map((m) => (
        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] p-4 rounded-2xl ${
            m.role === 'user' ? 'bg-blue-600 text-white' : 
            m.role === 'system' ? 'bg-gray-800 text-emerald-400 font-mono text-xs' : 'bg-[#1a1c23] text-gray-200 border border-gray-800'
          }`}>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
