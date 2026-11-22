# SplitRent & DepositGuard

A full-stack rental management platform built to eliminate unfair security deposit deductions and simplify shared roommate expense tracking.

## Live Application
- **Frontend (Vercel):** https://client-gamma-one-57.vercel.app
- **Backend API (Render):** https://splitrent-depositguard-api.onrender.com

## Key Features
- **DepositGuard (Tamper-Proof Inspection Ledger):** Tenants log move-in and move-out room conditions sealed with **SHA-256 cryptographic hashes** and timestamps, which Landlords can review and countersign.
- **SplitRent (Roommate Expense Tracker):** Shared flat expense logging with automatic split calculations and settlement tracking.
- **Role-Based Authentication:** Secure Tenant and Landlord workflows powered by Firebase Authentication and Firestore.

## Tech Stack
- **Frontend:** React 18, React Router, Tailwind CSS, Axios, Firebase Auth
- **Backend:** Node.js, Express, Firebase Admin SDK, Cloud Firestore
- **Deployment:** Vercel (Frontend) & Render (Backend)
