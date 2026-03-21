# 🚀 AI Career Coach (Full-Stack SaaS)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Play_Now-8A2BE2?style=for-the-badge)](https://ai-career-coach-frontend-peach.vercel.app/)
[![Backend Repo](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge)](https://github.com/Farhan8012/ai-career-coach-backend)

An intelligent, full-stack career acceleration platform that evaluates resumes, analyzes GitHub activity, and generates personalized study roadmaps using Generative AI. 

## ✨ Features
* **🔐 Secure Authentication:** Full user login/signup flow powered by Supabase.
* **📄 Smart ATS Parsing:** Extracts and cleans PDF resume text to calculate semantic match scores against job descriptions.
* **🐙 GitHub Profiler:** Automatically fetches live developer metrics (stars, languages, PRs) and generates an AI "Developer Scorecard."
* **🗺️ Generative AI Roadmaps:** Leverages Google Gemini to identify missing technical skills and auto-generate a 5-day study plan to close the gap.
* **🎨 Premium UI/UX:** Fully responsive, dark-mode glassmorphism interface built with Next.js and Tailwind CSS.

## 🛠️ Tech Stack
* **Frontend:** Next.js (React), Tailwind CSS, Framer Motion
* **Backend:** Python, FastAPI, pdfplumber
* **Database & Auth:** Supabase (PostgreSQL)
* **AI Engine:** Google Gemini (gemini-2.5-flash)
* **Deployment:** Vercel (Serverless Functions)

## 📸 Sneak Peek
*(Add a screenshot of your beautiful dark-mode dashboard here!)*

## 🧠 The Architecture
The platform utilizes a decoupled architecture. The Next.js frontend handles state management and user sessions, securely routing requests to the Python API. The backend uses pure-Python Jaccard Similarity algorithms for lightning-fast semantic matching to bypass heavy cloud deployment limits, while offloading complex generative tasks (like drafting Cover Letters) to the Gemini API.

### Frontend Setup
```bash
git clone <your-frontend-repo-url>
cd ai-career-coach-frontend
npm install
npm run dev

Backend Setup (Requires separate repo)
git clone <your-backend-repo-url>
cd ai-career-coach-backend
pip install -r requirements.txt
uvicorn api:app --reload