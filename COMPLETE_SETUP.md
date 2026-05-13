# 🚀 Complete Setup Guide

## From Zero to Running System in 5 Commands

```bash
npm install                                          # Install dependencies
npx prisma generate                                  # Generate Prisma Client
npx prisma migrate dev --name add_departments        # Create database tables
npx prisma db seed                                   # Add sample data
npm run dev                                          # Start server
```

Then open: `http://localhost:3000`

---

## 📊 What Each Command Does

### 1️⃣ `npm install`
- Installs all project dependencies
- Includes: Next.js, Prisma, bcrypt-ts, etc.
- ⏱️ Takes ~30-60 seconds

### 2️⃣ `npx prisma generate`
- Generates Prisma Client from schema
- Creates TypeScript types for your models
- ⏱️ Takes ~10 seconds

### 3️⃣ `npx prisma migrate dev --name add_departments`
- Creates database tables from schema
- Applies the "add_departments" migration
- Creates: users, patients, doctors, departments, appointments, etc.
- ⏱️ Takes ~5 seconds

### 4️⃣ `npx prisma db seed`
- Populates database with sample data
- Creates: 6 departments, 14 users, 5 appointments, 2 medical records
- ⏱️ Takes ~3 seconds

### 5️⃣ `npm run dev`
- Starts Next.js development server
- Server runs on: `http://localhost:3000`
- ⏱️ Takes ~15 seconds to start

---

## 🎯 After Setup - Test Your System

### Test 1: Landing Page
```
URL: http://localhost:3000
✅ Should see: Landing page with "Access Portal" and "Register as Patient" buttons
✅ Should see: Dark mode toggle in top-right corner
```

### Test 2: Patient Registration
```
1. Click "Register as Patient"
2. Fill out the form
3. Submit
✅ Should redirect to login page
✅ Should be able to login with new credentials
```

### Test 3: Admin Login
```
URL: http://localhost:3000/login
Email: admin@hospital.com
Password: password123
✅ Should login successfully
✅ Should see admin dashboard
```

### Test 4: Department Management
```
URL: http://localhost:3000/dashboard/admin/departments
✅ Should see 6 departments
✅ Each department shows doctor count
✅ Can add, edit, delete departments
```

### Test 5: Doctor Dashboard
```
Login as: doctor1@hospital.com / password123
✅ Should see doctor dashboard
✅ Should see assigned appointments
✅ Should see department assignment
```

### Test 6: Patient Dashboard
```
Login as: patient1@example.com / password123
✅ Should see patient dashboard
✅ Should see patient card number
✅ Should see appointments and medical records
```

---

## 🔑 Seeded User Credentials

All users have password: **`password123`**

| Role | Email | Details |
|------|-------|---------|
| 👑 Admin | admin@hospital.com | Full system access |
| 👥 Receptionist | receptionist1@hospital.com | Appointment management |
| 👥 Receptionist | receptionist2@hospital.com | Appointment management |
| 👨‍⚕️ Doctor | doctor1@hospital.com | Cardiologist |
| 👨‍⚕️ Doctor | doctor2@hospital.com | Pediatrician |
| 👨‍⚕️ Doctor | doctor3@hospital.com | Orthopedic Surgeon |
| 👨‍⚕️ Doctor | doctor4@hospital.com | Neurologist |
| 👨‍⚕️ Doctor | doctor5@hospital.com | Dermatologist |
| 👨‍⚕️ Doctor | doctor6@hospital.com | General Practitioner |
| 🏥 Patient | patient1@example.com | John Smith |
| 🏥 Patient | patient2@example.com | Emma Brown |
| 🏥 Patient | patient3@example.com | David Wilson |
| 🏥 Patient | patient4@example.com | Sophia Garcia |
| 🏥 Patient | patient5@example.com | Oliver Martinez |

---

## 📦 What's in Your Database

After seeding, your database contains:

```
📊 Database Contents:
├── 6 Departments
│   ├── Cardiology
│   ├── Pediatrics
│   ├── Orthopedics
│   ├── Neurology
│   ├── Dermatology
│   └── General Medicine
│
├── 14 Users
│   ├── 1 Admin
│   ├── 2 Receptionists
│   ├── 6 Doctors (assigned to departments)
│   └── 5 Patients (with card numbers)
│
├── 5 Appointments
│   ├── 3 Scheduled (upcoming)
│   └── 2 Completed (past)
│
└── 2 Medical Records
    └── For completed appointments
```

---

