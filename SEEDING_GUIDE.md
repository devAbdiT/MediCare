# 🌱 Database Seeding Guide

## What is Database Seeding?

Database seeding populates your database with sample data for development and testing. This is useful for:
- Testing features without manually creating data
- Demonstrating the system to stakeholders
- Development and debugging
- Training and onboarding

---

## 📦 What Gets Seeded

The seed script creates:

### 🏥 **6 Departments**
- Cardiology (Heart and cardiovascular system care)
- Pediatrics (Medical care for children)
- Orthopedics (Musculoskeletal system treatment)
- Neurology (Nervous system disorders)
- Dermatology (Skin, hair, and nail conditions)
- General Medicine (General health and wellness)

### 👤 **1 Admin User**
- Email: `admin@hospital.com`
- Password: `password123`
- Full access to admin dashboard

### 👥 **2 Receptionists**
- Email: `receptionist1@hospital.com` / `receptionist2@hospital.com`
- Password: `password123`
- Can manage appointments

### 👨‍⚕️ **6 Doctors** (one per department)
1. Dr. Michael Chen - Cardiologist (Cardiology)
2. Dr. Sarah Williams - Pediatrician (Pediatrics)
3. Dr. James Anderson - Orthopedic Surgeon (Orthopedics)
4. Dr. Lisa Martinez - Neurologist (Neurology)
5. Dr. Robert Taylor - Dermatologist (Dermatology)
6. Dr. Amanda White - General Practitioner (General Medicine)

### 🏥 **5 Patients**
1. John Smith (O+, DOB: 1990-05-15)
2. Emma Brown (A+, DOB: 1985-08-22)
3. David Wilson (B+, DOB: 1995-03-10)
4. Sophia Garcia (AB+, DOB: 2000-11-30)
5. Oliver Martinez (O-, DOB: 1988-07-18)

### 📅 **5 Appointments**
- 3 scheduled (upcoming)
- 2 completed (past)

### 📋 **2 Medical Records**
- For completed appointments
- Includes diagnosis, prescription, and notes

---

## 🚀 How to Seed Your Database

### Step 1: Ensure Database is Ready
Make sure you've run migrations first:
```bash
npx prisma generate
npx prisma migrate dev --name add_departments
```

### Step 2: Run the Seed Script
```bash
npx prisma db seed
```

That's it! The script will:
1. Clean existing data (optional - see below)
2. Create all departments
3. Create all users (admin, receptionists, doctors, patients)
4. Create appointments
5. Create medical records
6. Display a summary

---

## 📊 Expected Output

```
🌱 Starting database seeding...

🗑️  Cleaning existing data...
✅ Existing data cleaned

🏥 Creating departments...
✅ Created 6 departments

👤 Creating admin user...
✅ Admin created: admin@hospital.com / password123

👤 Creating receptionist users...
✅ Created 2 receptionists

👨‍⚕️ Creating doctor users...
✅ Created 6 doctors

🏥 Creating patient users...
✅ Created 5 patients

📅 Creating appointments...
✅ Created 5 appointments

📋 Creating medical records...
✅ Created 2 medical records

✨ Seeding completed successfully!

📊 Summary:
   - Departments: 6
   - Admins: 1
   - Receptionists: 2
   - Doctors: 6
   - Patients: 5
   - Appointments: 5
   - Medical Records: 2

🔑 Login Credentials (all users):
   Password: password123

   Admin: admin@hospital.com
   Receptionist 1: receptionist1@hospital.com
   Receptionist 2: receptionist2@hospital.com
   Doctor 1: doctor1@hospital.com (Cardiologist)
   Doctor 2: doctor2@hospital.com (Pediatrician)
   Doctor 3: doctor3@hospital.com (Orthopedic Surgeon)
   Doctor 4: doctor4@hospital.com (Neurologist)
   Doctor 5: doctor5@hospital.com (Dermatologist)
   Doctor 6: doctor6@hospital.com (General Practitioner)
   Patient 1: patient1@example.com
   Patient 2: patient2@example.com
   Patient 3: patient3@example.com
   Patient 4: patient4@example.com
   Patient 5: patient5@example.com
```

