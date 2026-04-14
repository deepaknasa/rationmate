import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserDisplayName } from '../lib/userProfile';
import {
  createRationItem,
  fetchRationItems,
  signOutUser,
  updateRationItem,
  updateRationItems,
} from '../services/supabase';

type RationItem = {
  clientKey?: string;
  id?: string | number;
  item_name?: string;
  name?: string;
  quantity?: string | number;
  unit?: string;
  score?: string | number;
  weightage?: string | number;
  savedFillPercentage?: string | number | null;
  pendingRank?: number | null;
};

type SortDirection = 'asc' | 'desc';
type BottomBarMode = 'actions' | 'search' | 'pending';

type SwipeCardProps = {
  item: RationItem;
  isDirty: boolean;
  onSlideLeft: (fillPercentage: number) => void;
  onSlideRight: () => void;
  onResetChange: () => void;
};

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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function getItemIdentity(item: RationItem, index?: number) {
  return String(item.clientKey ?? item.id ?? item.item_name ?? item.name ?? `item-${index ?? 0}`);
}

function getItemLabel(item: RationItem, index?: number) {
  return item.item_name ?? item.name ?? (typeof index === 'number' ? `Item ${index + 1}` : 'Untitled');
}

function getQuantityLabel(item: RationItem) {
  return item.quantity ? `Qty: ${item.quantity}${item.unit ? ` ${item.unit}` : ''}` : 'Qty not set';
}

function getBaseScore(item: RationItem) {
  const score = Number(item.score ?? item.weightage ?? 0);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
}

function getDisplayScore(item: RationItem) {
  if (item.savedFillPercentage == null || item.savedFillPercentage === '') {
    return getBaseScore(item);
  }

  const score = Number(item.savedFillPercentage);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : getBaseScore(item);
}

function hasDirtyScore(item: RationItem) {
  return item.savedFillPercentage != null && getDisplayScore(item) !== getBaseScore(item);
}

function getCardClass(scoreValue: number) {
  if (scoreValue < 25) return 'card-black';
  if (scoreValue < 50) return 'card-red';
  if (scoreValue < 75) return 'card-orange';
  return 'card-green';
}

function getTodayDateString() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeRationItems(data: RationItem[]) {
  return Array.isArray(data)
    ? data.map((item, index) => ({
        ...item,
        clientKey: getItemIdentity(item, index),
        savedFillPercentage: item.savedFillPercentage ?? null,
        pendingRank: null,
      }))
    : [];
}

