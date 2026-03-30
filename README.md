# Gestión de Usuarios – BildyApp

## 🧰 General requirements
- Node.js 22+
- MongoDB Atlas account.

---

## ▶️ Use
1. Rename `.env.example` to `.env` and configure.
2. Create folder `project1-bildy-app/uploads/`
3. Install dependencies and run.

---

## 📁 Folder structure
```
└── 📁project1-bildy-app
    └── 📁src
        └── 📁config
            ├── db.config.js
        └── 📁controllers
            ├── user.controller.js
        └── 📁middlewares
            ├── auth.middleware.js
            ├── error.middleware.js
            ├── logger.middleware.js
            ├── role.middleware.js
            ├── upload.middleware.js
            ├── validate.middleware.js
        └── 📁models
            ├── address.model.js
            ├── Company.js
            ├── User.js
        └── 📁routes
            ├── index.js
            ├── user.routes.js
        └── 📁services
            ├── notification.service.js
        └── 📁utils
            ├── AppError.js
            ├── jwt.util.js
            ├── password.util.js
        └── 📁validators
            └── 📁shared
                ├── fields.js
            ├── company.validator.js
            ├── user.validator.js
        ├── app.js
        ├── index.js
    └── 📁test
        ├── document.pdf
        ├── index.http
        ├── ucjc.jpg
        ├── utad.png
    ├── .env    # .env.example
    ├── .gitignore
    ├── package-lock.json
    ├── package.json
    └── README.md
```

---

## 📍 API endpoints
Base URL: `http://localhost:3000/api/user`


### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login |
| POST | `/refresh` | Refresh access token |


### Requires JWT

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/validation` | Verify email with 6-digit code |
| PUT | `/register` | Update personal data (name, lastName, NIF) |
| PATCH | `/company` | Create or join a company |
| PATCH | `/logo` | Upload company logo |
| GET | `/` | Get authenticated user (company populated) |
| POST | `/logout` | Logout — invalidates refresh token |
| DELETE | `/` | Delete account (`?soft=true` for soft delete) |
| PUT | `/password` | Change password |


### Requires JWT + admin role

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/invite` | Invite a new user to the company |

---

## 🧪 Testing
Open `test/index.http` and follow the requests, pasting tokens where indicated.
