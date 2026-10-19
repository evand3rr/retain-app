import { useState } from 'react';
import AdminCategories from '../components/admin/AdminCategories';
import AdminInsights from '../components/admin/AdminInsights';

type Tab = 'insights' | 'categories';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('insights');

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Admin dashboard</h1>
          <p className="muted">Platform insights and category management.</p>
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'insights'}
          className={tab === 'insights' ? 'tab active' : 'tab'}
          onClick={() => setTab('insights')}
        >
          Platform insights
        </button>
        <button
          role="tab"
          aria-selected={tab === 'categories'}
          className={tab === 'categories' ? 'tab active' : 'tab'}
          onClick={() => setTab('categories')}
        >
          Categories
        </button>
      </div>

      {tab === 'insights' ? <AdminInsights /> : <AdminCategories />}
    </>
  );
}
