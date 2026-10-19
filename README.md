### Retain - Personal Expense & Budget Manager

Retain is a full-stack web app for recording personal expenses, setting a monthly budget, and seeing where your money goes. Admins get a separate dashboard for managing expense categories and viewing platform-wide insights.

## Live demo

> **Deployed URL: ``https://retain-mwh6.onrender.com/** 

| Account | Email | Password |
| --- | --- | --- |
| Admin | the `ADMIN_EMAIL` you configured | the `ADMIN_PASSWORD` you configured |
| Demo user (only if you ran `npm run seed`) | `demo@retain.app` | `Demo1234!` |

## Main features

**For users**
- Sign up, sign in, sign out; session persists across page reloads
- Create, view, edit and delete your own expenses (title, amount, category, date, payment method, optional notes)
- Search by title/notes; filter by category, payment method, date range and amount range; sort by date or amount; paginated results
- Set or update a monthly budget and see total spent, remaining budget, and whether you are **within** (< 80% used), **approaching** (80-100%) or **over** (> 100%) budget
- Dashboard for any month: total spent, remaining budget, highest single expense, spending by category, recent expenses
- Responsive layout (tables collapse into cards on phones)

**For admins** (role `admin`, route `/admin`)
- Create, rename and delete expense categories
- Deleting a category moves its expenses to the default **Uncategorized** category (which cannot be renamed or deleted)
- Platform insights: total users, total expenses, total expense value, expenses this month, spending per category, top 5 most-used and bottom 5 least-used categories, recently added expenses, recently registered users

## Technologies used

| Layer | Stack |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router 6, Redux Toolkit + React Redux, plain responsive CSS |
| Backend | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB (local or MongoDB Atlas) |
| Auth | JWT (Bearer token), bcryptjs password hashing |
| Security | helmet, CORS allow-list, rate limiting on auth routes, server-side ownership checks |
| Hosting | Render (single web service serving API + built client) with MongoDB Atlas |

### How the requirements are met
- **Authentication uses React Context only** - `frontend/src/context/AuthContext.tsx` provides sign up / sign in / sign out, the current user and role. `ProtectedRoute`, `AdminRoute` and `GuestRoute` in `frontend/src/components/RouteGuards.tsx` guard routes using that context.
- **Filtering, searching and sorting use Redux only** - `frontend/src/store/expensesSlice.ts` holds every filter, the sort option and the page; components dispatch actions and a thunk fetches the matching expenses.
- **Users only see their own data** - every expense/budget query on the server is scoped to `req.user._id`; admin endpoints additionally require the `admin` role.

## Project structure

```
retain/
├── frontend/                 React + TypeScript + Vite frontend
│   └── src/
│       ├── api.ts          typed fetch wrapper for the REST API
│       ├── context/        AuthContext (authentication, roles)
│       ├── store/          Redux store + expensesSlice (filters/search/sort)
│       ├── components/     Layout, ExpenseList, ExpenseFilters, BudgetCard, admin/...
│       └── pages/          SignIn, SignUp, Dashboard, Expenses, ExpenseForm, ExpenseDetail, Admin
├── server/                 Node/Express REST API
│   ├── src/models/         User, Category, Expense, Budget
│   ├── src/routes/         auth, expenses, budgets, categories, dashboard, admin
│   ├── src/middleware/     authenticate, requireAdmin, error handling
│   └── scripts/seed.js     optional demo data
├── render.yaml             Render deployment blueprint
└── package.json            root scripts (build / start for deployment)
```

## Setup instructions (local)

**Prerequisites:** Node.js 18+ and a MongoDB database (local `mongod` or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

```bash
# 1. Install dependencies for both apps
npm run install:all

# 2. Configure the API
cp server/.env.example server/.env
#    then edit server/.env: set MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 3. (optional) Load demo data
npm run seed

# 4. Start the API (http://localhost:5000)
npm run dev:server

# 5. In a second terminal, start the frontend (http://localhost:5173)
npm run dev:frontend
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so no frontend configuration is needed locally.

On first start the API creates starter categories plus the default **Uncategorized** category, and creates the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (or promotes an existing user with that email). Public sign-up always creates a regular `user`.

### Environment variables

**`server/.env`**

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | no | Token lifetime, default `7d` |
| `PORT` | no | Default `5000` |
| `CLIENT_ORIGIN` | no | Comma-separated allowed origins (only if the client is hosted on a different domain) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | recommended | Admin account created on startup |

**`client/.env`** (optional): `VITE_API_URL` (only when the API is on another domain), `VITE_CURRENCY` (ISO code, default `USD`).

## Deployment (Render + MongoDB Atlas)

The Express server also serves the built React app, so one service hosts everything.

1. Create a free MongoDB Atlas cluster, add a database user, and allow network access from anywhere (`0.0.0.0/0`). Copy the connection string.
2. Push this repo to GitHub.
3. In Render choose **New > Blueprint**, select the repo (it reads `render.yaml`), and fill in `MONGODB_URI`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`. `JWT_SECRET` is generated automatically.
   - Without the blueprint: create a **Web Service** with build command `npm run build`, start command `npm start`, and the same environment variables.
4. After the deploy finishes, open the service URL, sign in as the admin, and put the URL in the **Live demo** section above.

## API reference

Base path `/api`. All routes except sign up / sign in require `Authorization: Bearer <token>`. Errors return `{ "message": "..." }`.

### Auth
| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/auth/signup` | `{ name, email, password }` -> `{ token, user }` (role is always `user`) |
| POST | `/auth/signin` | `{ email, password }` -> `{ token, user }` |
| GET | `/auth/me` | Current user |

### Expenses (own data only)
| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/expenses` | List with filters (below), returns `{ items, total, totalAmount, page, limit, totalPages }` |
| POST | `/expenses` | `{ title, amount, category, date, paymentMethod, notes? }` |
| GET | `/expenses/:id` | Single expense |
| PUT | `/expenses/:id` | Replace an expense (same body as POST) |
| DELETE | `/expenses/:id` | Delete an expense |

List query parameters: `search`, `category` (id), `paymentMethod`, `startDate`, `endDate` (`YYYY-MM-DD`, inclusive), `minAmount`, `maxAmount`, `sortBy` (`date` \| `amount`), `order` (`asc` \| `desc`), `page`, `limit` (max 100).

Payment methods: `Cash`, `Credit Card`, `Debit Card`, `Mobile Money`, `Bank Transfer`, `Other`.

### Budgets & dashboard (own data only)
| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/budgets/:month` | `YYYY-MM` -> `{ summary: { budget, spent, remaining, percentUsed, status } }` |
| PUT | `/budgets/:month` | `{ amount }` creates/updates that month's budget |
| DELETE | `/budgets/:month` | Remove the budget |
| GET | `/dashboard?month=YYYY-MM` | Total spent, remaining budget, highest expense, spending by category, recent expenses |

### Categories
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/categories` | any signed-in user | List categories |
| POST | `/categories` | admin | `{ name }` |
| PUT | `/categories/:id` | admin | Rename (not the default category) |
| DELETE | `/categories/:id` | admin | Delete; its expenses move to **Uncategorized** |

### Admin
| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/admin/insights` | Users, expense counts/value, spending per category, top/bottom 5 categories, recent expenses, recent users |

`GET /api/health` returns `{ "status": "ok" }` for uptime checks.

## Design notes
- "Expenses recorded this month" counts expenses whose **date** falls in the current (UTC) month.
- Months and expense dates are treated as UTC calendar dates, so totals do not shift with timezones.
- Top/bottom category lists are ranked by number of expenses (ties broken by total value); categories with zero expenses are included in the bottom list.
