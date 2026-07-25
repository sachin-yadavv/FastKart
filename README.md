# 🛒 FastKart — Grocery Delivery Platform

A full-stack grocery delivery app where customers can browse products, place orders, pay online, and track deliveries in real time. Includes dedicated dashboards for Admins and Delivery Partners.

🔗 **Live Demo:** [fast-kart-bdg8.vercel.app](https://fast-kart-bdg8.vercel.app/)

---

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL + Prisma ORM (Neon)
- **Auth:** JWT
- **Payments:** Stripe
- **Storage:** Cloudinary
- **Background Jobs:** Inngest
- **Email:** SMTP (Nodemailer)

---

## Features

- User auth with JWT
- Browse, search & filter products
- Flash deals section
- Cart & address management
- Stripe payments + Cash on Delivery
- Live order tracking
- Admin dashboard — manage products, orders, delivery partners
- Delivery partner dashboard — update delivery status & location

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/sachin-yadavv/FastKart.git
cd FastKart
```

### 2. Install dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### 3. Set up environment variables

Create a `.env` file inside the `server/` folder:

```env
JWT_SECRET=
ADMIN_EMAILS=

# Neon PostgreSQL
DATABASE_URL=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# SMTP
SENDER_EMAIL=
SMTP_USER=
SMTP_PASS=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Create a `.env` file inside the `client/` folder:

```env
VITE_BASE_URL=
VITE_CURRENCY_SYMBOL=$
```

### 4. Set up the database

```bash
cd server
npx prisma generate
npx prisma migrate dev
npm run seed
```

### 5. Run the app

```bash
# Backend
cd server && npm run server

# Frontend
cd client && npm run dev
```

---

## 👨‍💻 Author

**Sachin Yadav**

⭐ If you liked this project, don't forget to star the repository!
