# Team Task Manager

Production-ready MERN stack task management app for teams. JWT authentication, role-based access (Admin / Member), projects, tasks, status tracking, and analytics dashboard.

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, react-hot-toast |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, **bcrypt** |
| Database | Single MongoDB database — Users, Projects, Tasks, StatusUpdates |

## Features completed

### 1. Task management
- Create, edit, delete tasks (admin)
- Assign to project members, set due dates and priority
- Status workflow: `todo` → `in_progress` → `completed`
- Fields: title, description, priority, status, dueDate, assignedTo, project, createdBy, timestamps

### 2. Project organization
- Create, edit, delete projects (admin)
- Add/remove members, group tasks under projects
- Progress percentage per project
- Project detail view with tasks, members, activity feed

### 3. Role-based access control
- **Admin**: full CRUD on projects/tasks, team management, dashboard analytics
- **Member**: view assigned projects/tasks, update status on own tasks only
- JWT auth middleware + role middleware on protected routes

### 4. Progress dashboard
- Total, completed, pending, overdue tasks
- Completion rate %
- Project progress bars
- Recent projects and assigned tasks

### 5. Team collaboration
- Assigned task visibility
- Status update audit trail (who changed what, when)
- Activity feed on project pages

### 6. Authentication
- Signup, login, logout
- bcrypt password hashing, JWT tokens
- Persistent session via localStorage + AuthContext
- Protected frontend routes

### 7. Security & validation
- Frontend + backend validation (email, password, required fields)
- express-validator on API routes
- Duplicate email prevention
- Environment variables via `.env`

## Project structure

```
ttm/
├── backend/
│   ├── config/db.js
│   ├── controllers/     # auth, project, task, user, dashboard
│   ├── middleware/        # auth, role, error
│   ├── models/            # User, Project, Task, StatusUpdate
│   ├── routes/
│   └── server.js
└── frontend/
    └── src/
        ├── components/    # Layout, Sidebar, Navbar, Modal, Loader, EmptyState
        ├── context/       # AuthContext
        ├── hooks/         # useAuth
        ├── pages/         # Dashboard, Projects, Tasks, Team, Auth
        ├── routes/        # ProtectedRoute
        └── services/      # api.js (Axios)
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

`backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/team_task_manager
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

`frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

Open **http://localhost:5173**

### First user
The **first signup becomes Admin**. All later signups are Members. Promote roles from the Team page (admin only).

## REST API

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/signup` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Auth |

### Projects
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/projects` | Auth |
| GET | `/api/projects/:id` | Auth (member: own projects) |
| POST | `/api/projects` | Admin |
| PUT | `/api/projects/:id` | Admin |
| DELETE | `/api/projects/:id` | Admin |
| POST | `/api/projects/:id/members` | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Admin |

### Tasks
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/tasks` | Auth |
| POST | `/api/tasks` | Admin |
| PUT | `/api/tasks/:id` | Admin (full) / Member (status only, assigned) |
| DELETE | `/api/tasks/:id` | Admin |

### Other
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/dashboard` | Auth |
| GET | `/api/users` | Admin |
| PUT | `/api/users/:id/role` | Admin |
| GET | `/api/health` | Public |

## License

MIT
