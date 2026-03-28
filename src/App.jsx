import { useEffect, useRef, useState } from 'react';

const DEMO_RETRY_SECONDS = 45;
const demoItems = [
  { id: 1, name: 'Critical Risk', score: 18 },
  { id: 2, name: 'Compliance Review', score: 37 },
  { id: 3, name: 'Customer Onboarding', score: 63 },
  { id: 4, name: 'Operational Health', score: 88 },
  { id: 5, name: 'Service Stability', score: 52 },
  { id: 6, name: 'Stability', score: 45 },
  { id: 7, name: 'Mine Bug', score: 21 },
  { id: 8, name: 'Swiss Alps', score: 99 },
  { id: 9, name: 'Beach Towels', score: 19 },
  { id: 10, name: 'Apples', score: 49 },
  { id: 11, name: 'Milk', score: 82 },
  { id: 12, name: 'Data Sync', score: 56 },
  { id: 13, name: 'API Latency', score: 72 },
  { id: 14, name: 'Database Load', score: 64 },
  { id: 15, name: 'UI Responsiveness', score: 77 },
  { id: 16, name: 'Cache Efficiency', score: 41 },
  { id: 17, name: 'Error Rate', score: 23 },
  { id: 18, name: 'Security Audit', score: 91 },
  { id: 19, name: 'Access Control', score: 68 },
  { id: 20, name: 'Network Throughput', score: 74 },
  { id: 21, name: 'Queue Processing', score: 59 },
  { id: 22, name: 'Event Streaming', score: 66 },
  { id: 23, name: 'gRPC Calls', score: 53 },
  { id: 24, name: 'Thread Pool Usage', score: 47 },
  { id: 25, name: 'Memory Pressure', score: 84 },
  { id: 26, name: 'Disk IO', score: 61 },
  { id: 27, name: 'Backup Status', score: 79 },
  { id: 28, name: 'Deployment Health', score: 86 },
  { id: 29, name: 'Feature Adoption', score: 58 },
  { id: 30, name: 'User Retention', score: 73 },
  { id: 31, name: 'Billing Accuracy', score: 69 },
  { id: 32, name: 'Notification Delivery', score: 54 },
  { id: 33, name: 'Search Performance', score: 62 },
  { id: 34, name: 'Data Integrity', score: 93 },
  { id: 35, name: 'Failover Readiness', score: 81 },
  { id: 36, name: 'Latency Spikes', score: 44 },
];

function getCardClass(scoreValue) {
  const score = Number(scoreValue) || 0;
  if (score < 25) return 'card-black';
  if (score < 50) return 'card-red';
  if (score < 75) return 'card-orange';
  return 'card-green';
}

function getDisplayScore(item) {
  return item.savedFillPercentage ?? item.score;
}

function hasDirtyScore(item) {
  return item.savedFillPercentage !== null
    && Number(item.savedFillPercentage) !== Number(item.score);
}

function normalizeData(data) {
  const list = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);

  return list.map((item, index) => ({
    id: item.id ?? `row-${index + 1}`,
    name: item.name ?? 'Untitled',
    score: Number(item.score ?? item.weightage ?? 0),
    savedFillPercentage: item.savedFillPercentage == null ? null : Number(item.savedFillPercentage),
  }));
}

function getTodayDateString() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


function SortIcon({ sortMode }) {
  const icon = sortMode === 'score-asc'
    ? '\u2191'
    : '\u2193';

  return <span className="icon" aria-hidden="true">{icon}</span>;
}


function ActionButton({ label, title, icon, onClick, primary = false, disabled = false, children }) {
  return (
    <button
      type="button"
      className={`icon-btn${primary ? ' primary' : ''}`}
      aria-label={label}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {children ?? <span className="icon" aria-hidden="true">{icon}</span>}
    </button>
  );
}

