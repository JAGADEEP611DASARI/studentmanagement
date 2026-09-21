# Student Management System — Full Stack

A React + Express + MongoDB portal for managing students, courses, attendance and grades with JWT role-based access control.

## Features
- Student CRUD
- Course management
- Attendance management
- Grade reports
- Admin dashboard statistics
- JWT authentication
- Roles: admin, teacher, student
- MongoDB relational-style references using Mongoose

## Requirements
- Node.js 18+
- MongoDB running locally on port 27017

## Backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```
Backend: http://localhost:5000

## Create first admin
Use Postman/Thunder Client:
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{"name":"Admin","email":"admin@example.com","password":"admin123","role":"admin"}
```
Then login in the frontend.

## Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

## API overview
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET/POST/PUT/DELETE `/api/students`
- GET/POST/PUT/DELETE `/api/courses`
- GET/POST/PUT/DELETE `/api/attendance`
- GET/POST/PUT/DELETE `/api/grades`
- GET `/api/dashboard`

## Role permissions
- Admin: full access and delete operations
- Teacher: add/update students, courses, attendance and grades
- Student: read-only portal access
