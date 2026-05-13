# 🌱 How to Seed Your Database

## TL;DR - Just Run This:
```bash
npx prisma db seed
```

---

## 📋 Prerequisites

Before seeding, make sure you've completed these steps:

### ✅ Step 1: Install Dependencies
```bash
npm install
```

### ✅ Step 2: Generate Prisma Client
```bash
npx prisma generate
```

### ✅ Step 3: Run Migrations
```bash
npx prisma migrate dev --name add_departments
```

---

## 🚀 Seed the Database

Now run the seed command:
```bash
npx prisma db seed
```

You should see output like this:
```
🌱 Starting database seeding...
🗑️  Cleaning existing data...
✅ Existing data cleaned
🏥 Creating departments...
✅ Created 6 departments
👤 Creating admin user...
✅ Admin created: admin@hospital.com / password123
...
✨ Seeding completed successfully!
```

---

## 🎉 What You Get

After seeding, you'll have:

### 🏥 6 Departments
- Cardiology
- Pediatrics  
- Orthopedics
- Neurology
- Dermatology
- General Medicine

### 👥 14 Users
- 1 Admin
- 2 Receptionists
- 6 Doctors (one per department)
- 5 Patients

### 📅 5 Appointments
- 3 upcoming appointments
- 2 completed appointments

### 📋 2 Medical Records
- For the completed appointments

---

## 🔑 Login Credentials

**All users have the same password:** `password123`

### Quick Test Logins:

**Admin:**
```
Email: admin@hospital.com
Password: password123
```

**Doctor:**
```
Email: doctor1@hospital.com
Password: password123
```

**Patient:**
```
Email: patient1@example.com
Password: password123
```

**See full list:** Check `SEED_QUICK_REFERENCE.md`

---

## ✅ Verify It Worked

### Test 1: Login as Admin
1. Start your server: `npm run dev`
2. Go to: `http://localhost:3000/login`
3. Login with: `admin@hospital.com` / `password123`
4. You should see the admin dashboard

### Test 2: Check Departments
1. Navigate to: `/dashboard/admin/departments`
2. You should see 6 departments
3. Each department should show doctor count

### Test 3: Check Appointments
1. Navigate to: `/dashboard/admin/appointments`
2. You should see 5 appointments
3. Some scheduled, some completed

---

## 🔄 Need to Re-seed?

### Option 1: Re-run Seed (if cleanup is enabled)
```bash
npx prisma db seed
```
This will delete existing data and create fresh seed data.

### Option 2: Complete Reset
```bash
npx prisma migrate reset
```
⚠️ **WARNING:** This deletes ALL data and re-runs all migrations + seed.

---

## 🐛 Common Issues

### Issue: "Cannot find module 'tsx'"
**Solution:**
```bash
npm install
```

### Issue: "Unique constraint failed"
**Solution:** Database already has conflicting data. Reset it:
```bash
npx prisma migrate reset
```

### Issue: "bcrypt-ts not found"
**Solution:**
```bash
npm install bcrypt-ts
```

### Issue: "Database connection failed"
**Solution:** Check your `.env` file has correct `DATABASE_URL`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

---

## 📁 Files Created

The seeding system consists of:

1. **`prisma/seed.ts`** - The seed script (creates all data)
2. **`SEEDING_GUIDE.md`** - Comprehensive seeding documentation
3. **`SEED_QUICK_REFERENCE.md`** - Quick reference for credentials
4. **`HOW_TO_SEED.md`** - This file (simple how-to guide)

---

## 🎯 Complete Workflow

Here's the complete workflow from scratch:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Run migrations (creates tables)
npx prisma migrate dev --name add_departments

# 4. Seed database (adds sample data)
npx prisma db seed

# 5. Start development server
npm run dev

# 6. Test login
# Go to: http://localhost:3000/login
# Email: admin@hospital.com
# Password: password123
```

---

## 📚 More Information

- **Quick Reference:** `SEED_QUICK_REFERENCE.md` - All login credentials
- **Detailed Guide:** `SEEDING_GUIDE.md` - Complete documentation
- **Deployment:** `DEPLOYMENT_STEPS.md` - Full deployment guide
- **Features:** `READY_TO_DEPLOY.md` - New features overview

---

## ⚠️ Important Notes

- Seed data is for **development/testing only**
- All users have the same password (`password123`)
- The seed script **deletes existing data** by default
- Always **backup** before seeding if you have important data

---

**That's it! You're ready to seed your database! 🎉**

Need help? Check the detailed guides or the troubleshooting section above.
