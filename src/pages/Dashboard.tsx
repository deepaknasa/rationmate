import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserDisplayName } from '../lib/userProfile';
import { fetchRationItems, signOutUser } from '../services/supabase';

type RationItem = {
  id?: string | number;
  item_name?: string;
  name?: string;
  quantity?: string | number;
  unit?: string;
};

type SortDirection = 'asc' | 'desc';

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M7 12h13" />
      <path d="M10 17h10" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6v12" />
      <path d="M5 9l3-3 3 3" />
      <path d="M16 18V6" />
      <path d="M13 15l3 3 3-3" />
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [items, setItems] = useState<RationItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState('');
  const displayName = getUserDisplayName(user);

  useEffect(() => {
    let isActive = true;

    void fetchRationItems()
      .then((data) => {
        if (!isActive) {
          return;
        }

        setItems(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setItemsError(error instanceof Error ? error.message : 'Unable to load ration items.');
      })
      .finally(() => {
        if (isActive) {
          setLoadingItems(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Logout failed:', error instanceof Error ? error.message : error);
      return;
    }

    navigate('/auth', { replace: true });
  }

  const sortedItems = [...items].sort((leftItem, rightItem) => {
    const leftLabel = leftItem.item_name ?? leftItem.name ?? '';
    const rightLabel = rightItem.item_name ?? rightItem.name ?? '';
    const comparison = leftLabel.localeCompare(rightLabel);

    return sortDirection === 'asc' ? comparison : comparison * -1;
  });

  return (
    <main className="dashboard-page">
      <section className="dashboard-shell">
        <div className="card-list" aria-live="polite">
          {loadingItems && <p>Loading ration items...</p>}
          {!loadingItems && itemsError && <p className="auth-error">{itemsError}</p>}
          {!loadingItems && !itemsError && items.length === 0 && <p>No ration items found.</p>}
          {!loadingItems && !itemsError && sortedItems.length > 0 && (
            <ul className="card-list-items">
              {sortedItems.map((item, index) => {
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
            className="dashboard-action-button"
            onClick={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}
            aria-label={`Sort ration items ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
            title={sortDirection === 'asc' ? 'Sort Z to A' : 'Sort A to Z'}
          >
            <SortIcon />
          </button>
          <div className="dashboard-actions-divider" aria-hidden="true" />
          <button
            type="button"
            className="dashboard-action-button"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-expanded={isMenuOpen}
            aria-label="Open account menu"
          >
            <MenuIcon />
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
