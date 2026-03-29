import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { getUserDisplayName } from '../lib/userProfile';

type RationItem = {
  id?: string | number;
  item_name?: string;
  name?: string;
  quantity?: string | number;
  unit?: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [items, setItems] = useState<RationItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState('');
  const displayName = getUserDisplayName(user);

  useEffect(() => {
    let isMounted = true;

    async function loadItems() {
      setLoadingItems(true);
      setItemsError('');

      try {
        const response = await fetch('/api/ration-items');

        if (!response.ok) {
          throw new Error('Failed to load ration items.');
        }

        const data = (await response.json()) as RationItem[];

        if (!isMounted) {
          return;
        }

        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setItemsError(error instanceof Error ? error.message : 'Unable to load ration items.');
      } finally {
        if (isMounted) {
          setLoadingItems(false);
        }
      }
    }

    void loadItems();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    if (!supabase) {
      console.error('Supabase client is not configured.');
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout failed:', error.message);
      return;
    }

    navigate('/auth', { replace: true });
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1>Card List</h1>
          </div>
        </div>

        <div className="card-list" aria-live="polite">
          {loadingItems && <p>Loading ration items...</p>}
          {!loadingItems && itemsError && <p className="auth-error">{itemsError}</p>}
          {!loadingItems && !itemsError && items.length === 0 && <p>No ration items found.</p>}
          {!loadingItems && !itemsError && items.length > 0 && (
            <ul className="card-list-items">
              {items.map((item, index) => {
                const itemLabel = item.item_name ?? item.name ?? `Item ${index + 1}`;
                const quantityLabel = item.quantity ? `Qty: ${item.quantity}${item.unit ? ` ${item.unit}` : ''}` : 'Qty not set';
                const itemKey = item.id ?? `${itemLabel}-${index}`;

                return (
                  <li key={itemKey} className="card-list-item">
                    <p className="card-list-item-title">{itemLabel}</p>
                    <p className="card-list-item-subtitle">{quantityLabel}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-expanded={isMenuOpen}
            aria-label="Open account menu"
          >
            ☰
          </button>
        </div>

        {isMenuOpen && (
          <div className="burger-menu">
            <div className="burger-menu-profile">
              <p className="burger-menu-label">Customer</p>
              <p className="burger-menu-name">{displayName}</p>
              <p className="burger-menu-email">{user?.email ?? 'Unknown user'}</p>
            </div>
            <button type="button" className="burger-menu-item burger-menu-item-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
