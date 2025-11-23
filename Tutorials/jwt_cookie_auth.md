# How to build a **JWT (JSON Web Token) Authentication with Cookies** using **Express**, **JWT**, **Bcrypt**, and **Custom Middlewares**

---

# 1️⃣ Setup Environment Variables (`.env`)

Add these variables to your `.env` file:

```env
JWT_SECRET=your_super_secret_key_here_change_this_in_production
JWT_EXPIRY=7d
COOKIE_NAME=authToken
APP_NAME=Express Chat App
```

---

# 2️⃣ Create Login Controller (`controller/loginController.js`)

This controller handles user authentication and token generation.

```js
// external imports
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");

// internal imports
const User = require("../models/People");

// get login page
function getLogin(req, res, next) {
  res.render("index");
}

// do login
async function login(req, res, next) {
  try {
    // find a user who has this email/username
    const user = await User.findOne({
      $or: [{ email: req.body.username }, { mobile: req.body.username }],
    });

    if (user && user._id) {
      const isValidPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );

      if (isValidPassword) {
        // prepare the user object to generate token
        const userObject = {
          username: user.name,
          mobile: user.mobile,
          email: user.email,
          role: "user",
        };

        // generate token
        const token = jwt.sign(userObject, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRY,
        });

        // set cookie
        res.cookie(process.env.COOKIE_NAME, token, {
          maxAge: process.env.JWT_EXPIRY,
          httpOnly: true,
          signed: true,
        });

        // set logged in user local identifier
        res.locals.loggedInUser = userObject;

        res.render("inbox");
      } else {
        throw createError("Login failed! Please try again.");
      }
    } else {
      throw createError("Login failed! Please try again.");
    }
  } catch (err) {
    res.render("index", {
      data: {
        username: req.body.username,
      },
      errors: {
        common: {
          msg: err.message,
        },
      },
    });
  }
}

// do logout
function logout(req, res) {
  res.clearCookie(process.env.COOKIE_NAME);
  res.send("logged out");
}

module.exports = {
  getLogin,
  login,
  logout,
};
```

---

# 3️⃣ Create Login Validators Middleware (`middleware/login/loginValidators.js`)

Validates login form data before processing.

```js
const { check, validationResult } = require("express-validator");

const doLoginValidators = [
  check("username")
    .isLength({
      min: 1,
    })
    .withMessage("Mobile number or email is required"),
  check("password").isLength({ min: 1 }).withMessage("Password is required"),
];

const doLoginValidationHandler = function (req, res, next) {
  const errors = validationResult(req);
  const mappedErrors = errors.mapped();

  if (Object.keys(mappedErrors).length === 0) {
    next();
  } else {
    res.render("index", {
      data: {
        username: req.body.username,
      },
      errors: mappedErrors,
    });
  }
};

module.exports = {
  doLoginValidators,
  doLoginValidationHandler,
};
```

---

# 4️⃣ Create JWT Check Middleware (`middleware/common/checkLogin.js`)

This middleware verifies JWT tokens from cookies and protects routes.

```js
const jwt = require("jsonwebtoken");

const checkLogin = (req, res, next) => {
  let cookies =
    Object.keys(req.signedCookies).length > 0 ? req.signedCookies : null;

  if (cookies) {
    try {
      token = cookies[process.env.COOKIE_NAME];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // pass user info to response locals
      if (res.locals.html) {
        res.locals.loggedInUser = decoded;
      }
      next();
    } catch (err) {
      if (res.locals.html) {
        res.redirect("/");
      } else {
        res.status(500).json({
          errors: {
            common: {
              msg: "Authentication failure!",
            },
          },
        });
      }
    }
  } else {
    if (res.locals.html) {
      res.redirect("/");
    } else {
      res.status(401).json({
        error: "Authentication failure!",
      });
    }
  }
};

const redirectLoggedIn = function (req, res, next) {
  let cookies =
    Object.keys(req.signedCookies).length > 0 ? req.signedCookies : null;

  if (!cookies) {
    next();
  } else {
    res.redirect("/inbox");
  }
};

module.exports = {
  checkLogin,
  redirectLoggedIn,
};
```

---

# 5️⃣ Update HTML Response Decorator (`middleware/common/decorateHtmlResponse.js`)

Initializes response locals for HTML templates.

```js
function decorateHtmlResponse(page_title) {
  return function(req, res, next){
    res.locals.html = true;
    res.locals.title = `${page_title} - ${process.env.APP_NAME}`
    res.locals.loggedInUser = {};
    res.locals.errors = {};
    res.locals.data = {};
    next();
  }
}

module.exports = decorateHtmlResponse;
```

---

# 6️⃣ Setup Login Routes (`router/loginRouter.js`)

