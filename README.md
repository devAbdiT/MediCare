# 🏥 Jimma Medical Center — Patient Appointment Scheduling & Medical Record Management (MediCare)

A modern, highly secure, and responsive Web-Based Patient Appointment Scheduling and Basic Medical Record Management System for Jimma Medical Center. Built with **Next.js 16**, **Prisma ORM**, **PostgreSQL**, and **Better Auth**, it provides tailored portals for Patients, Doctors, Receptionists, and Administrators.

---

## 📖 Table of Contents

1. [Key Features](#-key-features)
2. [Tech Stack](#-tech-stack)
3. [Portals & Roles](#-portals--roles)
4. [Database & Models](#-database--models)
5. [Project Structure](#-project-structure)
6. [Getting Started](#-getting-started)
7. [Environment Variables](#-environment-variables)
8. [Database Seeding & Demo Accounts](#-database-seeding--demo-accounts)
9. [Key Custom Systems](#-key-custom-systems)

---

## 🌟 Key Features

*   **Unified Role-Based Portals:** Dedicated dashboards for Administrators, Doctors, Receptionists, and Patients.
*   **Modern Authentication:** Fully integrated login, session, and role checking powered by **Better Auth** with a credentials provider.
*   **Smart Patient Search:** Multi-criteria search allowing Receptionists and Doctors to lookup patients instantly by **Name**, **Email**, **Phone**, or **Unique Card Number** (`BK-P-YYYY-XXXX`).
*   **Comprehensive Appointment Management:** 
    *   Real-time appointment scheduling with conflict detection.
    *   Support for specialized **Appointment Types** (New Visit, Follow-up, Consultation, Emergency) and **Priorities** (Normal, Urgent, Emergency).
    *   **Check-in & Queue System** for receptionists to manage patient flow.
    *   Advanced tracking with `SCHEDULED`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`, and `NO_SHOW` statuses.
    *   Complete **Appointment History** logging for tracking reschedules and status changes.
*   **Chapa Payment Integration:** Secure, integrated appointment booking payments using Chapa. Patients must complete a booking fee before the system confirms the slot and allows check-in.
*   **Printable Receipts & Slips:** Automated generation of printable appointment slips and payment receipts.
*   **Doctor Availability Management:** Doctors can configure their exact working days and hours, ensuring patients and receptionists can only book within valid operational windows.
*   **Electronic Health Records (EHR):** Clinical record management where doctors can log diagnoses, input prescriptions, and write internal notes. Patients can securely access their own medical history.
*   **Robust Input Validation:** Standardized schemas (via `zod` & `react-hook-form`) across all registration forms, including localized phone formatting.
*   **Premium Dark/Light UI:** A unified **Midnight Navy & Ice Blue** design system supporting fluid dark mode transitions via `next-themes`.

---

## 🛠️ Tech Stack

*   **Frontend Core:** React 19.2.4 (Next.js 16.2.5 App Router & Turbopack)
*   **Styling:** Tailwind CSS v4, `@tailwindcss/postcss`, `class-variance-authority`, `lucide-react` icons
*   **Authentication:** Better Auth 1.6.9 (with Prisma Adapter)
*   **Database & ORM:** PostgreSQL database accessed via Prisma Client 6.19.3
*   **Form & Validation:** React Hook Form 7.75.0, Zod 4.4.3, `@hookform/resolvers`
*   **Visualizations:** Recharts 3.8.1 (for admin analytics & dashboard metrics)

---

## 👥 Portals & Roles

### 👑 1. Administrator Portal
*   Create and manage clinical departments (e.g., Cardiology, Pediatrics, Orthopedics).
*   Add and onboard new Doctors and Receptionists to the system.
*   Monitor system-wide metrics: total patient counts, appointment queues, doctor workloads, and active staff.

### 👨‍⚕️ 2. Doctor Portal
*   View daily scheduled appointments and update appointment statuses.
*   Access complete medical records and patient consultation history.
*   Log new medical records (diagnosis, prescription, clinical notes).
*   Search for any patient in the hospital registry using name, email, phone, or card number.

### 👩‍💻 3. Receptionist Portal
*   Register new patients with formatted details.
*   Book and schedule appointments for patients with any available doctor.
*   Verify doctor availability in real-time before scheduling.
*   Search patient registries to check existing appointments or clinical cards.

### 🤒 4. Patient Portal
*   Self-register an account securely.
*   Book medical appointments by selecting preferred departments, doctors, dates, and times.
*   Review upcoming and historical appointments.
*   Access medical record history, diagnoses, and prescriptions given by doctors.

---


## 📂 Project Structure

```text
patient-management-system/
├── app/                      # Next.js App Router pages & API routes
│   ├── api/                  # API endpoints (auth, patients, appointments, etc.)
│   ├── dashboard/            # Role-based dashboards (admin, doctor, patient, receptionist)
│   ├── login/                # Authentication page
│   ├── register/             # Self-registration page
│   ├── globals.css           # Global Tailwind styles & CSS variables
│   └── layout.tsx            # Root layout & providers (Theme, Auth, Redux)
├── components/               # Reusable UI components
│   ├── ui/                   # Shadcn/ui baseline components (button, card, dialog, etc.)
│   ├── layout/               # Shared dashboard layout components
│   └── admin/                # Admin-specific modal & components
├── lib/                      # Core utility functions & shared logic
│   ├── auth.ts               # Better Auth server configuration
│   ├── auth-client.ts        # Better Auth client configuration
│   ├── prisma.ts             # Instantiated Prisma Client
│   ├── phone-format.ts       # Phone number parsing & Ethiopian formatters
│   └── validations.ts        # Shared Zod forms validation schemas
├── prisma/                   # Database schema & migrations
│   ├── schema.prisma         # Prisma schema definition
│   └── seed.ts               # Seeding script containing dummy dataset
└── public/                   # Static assets (images, icons)
```

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [PostgreSQL](https://www.postgresql.org/) database instance running locally or hosted

### ⚙️ Installation

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd patient-management-system
    ```

2.  **Install Project Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and configure it as shown in the [Environment Variables](#-environment-variables) section.

4.  **Synchronize Database Schema:**
    Run the Prisma command to push the schema into your PostgreSQL database:
    ```bash
    npx prisma db push
    ```

5.  **Seed the Database:**
    Populate your database with departments, doctors, receptionists, patients, and sample appointments:
    ```bash
    npx prisma db seed
    ```

6.  **Run the Local Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to access the app.

---

## 🔑 Environment Variables

Create a file named `.env` in the root of the project:

```env
# Database connection string
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>?schema=public"

# Better Auth secret key (can be generated using: openssl rand -base64 32)
BETTER_AUTH_SECRET="your_better_auth_secret_here"

# Core application URL
BETTER_AUTH_URL="http://localhost:3000"
```

---


## 🛠️ Key Custom Systems

### 📞 Localized Phone Validation
The application uses a custom validator in `lib/phone-format.ts` specifically optimized for Ethiopian phone numbers:
*   Allows prefixes `+2519`, `+2517`, `09`, or `07`.
*   Standardizes phone input before storing it in the database in the format `+251xxxxxxxxx`.
*   Validates length and starting digits to prevent malformed data.

### 💳 Patient Unique Card Numbers
Each registered patient is allocated a structured clinical card number.
*   Format: `BK-P-{YEAR}-{FOUR_DIGIT_AUTO_INCREMENT}` (e.g., `BK-P-2026-0001`).
*   Indexed and unique `@unique` constraint in the schema for rapid lookups.
*   Seamlessly integrated into the global search bar across Receptionist and Doctor dashboards.
