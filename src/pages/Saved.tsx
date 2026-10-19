import { useState } from 'react';
import DishCard from '../components/DishCard';
import DishFormModal from '../components/DishFormModal';
import { useDishContext } from '../context/useDishContext'; 
import { useAuth } from '../context/useAuth';
import { AUTH_REQUIRED_MESSAGE } from '../context/AuthContext';
import { useDishFilter } from '../hooks/useDishFilter';
import type { ProteinType } from '../types/dish'; // <-- Linter fix: Importerar ProteinType
import { Plus, X, SlidersHorizontal, Smile, Meh, Trash, Clock } from 'lucide-react';
import '../styles/saved.css';

type Tab = 'yes' | 'no' | 'maybe';

export default function Saved() {
  const [activeTab, setActiveTab] = useState<Tab>('yes');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isDishFormModalOpen, setIsDishFormModalOpen] = useState(false);

  const { dishes, userDishStatuses, updateDishStatus } = useDishContext();
  const { requireAuth } = useAuth();

  const baseFilteredDishes = dishes.filter(dish => {
    const matchesTab = userDishStatuses[dish.id] === activeTab; 
    const matchesSearch = dish.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const {
    processedDishes,
    sortBy,
    setSortBy,
    proteinFilter,
    setProteinFilter,
    quickFilter,
    setQuickFilter
  } = useDishFilter(baseFilteredDishes);

  return (
    <div className="saved-page">
      <h1 className="visually-hidden">Sparade maträtter</h1>
      
      <div className="saved-header">
        <div className="search-filter-bar">
          <input 
            type="text" 
            aria-label="Sök efter maträtt"
            placeholder="Sök efter maträtt..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button 
            type="button"
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Sortera och filtrera"
            aria-expanded={showFilters}
            aria-controls="saved-filter-options"
          >
            <SlidersHorizontal size={20} aria-hidden="true" />
          </button>
        </div>

        {activeTab === 'yes' && (
          <button
            type="button"
            className="add-dish-btn"
            onClick={() => {
              if (requireAuth(AUTH_REQUIRED_MESSAGE)) setIsDishFormModalOpen(true);
            }}
          >
            <Plus size={20} aria-hidden="true" />
            Lägg till maträtt
          </button>
        )}

        {showFilters && (
          <div
            className="filter-dropdown"
            id="saved-filter-options"
            role="region"
            aria-label="Sortering och filtrering"
          >
            <div className="filter-row">
              <label className="filter-option-label" htmlFor="sort-select">Sortera på:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'a-z' | 'z-a')} // <-- Linter fix!
                className="filter-select"
              >
                <option value="a-z">Namn (A-Ö)</option>
                <option value="z-a">Namn (Ö-A)</option>
              </select>
            </div>

            <div className="filter-row filter-row-wrap">
              <label className="filter-option-label" htmlFor="protein-select">Protein:</label>
              <select
                id="protein-select"
                value={proteinFilter}
                onChange={(e) => setProteinFilter(e.target.value as ProteinType | 'all')} // <-- Linter fix!
                className="filter-select"
              >
                <option value="all">Alla proteiner</option>
                <option value="chicken">Kyckling</option>
                <option value="mince">Färs</option>
                <option value="sausage">Korv</option>
                <option value="fish">Fisk</option>
                <option value="stew">Gryta</option>
              </select>

              <label className="quick-filter-label">
                <input
                  type="checkbox"
                  checked={quickFilter}
                  onChange={(e) => setQuickFilter(e.target.checked)}
                />
                <Clock size={16} aria-hidden="true" /> Snabblagat (under 30 min)
              </label>
            </div>
          </div>
        )}

        <div className="saved-tabs" role="group" aria-label="Filtrera rätter efter status">
          <button 
            type="button"
            className={`tab-btn ${activeTab === 'yes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('yes')}
            aria-label="Ja-listan"
            aria-pressed={activeTab === 'yes'}
          >
            <Smile size={22} aria-hidden="true" />
          </button>
          <button 
            type="button"
            className={`tab-btn ${activeTab === 'maybe' ? 'active' : ''}`} 
            onClick={() => setActiveTab('maybe')}
            aria-label="Kanske"
            aria-pressed={activeTab === 'maybe'}
          >
            <Meh size={22} aria-hidden="true" />
          </button>
          <button 
            type="button"
            className={`tab-btn ${activeTab === 'no' ? 'active' : ''}`} 
            onClick={() => setActiveTab('no')}
            aria-label="Nej-listan"
            aria-pressed={activeTab === 'no'}
          >
            <Trash size={22} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="saved-list">
        {processedDishes.length > 0 ? (
          processedDishes.map(dish => (
            <DishCard key={dish.id} dish={dish} variant="calendar">
              
              <div className="compact-actions">
                {activeTab === 'maybe' && (
                  <button 
                    type="button"
                    className="action-icon add" 
                    aria-label="Flytta till Ja-listan"
                    onClick={() => updateDishStatus(dish.id, 'yes')}
                  >
                    <Plus size={20} aria-hidden="true" />
                  </button>
                )}
                
                <button 
                  type="button"
                  className="action-icon remove" 
                  aria-label={`Ta bort ${dish.title} från listan`}
                  onClick={() => updateDishStatus(dish.id, undefined)}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

            </DishCard>
          ))
        ) : (
          <p className="empty-state">Inga rätter hittades med dessa filter.</p>
        )}
      </div>

      <DishFormModal
        isOpen={isDishFormModalOpen}
        onClose={() => setIsDishFormModalOpen(false)}
      />
    </div>
  );
}