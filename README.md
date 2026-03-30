# Gestión de Usuarios — BildyApp

## 🧰 General requirements
- Node.js 22+
- MongoDB Atlas account

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

