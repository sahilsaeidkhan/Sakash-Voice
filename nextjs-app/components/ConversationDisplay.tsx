'use client';

interface ConversationDisplayProps {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

export function ConversationDisplay({ messages }: ConversationDisplayProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 min-h-96 max-h-96 overflow-y-auto">
      {messages.map((msg, idx) => (
        <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
          <div
            className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
            }`}
          >
            <p className="text-sm md:text-base">{msg.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
