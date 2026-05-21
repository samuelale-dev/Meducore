# EduCore - Cloud-Based School Administration Platform

## 🎯 Project Vision

EduCore is a **Progressive Web App (PWA)** that centralizes school operations into one unified platform, replacing:
- Paper attendance sheets
- Excel spreadsheets
- WhatsApp groups
- Separate library software
- Manual meal tracking

### Core Features
✅ Student identity management  
✅ QR-based attendance  
✅ Meal tracking  
✅ Grades & academic records  
✅ Library management  
✅ Discipline tracking  
✅ Clubs & activities  
✅ Communication hub  
✅ Administration dashboard  

---

## 🏗️ High-Level Architecture

### Technology Stack

| Layer | Technology | Hosting |
|-------|-----------|---------|
| **Frontend** | React + Vite + TypeScript + Tailwind + PWA | Vercel |
| **Backend API** | Node.js + Express + TypeScript | Railway/Render |
| **Database** | PostgreSQL + Prisma ORM | Neon |
| **CI/CD** | GitHub Actions | GitHub |

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vercel)                        │
│  React + Vite + TypeScript + Tailwind + PWA Offline Support │
│  - Dashboard UI                                              │
│  - QR Scanner                                                │
│  - Forms & Authentication                                    │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS API Calls
┌────────────────▼────────────────────────────────────────────┐
│                  BACKEND API (Railway/Render)                │
│         Node.js + Express + TypeScript                       │
│  - Authentication & Authorization                            │
│  - Business Logic                                            │
│  - QR Generation & Validation                                │
│  - Data Processing                                           │
└────────────────┬────────────────────────────────────────────┘
                 │ Prisma ORM
┌────────────────▼────────────────────────────────────────────┐
│              DATABASE (Neon PostgreSQL)                      │
│  - Users & Roles                                             │
│  - Students & QR Codes                                       │
│  - Attendance Records                                        │
│  - Grades & Academic Data                                    │
│  - Library & Meal Logs                                       │
│  - Discipline & Activities                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 Development Phases

### Phase 1: Foundation & Authentication
**Duration:** Week 1-2  
**Goal:** Secure staff login system

**Database Schema:**
```sql
Table: users
├── id (UUID primary)
├── email (unique)
├── password (hashed bcryptjs)
├── name
├── role (admin/teacher/staff)
├── school_id (for multi-tenancy)
├── createdAt
└── updatedAt
```

**Features:**
- ✅ Login page with email/password
- ✅ JWT token generation
- ✅ Protected routes
- ✅ AuthContext for state management
- ✅ Session persistence
- ✅ Password reset functionality (future)

**API Endpoints:**
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login & get JWT
GET    /api/auth/verify            - Verify token validity
POST   /api/auth/refresh           - Refresh expired token
POST   /api/auth/logout            - Logout
```

---

### Phase 2: Student Identity System
**Duration:** Week 3-4  
**Goal:** Digitize student records with QR codes

**Database Schema:**
```sql
Table: students
├── id (UUID primary)
├── studentId (numeric, auto-generated, unique)
├── fullName
├── email
├── dateOfBirth
├── class_id (references classes)
├── guardian_contact
├── photo_url
├── status (active/inactive)
├── createdAt
└── updatedAt

Table: qr_codes
├── id (UUID primary)
├── student_id (references students)
├── qr_data (unique code)
├── generated_at
└── expires_at (optional)
```

**Features:**
- Create/edit/delete students
- Auto-generate numeric IDs (e.g., STD-2024-0001)
- QR code generation for each student
- QR code printing/export
- Student profile page
- Batch student import (CSV)

**API Endpoints:**
```
GET    /api/students               - List all students
POST   /api/students               - Create student
GET    /api/students/:id           - Get student details
PUT    /api/students/:id           - Update student
DELETE /api/students/:id           - Delete student
GET    /api/students/:id/qrcode    - Generate QR code
POST   /api/students/bulk-import   - Bulk import students
```

---

### Phase 3: Attendance System
**Duration:** Week 5-6  
**Goal:** Fast attendance through QR scanning

**Database Schema:**
```sql
Table: attendance
├── id (UUID primary)
├── student_id (references students)
├── date (DATE)
├── time_in (TIMESTAMP)
├── time_out (TIMESTAMP)
├── status (present/absent/late/excused)
├── marked_by (references users)
├── notes
├── created_at
└── unique(student_id, date)

