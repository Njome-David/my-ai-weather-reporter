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
    <main className="min-h-[100dvh] bg-[#f7f4ed] px-4 py-8 text-stone-900 sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col sm:min-h-[calc(100dvh-6rem)]">
        <header className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
            Your forecast, made personal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            My AI Weather Reporter
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600 sm:text-base">
            Ask about the weather anywhere, and get a clear answer.
          </p>
        </header>

        {/* Chat Messages Feed */}
        <div className="mb-4 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-stone-200 bg-[#fffdfa] p-4 text-stone-900 shadow-[0_12px_32px_-24px_rgba(87,65,35,0.35)]">
          {messages.length === 0 && (
            <p className="py-3 text-sm text-stone-500">
              Start with a city name, like “What’s the weather in Lisbon?”
            </p>
          )}
          {messages.map(message => (
            <div
              key={message.id}
              className={`whitespace-pre-wrap rounded-xl p-2 ${
                message.role === 'user'
                  ? 'bg-amber-100 text-right'
                  : 'bg-stone-100'
              }`}
            >
              <strong>{message.role === 'user' ? 'You: ' : 'Agent: '}</strong>
              {message.parts.map((part, index) => {
                if (part.type === 'text') {
                  return <span key={`${message.id}-${index}`}>{part.text}</span>;
                }

                if (part.type === 'tool-getWeather') {
                  if (part.state === 'input-streaming') {
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-1 text-xs italic text-amber-800"
                      >
                        Preparing weather lookup
                        {part.input?.city ? ` for ${part.input.city}` : ''}...
                      </div>
                    );
                  }

                  if (part.state === 'input-available') {
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-1 text-xs italic text-amber-800"
                      >
                        Looking up weather for {part.input.city}...
                      </div>
                    );
                  }

                  if (part.state === 'output-available') {
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-1 rounded border border-amber-200 bg-white p-2 text-xs text-stone-700"
                      >
                        {'error' in part.output ? (
                          <p>{part.output.error}</p>
                        ) : (
                          <>
                            <p>
                              Weather in {part.output.location}:{' '}
                              {part.output.condition}, {part.output.temperature}
                            </p>
                            <p>
                              Feels like {part.output.feelsLike}; humidity{' '}
                              {part.output.humidity}; wind {part.output.windSpeed}.
                            </p>
                          </>
                        )}
                      </div>
                    );
                  }

                  if (part.state === 'output-error') {
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-1 rounded border border-red-200 bg-white p-2 text-xs text-red-700"
                      >
                        Weather lookup failed: {part.errorText}
                      </div>
                    );
                  }
                }

                return null;
              })}
            </div>
          ))}
          {(status === 'submitted' || status === 'streaming') && (
            <div className="text-xs italic text-stone-500">
              Your forecast is on its way...
            </div>
          )}
          {error && (
            <div role="alert" className="text-sm text-red-600">
              Chat request failed: {error.message}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            aria-label="Ask about the weather"
            className="w-full rounded-xl border border-stone-300 bg-[#fffdfa] px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-700"
            value={input}
            placeholder="Ask about a city or forecast..."
            onChange={event => setInput(event.currentTarget.value)}
          />
          <button
            type="submit"
            disabled={status === 'submitted' || status === 'streaming'}
            className="rounded-xl bg-amber-800 px-5 py-3 font-medium text-white transition-colors hover:bg-amber-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
