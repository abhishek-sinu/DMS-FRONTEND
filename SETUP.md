# DMS Frontend & Backend Setup Guide

This document explains how to set up the DMS application on a new Windows system. It covers:
- Installing Node.js
- Installing MySQL
- Folder structure
- Installing dependencies for frontend and backend
- Creating required configuration files
- Running the app with a batch file

---

## 1. Install required software

### 1.1 Install Node.js

1. Download Node.js LTS from https://nodejs.org/en/
2. Install it using the default options.
3. Verify installation in PowerShell or Command Prompt:
   ```powershell
   node -v
   npm -v
   ```

### 1.2 Install MySQL Server

1. Download MySQL Community Server from https://dev.mysql.com/downloads/mysql/
2. Install with a standard configuration.
3. During install, set a root password and remember it.
4. Optionally install MySQL Workbench for database management.

---

## 2. Repository folder structure

Your repository should contain these main folders:

- `DMS-BACKEND/`
  - `package.json`
  - `server.js`
  - `routes/`
  - `middleware/`
  - `database_sql/`
  - other backend files
- `DMS-FRONTEND-GIT/`
  - `package.json`
  - `src/`
  - `public/`
  - `README.md`
- `DMS-OFFLINE/` (offline Electron version)

Example root structure:

```text
DMS/
  DMS-BACKEND/
  DMS-FRONTEND-GIT/
  DMS-OFFLINE/
```

---

## 3. Backend setup

### 3.1 Install backend dependencies

Open a terminal and run:

```powershell
cd "C:\React Project\DMS\DMS-BACKEND"
npm install
```

### 3.2 Create backend configuration

Create a `.env` file inside `DMS-BACKEND` with your database connection settings.

Example `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=YourMysqlRootPassword
DB_NAME=iskcon_dms
DB_CONN_LIMIT=10
JWT_SECRET=your_jwt_secret
```

### 3.3 Create database and tables

1. Open MySQL Workbench or the MySQL command line.
2. Run the SQL scripts from `DMS-BACKEND/database_sql/schema/`.
   - Start with `iskcon_dms_users.sql`
   - Then run the other schema files in the folder.
3. Confirm the tables exist in the `iskcon_dms` database.

### 3.4 Start backend server

```powershell
cd "C:\React Project\DMS\DMS-BACKEND"
npm start
```

The backend server should start and listen on the port configured in `server.js`.

---

## 4. Frontend setup

### 4.1 Install frontend dependencies

Open a new terminal and run:

```powershell
cd "C:\React Project\DMS\DMS-FRONTEND-GIT"
npm install
```

### 4.2 Start frontend app

```powershell
cd "C:\React Project\DMS\DMS-FRONTEND-GIT"
npm start
```

The frontend should open in your browser at `http://localhost:3000`.

---

## 5. Running both apps together with a batch file

Create a batch file named `start-app.bat` with this content:

```bat
@echo off

echo Starting Backend...
start cmd /k "cd /d C:\React Project\DMS\DMS-BACKEND && npm start"

timeout /t 5

echo Starting Frontend...
start cmd /k "cd /d C:\React Project\DMS\DMS-FRONTEND-GIT && npm start"

echo Application started!
pause
```

Save `start-app.bat` anywhere convenient and double-click it to launch both servers.

---

## 6. Notes

- If the frontend cannot connect to the backend, verify the backend port and API URL.
- If you have a firewall or antivirus blocking connections, allow Node.js and MySQL.
- If you need to use the offline desktop version, use the `DMS-OFFLINE` folder instead.

---

## 7. Troubleshooting

### 7.1 `npm install` failures

- Ensure Node.js is installed.
- Delete `node_modules` and `package-lock.json` then rerun `npm install`.

### 7.2 Backend fails to start

- Check `.env` values.
- Confirm MySQL service is running.
- Verify the database name and credentials.

### 7.3 Frontend shows a blank page

- Make sure the backend is running.
- Open browser dev tools console for errors.
- Confirm the frontend build is using the correct API base URL.