Table: attendance_logs
├── id (UUID primary)
├── attendance_id
├── action (scan/edit/delete)
├── changed_by (references users)
├── timestamp
└── details (JSON)
```

**Features:**
- QR code scanning interface
- Real-time attendance marking
- Manual attendance entry
- Attendance history per student
- Daily reports by class
- Attendance summaries
- Late/absent notifications
- Bulk attendance corrections

**API Endpoints:**
```
POST   /api/attendance/scan        - Mark attendance via QR
GET    /api/attendance             - Get attendance records
POST   /api/attendance             - Manual entry
PUT    /api/attendance/:id         - Edit attendance
GET    /api/attendance/:id/reports - Generate reports
GET    /api/students/:id/attendance - Student attendance history
```

---

### Phase 4: Meal Tracking
**Duration:** Week 7-8  
**Goal:** Prevent duplicate meal claims

**Database Schema:**
```sql
Table: meals
├── id (UUID primary)
├── date (DATE)
├── meal_type (breakfast/lunch/snack)
├── description
└── created_at

Table: meal_assignments
├── id (UUID primary)
├── student_id (references students)
├── meal_id (references meals)
└── unique(student_id, meal_id)

Table: meal_logs
├── id (UUID primary)
├── student_id (references students)
├── meal_id (references meals)
├── scanned_at (TIMESTAMP)
└── scanned_by (references users)
```

**Features:**
- Define daily meals
- QR scan for meal verification
- Meal eligibility checking
- Duplicate claim prevention
- Daily meal reports
- Dietary restrictions tracking (future)

**API Endpoints:**
```
POST   /api/meals                  - Create meal
GET    /api/meals/:date            - Get meals for date
POST   /api/meals/:id/scan         - Scan meal access
GET    /api/meals/reports          - Meal attendance reports
```

---

### Phase 5: Library Management
**Duration:** Week 9-10  
**Goal:** Digitize borrowing system

**Database Schema:**
```sql
Table: books
├── id (UUID primary)
├── title
├── author
├── isbn
├── category
├── quantity
├── available_count
└── created_at

Table: borrowing
├── id (UUID primary)
├── student_id (references students)
├── book_id (references books)
├── borrowed_at (TIMESTAMP)
├── due_date (DATE)
├── returned_at (TIMESTAMP)
├── status (active/overdue/returned)
└── created_at
```

**Features:**
- Book catalog management
- Borrow/return tracking
- QR code scanning for books
- Overdue monitoring
- Fine calculation
- Reservation system

**API Endpoints:**
```
GET    /api/library/books          - List books
POST   /api/library/books          - Add book
POST   /api/library/borrow         - Borrow book
POST   /api/library/return         - Return book
GET    /api/library/overdue        - Get overdue books
```

---

### Phase 6: Academic System
**Duration:** Week 11-12  
**Goal:** Manage grades and academic records

**Database Schema:**
```sql
Table: subjects
├── id (UUID primary)
├── name
├── code
└── class_id (references classes)

Table: grades
├── id (UUID primary)
├── student_id (references students)
├── subject_id (references subjects)
├── term (1/2/3)
├── score
├── grade (A/B/C/D/F)
└── period

Table: report_cards
├── id (UUID primary)
├── student_id (references students)
├── term
├── gpa
├── overall_rank
└── generated_at
```

**Features:**
- Subject management
- Grade entry & tracking
- GPA calculations
- Report card generation
- Student performance analytics
- Parent report access (future)

**API Endpoints:**
```
POST   /api/grades                 - Record grade
GET    /api/students/:id/grades    - Student grades
GET    /api/reports/:id            - Generate report card
```

---

### Phase 7: Discipline & Conduct
**Duration:** Week 13-14  
**Goal:** Track behavior and misconduct

**Database Schema:**
```sql
Table: incidents
├── id (UUID primary)
├── student_id (references students)
├── date (TIMESTAMP)
├── severity (minor/major/critical)
├── description
├── reported_by (references users)
├── action_taken
└── created_at

Table: warnings
├── id (UUID primary)
├── student_id (references students)
├── incident_id (references incidents)
├── warning_type (verbal/written/suspension)
├── issued_date (DATE)
└── parent_notified (BOOLEAN)

