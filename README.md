# SchoolTrack - Educational Management System

SchoolTrack is a comprehensive educational management system designed to facilitate communication and information sharing between administrators, teachers, and parents.

## Features

### For Administrators
- Manage teacher accounts (add, remove, update)
- Manage parent accounts (add, remove, update)
- Manage student records (add, remove, update)
- View and manage donation system
- Search functionality for parents, teachers and students

### For Teachers
- Assign and manage marksheets
- Track student attendance
- Set working days for the academic calendar
- Create and distribute dynamic forms
- Send notes to students/parents
- Communicate with parents
- Upload data through Excel sheets (attendance, marks, etc.)

### For Parents
- View children's academic records
- Track attendance
- Complete forms from teachers
- Communicate with teachers
- Manage donations (create, apply)
- View and acknowledge notes

## Technology Stack
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcrypt for password hashing
- **File Processing**: Multer, xlsx for Excel file handling
- **Email**: Nodemailer for email services

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local instance or MongoDB Atlas account)
- Git

### Installation

1. Clone the repository
   ```
   git clone https://github.com/Sanjay-Aski/Field-Project-SE.git
   cd Field-Project-SE
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_email_for_notifications
   EMAIL_PASS=your_email_password_or_app_password
   ADMIN_KEY=your_admin_registration_key
   ```

4. Start the server
   ```
   npm run dev   # for development with nodemon
   npm start     # for production
   ```

## API Endpoints

The system provides various API endpoints for different user roles:

### Authentication
- `/admin/login` - Admin login
- `/teacher/login` - Teacher login
- `/parent/login` - Parent login
- `/user/change-password` - Change password (any user)
- `/user/send-otp` - Request password reset OTP
- `/user/reset-password` - Reset password with OTP

### Admin Routes
- `/admin/register` - Register new admin (requires admin key)
- `/admin/teacher` - Manage teachers
- `/admin/parent` - Manage parents
- `/admin/student` - Manage students
- `/admin/donations` - View and manage donations

### Teacher Routes
- `/teacher/assign-marksheet` - Assign marks to students
- `/teacher/set-working-days` - Set working days for classes
- `/teacher/assign-attendance` - Record student attendance
- `/teacher/give-form` - Create and assign forms
- `/teacher/give-note` - Send notes to students/parents

### Parent Routes
- `/parent/children` - View children information
- `/parent/forms` - View and fill teacher forms
- `/parent/marksheet` - View children's marks
- `/parent/attendance` - View attendance records
- `/parent/donations` - Manage donations

## Data Models

The system uses several data models including:
- Admin
- Teacher
- Parent
- Student
- MarkSheet
- Attendance
- DynamicForm
- Note
- Donation
- Chat


# API Routes Documentation

## Admin Routes

| Method | Endpoint | Middleware | Purpose |
|--------|----------|------------|---------|
| POST | /admin/register | None | Register new admin with admin key |
| POST | /admin/login | None | Admin login |
| POST | /admin/teacher | authMiddleware | Add new teacher |
| DELETE | /admin/teacher/:id | authMiddleware | Remove teacher |
| POST | /admin/parent | authMiddleware | Add new parent |
| DELETE | /admin/parent/:id | authMiddleware | Remove parent |
| POST | /admin/student | authMiddleware | Add new student |
| DELETE | /admin/student/:id | authMiddleware | Remove student |
| GET | /admin/donations | authMiddleware | Get all donations |
| GET | /admin/donations/pending | authMiddleware | Get pending donations |
| POST | /admin/donations/assign | authMiddleware | Assign donation to user |

## Teacher Routes

| Method | Endpoint | Middleware | Purpose |
|--------|----------|------------|---------|
| POST | /teacher/login | None | Teacher login |
| POST | /teacher/assign-marksheet | teacherAuth, classTeacherAuth | Assign marksheet |
| POST | /teacher/assign-attendance | teacherAuth, classTeacherAuth | Mark attendance |
| GET | /teacher/marksheet/:studentId | teacherAuth, classTeacherAuth | Get student marksheet |
| POST | /teacher/give-note | teacherAuth, subjectTeacherAuth | Send note |
| POST | /teacher/acknowledge-note/:noteId | teacherAuth | Acknowledge note |
| POST | /teacher/give-form | teacherAuth, classTeacherAuth | Create and assign form |
| GET | /teacher/form-responses/:formId | teacherAuth, classTeacherAuth | Get form responses |
| GET | /teacher/attendance/:studentId | teacherAuth, classTeacherAuth | Get attendance report |
| GET | /teacher/class-students | teacherAuth, classTeacherAuth | Get class students list |
| POST | /teacher/chat/send | teacherAuth, subjectTeacherAuth | Send message to parent |
| POST | /teacher/chat/history | teacherAuth, subjectTeacherAuth | Get chat history |
| GET | /teacher/notes | teacherAuth | Get received notes |
| GET | /teacher/forms/sent | teacherAuth | Get sent forms |
| GET | /teacher/forms/analytics/:formId | teacherAuth, classTeacherAuth | Get form analytics |

## Parent Routes

| # | Method | Endpoint | Middleware | Description | Request Body/Params |
|---|--------|----------|------------|-------------|---------------------|
| 1 | POST | /parent/login | None | Login parent | { email, password } |
| 2 | GET | /parent/children | parentAuth | Get children list | None |
| 3 | GET | /parent/forms/:studentId | parentAuth | Get forms for student | studentId (param) |
| 4 | GET | /parent/marksheet/:studentId | parentAuth | Get student marksheet | studentId (param) |
| 5 | GET | /parent/attendance/:studentId | parentAuth | Get attendance report | studentId (param) |
| 6 | POST | /parent/send-note | parentAuth | Send note to teacher | { teacherId, title, content } |
| 7 | POST | /parent/acknowledge-note/:noteId | parentAuth | Acknowledge received note | noteId (param) |
| 8 | GET | /parent/teacher-details/:studentId | parentAuth | Get teachers info | studentId (param) |
| 9 | POST | /parent/fill-form | parentAuth | Submit form response | { formId, answers } |
| 10 | POST | /parent/chat/send | parentAuth | Message teacher | { teacherId, message } |
| 11 | GET | /parent/chat/history | parentAuth | Get chat history | { teacherId } |
| 12 | GET | /parent/forms/not-filled | parentAuth | Get pending forms | None |
| 13 | GET | /parent/notes | parentAuth | Get received notes | None |
| 14 | POST | /parent/donations/create | parentAuth | Create donation | { item, quantity, description } |
| 15 | GET | /parent/donations/pending | parentAuth | View available donations | None |
| 16 | POST | /parent/donations/apply/:donationId | parentAuth | Apply for donation | donationId (param) |

## Summary

**Total Routes: 44**

- Admin Routes: 11
- Teacher Routes: 15
- Parent Routes: 16
- User Routes: 2

