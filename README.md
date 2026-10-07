# Online-examantion

> Enterprise Online Examination Platform with Server-Authoritative Proctoring, Fullscreen Lockdown, Anti-Cheating Detection, Question Banks, and Role-Based Dashboards.

---

## 🚀 Key Features

- **Multi-Role Access Control**:
  - **Administrator** (`ironman@examflow.edu` / **Iron Man**): System configurations, user management, and security audit logs.
  - **Instructor** (`instructor@examflow.edu` / **Prof. Padmanabha Simha**): Question authoring, 6-step exam builder, and manual essay grading.
  - **Student** (`durgaprasad@examflow.edu` / **Durga Prasad**): Secure exam taking, live timers, auto-save, and instant scorecard reports.
- **Strict Anti-Cheating & Proctoring Engine**:
  - **Mandatory Fullscreen Lock**: Students cannot see questions until entering fullscreen mode.
  - **Immediate Disconnection**: Tab switching (`visibilitychange`), exiting fullscreen (`fullscreenchange`), or window focus loss (`blur`) instantly terminates the test, hides all question assets, and flags the session for plagiarism.
  - **Emergency Vigilance**: Directed immediately to Customer Care (**Batman** / `batman@examflow.edu`).
- **Comprehensive Question Bank**: Supports Single Choice (MCQ), Multiple Select (MSQ), True/False, Short Answer, and Long Essay formats with rich evaluation rubrics.
- **Pre-Configured Seed Datasets**:
  - *Kids Easy Test – LKG / UKG / Kindergarten* (20 foundational questions)
  - *Advanced Web Engineering & Distributed Architecture* (CS-302)
  - *Tollywood Comedy & Brahmi Legend Exam – Fun Edition* (Featuring Gajala, Kill Bill Pandey, Relangi Mavayya, and Pullarao)

---

## 🔐 Credentials Directory

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Administrator** | Iron Man *(Tony Stark)* | `ironman@examflow.edu` *(or `admin@examflow.edu`)* | `Demo@123` |
| **Student** | Durga Prasad | `durgaprasad@examflow.edu` *(or `student@examflow.edu`)* | `Demo@123` |
| **Customer Care** | Batman *(Gotham HQ)* | `batman@examflow.edu` | `Demo@123` |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **Routing**: React Router v6
- **Architecture**: Dual-mode storage (Local persistent reactive state + Supabase PostgreSQL schema)

---

## 💻 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build
```bash
npm run build
```