Table: suspensions
├── id (UUID primary)
├── student_id (references students)
├── start_date (DATE)
├── end_date (DATE)
└── reason
```

**Features:**
- Incident logging
- Warning tracking
- Suspension management
- Behavior history
- Parent notifications (future)
- Conduct reports

**API Endpoints:**
```
POST   /api/discipline/incidents   - Log incident
POST   /api/discipline/warnings    - Issue warning
GET    /api/students/:id/conduct   - Conduct history
```

---

### Phase 8: Clubs & Activities
**Duration:** Week 15-16  
**Goal:** Manage extracurricular programs

**Database Schema:**
```sql
Table: clubs
├── id (UUID primary)
├── name
├── description
├── club_head_id (references users)
└── created_at

Table: club_members
├── id (UUID primary)
├── club_id (references clubs)
├── student_id (references students)
├── position (member/leader/organizer)
└── joined_at

Table: activities
├── id (UUID primary)
├── club_id (references clubs)
├── event_name
├── event_date (TIMESTAMP)
└── description
```

**Features:**
- Club creation & management
- Member enrollment
- Activity tracking
- Leadership positions
- Event management
- Participation certificates (future)

**API Endpoints:**
```
GET    /api/clubs                  - List clubs
POST   /api/clubs                  - Create club
POST   /api/clubs/:id/enroll       - Enroll student
GET    /api/clubs/:id/members      - List members
```

---

## 📁 Project Structure

### Frontend (`client/`)
```
client/
├── public/
│   ├── manifest.json             (PWA manifest)
│   └── icons/                    (app icons)
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Students.tsx
│   │   ├── Attendance.tsx
│   │   ├── Meals.tsx
│   │   ├── Library.tsx
│   │   ├── Grades.tsx
│   │   ├── Discipline.tsx
│   │   └── Clubs.tsx
│   ├── components/
│   │   ├── QRScanner.tsx
│   ��   ├── StudentForm.tsx
│   │   ├── AttendanceTable.tsx
│   │   ├── ReportCard.tsx
│   │   └── Navigation.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── SchoolContext.tsx       (school/class data)
│   ├── services/
│   │   ├── api.ts                 (API client)
│   │   ├── auth.ts
│   │   ├── storage.ts             (localStorage/IndexedDB)
│   │   └── qrcode.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAttendance.ts
│   │   └── useOffline.ts
│   ├── layouts/
│   │   ├── AppLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── sw.ts                      (Service Worker)
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Backend (`server/`)
```
server/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── students.ts
│   │   ├── attendance.ts
│   │   ├── meals.ts
│   │   ├── library.ts
│   │   ├── grades.ts
│   │   ├── discipline.ts
│   │   └── clubs.ts
│   ├── middleware/
│   │   ├── auth.ts                (JWT verification)
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── studentController.ts
│   │   ├── attendanceController.ts
│   │   └── [more controllers]
│   ├── services/
│   │   ├── authService.ts
│   │   ├── qrService.ts
│   │   ├── studentService.ts
│   │   └── [more services]
│   ├── prisma/
│   │   └── schema.prisma
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── hash.ts
│   │   └── validators.ts
│   ├── types/
│   │   └── index.ts               (TypeScript interfaces)
│   └── index.ts                   (main server file)
├── .env.example
├── tsconfig.json
└── package.json
```

---

## 🔐 Authentication Flow

```
1. User enters email & password
                ↓
2. Frontend sends POST /api/auth/login
                ↓
3. Backend validates credentials
   - Checks user exists
   - Verifies password hash
                ↓
4. Backend generates JWT token
                ↓
5. Frontend stores token:
   - localStorage (persistent)
   - In-memory (AuthContext)
                ↓
6. Frontend redirects to dashboard
                ↓
7. All subsequent requests include Authorization header
   Authorization: Bearer <token>
                ↓
8. Backend middleware verifies token
   - Valid → allow request
   - Invalid/Expired → return 401
```

---

## 📱 PWA (Progressive Web App) Features

### Why PWA?
- Install as native app (no App Store)
- Works offline with cached data
- Faster loading on repeat visits
- Reduced bandwidth usage
- Push notifications (future)

### Implementation
```
1. Service Worker (sw.ts)
   ├── Cache assets (JS, CSS, images)
   ├── Intercept network requests
   ├── Serve cached content offline
   └── Sync data when back online

2. Web App Manifest (manifest.json)
   ├── App name & description
   ├── Icons (192px, 512px)
   ├── Theme colors
   └── Start URL

3. Vite PWA Plugin
   ├── Auto-generate service worker
   ├── Preload critical assets
   └── Version management
```