## 🎨 New Features Available

### ✨ Feature 1: Patient Registration
- **URL:** `/register`
- **Access:** Public (no login required)
- **Features:**
  - Self-service registration
  - Auto-generated patient card numbers
  - Password validation
  - Redirects to login after success

### ✨ Feature 2: Dark Mode
- **Location:** Landing, Login, Register pages
- **Access:** Everyone
- **Features:**
  - Toggle button in top-right corner
  - Persists preference
  - Smooth transitions

### ✨ Feature 3: Department Management
- **URL:** `/dashboard/admin/departments`
- **Access:** Admin only
- **Features:**
  - View all departments
  - Add new departments
  - Edit departments
  - Delete departments (if no doctors assigned)
  - Shows doctor count per department

---

## 🔄 Reset Everything

If you need to start fresh:

```bash
# ⚠️ WARNING: This deletes ALL data
npx prisma migrate reset
```

This will:
1. Drop the database
2. Recreate it
3. Run all migrations
4. Run the seed script automatically

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is already in use
# Kill the process or use a different port:
npm run dev -- -p 3001
```

### Database connection errors
```bash
# Check your .env file
# Should have:
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### Prisma errors
```bash
# Regenerate Prisma Client
npx prisma generate

# Reset database
npx prisma migrate reset
```

### Seed errors
```bash
# Make sure migrations ran first
npx prisma migrate dev

# Then try seeding again
npx prisma db seed
```

---

## 📁 Project Structure

```
patient-management-system/
├── app/
│   ├── api/                    # API routes
│   │   ├── register/           # ✨ NEW: Registration endpoint
│   │   └── departments/        # ✨ NEW: Department CRUD
│   ├── dashboard/              # Dashboard pages
│   │   └── admin/
│   │       └── departments/    # ✨ NEW: Department management
│   ├── register/               # ✨ NEW: Registration page
│   ├── login/                  # Login page (with dark mode)
│   └── page.tsx                # Landing page (with dark mode)
├── components/
│   └── admin/
│       └── DepartmentManagement.tsx  # ✨ NEW: Department UI
├── prisma/
│   ├── schema.prisma           # Database schema (with Department model)
│   └── seed.ts                 # ✨ NEW: Seed script
└── Documentation/
    ├── START_HERE.md           # Quick start guide
    ├── READY_TO_DEPLOY.md      # Deployment status
    ├── DEPLOYMENT_STEPS.md     # Detailed deployment
    ├── HOW_TO_SEED.md          # Seeding guide
    ├── SEEDING_GUIDE.md        # Detailed seeding docs
    ├── SEED_QUICK_REFERENCE.md # Login credentials
    └── COMPLETE_SETUP.md       # This file
```

---

## 🎯 Next Steps

After setup is complete:

1. ✅ **Explore the Admin Dashboard**
   - Login as admin
   - Check all sections
   - Test department management

2. ✅ **Test Patient Registration**
   - Register a new patient
   - Login with new credentials
   - Check patient dashboard

3. ✅ **Test Dark Mode**
   - Toggle on all pages
   - Verify persistence

4. ✅ **Review the Code**
   - Check new components
   - Review API endpoints
   - Understand the architecture

5. ✅ **Customize**
   - Add more departments
   - Create more users
   - Modify styling
   - Add features

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| `START_HERE.md` | Quick 3-step deployment |
| `READY_TO_DEPLOY.md` | Feature overview & testing |
| `DEPLOYMENT_STEPS.md` | Detailed deployment guide |
| `HOW_TO_SEED.md` | Simple seeding guide |
| `SEEDING_GUIDE.md` | Comprehensive seeding docs |
| `SEED_QUICK_REFERENCE.md` | All login credentials |
| `COMPLETE_SETUP.md` | This file - complete setup |
| `FEATURE_IMPLEMENTATION_GUIDE.md` | Technical implementation |
| `NEW_FEATURES_SUMMARY.md` | Quick feature reference |

---

## ✅ Setup Checklist

- [ ] Run `npm install`
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma migrate dev --name add_departments`
- [ ] Run `npx prisma db seed`
- [ ] Run `npm run dev`
- [ ] Test landing page
- [ ] Test patient registration
- [ ] Test dark mode
- [ ] Login as admin
- [ ] Check department management
- [ ] Login as doctor
- [ ] Login as patient

---

**🎉 You're all set! Your Patient Management System is ready to use!**

For questions or issues, check the troubleshooting section or review the detailed documentation files.
