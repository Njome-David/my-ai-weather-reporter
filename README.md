# My AI Weather Reporter

Un assistant météo conversationnel qui répond aux questions sur le temps actuel dans une ville. Demandez, par exemple, « What’s the weather in Lisbon? » : l’assistant recherche la ville, récupère les conditions météo et les résume avec un conseil vestimentaire.

## Fonctionnalités

- Conversation en langage naturel avec un assistant propulsé par Gemini.
- Recherche d’une ville avec l’API de géocodage d’Open-Meteo.
- Affichage de la température en Celsius et en Fahrenheit, de la température ressentie, de l’humidité, du vent et des conditions actuelles.
- Réponses courtes et conseils pratiques adaptés à la météo.
- États de chargement et messages d’erreur dans l’interface.

> L’application affiche actuellement son interface en anglais.

## Prérequis

- Node.js et npm.
- Une clé API Google Gemini.

Les services d’Open-Meteo utilisés pour la géolocalisation et la météo ne nécessitent pas de clé API.

## Installation

1. Installez les dépendances :

   ```bash
   npm install
   ```

2. Créez un fichier `.env.local` à la racine du projet et ajoutez votre clé Gemini :

   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=votre_cle_api
   ```

   Ne publiez pas cette clé et ne la placez pas dans le code côté navigateur.

3. Lancez le serveur de développement :

   ```bash
   npm run dev
   ```

4. Ouvrez [http://localhost:3000](http://localhost:3000).

## Utilisation

Saisissez une question météo dans la zone de discussion, par exemple :

- `What's the weather in Lisbon?`
- `Do I need a jacket in Montreal today?`

L’assistant peut rechercher la météo actuelle d’une ville. Il ne fournit pas de prévisions horaires ou sur plusieurs jours.

## Commandes

| Commande | Description |
| --- | --- |
| `npm run dev` | Démarre le serveur de développement Next.js. |
| `npm run build` | Génère la version de production. |
| `npm run start` | Démarre le serveur de production après le build. |
| `npm run lint` | Exécute ESLint. |

## Fonctionnement

1. L’interface de discussion de [`app/page.tsx`](./app/page.tsx) transmet les messages à la route API.
2. [`app/api/chat/route.ts`](./app/api/chat/route.ts) utilise le modèle `gemini-3.1-flash-lite` via l’AI SDK.
3. Lorsque nécessaire, l’outil météo résout le nom de la ville avec le géocodeur Open-Meteo, puis demande les conditions actuelles à son API de prévision.
4. Gemini formule une réponse concise à partir des données récupérées.

Les réponses des services météo sont validées avec des schémas Zod. Les erreurs HTTP des services sont remontées par la route API.

## Technologies

- Next.js 16 et React 19
- TypeScript
- AI SDK avec Google Gemini
- Tailwind CSS 4
- Open-Meteo Geocoding API et Forecast API
- Zod
