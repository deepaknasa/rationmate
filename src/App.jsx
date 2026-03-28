import { useEffect, useRef, useState } from 'react';

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

function getColorRank(scoreValue) {
  const score = Number(scoreValue) || 0;
  if (score < 25) return 1;
  if (score < 50) return 2;
  if (score < 75) return 3;
  return 4;
}

function normalizeData(data) {
  const list = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);

  return list.map((item, index) => ({
    id: item.id ?? `row-${index + 1}`,
    name: item.name ?? 'Untitled',
    score: Number(item.score ?? item.weightage ?? 0),
    savedFillPercentage: item.savedFillPercentage ?? null,
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
  const icon = sortMode === 'name'
    ? 'A-Z'
    : sortMode === 'colour'
      ? '\u25CF'
      : '\u21C5';

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

function CardRow({
  item,
  canDrag,
  onDragStart,
  onDropOn,
  onSlideStarted,
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
    onSlideStarted();

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
  const [items, setItems] = useState(demoItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortMode, setSortMode] = useState('default');
  const [draggedId, setDraggedId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasPendingSlides, setHasPendingSlides] = useState(false);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeoutId = window.setTimeout(() => setToastMessage(''), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const filteredItems = items.filter((item) => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return true;
    return String(item.id).toLowerCase().includes(term) || String(item.name).toLowerCase().includes(term);
  });

  if (sortMode === 'name') {
    filteredItems.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  } else if (sortMode === 'colour') {
    filteredItems.sort((a, b) => (
      getColorRank(a.score) - getColorRank(b.score)
      || String(a.name).localeCompare(String(b.name))
    ));
  }

  function cycleSortMode() {
    setSortMode((current) => {
      if (current === 'default') return 'name';
      if (current === 'name') return 'colour';
      return 'default';
    });
  }

  function openSearchModal() {
    setSearchDraft(searchQuery);
    setIsSearchOpen(true);
  }

  function closeSearchModal() {
    setIsSearchOpen(false);
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

  function markSlidesPending() {
    setHasPendingSlides(true);
  }

  function reorderItems(targetId) {
    if (!draggedId || draggedId === targetId || sortMode !== 'default') return;

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

  async function loadData() {
    setIsLoading(true);

    try {
      const response = await fetch('/api/ration-items');
      const data = await response.json();
      const normalized = normalizeData(data);

      setItems(normalized);
      setHasPendingSlides(false);
      setToastMessage('Cards synced');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setToastMessage(`Sync failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveItems() {
    const dirtyItems = items
      .filter((item) => item.savedFillPercentage !== null)
      .map((item) => ({
        id: item.id,
        score: item.savedFillPercentage,
        fillDate: getTodayDateString(),
      }));

    if (!dirtyItems.length) {
      setHasPendingSlides(false);
      setToastMessage('No items to save');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/functions/v1/update-ration-item', {
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
      setHasPendingSlides(false);
      setToastMessage('Items are saved');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setToastMessage(`Save failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }

  function handleMiddleAction() {
    if (hasPendingSlides) {
      saveItems();
      return;
    }

    loadData();
  }

  const middleLabel = hasPendingSlides ? 'Save cards' : 'Sync cards';
  const middleTitle = hasPendingSlides ? 'Save cards' : 'Sync cards';
  const middleIcon = hasPendingSlides ? '\uD83D\uDCBE' : '\u27F3';

  return (
    <>
      <div className="page">
        <section id="cardList" className="list">
          {filteredItems.length ? filteredItems.map((item) => (
            <CardRow
              key={item.id}
              item={item}
              canDrag={sortMode === 'default'}
              onDragStart={setDraggedId}
              onDropOn={reorderItems}
              onSlideStarted={markSlidesPending}
              onSlideLeft={(fillPercentage) => {
                setItems((current) => current.map((entry) => (
                  String(entry.id) === String(item.id)
                    ? { ...entry, savedFillPercentage: fillPercentage }
                    : entry
                )));
                setToastMessage(`Left fill ${fillPercentage}%`);
              }}
              onSlideRight={() => setToastMessage('Slid right')}
            />
          )) : (
            <div className="empty-state">No cards found.</div>
          )}
        </section>

        <div className="bottom-bar">
          <ActionButton
            label={sortMode === 'default' ? 'Sort cards' : sortMode === 'name' ? 'Sorting by name' : 'Sorting by colour'}
            title={sortMode === 'default' ? 'Sort cards' : sortMode === 'name' ? 'Sorting by name' : 'Sorting by colour'}
            onClick={cycleSortMode}
            disabled={isLoading}
          >
            <SortIcon sortMode={sortMode} />
          </ActionButton>
          <ActionButton
            label={middleLabel}
            title={middleTitle}
            icon={middleIcon}
            onClick={handleMiddleAction}
            primary
            disabled={isLoading}
          />
          <ActionButton
            label="Open search"
            title="Search"
            icon={'\uD83D\uDD0D'}
            onClick={openSearchModal}
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



