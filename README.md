[README.md](https://github.com/user-attachments/files/23834217/README.md)
# **NFC Check – Backend**

Backend API built with **Node.js**, **Express.js**, **Drizzle ORM**, and **PostgreSQL**.
Provides authentication, member management, CSV import/export, and NFC card checking.

---

# 🚀 **Tech Stack (Backend)**

### **Core**

- **Node.js** — runtime
- **Express.js** — routing + backend framework
- **PostgreSQL** — main database
- **Drizzle ORM** — SQL migrations + schema

### **Authentication**

- **JWT** (JSON Web Token)

### **Utilities**

- `multer` → file uploads (CSV, images)
- `csv-parser` → reading CSV files
- `cors` → cross-origin access
- `dotenv` → environment variables
- `bcrypt` → password hashing

---

# ⚙️ **Environment Setup**

Create a file named **`.env`** inside `<backend-folder>`.

### Required variables:

```
PORT=4000

# PostgreSQL database connection string
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE_NAME

# Secret for JWT signing
JWT_SECRET=your-secret-key

# Cloudinary
CLOUDINARY_NAME=dxj6bjjkm
CLOUDINARY_KEY=156677931567682
CLOUDINARY_SECRET=_AV9qDhtgxwmr3RGGGNF8WtMSmU

# Admin seed
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=pw123456
```

### Example for local PostgreSQL:

```
DATABASE_URL=postgres://postgres:1234@localhost:5432/nfc_db?sslmode=require&channel_binding=require
```

Make sure the database exists:

```bash
createdb nfc_db
```

---

# 📁 **Project Structure**

```
nfc-check-backend/
 ├─ db/
 │   ├─ schema.js
 │   └─ index.js
 ├─ drizzle/
 ├─ routes/
 ├─ middleware/
 └─ utils/
 ├─ drizzle.config.js
 ├─ package.json
 ├─ server.js
 └─ .env
```

---

# 🛠️ **Install Dependencies**

```bash
cd nfc-check-backend
npm install
```

---

# 🧱 **Database & Drizzle Setup**

### Generate migrations from schema:

```bash
npm run db:generate
```

### Push migrations to DB:

```bash
npm run db:push
```

---

# ▶️ **Run the Backend**

### Development mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server will run at:

👉 **[http://localhost:4000](http://localhost:4000)**

---

# 🔌 **Key API Modules**

### **Auth**

- `POST /api/auth/login`
  → Admin login with JWT

### **Members**

- `GET /api/members`
- `GET /api/members/:id`
- `POST /api/members`
- `PUT /api/members/:id`
- `DELETE /api/members/:id`

### **NFC Check**

- `POST /api/check/:token`
  → Verify NFC card mapped to member

### **Log (admit / deny)**

- `POST /api/log`
  → Log admit or deny member

### **CSV**

- `POST /api/members/upload`
  → Import members

---

# **NFC Member Import – CSV Format**

This CSV file is used to import multiple members into the NFC Check system.

---

## 📌 **Required Columns**

Your CSV **must contain exactly these headers**:

```
token, full_name, photo_url, status, expires_at
```

### Column Meaning:

| Column         | Description                   |
| -------------- | ----------------------------- |
| **token**      | NFC tag UID or manual token   |
| **full_name**  | Member’s full name            |
| **photo_url**  | Public image link (optional)  |
| **status**     | `active` or `expired`         |
| **expires_at** | Date in `YYYY-MM-DD` or empty |

---

## 🧪 **Import Rules**

- Duplicate **token** is rejected
- Empty `expires_at` → means _never expires_
- Status must be `active` or `expired`
- CSV must be UTF-8 encoded

---

## 📤 **Example CSV**

```csv
token,full_name,photo_url,status,expires_at
123ABC,John Doe,https://example.com/john.jpg,active,2025-12-31
456DEF,Jane Smith,,expired,
789GHI,Alex Johnson,https://example.com/alex.png,active,2024-06-30
```

---

## 🚀 **How to Use**

1. Prepare your CSV with the exact format above
2. Upload via the `/dashboard/upload` page
3. Verify the import results in the logs

---

# 📄 **Useful Notes**

### ✔ Drizzle ORM

- Schema defined in `db/schema.js`

### ✔ File Uploads

- Images stored in `cloudinary`
- CSV must follow required column structure

### ✔ Authentication Flow

- Login returns a JWT
- Frontend stores token in `localStorage`
- Protected routes use auth middleware
