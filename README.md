# TaskFlow - Real-Time Project Management & Collaboration Platform

TaskFlow is a production-ready, full-stack MERN (MongoDB, Express, React, Node.js) web application designed for high-performance project management and real-time team collaboration. This project demonstrates industrial web development patterns, including JWT authentication, role-based access control (RBAC), native HTML5 drag-and-drop, Socket.IO real-time channels, file upload handling with Multer/Cloudinary, and responsive glassmorphic interfaces.

---

## 🌟 Key Features

1. **JWT & RBAC Security**: Seamless user registration and login. Dynamic permissions for system roles:
   - **Admin**: System-wide statistics, user search/filtering, role editing, and account suspension.
   - **Manager**: Workspace management, project creations, members allocations, task creations, and assignments.
   - **Member**: Personal dashboard, Kanban moves, file attachments, comment threads, and chat access.
2. **Dynamic Workspace System**: Organizes work into collaborative workspace rooms with owner/admin moderation.
3. **HTML5 Native Kanban Board**: Drag-and-drop task status updates without heavy third-party packages, sync'd in real-time across users.
4. **Task Lifecycle Management**: Fully supports task updates, due dates, priorities, assignees, and task deletions.
5. **Real-Time Project Chats**: Instant project-specific chat rooms powered by Socket.IO with message log history.
6. **Real-Time Alert Notifications**: Desktop-like notifications for assignments, status changes, comments, and project updates.
7. **Multer & Cloudinary Storage**: File uploads with strict security checking to filter out executable files. Gracefully falls back to local disk storage if Cloudinary is not configured.
8. **Interactive Analytics Dashboard**: Calculated statistics and visualizations using Recharts (priorities, timelines, completion progress).

---

## 📂 Project Structure

```text
TaskFlow/
│
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI (Modals, Dropdowns)
│   │   ├── context/            # AuthContext, SocketContext
│   │   ├── layouts/            # DashboardLayout, Sidebar, Navbar
│   │   ├── pages/              # Landing, Login, Dashboard, Project, Admin
│   │   ├── services/           # Centralized Axios API client (api.js)
│   │   ├── routes/             # ProtectedRoute wrapper
│   │   ├── App.jsx             # React router configuration
│   │   ├── index.css           # Tailwind CSS directives & theme variables
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── package.json
│
├── server/                     # Node.js + Express Backend
│   ├── config/                 # Database connection settings (db.js)
│   ├── controllers/            # Controller handling HTTP endpoints
│   ├── middleware/             # Auth checks, upload filters, error handler
│   ├── models/                 # Mongoose database schemas
│   ├── routes/                 # Express API routing definitions
│   ├── services/               # Cloudinary storage integration service
│   ├── sockets/                # Socket.IO connection & event handlers
│   ├── uploads/                # Local files directory (ignored by git)
│   ├── server.js               # Main Express + Socket HTTP server
│   ├── .env.example
│   └── package.json
│
├── .gitignore                  # Root gitignore rules
└── README.md                   # Project documentation
```

---

## ⚙️ Environment Variables

### Backend Configuration (`server/.env`)
Create a file named `.env` in the `server` directory and define the following variables:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskflow
JWT_SECRET=your_jwt_signing_key_here
CLIENT_URL=http://localhost:5173

# Cloudinary Setup (Optional - Falls back to local disk storage if left empty)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend Configuration (`client/.env`)
Create a file named `.env` in the `client` directory and define:
```env
VITE_API_URL=http://localhost:5000
```

---

## 🚀 Installation & Running

Follow these steps to run the application locally:

### 1. Setup Backend
```bash
# Navigate to server
cd server

# Install dependencies
npm install

# Start the backend development server (via nodemon)
npm run dev
```
The backend server runs at `http://localhost:5000`.

### 2. Setup Frontend
```bash
# Open a new terminal and navigate to client
cd client

# Install dependencies
npm install

# Start the Vite React development server
npm run dev
```
The client application runs at `http://localhost:5173`.