---

## 🔑 Test Credentials

All users have the same password: **`password123`**

### Admin Access
```
Email: admin@hospital.com
Password: password123
```

### Receptionist Access
```
Email: receptionist1@hospital.com
Password: password123
```

### Doctor Access
```
Email: doctor1@hospital.com
Password: password123
```

### Patient Access
```
Email: patient1@example.com
Password: password123
```

---

## ⚙️ Customizing the Seed Script

### Keep Existing Data
If you want to add seed data WITHOUT deleting existing data, comment out the cleanup section in `prisma/seed.ts`:

```typescript
// Comment out these lines to keep existing data:
/*
await prisma.medicalRecord.deleteMany();
await prisma.appointment.deleteMany();
// ... etc
*/
```

### Add More Data
Edit `prisma/seed.ts` to add more:
- Departments
- Users (any role)
- Appointments
- Medical records

### Change Passwords
Modify the password in the seed script:
```typescript
const hashedPassword = await hash('YOUR_PASSWORD_HERE', 10);
```

---

## 🔄 Re-seeding

To completely reset and re-seed your database:

```bash
# Option 1: Reset everything (⚠️ DELETES ALL DATA)
npx prisma migrate reset

# Option 2: Just run seed again (if cleanup is enabled in seed.ts)
npx prisma db seed
```

---

## 🧪 Testing After Seeding

### 1. Test Admin Dashboard
```bash
# Login as admin
Email: admin@hospital.com
Password: password123

# Navigate to:
- /dashboard/admin (overview)
- /dashboard/admin/departments (view departments)
- /dashboard/admin/doctors (view doctors)
- /dashboard/admin/patients (view patients)
- /dashboard/admin/appointments (view appointments)
```

### 2. Test Doctor Dashboard
```bash
# Login as doctor
Email: doctor1@hospital.com
Password: password123

# Check:
- View assigned appointments
- View patient medical records
- Department assignment
```

### 3. Test Patient Dashboard
```bash
# Login as patient
Email: patient1@example.com
Password: password123

# Check:
- View appointments
- View medical records
- Patient card number
```

### 4. Test Receptionist Dashboard
```bash
# Login as receptionist
Email: receptionist1@hospital.com
Password: password123

# Check:
- Create appointments
- View all appointments
- Search patients
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'tsx'"
**Solution:** Install tsx globally or use npx:
```bash
npm install -g tsx
# OR
npx tsx prisma/seed.ts
```

### Error: "Unique constraint failed"
**Solution:** The database already has data. Either:
1. Enable cleanup in seed.ts (uncomment deleteMany lines)
2. Reset database: `npx prisma migrate reset`

### Error: "bcrypt-ts not found"
**Solution:** Install dependencies:
```bash
npm install
```

### Error: "Database connection failed"
**Solution:** Check your `.env` file has correct `DATABASE_URL`

---

## 📝 Seed Script Location

The seed script is located at:
```
prisma/seed.ts
```

Configuration in `package.json`:
```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

---

## 🎯 Quick Start Workflow

Complete workflow from scratch:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Run migrations
npx prisma migrate dev --name add_departments

# 4. Seed database
npx prisma db seed

# 5. Start development server
npm run dev

# 6. Login as admin
# Go to: http://localhost:3000/login
# Email: admin@hospital.com
# Password: password123
```

---

## 📚 Additional Resources

- **Prisma Seeding Docs:** https://www.prisma.io/docs/guides/database/seed-database
- **Project Documentation:** See `READY_TO_DEPLOY.md`
- **Deployment Guide:** See `DEPLOYMENT_STEPS.md`

---

## ⚠️ Important Notes

- **Development Only:** Seed data is for development/testing, not production
- **Password Security:** All users have the same password (`password123`) - change this in production
- **Data Cleanup:** The seed script deletes existing data by default
- **Backup First:** Always backup your database before seeding if you have important data

---

**Happy Seeding! 🌱**
