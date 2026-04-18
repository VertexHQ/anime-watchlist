here is the sheet url :https://docs.google.com/spreadsheets/d/1M5h2vyTr3eZmFxTLmW9XoJ-YOOaTexMfhVEaUH_G68M/edit?gid=0#gid=0

watched sheet name : "watched"
unwatched sheet name : "unwatched"

1. High-Level Architecture
React App (Vite + Tailwind)
        ↓
Fetch API (GET / POST)
        ↓
Google Apps Script (Web API)
        ↓
Google Sheets (Database)
2. Tech Stack (Finalized)
Layer	Technology
Frontend	React (Vite)
Styling	Tailwind CSS
Routing	React Router
State	React Hooks / Context API
API Layer	Google Apps Script
Hosting	Vercel / Netlify
3. Application Structure (Multi-Page)

Use React Router for pages:

Pages:
/ → Dashboard
/add → Add Anime
/completed → Watched Anime
/watching → Watching Anime
/planned → Plan to Watch
/details/:id → Anime Detail Page
4. Folder Structure (Scalable)
src/
 ├── api/
 │    └── animeApi.js
 ├── components/
 │    ├── Navbar.jsx
 │    ├── AnimeCard.jsx
 │    ├── AnimeForm.jsx
 │    └── Loader.jsx
 ├── pages/
 │    ├── Dashboard.jsx
 │    ├── AddAnime.jsx
 │    ├── Completed.jsx
 │    ├── Watching.jsx
 │    ├── Planned.jsx
 │    └── Details.jsx
 ├── context/
 │    └── AnimeContext.jsx
 ├── hooks/
 │    └── useAnime.js
 ├── utils/
 │    └── constants.js
 ├── App.jsx
 ├── main.jsx
 └── index.css
5. Routing Setup
import { BrowserRouter, Routes, Route } from "react-router-dom";

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/add" element={<AddAnime />} />
    <Route path="/completed" element={<Completed />} />
    <Route path="/watching" element={<Watching />} />
    <Route path="/planned" element={<Planned />} />
    <Route path="/details/:id" element={<Details />} />
  </Routes>
</BrowserRouter>
6. Data Model (Google Sheet)
Field	Type
id	number (timestamp)
title	string
status	string
rating	number
notes	string
image	string (URL)
createdAt	string
7. API Layer (Frontend)
animeApi.js
const BASE_URL = "YOUR_APPS_SCRIPT_URL";

export const getAnime = async () => {
  const res = await fetch(BASE_URL);
  return res.json();
};

export const addAnime = async (data) => {
  return fetch(BASE_URL, {
    method: "POST",
    body: JSON.stringify(data),
  });
};
8. Global State (Context API)
Why:
Avoid prop drilling
Centralized anime list
AnimeContext.jsx
import { createContext, useState, useEffect } from "react";
import { getAnime } from "../api/animeApi";

export const AnimeContext = createContext();

export const AnimeProvider = ({ children }) => {
  const [anime, setAnime] = useState([]);

  const fetchData = async () => {
    const data = await getAnime();
    setAnime(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AnimeContext.Provider value={{ anime, setAnime, fetchData }}>
      {children}
    </AnimeContext.Provider>
  );
};
9. Core Components
1. Navbar
Navigation links:
Dashboard
Add Anime
Completed
Watching
Planned
2. AnimeCard

Displays:

Image
Title
Status badge
Rating
Button → Details
3. AnimeForm

Inputs:

Title
Status (dropdown)
Rating
Notes
Image URL
10. Page Logic
Dashboard
Show:
Total anime count
Completed count
Watching count
Recent anime list
Completed Page
anime.filter(a => a.status === "Completed")
Watching Page
anime.filter(a => a.status === "Watching")
Planned Page
anime.filter(a => a.status === "Plan")
Details Page
Show:
Full info
Notes
Status
Future:
Edit / Delete
11. Tailwind Design System
Theme
Background: Dark (bg-gray-900)
Cards: bg-gray-800
Accent: purple / pink gradient
Example Card
<div className="bg-gray-800 rounded-xl p-4 shadow-lg">
  <img src={image} className="rounded-lg" />
  <h2 className="text-white text-lg font-bold">{title}</h2>
  <span className="text-sm text-purple-400">{status}</span>
</div>
12. Background Handling

Since you’ll provide image:

body {
  background: url('/bg.jpg') no-repeat center center/cover;
}

Or Tailwind:

<div className="bg-[url('/bg.jpg')] bg-cover bg-center min-h-screen">
13. Performance Strategy
Cache API response in state
Avoid refetch on every route
Use useMemo for filtered lists
14. Security Layer (Important)

In Apps Script:

if (data.secret !== "MY_SECRET") {
  return;
}

Frontend:

body: JSON.stringify({
  ...data,
  secret: "MY_SECRET"
})
15. Deployment Plan
Steps:
Build project:
npm run build
Deploy to:
Vercel (recommended)
or Netlify
16. Advanced Features (Recommended for You)

Since you're a scraping dev:

1. Auto Anime Data Fetch
Use APIs like:
Jikan (MyAnimeList API)

Auto-fill:

Title
Image
Rating
2. Status Update (Inline)
Dropdown inside card → PATCH via Apps Script
3. Delete Feature
Add doDelete in Apps Script
4. Pagination / Lazy Load
For large lists
5. Search + Filter
anime.filter(a => 
  a.title.toLowerCase().includes(search)
)
17. Final Workflow
User adds anime →
React form →
POST → Apps Script →
Google Sheet updated →

React fetch →
State updated →
UI re-rendered →
Separated pages show data
18. What You Should Do Next
Setup:
Vite React app
Tailwind
Create Google Sheet + Script
Implement:
API layer
Context
Pages
Add styling