---

## 🛠️ API & Database Reference

### Database Models (MongoDB via Mongoose)
- **User**: Name, unique email, hashed password, role (`admin`/`manager`/`member`), status.
- **Workspace**: Name, description, owner, list of members (with workspace roles).
- **Project**: Name, description, parent workspace, owner, member list, status, priority, timelines.
- **Task**: Title, description, project, assignee, creator, status, priority, due date, attachments array.
- **Comment**: Parent task, author, content string.
- **Message**: Project room, sender, message text content.
- **Notification**: Recipient, sender, alert type, message description, task/project linkages, read flag.

### Core REST Endpoints
| HTTP Method | Route | Description | Auth Required |
|---|---|---|---|
| **POST** | `/api/auth/register` | User registration | Public |
| **POST** | `/api/auth/login` | User login & JWT issuance | Public |
| **GET** | `/api/auth/me` | Fetch active session details | Private |
| **GET** | `/api/users` | Search & filter users | Private |
| **PUT** | `/api/users/profile` | Update profile (name, avatar URL) | Private |
| **PUT** | `/api/users/profile/password` | Change user password | Private |
| **PUT** | `/api/users/:id/role` | Update user system role | Admin |
| **PUT** | `/api/users/:id/status` | Suspend/Activate user account | Admin |
| **GET** | `/api/workspaces` | Get workspaces user is in | Private |
| **POST** | `/api/workspaces` | Create workspace | Private |
| **POST** | `/api/workspaces/:id/members` | Invite member to workspace | Workspace Admin |
| **GET** | `/api/projects/workspace/:id`| Fetch projects in workspace | Workspace Member |
| **POST** | `/api/projects` | Create project | Workspace Manager |
| **GET** | `/api/tasks/project/:id` | Fetch tasks in project (with filters) | Project Member |
| **POST** | `/api/tasks/:id/attachments`| Upload file attachment to task | Project Member |
| **GET** | `/api/messages/project/:id` | Get project chat logs | Project Member |
| **GET** | `/api/dashboard` | Fetch dashboard analytics statistics | Private |

---

## 💬 Interview Pitch: How to explain this project

When showcasing **TaskFlow** during placements or technical interviews, use these talking points to demonstrate deep practical competence:

### 1. Architectural Highlights (Express & Node.js)
> *"TaskFlow uses a decoupled REST architecture. Rather than packing route files with business logic, I implemented the Controller-Route-Service pattern. Controllers parse parameters and formulate JSON responses, while middlewares handle cross-cutting concerns like JWT authorization (using Bearer headers), error handling, and file filtering. Databases are integrated with Mongoose validation rules and pre-save hooks to hash passwords using bcrypt."*

### 2. State & Live Connection Sync (React & Socket.IO)
> *"For state management, I utilized React's Context API. It acts as a clean state layer for session validations and socket handshakes. When a user logs in, the SocketContext sets up a persistent WebSocket connection, registers the user to a unique notification room, and joins active project chat rooms. When a task is updated or a message is sent, Socket.IO broadcasts events so other active team members see the changes instantly without reloading."*

### 3. Native Browser API (HTML5 Drag & Drop)
> *"Instead of using bulky third-party drag-and-drop packages, I implemented the Kanban board using the native HTML5 Drag and Drop API. This keeps the frontend package footprint minimal. I bound task IDs to the native `e.dataTransfer` object on drag-start, captured drops on status columns, immediately updated local state for optimistic responsiveness, and synced the new status with the backend through a PATCH request while broadcasting the event over WebSockets."*

### 4. Security & Robust Storage
> *"Security was a key focus. Password hashes are excluded from user queries by default using Mongoose selectors. Route protection checks roles (Admin, Manager, Member) before allowing actions. I configured Helmet to secure HTTP headers and applied rate limits on API requests to defend against brute force attempts. For uploads, Multer filters filenames to prevent dangerous executable files, uploading them to Cloudinary in production, or saving to a local disk storage system if cloud credentials are absent."*
