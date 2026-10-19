import { useEffect } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AdminRoute, GuestRoute, ProtectedRoute } from './components/RouteGuards';
import { useAuth } from './context/AuthContext';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/DashboardPage';
import ExpenseDetailPage from './pages/ExpenseDetailPage';
import ExpenseFormPage from './pages/ExpenseFormPage';
import ExpensesPage from './pages/ExpensesPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import { resetExpenses } from './store/expensesSlice';
import { useAppDispatch } from './store/hooks';

function NotFound() {
  return (
    <div className="center-screen">
      <div className="card empty">
        <h1>Page not found</h1>
        <p className="muted">The page you are looking for does not exist.</p>
        <Link to="/" className="btn btn-primary">
          Go home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  // Never carry one user's filters or cached expenses over to the next session.
  useEffect(() => {
    if (!user) dispatch(resetExpenses());
  }, [user, dispatch]);

  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="expenses/new" element={<ExpenseFormPage />} />
          <Route path="expenses/:id" element={<ExpenseDetailPage />} />
          <Route path="expenses/:id/edit" element={<ExpenseFormPage />} />
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
