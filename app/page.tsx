'use client';

import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useState } from 'react';

type WeatherResult =
  | { error: string }
  | {
      location: string;
      temperature: string;
      feelsLike: string;
      condition: string;
      humidity: string;
      windSpeed: string;
    };

type ChatTools = {
  getWeather: {
    input: { city: string };
    output: WeatherResult;
  };
};

export default function Page() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error } =
    useChat<UIMessage<unknown, never, ChatTools>>();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!input.trim() || status === 'submitted') {
      return;
    }

    sendMessage({ text: input });
    setInput('');
  }

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch h-screen justify-between">
      {/* Chat Messages Feed */}
      <div className="overflow-y-auto space-y-4 mb-4 flex-1 p-4 border text-black rounded-lg bg-gray-50">
        {messages.map(message => (
          <div
            key={message.id}
            className={`whitespace-pre-wrap p-2 rounded ${
              message.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-200'
            }`}
          >
            <strong>{message.role === 'user' ? 'You: ' : 'Agent: '}</strong>
            {/* Loop through parts cleanly with precise TypeScript types */}
            {message.parts.map((part, index) => {
              // 1. Text Responses (Like 2 + 3)
              if (part.type === 'text') {
                return <span key={`${message.id}-${index}`}>{part.text}</span>;
              }

              if (part.type === 'tool-getWeather') {
                if (part.state === 'input-streaming') {
                  return (
                    <div key={part.toolCallId} className="mt-1 text-xs italic text-blue-600">
                      Preparing weather lookup{part.input?.city ? ` for ${part.input.city}` : ''}...
                    </div>
                  );
                }

                if (part.state === 'input-available') {
                  return (
                    <div key={part.toolCallId} className="mt-1 text-xs italic text-blue-600">
                      Looking up weather for {part.input.city}...
                    </div>
                  );
                }

                if (part.state === 'output-available') {
                  return (
                    <div key={part.toolCallId} className="mt-1 rounded border border-green-200 bg-white p-2 text-xs text-green-700">
                      {'error' in part.output ? (
                        <p>{part.output.error}</p>
                      ) : (
                        <>
                          <p>
                            Weather in {part.output.location}: {part.output.condition}, {part.output.temperature}
                          </p>
                          <p>Feels like {part.output.feelsLike}; humidity {part.output.humidity}; wind {part.output.windSpeed}.</p>
                        </>
                      )}
                    </div>
                  );
                }

                if (part.state === 'output-error') {
                  return (
                    <div key={part.toolCallId} className="mt-1 rounded border border-red-200 bg-white p-2 text-xs text-red-700">
                      Weather lookup failed: {part.errorText}
                    </div>
                  );
                }
              }

              return null;
            })}
          </div>
        ))}
        {/* Simple thinking indicator */}
        {(status === 'submitted' || status === 'streaming') && (
          <div className="text-xs text-gray-400 italic">Agent is thinking...</div>
        )}
        {error && (
          <div role="alert" className="text-sm text-red-600">
            Chat request failed: {error.message}
          </div>
        )}
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="w-full p-2 border border-gray-300 rounded shadow-xl text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          placeholder="Ask your agent something..."
          onChange={event => setInput(event.currentTarget.value)}
        />
        <button
          type="submit"
          disabled={status === 'submitted' || status === 'streaming'}
          className="bg-blue-500 text-white p-2 rounded px-4 hover:bg-blue-600 disabled:bg-gray-400"
        >
          Send
        </button>
      </form>
    </div>
  );
}
