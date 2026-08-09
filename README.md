## Getting Started

### Prerequisites

Make sure the following are installed:

* **Node.js** v18 or later
* **npm** (included with Node.js)
* A **Google Gemini API key**

---

## 1. Clone the repository

```bash
git clone https://github.com/your-username/fraudtrace.git
cd fraudtrace
```

---

## 2. Install dependencies

Install the project dependencies:

```bash
npm install
```

---

## 3. Configure environment variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

The Gemini API key is used **only by the backend** and must never be exposed to the frontend.

If you are running the frontend and backend as separate deployments, configure the frontend with the backend URL using:

```env
VITE_API_URL=http://localhost:3000
```

For a deployed backend, replace it with the backend's public URL:

```env
VITE_API_URL=https://your-backend-url.com
```

> **Important:** Never expose `GEMINI_API_KEY` through a `VITE_` environment variable. Vite exposes `VITE_*` variables to the browser.

---

## 4. Run the application locally

FraudTrace uses a Node.js backend together with a React/Vite frontend.

Start the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

The backend API is served by the application server and is used by the frontend for dashboard data, pattern analysis, case details, and AI-powered functionality.

---

## 5. Frontend-only deployment

The frontend can be deployed independently from the backend.

For a frontend-only deployment, make sure the frontend environment contains:

```env
VITE_API_URL=https://your-backend-url.com
```

Then build the frontend:

```bash
npm run build
```

The production build will be generated in:

```text
dist/
```

You can preview the production build locally with:

```bash
npm run preview
```

---

## 6. Backend configuration

The backend is responsible for:

* Serving FraudTrace API endpoints
* Processing investigation data
* Running fraud detection functionality
* Handling AI requests
* Communicating with the Google Gemini API

The Gemini API key must remain on the backend:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

The frontend communicates with the backend through:

```env
VITE_API_URL=https://your-backend-url.com
```

This keeps the Gemini credentials private while allowing the frontend to be hosted separately.

---

## API Reference

| Method  | Endpoint                          | Description                                                  |
| ------- | --------------------------------- | ------------------------------------------------------------ |
| `GET`   | `/api/dashboard/summary`          | Retrieve dashboard KPI summary                               |
| `GET`   | `/api/dashboard/timeline`         | Retrieve pattern detection timeline                          |
| `GET`   | `/api/patterns`                   | Retrieve detected fraud patterns sorted by risk              |
| `GET`   | `/api/patterns/:patternId`        | Retrieve complete case details, graph data, and transactions |
| `PATCH` | `/api/patterns/:patternId/status` | Update case status and investigation notes                   |
| `GET`   | `/api/accounts/flagged`           | Retrieve highest-risk flagged accounts                       |
| `POST`  | `/api/model/detect`               | Run fraud detection on transaction data                      |

---

## Project Structure

```text
fraudtrace/
│
├── src/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── App.tsx
│   ├── main.tsx
│   └── ...
│
├── server.ts
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env
└── README.md
```

The project follows a frontend/backend architecture where:

```text
React + Vite
      │
      │ HTTP API requests
      ▼
Node.js / Express Backend
      │
      ├── Fraud Detection
      ├── Investigation APIs
      └── Gemini API
```

---

## Production Deployment

For production, the frontend and backend can be deployed independently.

### Frontend

Deploy the React/Vite application to a static hosting platform such as Vercel.

Set the following environment variable:

```env
VITE_API_URL=https://your-backend-url.com
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

### Backend

Deploy the Node.js backend separately.

Configure the backend environment with:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

The frontend should never contain the Gemini API key.

---

## Troubleshooting

### `npm run dev` starts `tsx server.ts`

Make sure the `package.json` development script is:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

If the backend is being run separately, start it using its own backend command/configuration.

### API requests are failing

Check that:

1. The backend is running.
2. `VITE_API_URL` points to the correct backend URL.
3. The backend allows requests from the frontend origin.
4. The requested API endpoint exists.

For local development:

```env
VITE_API_URL=http://localhost:3000
```

For production:

```env
VITE_API_URL=https://your-backend-url.com
```

### Gemini requests are failing

Check that the backend has:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Do **not** put the Gemini key in the frontend.

---

## Team

Built at **YEL Build Bank · IGDTUW Chapter**

---

## License

This project is licensed under the MIT License.