function SwipeCard({ item, isDirty, onSlideLeft, onSlideRight, onResetChange }: SwipeCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const slideRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    axis: null as 'x' | 'y' | null,
    pointerId: null as number | null,
  });
  const supportsPointer = typeof window !== 'undefined' && 'PointerEvent' in window;
  const [translateX, setTranslateX] = useState(0);
  const [fillPercentage, setFillPercentage] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const itemLabel = getItemLabel(item);
  const quantityLabel = getQuantityLabel(item);

  function getSlideBounds() {
    const cardWidth = cardRef.current?.offsetWidth ?? 0;

    return {
      leftLimit: cardWidth * 0.75,
      rightLimit: cardWidth * 0.25,
    };
  }

  function getLeftSlideFillPercentage(leftDistance: number, leftLimit: number) {
    if (!leftLimit) {
      return 0;
    }

    const progress = Math.max(0, Math.min(1, leftDistance / leftLimit));
    return Math.round(progress * 100);
  }

  function resetSlide() {
    slideRef.current.active = false;
    slideRef.current.pointerId = null;
    slideRef.current.axis = null;
    setIsSliding(false);
    setTranslateX(0);
    setFillPercentage(0);
  }

  function updateSlide(clientX: number, clientY: number, event?: { preventDefault?: () => void }) {
    if (!slideRef.current.active) {
      return;
    }

    const dx = clientX - slideRef.current.startX;
    const dy = clientY - slideRef.current.startY;

    if (!slideRef.current.axis && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      slideRef.current.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }

    if (slideRef.current.axis !== 'x') {
      return;
    }

    event?.preventDefault?.();

    const { leftLimit, rightLimit } = getSlideBounds();
    const capped = Math.max(-leftLimit, Math.min(rightLimit, dx));
    const leftDistance = capped < 0 ? Math.abs(capped) : 0;

    setIsSliding(true);
    setTranslateX(capped);
    setFillPercentage(getLeftSlideFillPercentage(leftDistance, leftLimit));
  }

  function endSlide(clientX: number) {
    if (slideRef.current.axis !== 'x') {
      resetSlide();
      return;
    }

    const dx = clientX - slideRef.current.startX;

    if (dx < 0) {
      const { leftLimit } = getSlideBounds();
      const finalFill = getLeftSlideFillPercentage(Math.abs(dx), leftLimit);

      if (finalFill > 0) {
        onSlideLeft(finalFill);
      }
    } else if (dx >= 60) {
      onSlideRight();
    }

    resetSlide();
  }

  const rowClassName = `card-row${fillPercentage > 0 ? ' show-left-meter' : ''}${isDirty ? ' card-row-dirty' : ''}`;
  const rowStyle = fillPercentage > 0
    ? {
        '--slide-fill': `${fillPercentage}%`,
        '--slide-fill-color': `hsl(${Math.round((fillPercentage / 100) * 120)} 82% 56%)`,
      } as CSSProperties
    : undefined;
  const badgeValue = fillPercentage > 0 ? fillPercentage : getDisplayScore(item);
  const cardClassName = `card ${getCardClass(badgeValue)}${isSliding ? ' sliding' : ''}${isDirty ? ' card-dirty' : ''}`;
  const cardStyle = translateX !== 0 ? { transform: `translateX(${translateX}px)` } : undefined;

  const pointerHandlers = supportsPointer ? {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (!event.isPrimary || event.pointerType === 'mouse') {
        return;
      }

      slideRef.current.active = true;
      slideRef.current.pointerId = event.pointerId;
      slideRef.current.startX = event.clientX;
      slideRef.current.startY = event.clientY;
      slideRef.current.axis = null;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      if (!slideRef.current.active || event.pointerId !== slideRef.current.pointerId) {
        return;
      }

      updateSlide(event.clientX, event.clientY, event);
    },
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
      if (!slideRef.current.active || event.pointerId !== slideRef.current.pointerId) {
        return;
      }

      endSlide(event.clientX);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerId !== slideRef.current.pointerId) {
        return;
      }

      resetSlide();

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
  } : {
    onTouchStart: (event: ReactTouchEvent<HTMLElement>) => {
      const touch = event.touches[0];
      slideRef.current.active = true;
      slideRef.current.startX = touch.clientX;
      slideRef.current.startY = touch.clientY;
      slideRef.current.axis = null;
    },
    onTouchMove: (event: ReactTouchEvent<HTMLElement>) => {
      const touch = event.touches[0];
      updateSlide(touch.clientX, touch.clientY, event);
    },
    onTouchEnd: (event: ReactTouchEvent<HTMLElement>) => {
      if (!slideRef.current.active) {
        return;
      }

      endSlide(event.changedTouches[0].clientX);
    },
    onTouchCancel: () => resetSlide(),
  };

  return (
    <li className={rowClassName} style={rowStyle}>
      <article ref={cardRef} className={cardClassName} style={cardStyle} {...pointerHandlers}>
        {isDirty && (
          <button
            type="button"
            className="card-dirty-reset"
            aria-label={`Cancel score update for ${itemLabel}`}
            title="Cancel score update"
            onClick={(event) => {
              event.stopPropagation();
              onResetChange();
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <CancelIcon />
          </button>
        )}

        <div className="card-content">
          <p className="card-title">{itemLabel}</p>
          <p className="card-subtitle">{quantityLabel}</p>
        </div>
        <div className="score-badge">{badgeValue}%</div>
      </article>
      <div className="slide-meter" aria-hidden="true">
        <div className="slide-meter-fill" />
      </div>
    </li>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [items, setItems] = useState<RationItem[]>([]);
  const [suggestionItems, setSuggestionItems] = useState<RationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [selectedSuggestionName, setSelectedSuggestionName] = useState('');
  const [loadingItems, setLoadingItems] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [itemsError, setItemsError] = useState('');
  const [addItemError, setAddItemError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const addItemInputRef = useRef<HTMLInputElement | null>(null);
  const nextPendingRankRef = useRef(1);
  const displayName = getUserDisplayName(user);

  useEffect(() => {
    let isActive = true;
    setItemsError('');

    void fetchRationItems()
      .then((data) => {
        if (!isActive) {
          return;
        }

        const normalizedItems = normalizeRationItems(data);

        setItems(normalizedItems);
        setSuggestionItems(normalizedItems);
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

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(''), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const hasPendingChanges = items.some(hasDirtyScore);
  const bottomBarMode: BottomBarMode = hasPendingChanges ? 'pending' : isSearchOpen ? 'search' : 'actions';

  useEffect(() => {
    if (bottomBarMode !== 'search') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => searchInputRef.current?.focus(), 120);
    return () => window.clearTimeout(timeoutId);
  }, [bottomBarMode]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;

      if (menuRef.current?.contains(target) || menuButtonRef.current?.contains(target)) {
        return;
      }

      setIsMenuOpen(false);
    }

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isAddDialogOpen) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => addItemInputRef.current?.focus(), 80);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeAddItemDialog();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAddDialogOpen]);

  function updateItemByIdentity(targetItem: RationItem, updater: (item: RationItem) => RationItem) {
    setItems((current) => current.map((entry) => (
      getItemIdentity(entry) === getItemIdentity(targetItem) ? updater(entry) : entry
    )));
  }

  function setPendingScore(targetItem: RationItem, fillPercentage: number) {
    updateItemByIdentity(targetItem, (entry) => {
      if (fillPercentage === getBaseScore(entry)) {
        return {
          ...entry,
          savedFillPercentage: null,
          pendingRank: null,
        };
      }

      return {
        ...entry,
        savedFillPercentage: fillPercentage,
        pendingRank: nextPendingRankRef.current++,
      };
    });
  }

  function resetPendingScore(targetItem: RationItem) {
    updateItemByIdentity(targetItem, (entry) => ({
      ...entry,
      savedFillPercentage: null,
      pendingRank: null,
    }));
  }

  function cancelPendingChanges() {
    setItems((current) => current.map((entry) => ({
      ...entry,
      savedFillPercentage: null,
      pendingRank: null,
    })));
    setToastMessage('Changes canceled');
  }

  async function savePendingChanges() {
    const dirtyItems = items.filter(hasDirtyScore);

    if (!dirtyItems.length) {
      return;
    }

    const payloadItems = dirtyItems
      .filter((item) => item.id != null)
      .map((item) => ({
        id: item.id,
        score: getDisplayScore(item),
        fillDate: getTodayDateString(),
      }));

    if (!payloadItems.length) {
      setToastMessage('Nothing to save');
      return;
    }

    setIsSaving(true);

    try {
      await updateRationItems({ items: payloadItems });

      setItems((current) => current.map((entry) => {
        if (!hasDirtyScore(entry)) {
          return entry;
        }

        const nextScore = getDisplayScore(entry);

        return {
          ...entry,
          score: nextScore,
          weightage: entry.weightage == null ? entry.weightage : nextScore,
          savedFillPercentage: null,
          pendingRank: null,
        };
      }));
      setToastMessage('Scores saved');
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Unable to save scores.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Logout failed:', error instanceof Error ? error.message : error);
      return;
    }

    navigate('/auth', { replace: true });
  }

  function openSearch() {
    setIsSearchOpen(true);
    setIsMenuOpen(false);
  }

  function closeSearch() {
    setIsSearchOpen(false);
    searchInputRef.current?.blur();
  }

  function resetSearch() {
    setSearchQuery('');
    searchInputRef.current?.focus();
  }

  function openAddItemDialog() {
    setIsMenuOpen(false);
    setNewItemName('');
    setSelectedSuggestionName('');
    setAddItemError('');
    setIsAddDialogOpen(true);
  }

  function closeAddItemDialog() {
    setIsAddDialogOpen(false);
    setNewItemName('');
    setSelectedSuggestionName('');
    setAddItemError('');
  }

  function handleSuggestionPick(suggestion: RationItem) {
    const suggestionLabel = getItemLabel(suggestion);
    setNewItemName(suggestionLabel);
    setSelectedSuggestionName(suggestionLabel.trim().toLowerCase());
    setAddItemError('');
    addItemInputRef.current?.focus();
  }

  const filteredItems = items.filter((item) => {
    const term = searchQuery.trim().toLowerCase();

    if (hasDirtyScore(item)) {
      return true;
    }

    if (!term) {
      return true;
    }

    return getItemLabel(item).toLowerCase().includes(term);
  });

  const sortedItems = [...filteredItems].sort((leftItem, rightItem) => {
    const leftDirty = hasDirtyScore(leftItem);
    const rightDirty = hasDirtyScore(rightItem);

    if (leftDirty !== rightDirty) {
      return leftDirty ? -1 : 1;
    }

    if (leftDirty && rightDirty) {
      const pendingRankComparison = (rightItem.pendingRank ?? 0) - (leftItem.pendingRank ?? 0);

      if (pendingRankComparison !== 0) {
        return pendingRankComparison;
      }
    }

    const scoreComparison = getDisplayScore(leftItem) - getDisplayScore(rightItem);

    if (scoreComparison !== 0) {
      return sortDirection === 'asc' ? scoreComparison : scoreComparison * -1;
    }

    return getItemLabel(leftItem).localeCompare(getItemLabel(rightItem));
  });

  const normalizedNewItemName = newItemName.trim().toLowerCase();
  const uniqueSuggestionItems = Array.from(
    suggestionItems.reduce((map, item) => {
      const label = getItemLabel(item).trim();

      if (!label) {
        return map;
      }

      const identity = label.toLowerCase();

      if (!map.has(identity)) {
        map.set(identity, item);
      }

      return map;
    }, new Map<string, RationItem>()).values(),
  );
  const matchingSuggestions = normalizedNewItemName
    ? uniqueSuggestionItems
      .filter((item) => getItemLabel(item).toLowerCase().includes(normalizedNewItemName))
      .slice(0, 6)
    : [];
  const exactMatchingSuggestion = uniqueSuggestionItems.find(
    (item) => getItemLabel(item).trim().toLowerCase() === normalizedNewItemName,
  );
  const hasSelectedSuggestion = !!exactMatchingSuggestion && selectedSuggestionName === normalizedNewItemName;
  const isUpdateItemMode = !!exactMatchingSuggestion && hasSelectedSuggestion;
  const canAddItem = !!normalizedNewItemName && (!exactMatchingSuggestion || hasSelectedSuggestion);

  async function handleAddItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = newItemName.trim();

    if (!trimmedName) {
      setAddItemError('Enter an item name.');
      return;
    }

    if (exactMatchingSuggestion && !hasSelectedSuggestion) {
      setAddItemError('Select the matching suggestion before updating this item.');
      return;
    }

    setIsSubmittingItem(true);
    setAddItemError('');

    try {
      if (isUpdateItemMode) {
        if (exactMatchingSuggestion?.id == null) {
          throw new Error('The selected item cannot be updated because its id is missing.');
        }

        await updateRationItem({
          id: exactMatchingSuggestion.id,
          item_name: trimmedName,
          name: trimmedName,
          quantity: exactMatchingSuggestion.quantity ?? '',
          unit: exactMatchingSuggestion.unit ?? '',
          score: getBaseScore(exactMatchingSuggestion),
          weightage: exactMatchingSuggestion.weightage ?? exactMatchingSuggestion.score ?? getBaseScore(exactMatchingSuggestion),
        });
      } else {
        await createRationItem({
          item_name: trimmedName,
          name: trimmedName,
          quantity: '',
          unit: '',
          score: 0,
          weightage: 0,
        });
      }

      const refreshedItems = normalizeRationItems(await fetchRationItems());
      setItems(refreshedItems);
      setSuggestionItems(refreshedItems);
      closeAddItemDialog();
      setToastMessage(isUpdateItemMode ? `${trimmedName} updated` : `${trimmedName} added`);
    } catch (error) {
      setAddItemError(error instanceof Error ? error.message : 'Unable to save item.');
    } finally {
      setIsSubmittingItem(false);
    }
  }

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
                const itemKey = getItemIdentity(item, index);

                return (
                  <SwipeCard
                    key={itemKey}
                    item={item}
                    isDirty={hasDirtyScore(item)}
                    onSlideLeft={(fillPercentage) => {
                      setPendingScore(item, fillPercentage);
                      setToastMessage(`Score set to ${fillPercentage}%`);
                    }}
                    onSlideRight={() => {
                      resetPendingScore(item);
                      setToastMessage('Score reset');
                    }}
                    onResetChange={() => {
                      resetPendingScore(item);
                      setToastMessage('Change removed');
                    }}
                  />
                );
              })}
            </ul>
          )}
        </div>

        <div className="dashboard-bottom-shell">
          <div className={`dashboard-actions dashboard-bottom-layer${bottomBarMode === 'actions' ? ' is-active' : ''}`}>
            <button
              type="button"
              className="dashboard-action-button"
              onClick={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}
              aria-label={`Sort ration items ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
              title={sortDirection === 'asc' ? 'Lowest to highest score' : 'Highest to lowest score'}
            >
              <SortIcon />
            </button>
            <div className="dashboard-actions-divider" aria-hidden="true" />
            <button
              type="button"
              className="dashboard-action-button"
              onClick={openSearch}
              aria-expanded={isSearchOpen}
              aria-label="Search ration items"
              title="Search items"
            >
              <SearchIcon />
            </button>
            <div className="dashboard-actions-divider" aria-hidden="true" />
            <button
              ref={menuButtonRef}
              type="button"
              className="dashboard-action-button"
              onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                setIsMenuOpen((current) => !current);
              }}
              aria-expanded={isMenuOpen}
              aria-label="Open account menu"
            >
              <MenuIcon />
            </button>
          </div>

          <div className={`dashboard-search-bar dashboard-bottom-layer${bottomBarMode === 'search' ? ' is-active' : ''}`}>
            <button
              type="button"
              className="dashboard-action-button"
              onClick={resetSearch}
              aria-label="Reset search"
              title="Reset search"
            >
              <ResetIcon />
            </button>
            <input
              ref={searchInputRef}
              className="dashboard-search-input"
              type="text"
              placeholder="Search ration items"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search ration items"
            />
            <button
              type="button"
              className="dashboard-action-button"
              onClick={closeSearch}
              aria-label="Close search"
              title="Close search"
            >
              <ClearIcon />
            </button>
          </div>

          <div className={`dashboard-pending-actions dashboard-bottom-layer${bottomBarMode === 'pending' ? ' is-active' : ''}`}>
            <button
              type="button"
              className="dashboard-action-button"
              onClick={cancelPendingChanges}
              aria-label="Cancel pending score changes"
              title="Cancel changes"
              disabled={isSaving}
            >
              <CancelIcon />
            </button>
            <div className="dashboard-actions-divider" aria-hidden="true" />
            <button
              type="button"
              className="dashboard-action-button dashboard-action-button-primary"
              onClick={savePendingChanges}
              aria-label="Save pending score changes"
              title="Save changes"
              disabled={isSaving}
            >
              <SaveIcon />
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div ref={menuRef} className="burger-menu">
            <div className="burger-menu-profile">
              <p className="burger-menu-label">Customer</p>
              <p className="burger-menu-name">{displayName}</p>
              <p className="burger-menu-email">{user?.email ?? 'Unknown user'}</p>
            </div>
            <button type="button" className="burger-menu-item" onClick={openAddItemDialog}>
              Add item
            </button>
            <button type="button" className="burger-menu-item burger-menu-item-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}

        {isAddDialogOpen && (
          <div className="dialog-backdrop" onClick={closeAddItemDialog}>
            <section
              className="dialog-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-item-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="dialog-header">
                <div>
                  <p className="dialog-eyebrow">Menu</p>
                  <h2 id="add-item-title">Add item</h2>
                </div>
                <button
                  type="button"
                  className="dialog-close-button"
                  onClick={closeAddItemDialog}
                  aria-label="Close add item dialog"
                >
                  <ClearIcon />
                </button>
              </div>

              <form className="dialog-form" onSubmit={handleAddItemSubmit}>
                <label htmlFor="add-item-name">Item name</label>
                <input
                  ref={addItemInputRef}
                  id="add-item-name"
                  type="text"
                  placeholder="Enter an item name"
                  value={newItemName}
                  disabled={isSubmittingItem}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setNewItemName(nextValue);
                    if (nextValue.trim().toLowerCase() !== selectedSuggestionName) {
                      setSelectedSuggestionName('');
                    }
                    setAddItemError('');
                  }}
                  autoComplete="off"
                />
                {addItemError && <p className="auth-error">{addItemError}</p>}

                <div className="dialog-suggestions">
                  <p className="dialog-suggestions-title">Matching items from your current list</p>
                  {normalizedNewItemName ? (
                    matchingSuggestions.length > 0 ? (
                      <ul className="dialog-suggestions-list">
                        {matchingSuggestions.map((suggestion, index) => {
                          const suggestionKey = getItemIdentity(suggestion, index);
                          const suggestionLabel = getItemLabel(suggestion);

                          return (
                            <li key={suggestionKey}>
                              <button
                                type="button"
                                className={`dialog-suggestion-button${
                                  selectedSuggestionName === suggestionLabel.trim().toLowerCase() ? ' is-selected' : ''
                                }`}
                                onClick={() => handleSuggestionPick(suggestion)}
                                aria-pressed={selectedSuggestionName === suggestionLabel.trim().toLowerCase()}
                              >
                                <span>{suggestionLabel}</span>
                                <span>{getQuantityLabel(suggestion)}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="dialog-empty-state">No matching items found.</p>
                    )
                  ) : (
                    <p className="dialog-empty-state">Start typing to see matching items.</p>
                  )}
                </div>

                <div className="dialog-actions">
                  <button type="button" className="button-secondary" onClick={closeAddItemDialog} disabled={isSubmittingItem}>
                    Cancel
                  </button>
                  <button type="submit" disabled={!canAddItem || isSubmittingItem}>
                    {isSubmittingItem ? (isUpdateItemMode ? 'Updating...' : 'Adding...') : isUpdateItemMode ? 'Update item' : 'Add item'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {toastMessage && (
          <div className="dashboard-toast" role="status" aria-live="polite">
            {toastMessage}
          </div>
        )}
      </section>
    </main>
  );
}