function SearchModal({
  isOpen,
  searchDraft,
  setSearchDraft,
  onClose,
  onSearch,
  onReset,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter') {
        onSearch();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, onSearch]);

  if (!isOpen) return null;

  return (
    <div className="search-modal" aria-hidden="false">
      <div className="search-backdrop" onClick={onClose} />
      <div className="search-sheet" role="dialog" aria-modal="true" aria-labelledby="searchTitle">
        <div className="search-sheet-header">
          <h2 id="searchTitle" className="search-sheet-title">Search cards</h2>
          <ActionButton
            label="Close search"
            title="Close search"
            icon={'\u2715'}
            onClick={onClose}
          />
        </div>
        <div className="search-sheet-body">
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Search by name or id"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
          <div className="search-actions">
            <button type="button" className="btn btn-primary" onClick={onSearch}>Search</button>
            <button type="button" className="btn btn-secondary" onClick={onReset}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuOverlay({ isOpen, onClose, onSync, onAddItem, isLoading }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="menu-modal" aria-hidden="false">
      <div className="menu-backdrop" onClick={onClose} />
      <div className="menu-sheet" role="dialog" aria-modal="true" aria-labelledby="menuTitle">
        <div className="menu-sheet-header">
          <h2 id="menuTitle" className="menu-sheet-title">Menu</h2>
          <ActionButton
            label="Close menu"
            title="Close menu"
            icon={'\u2715'}
            onClick={onClose}
          />
        </div>
        <div className="menu-actions">
          <button type="button" className="btn btn-primary" onClick={onSync} disabled={isLoading}>Sync</button>
          <button type="button" className="btn btn-secondary" onClick={onAddItem}>Add item</button>
        </div>
      </div>
    </div>
  );
}
function TopPlaceholderBar() {
  return (
    <header className="top-placeholder" aria-label="Company placeholder">
      <div className="top-placeholder-logo" aria-hidden="true">
        <svg viewBox="0 0 64 64" className="top-placeholder-logo-svg">
          <rect x="14" y="24" width="36" height="24" rx="8" fill="currentColor" opacity="0.18" />
          <path d="M20 28h24l-3 16H23L20 28Z" fill="currentColor" />
          <path d="M24 24c0-4 3-7 8-7s8 3 8 7" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M36 14c3 0 6-3 6-6-3 0-6 3-6 6Z" fill="currentColor" />
        </svg>
      </div>
    </header>
  );
}
function CardRow({
  item,
  canDrag,
  onDragStart,
  onDropOn,
  onSlideLeft,
  onSlideRight,
}) {
  const cardRef = useRef(null);
  const slideRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    axis: null,
    pointerId: null,
  });
  const supportsPointer = typeof window !== 'undefined' && 'PointerEvent' in window;
  const [translateX, setTranslateX] = useState(0);
  const [fillPercentage, setFillPercentage] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  function getSlideBounds() {
    const cardWidth = cardRef.current?.offsetWidth ?? 0;
    return {
      leftLimit: cardWidth * 0.75,
      rightLimit: cardWidth * 0.25,
    };
  }

  function getLeftSlideFillPercentage(leftDistance, leftLimit) {
    if (!leftLimit) return 0;
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

  function updateSlide(clientX, clientY, event) {
    if (!slideRef.current.active) return;

    const dx = clientX - slideRef.current.startX;
    const dy = clientY - slideRef.current.startY;

    if (!slideRef.current.axis && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      slideRef.current.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }

    if (slideRef.current.axis !== 'x') return;

    event.preventDefault?.();

    const { leftLimit, rightLimit } = getSlideBounds();
    const capped = Math.max(-leftLimit, Math.min(rightLimit, dx));
    const leftDistance = capped < 0 ? Math.abs(capped) : 0;

    setIsSliding(true);
    setTranslateX(capped);
    setFillPercentage(getLeftSlideFillPercentage(leftDistance, leftLimit));
  }

  function endSlide(clientX) {
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

  const rowClassName = `card-row${fillPercentage > 0 ? ' show-left-meter' : ''}`;
  const rowStyle = fillPercentage > 0
    ? {
        '--slide-fill': `${fillPercentage}%`,
        '--slide-fill-color': `hsl(${Math.round((fillPercentage / 100) * 120)} 82% 56%)`,
      }
    : undefined;
  const badgeValue = fillPercentage > 0
    ? fillPercentage
    : (item.savedFillPercentage ?? item.score);
  const cardClassName = `card ${getCardClass(badgeValue)}${isSliding ? ' sliding' : ''}`;
  const cardStyle = translateX !== 0 ? { transform: `translateX(${translateX}px)` } : undefined;
  const badgeText = `${badgeValue}%`;


  const pointerHandlers = supportsPointer ? {
    onPointerDown: (event) => {
      if (!event.isPrimary || event.pointerType === 'mouse') return;
      slideRef.current.active = true;
      slideRef.current.pointerId = event.pointerId;
      slideRef.current.startX = event.clientX;
      slideRef.current.startY = event.clientY;
      slideRef.current.axis = null;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event) => {
      if (!slideRef.current.active || event.pointerId !== slideRef.current.pointerId) return;
      updateSlide(event.clientX, event.clientY, event);
    },
    onPointerUp: (event) => {
      if (!slideRef.current.active || event.pointerId !== slideRef.current.pointerId) return;
      endSlide(event.clientX);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    onPointerCancel: (event) => {
      if (event.pointerId !== slideRef.current.pointerId) return;
      resetSlide();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
  } : {
    onTouchStart: (event) => {
      const touch = event.touches[0];
      slideRef.current.active = true;
      slideRef.current.startX = touch.clientX;
      slideRef.current.startY = touch.clientY;
      slideRef.current.axis = null;
    },
    onTouchMove: (event) => {
      const touch = event.touches[0];
      updateSlide(touch.clientX, touch.clientY, event);
    },
    onTouchEnd: (event) => {
      if (!slideRef.current.active) return;
      endSlide(event.changedTouches[0].clientX);
    },
    onTouchCancel: () => resetSlide(),
  };

  return (
    <div className={rowClassName} style={rowStyle}>
      <article
        ref={cardRef}
        className={cardClassName}
        style={cardStyle}
        draggable={canDrag}
        onDragStart={() => canDrag && onDragStart(item.id)}
        onDragOver={(event) => canDrag && event.preventDefault()}
        onDrop={(event) => {
          if (!canDrag) return;
          event.preventDefault();
          onDropOn(item.id);
        }}
        {...pointerHandlers}
      >
        <div className="card-content">
          <h3 className="card-title">{item.name}</h3>
        </div>
        <div className="score-badge">{badgeText}</div>
      </article>
      <div className="slide-meter" aria-hidden="true">
        <div className="slide-meter-fill" />
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sortMode, setSortMode] = useState('score-asc');
  const [draggedId, setDraggedId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(DEMO_RETRY_SECONDS);
  const [retryCycle, setRetryCycle] = useState(0);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeoutId = window.setTimeout(() => setToastMessage(''), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  useEffect(() => {
    loadData({ source: 'initial', useDemoFallback: true, showSuccessToast: false });
  }, []);

  useEffect(() => {
    if (!isUsingDemoData) return undefined;

    setRetryCountdown(DEMO_RETRY_SECONDS);
    const startedAt = Date.now();

    const intervalId = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      setRetryCountdown(Math.max(0, DEMO_RETRY_SECONDS - elapsedSeconds));
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      loadData({ source: 'retry', useDemoFallback: true, showSuccessToast: false });
    }, DEMO_RETRY_SECONDS * 1000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [isUsingDemoData, retryCycle]);

  const hasPendingChanges = items.some(hasDirtyScore);
  const filteredItems = items.filter((item) => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return true;
    return String(item.id).toLowerCase().includes(term) || String(item.name).toLowerCase().includes(term);
  });

  if (sortMode === 'score-asc') {
    filteredItems.sort((a, b) => (
      getDisplayScore(a) - getDisplayScore(b)
      || String(a.name).localeCompare(String(b.name))
    ));
  } else if (sortMode === 'score-desc') {
    filteredItems.sort((a, b) => (
      getDisplayScore(b) - getDisplayScore(a)
      || String(a.name).localeCompare(String(b.name))
    ));
  }

  function cycleSortMode() {
    setSortMode((current) => (current === 'score-asc' ? 'score-desc' : 'score-asc'));
  }

  function openSearchModal() {
    setSearchDraft(searchQuery);
    setIsSearchOpen(true);
  }

  function closeSearchModal() {
    setIsSearchOpen(false);
  }

  function openMenu() {
    setIsMenuOpen(true);
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function applySearch() {
    setSearchQuery(searchDraft);
    setIsSearchOpen(false);
  }

  function resetSearch() {
    setSearchDraft('');
    setSearchQuery('');
    setIsSearchOpen(false);
  }

  function reorderItems(targetId) {
    if (!draggedId || draggedId === targetId) return;

    setItems((current) => {
      const draggedIndex = current.findIndex((item) => String(item.id) === String(draggedId));
      const targetIndex = current.findIndex((item) => String(item.id) === String(targetId));

      if (draggedIndex === -1 || targetIndex === -1) return current;

      const updated = [...current];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
    setDraggedId(null);
  }

  async function loadData({
    source = 'manual',
    useDemoFallback = false,
    showSuccessToast = true,
  } = {}) {
    const showLoader = source !== 'retry';
    if (showLoader) {
      setIsLoading(true);
    }

    try {
      const response = await fetch('/api/ration-items');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const normalized = normalizeData(data);

      setItems(normalized);
      setIsUsingDemoData(false);
      setRetryCountdown(DEMO_RETRY_SECONDS);

      if (showSuccessToast) {
        setToastMessage(source === 'manual' ? 'Cards synced' : 'Server data loaded');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (useDemoFallback) {
        setItems((current) => (current.length ? current : demoItems));
        setIsUsingDemoData(true);
        setRetryCycle((current) => current + 1);

        if (source === 'manual') {
          setToastMessage(`Sync failed: ${message}`);
        }
      } else {
        setToastMessage(`Sync failed: ${message}`);
      }
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  }

  async function saveItems() {
    const dirtyItems = items
      .filter(hasDirtyScore)
      .map((item) => ({
        id: item.id,
        score: item.savedFillPercentage,
        fillDate: getTodayDateString(),
      }));

    if (!dirtyItems.length) {
      setToastMessage('No items to save');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/update-ration-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Reserved for future Supabase auth headers or payload extensions.
        body: JSON.stringify({ items: dirtyItems }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Save request failed');
      }

      setItems((current) => current.map((item) => (
        item.savedFillPercentage !== null
          ? { ...item, score: item.savedFillPercentage, savedFillPercentage: null }
          : item
      )));
      setToastMessage('Scores saved');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setToastMessage(`Save failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSyncAction() {
    closeMenu();
    loadData({ source: 'manual', useDemoFallback: true, showSuccessToast: true });
  }

  function handleAddItemAction() {
    closeMenu();
    setToastMessage('Add item is not implemented yet');
  }

  function cancelPendingChanges() {
    setItems((current) => current.map((item) => (
      item.savedFillPercentage !== null
        ? { ...item, savedFillPercentage: null }
        : item
    )));
    setToastMessage('Changes canceled');
  }

  return (
    <>
      <div className="page">
        <TopPlaceholderBar />

        {isUsingDemoData && (
          <div className="demo-ribbon" role="status" aria-live="polite">
            <span className="demo-ribbon-label">Demo data</span>
            <span>
              {retryCountdown > 0
                ? `Retrying server in ${retryCountdown}s`
                : 'Retrying server now...'}
            </span>
          </div>
        )}

        <section id="cardList" className={`list${isUsingDemoData ? ' list-with-ribbon' : ''}`}>
          {filteredItems.length ? filteredItems.map((item) => (
            <CardRow
              key={item.id}
              item={item}
              canDrag={false}
              onDragStart={setDraggedId}
              onDropOn={reorderItems}
              onSlideLeft={(fillPercentage) => {
                setItems((current) => current.map((entry) => (
                  String(entry.id) === String(item.id)
                    ? { ...entry, savedFillPercentage: fillPercentage }
                    : entry
                )));
                setToastMessage(`Score set to ${fillPercentage}%`);
              }}
              onSlideRight={() => setToastMessage('Slid right')}
            />
          )) : (
            <div className="empty-state">No cards found.</div>
          )}
        </section>

        <div className="bottom-bar">
          <ActionButton
            label="Open menu"
            title="Menu"
            icon={'\u2630'}
            onClick={openMenu}
            disabled={isLoading}
          />
          <ActionButton
            label={hasPendingChanges ? 'Cancel pending score changes' : (sortMode === 'score-desc' ? 'Sorting by score descending' : 'Sorting by score ascending')}
            title={hasPendingChanges ? 'Cancel pending score changes' : (sortMode === 'score-desc' ? 'Sorting by score descending' : 'Sorting by score ascending')}
            onClick={hasPendingChanges ? cancelPendingChanges : cycleSortMode}
            primary
            disabled={isLoading}
          >
            {hasPendingChanges
              ? <span className="icon" aria-hidden="true">{'\u2715'}</span>
              : <SortIcon sortMode={sortMode} />}
          </ActionButton>
          <ActionButton
            label={hasPendingChanges ? 'Save pending score changes' : 'Open search'}
            title={hasPendingChanges ? 'Save pending score changes' : 'Search'}
            icon={hasPendingChanges ? '\u2713' : '\uD83D\uDD0D'}
            onClick={hasPendingChanges ? saveItems : openSearchModal}
            primary
            disabled={isLoading}
          />
        </div>
      </div>

      {isLoading && (
        <div className="loading-overlay" aria-hidden="false">
          <div className="loading-spinner" />
        </div>
      )}

      {toastMessage && (
        <div className="toast" role="status" aria-live="polite">{toastMessage}</div>
      )}

      <MenuOverlay
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onSync={handleSyncAction}
        onAddItem={handleAddItemAction}
        isLoading={isLoading}
      />

      <SearchModal
        isOpen={isSearchOpen}
        searchDraft={searchDraft}
        setSearchDraft={setSearchDraft}
        onClose={closeSearchModal}
        onSearch={applySearch}
        onReset={resetSearch}
      />
    </>
  );
}








