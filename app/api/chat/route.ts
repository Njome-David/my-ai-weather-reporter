import { google } from '@ai-sdk/google';
import { convertToModelMessages, isStepCount, streamText, type UIMessage } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

const geocodingResponseSchema = z.object({
  results: z.array(
    z.object({
      latitude: z.number(),
      longitude: z.number(),
      name: z.string(),
      country: z.string().optional(),
    }),
  ).optional(),
});

const weatherResponseSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    apparent_temperature: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number(),
  }),
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-3.1-flash-lite'), // Updated to the stable default production model
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5),
    system: `You are a helpful personal assistant agent. When a tool returns data, do not just repeat the raw numbers. Summarize it like a cheerful morning radio host, give a practical clothing recommendation based on the temperature, and keep it under 3 sentences.`,

    tools: {
      getWeather: {
        description: 'Get the current weather for a specific location',
        inputSchema: z.object({
          city: z.string().describe('The city or location to get the weather for'),
        }),
        execute: async ({ city }) => {
          const geocodeUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
          geocodeUrl.search = new URLSearchParams({
            name: city,
            count: '1',
            language: 'en',
            format: 'json',
          }).toString();

          const geocodeResponse = await fetch(geocodeUrl);
          if (!geocodeResponse.ok) {
            throw new Error(`Geocoding service returned HTTP ${geocodeResponse.status}`);
          }

          const geocodeData = geocodingResponseSchema.parse(await geocodeResponse.json());
          const location = geocodeData.results?.[0];
          if (!location) {
            return { error: `Could not locate "${city}". Check the spelling and try again.` };
          }

          const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
          weatherUrl.search = new URLSearchParams({
            latitude: String(location.latitude),
            longitude: String(location.longitude),
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
            temperature_unit: 'celsius',
            wind_speed_unit: 'kmh',
          }).toString();

          const weatherResponse = await fetch(weatherUrl);
          if (!weatherResponse.ok) {
            throw new Error(`Weather service returned HTTP ${weatherResponse.status}`);
          }

          const { current } = weatherResponseSchema.parse(await weatherResponse.json());
          const interpretWeatherCode = (code: number): string => {
            if (code === 0) return 'Clear sky';
            if ([1, 2, 3].includes(code)) return 'Mainly clear, partly cloudy, or overcast';
            if ([45, 48].includes(code)) return 'Fog or depositing rime fog';
            if ([51, 53, 55].includes(code)) return 'Drizzle';
            if ([61, 63, 65].includes(code)) return 'Rain';
            if ([71, 73, 75].includes(code)) return 'Snow fall';
            if ([80, 81, 82].includes(code)) return 'Rain showers';
            if ([95, 96, 99].includes(code)) return 'Thunderstorm';
            return 'Unspecified weather patterns';
          };

          const tempC = Math.round(current.temperature_2m);
          const tempF = Math.round((tempC * 9) / 5 + 32);

          return {
            location: location.country ? `${location.name}, ${location.country}` : location.name,
            temperature: `${tempC}°C (${tempF}°F)`,
            feelsLike: `${Math.round(current.apparent_temperature)}°C`,
            condition: interpretWeatherCode(current.weather_code),
            humidity: `${current.relative_humidity_2m}%`,
            windSpeed: `${current.wind_speed_10m} km/h`,
          };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
