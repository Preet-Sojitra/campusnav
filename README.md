<div align="center">
  <h1>🗺️ CampusNav </h1>
  <p><b>Your AI-powered guide for navigating campus, maximizing free time, and staying on top of your classes.</b></p>
</div>

---

##  The Pitch
We've all been there: it's Wednesday, you have a 3-hour gap between Data Structures and Calc III, you don't know where the closest empty lecture hall is, and you *definitely* should be studying but have zero motivation. 

**CampusNav** fixes this. 

It transforms your static college schedule into a real-time, interactive, AI-driven dashboard. Not only does it tell you where to walk, but it actively monitors the timeline of your day to find empty rooms, give live walking directions, and—crucially—uses AI to nag you (productively) about what you *should* be studying right now. 

*(Oh, and it was entirely built by an AI agent—Google's Antigravity model—but more on that later).* 😉

---

## ✨ Core Features

*    **Smart Schedule Timeline**: A beautiful, dynamic view of your day. It tracks the time, highlights your current class, and warns you exactly when you need to start walking to your next lecture.
*    **Syllabus-Aware AI Gap Suggestions**: Upload your syllabus PDF and the app remembers it. When you have free time, you click "AI Suggestion" and Gemini analyzes your syllabus against the *current week of the semester* to tell you exactly what topics to review or assignments to start.
*    **Voice-Enabled Assistant**: Reading is hard. ElevenLabs TTS brings your AI study suggestions to life, speaking the recommendations out loud like a real academic advisor.
*    **Live Empty Room Discovery**: Instead of wandering the halls, the app computes your free gaps and checks campus schedules to recommend the *closest, actually-empty* classrooms for quiet study. 
*    **Integrated Navigation**: Embedded campus maps appear the second you need them, drawing the route from where your last class ended to the empty study spot or your next lecture hall.
*    **Ask Gemini Chat**: A floating assistant that understands your *entire* context—your location, your free time, the time of day, and your uploaded coursework. Ask it design questions, have it quiz you, or just ask what to do next.

---

## 🛠️ Tracks & APIs Used

We aimed for the stars (and the sponsor prizes). Here's the tech stack powering CampusNav:

*   **Nebula Labs API Track**: A huge shoutout to our university's open-source student org, Nebula Labs! We hit their API to extract real course metrics, fetch accurate class names, and power the live empty-room discovery algorithm.
*   **Figma Track**: We mapped out the sleek, dynamic interface in Figma before writing a single line of code (which is a lie, the AI wrote the code, but we *did* design it). Check out our [Figma Workspace here](https://www.figma.com/design/0DFnzUCPH4zwtdtZAgNtm9/hackai?node-id=7-2&t=8IIgQiMXNaTG9U7g-1). 
*   **Google Gemini Track**: We abused—ahem, *utilized*—Gemini models extensively. `gemini-2.5-flash-lite` parses messy uploaded PDFs into structured syllabus data. `gemini-2.5-flash` powers the context-aware "Ask Gemini" chat and the hyper-personalized gap-time study suggestions.
*  **ElevenLabs Track**: We used the ElevenLabs REST API to generate high-quality, ultra-realistic voice output for the AI study suggestions ("Recommendation Mode") and navigation alerts ("Navigation Mode").
*   **Antigravity Track**: The elephant in the room. This entire project—the Next.js routing, the tailwind CSS beautifulness, the complex state management, the API integrations—was constructed by pair-programming with the Deepmind **Antigravity agentic coding model**. Yes, the AI built the AI app. It's AIs all the way down. 

---

## 💻 Tech Stack

*   **Frontend**: Next.js (App Router), React, Tailwind CSS, Lucide Icons, React Hot Toast
*   **Backend**: Next.js API Routes, NextAuth (for logging in)
*   **Database/Storage**: MongoDB (for chat history caching)
*   **APIs**: Google GenAI SDK, ElevenLabs API, Nebula Labs API, Campus Map Routing APIs

---

## 🏃‍♂️ Running Locally

1. Clone the repo.
2. Install the things: `npm install` (or `pnpm install`)
3. Create a `.env.local` file with the goods:
   ```env
   GEMINI_API_KEY=your_gemini_key
   ELEVEN_LABS_API_KEY=your_elevenlabs_key
   NEXTAUTH_SECRET=your_secret
   ```
4. Run it: `npm run dev`
5. Go to `http://localhost:3000` and marvel at what happens when humans and Antigravity join forces.