```js
// external imports
const express = require("express");

// internal imports
const { getLogin, login, logout } = require("../controller/loginController");
const decorateHtmlResponse = require("../middlewares/common/decorateHtmlResponse");
const {
  doLoginValidators,
  doLoginValidationHandler,
} = require("../middlewares/login/loginValidators");
const { redirectLoggedIn } = require("../middlewares/common/checkLogin");

const router = express.Router();

// set page title
const page_title = "Login";

// login page
router.get("/", decorateHtmlResponse(page_title), redirectLoggedIn, getLogin);

// process login
router.post(
  "/",
  decorateHtmlResponse(page_title),
  doLoginValidators,
  doLoginValidationHandler,
  login
);

// logout
router.delete("/", logout);

module.exports = router;
```

---

# 7️⃣ Setup Inbox Routes (`router/inboxRouter.js`)

Protected route that requires authentication.

```js
const express = require("express");

//internal imports
const { getInbox } = require("../controller/inboxController");
const decorateHtmlResponse = require("../middlewares/common/decorateHtmlResponse");
const { checkLogin } = require("../middlewares/common/checkLogin");

const router = express.Router();

//inbox page - Protected route
router.get("/", decorateHtmlResponse("Inbox"), checkLogin, getInbox);

module.exports = router;
```

---

# 8️⃣ Update Users Routes (`router/usersRouter.js`)

Add `checkLogin` middleware to protect user routes.

```js
// external imports
const express = require("express");
const { check } = require("express-validator");

// internal imports
const {
  getUsers,
  addUser,
  removeUser,
} = require("../controller/usersController");
const decorateHtmlResponse = require("../middlewares/common/decorateHtmlResponse");
const avatarUpload = require("../middlewares/users/avaterUpload");
const {
  addUserValidators,
  addUserValidationHandler,
} = require("../middlewares/users/userValidators");
const { checkLogin } = require("../middlewares/common/checkLogin");

const router = express.Router();

// users page - Protected route
router.get("/", decorateHtmlResponse("Users"), checkLogin, getUsers);

// add user
router.post(
  "/",
  checkLogin,
  avatarUpload,
  addUserValidators,
  addUserValidationHandler,
  addUser
);

// remove user
router.delete("/:id", removeUser);

module.exports = router;
```

---

# 9️⃣ Update Header/Navigation View (`views/partials/header.ejs`)

Display login/logout buttons based on authentication status.

```ejs
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="author" content="Sumit Saha" />
    <meta name="owner" content="learnwithsumit.com" />
    <title><%= title %></title>
    <link rel="shortcut icon" href="./images/favicon.png" />
    <link rel="stylesheet" href="./stylesheets/toastify.css" />
    <link rel="stylesheet" href="./stylesheets/style.css" />
    <script src="./js/toastify.js"></script>
  </head>
  <body>
    <div class="menu">
      <% if (loggedInUser && loggedInUser.username) { %>
      <div class="menu-item"><a href="/inbox">Inbox</a></div>
      <div class="menu-item"><a href="/users">Users</a></div>
      <div class="menu-item"><a href="#" onclick="logout()">Logout</a></div>
      <% } else { %>
      <div class="menu-item"><a href="/inbox">Inbox</a></div>
      <div class="menu-item"><a href="/users">Users</a></div>
      <div class="menu-item"><a href="/">Login</a></div>
      <% } %>
    </div>
    <script>
      // toast
      const logoutToast = Toastify({
        text: "You are being logged out...",
        duration: 1000,
      });

      function logout() {
        fetch("/", {
          method: "DELETE",
        });
        logoutToast.showToast();
        setTimeout(() => {
          window.location.replace("/");
        }, 1000);
      }
    </script>
  </body>
</html>
```

---

# How The Flow Works

## 1. User visits Login Page (`GET /`)

- `redirectLoggedIn` middleware checks if user already has a valid token in cookies
- If logged in → redirect to `/inbox`
- If not logged in → render login form

## 2. User Submits Login Form (`POST /`)

1. **doLoginValidators** validates form data (username & password required)
2. **doLoginValidationHandler** checks for validation errors
3. **login controller**:
   - Queries DB for user with matching email or mobile
   - Compares submitted password with hashed password using **bcrypt**
   - If valid → generates **JWT token** with user info
   - Stores token in **signed, httpOnly cookie**
   - Redirects to inbox page

## 3. User Accesses Protected Route (`GET /inbox`, `/users`)

- **checkLogin middleware** runs first
- Reads signed cookies from request
- Verifies JWT token using secret key
- If valid → attaches user data to `req.user` and continues
- If invalid/expired → redirects to login page

## 4. User Logs Out (`DELETE /`)

- Clears authentication cookie
- Frontend triggers redirect to login page

---

# 🔐 Security Features Explained

| Feature | Purpose |
|---------|---------|
| **JWT Secret** | Prevents token tampering - only server can verify signatures |
| **Signed Cookies** | Express signs cookies - client cannot modify them |
| **httpOnly Flag** | Cookie not accessible via JavaScript - prevents XSS attacks |
| **Token Expiry** | Token automatically expires after set duration - reduces security risk |
| **Bcrypt** | Hashes passwords - never stores plain text passwords |
| **checkLogin Middleware** | Guards routes - unauthorized users redirected to login |