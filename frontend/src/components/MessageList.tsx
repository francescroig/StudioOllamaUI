import { Message } from '../store';

export default function MessageList({ messages }: { messages: Message[] }) {
  if (!messages || messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 text-sm italic">
        Inicia una conversación para empezar...
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