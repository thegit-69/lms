# PROJECT_CONTEXT.md
## College Capstone – Learning Management System (LMS)

---

## 1. Project Overview
This project is a **college capstone Learning Management System (LMS)**.
The goal is to demonstrate:
- Full-stack system design
- Authentication & authorization
- Role-based access control (RBAC)
- Secure backend using managed services
- Clean, responsive frontend UI

This is an **MVP**, not a production SaaS.

---

## 2. Tech Stack (LOCKED – DO NOT CHANGE)

### Frontend
- React
- Vite
- Tailwind CSS
- Client-Side Rendered SPA (CSR)

### Backend
- Supabase
  - Supabase Auth
  - PostgreSQL
  - Row Level Security (RLS)
  - Auto-generated REST APIs

### Tooling
- Git & GitHub
- Postman (API testing)
- Hosting: Vercel or render

---

## 3. Explicit Constraints (VERY IMPORTANT)

DO NOT introduce:
- SSR / Next.js
- Docker
- Redux / Zustand / MobX
- GraphQL
- Custom backend server
- Microservices
- AI / MCP features
- Payments, chat, grades, attendance

Keep the system **simple, clean, and explainable**.

---

## 4. Rendering Model
- Single Page Application (SPA)
- Client-Side Rendering only
- SEO is NOT a requirement
- App is login-based (private content)

---

## 5. User Roles

### Roles
- admin
- faculty
- student

### Role Storage
- Stored in `profiles.role`
- `profiles.id` = `auth.users.id` (UUID)

Frontend hides UI elements by role,  
Backend enforces security using RLS.

---

## 6. Database Schema (FINAL)

### profiles
- id (uuid, primary key)
- username (text)
- role (admin | faculty | student)
- created_at (timestamp)

### courses
- course_id (uuid, primary key)
- course_name (text)
- faculty_id (uuid → profiles.id)
- status (pending | approved | rejected)
- created_at (timestamp)

### enrollments
- enrollment_id (uuid, primary key)
- course_id (uuid → courses.course_id)
- student_id (uuid → profiles.id)
- status (pending | approved | rejected)
- enrolled_at (timestamp)
- unique(course_id, student_id)

No additional tables are required for MVP.

---

## 7. Security Model

- All security is enforced at the database layer using Supabase RLS
- Frontend must NEVER assume trust
- API requests use Publishable key(new version) + user JWT
- service_role key/Secret keys is NOT used in frontend

RLS is intentionally minimal (capstone-level).

---

## 8. Core Functional Requirements

### Admin
- View all courses
- Approve / reject courses
- Manage data via Supabase dashboard if needed

### Faculty
- Create courses (status = pending)
- View enrollments
- Approve / reject student enrollments

### Student
- View approved courses
- Enroll in courses
- View own enrollments

---

## 9. Frontend Pages (REQUIRED)

- Login page
- AdminDashboard
- FacultyDashboard
- StudentDashboard

No extra pages unless absolutely necessary.

---

## 10. Frontend Folder Structure (PREFERRED)

src/
├─ auth/
│ ├─ Login.jsx
│ └─ ProtectedRoute.jsx
├─ pages/
│ ├─ AdminDashboard.jsx
│ ├─ FacultyDashboard.jsx
│ └─ StudentDashboard.jsx
├─ components/
│ ├─ Navbar.jsx
│ ├─ Sidebar.jsx
│ └─ CourseCard.jsx
├─ services/
│ └─ supabaseClient.js
├─ App.jsx
└─ main.jsx


---

## 11. UI / UX Guidelines

## UI / UX Guidelines

- Clean, minimal, professional UI
- Responsive design that adapts naturally to screen size
- Desktop-first visual balance with mobile compatibility
- Layout must feel appropriate for the current viewport:
  - Desktop/Laptop: spacious, centered, well-proportioned layouts
  - Tablet: comfortable spacing and readable content
  - Mobile: compact, stacked, touch-friendly layout
- Use Tailwind CSS responsive breakpoints (sm, md, lg)
- Do NOT lock layouts to mobile widths on large screens
- Do NOT stretch content edge-to-edge on large displays
- Prefer max-width containers with centered content
- No heavy animations
- No unnecessary UI libraries

Focus on clarity, hierarchy, and usability over visual decoration.

---

## 12. Testing Strategy

- API testing was done via Postman
- Manual tests were done.
- No Cypress / Playwright / Selenium

---

## 13. Deployment

- Frontend deployed as static SPA
- Environment variables used for Supabase keys
- No containerization

---

## 14. AI Tool Usage (IMPORTANT)

AI tools (Copilot / Claude / Gemini / GPT) are used as **coding assistants only**.

AI must:
- Follow this document strictly
- NOT introduce new architecture
- NOT add new tools
- Generate code only within defined constraints

Architecture and security decisions are **human-defined**.

---

## 15. Project Scope Philosophy

This project prioritizes:
- Correct design
- Security awareness
- Clear explanations
- Finishability

Over:
- Feature count
- Over-engineering
- Trend chasing

---

## End of Context