---

## 🚀 Deployment Strategy

### Frontend (Vercel)
```
1. Push code to GitHub
2. Vercel auto-deploys on main branch
3. Environment variables set in Vercel dashboard
4. CDN distributes globally
5. SSL/HTTPS automatic
```

### Backend (Railway/Render)
```
1. Connect GitHub repository
2. Set environment variables
3. Auto-deploy on push
4. Run build: npm run build
5. Start: npm start
```

### Database (Neon PostgreSQL)
```
1. Create project on Neon
2. Get connection string
3. Add to .env (DATABASE_URL)
4. Run migrations: npx prisma migrate deploy
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

```yaml
Workflow Triggers:
├── On push to main
│   ├── Run tests
│   ├── Build application
│   ├── Deploy to staging
│   └── Run E2E tests
│
├── On PR
│   ├── Run linting
│   ├── Type checking
│   ├── Unit tests
│   └── Build check
│
└── Manual deployment
    └── Deploy to production
```

---

## 📊 Database Schema Overview

```
┌─────────────────────────────────────────┐
│            Core Tables                  │
├─────────────────────────────────────────┤
│ users (authentication)                  │
│ students (identity)                     │
│ classes (organization)                  │
│ subjects (academics)                    │
└─────────────────────────────────────────┘
         ↓          ↓          ↓
┌──────────────┬──────────────┬──────────────┐
│  Attendance  │   Academics  │   Activities │
├──────────────┼──────────────┼──────────────┤
│attendance    │ grades       │ clubs        │
│qr_codes      │report_cards  │club_members  │
│              │              │ activities   │
└──────────────┴──────────────┴──────────────┘
         ↓          ↓          ↓
┌──────────────┬──────────────┬──────────────┐
│   Support    │   Services   │   Tracking   │
├──────────────┼──────────────┼──────────────┤
│ meals        │ library      │ incidents    │
│ meal_logs    │ borrowing    │ warnings     │
│ meal_assign  │ books        │ suspensions  │
└──────────────┴──────────────┴──────────────┘
```

---

## 🛠️ Development Workflow

### Local Setup
```bash
# Clone repository
git clone https://github.com/samuelale-dev/Meducore.git

# Install dependencies
npm run install:all

# Setup environment
cp server/.env.example server/.env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Setup database
npm run db:setup

# Start development servers
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### Git Workflow
```
1. Create feature branch
   git checkout -b feature/student-management

2. Make changes & commit
   git commit -m "feat: add student CRUD operations"

3. Push to GitHub
   git push origin feature/student-management

4. Create Pull Request
5. Pass CI/CD checks
6. Get code review
7. Merge to main
8. Auto-deploy to production
```

---

## 📈 Scalability Considerations

### Performance
- ✅ Pagination (limit 50 records per page)
- ✅ Database indexing on frequently queried fields
- ✅ Caching with Redis (future)
- ✅ CDN for static assets
- ✅ Gzip compression

### Multi-Tenancy (Future)
- ✅ Add `school_id` to all tables
- ✅ Implement row-level security
- ✅ Separate database per school (option 2)

### Analytics (Future)
- ✅ Log all API requests
- ✅ Track attendance trends
- ✅ Student performance analytics
- ✅ School KPIs dashboard

---

## 🔒 Security Best Practices

- ✅ JWT token expiration (1 hour)
- ✅ Refresh tokens (7 days)
- ✅ Password hashing with bcryptjs
- ✅ CORS protection
- ✅ Input validation & sanitization
- ✅ Rate limiting on auth endpoints
- ✅ HTTPS only in production
- ✅ Environment variables for secrets
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (React)

---

## 📞 Support & Maintenance

- GitHub Issues for bug reports
- Automated daily backups (Neon)
- Error logging with Sentry (future)
- Health check endpoint (`GET /api/health`)
- Uptime monitoring (future)

---

## 🎯 Next Steps

1. **Complete Phase 1:** Authentication system
2. **Deploy MVP:** Frontend on Vercel, Backend on Railway
3. **Test with real school:** Get feedback
4. **Iterate:** Based on user feedback
5. **Scale:** Add more schools
6. **Monetize:** Premium features (SMS notifications, advanced analytics)

---

**Status:** 🚀 In Development  
**Last Updated:** May 21, 2026  
**Version:** 1.0.0
