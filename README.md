# Online-examantion

> Enterprise Online Examination Platform with Server-Authoritative Proctoring, Fullscreen Lockdown, Anti-Cheating Detection, Question Banks, Role-Based Dashboards, JWT Authentication, and Anti-SQL Injection Shield.

---

## 🎓 Project Candidates & Contributors

* **V Surendra** — Registration Number: `2500040073`
* **K Dileep Kumar** — Registration Number: `2500040145`

---

## 🔐 Credentials Directory

| Role | Name | Identifier / Email | Registration No | Password | Quick Fill |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Administrator** | Administrator *(Iron Man / Tony Stark)* | `admin@examflow.edu` | `ADM-STARK-001` | `admin123` | `[⚡ Fill Admin]` |
| **Student** | **V Surendra** | `surendra@examflow.edu` | `2500040073` | `student123` | `[⚡ Fill V Surendra]` |
| **Student** | **K Dileep Kumar** | `dileep@examflow.edu` | `2500040145` | `student123` | `[⚡ Fill K Dileep]` |
| **Customer Care** | Batman *(Emergency Care)* | `batman@examflow.edu` | `CARE-BATMAN-001` | `Demo@123` | — |

*Note: You can log into student accounts using either their institutional email or their direct registration number.*

---

## 🚀 Key Features & Security Enhancements

1. **JWT Token Authentication (RFC 7519 HS256)**:
   - Cryptographically structured header, claims payload (`sub`, `email`, `role`, `regNo`, `exp`), and HMAC signature.
   - Live **JWT Token Inspector** modal to view parsed claims and copy authorization Bearer tokens.

2. **Anti-SQL Injection Shield**:
   - Comprehensive pattern matching and parameter sanitization intercepting tautology attacks (`' OR '1'='1'`), union queries, delimiters (`--`, `/*`), and stacked commands.
   - Real-time warning alerts and safe parameterized lookup defense.
   - Interactive `[🧪 Test SQLi Block]` button to demonstrate live interceptor protection.

3. **Interactive Security CAPTCHA**:
   - HTML5 Canvas distorted alphanumeric CAPTCHA with noise lines, rotation, refresh button, and testing auto-fill.
   - Blocks unauthorized automated form submission.

4. **Exam Day Humor / Fun Zone 😂**:
   - Integrated mood booster and humorous exam quotes generator with `[🎲 Next Joke]` on the login portal.

5. **Multi-Role Access Control & Proctoring**:
   - Strict fullscreen lockdown and proctoring engine.
   - Instant tab-switch / focus loss detection with session flagging.
   - Full support for MCQ, MSQ, True/False, Short Answer, and Long Essay question formats with rubrics.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **Routing**: React Router v6
- **Security**: JWT (RFC 7519), Canvas CAPTCHA, Parameterized Query Engine
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
