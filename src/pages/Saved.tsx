import { useState } from 'react';
import DishCard from '../components/DishCard';
import DishFormModal from '../components/DishFormModal';
// 1. Vi importerar nu din globala hook istället för dummyData!
import { useDishContext } from '../context/useDishContext'; 
import { Plus, X, SlidersHorizontal, Smile, Meh, Trash, Clock, Hourglass } from 'lucide-react';
import '../styles/saved.css';

type Tab = 'yes' | 'no' | 'maybe';

export default function Saved() {
  const [activeTab, setActiveTab] = useState<Tab>('yes');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isDishFormModalOpen, setIsDishFormModalOpen] = useState(false);

  // 2. Hämta alla rätter OCH funktionen för att flytta dem från Context
  const { dishes, userDishStatuses, updateDishStatus } = useDishContext();

 // Filtrerar fram rätterna baserat på vald flik och sökord
  const filteredDishes = dishes.filter(dish => {
    const matchesTab = userDishStatuses[dish.id] === activeTab; 
    
    // 2. Sökfunktionen fungerar precis som innan
    const matchesSearch = dish.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  return (
    <div className="saved-page">
      
      {/* Toppsektion med Sök och Sortering/Filtrering */}
      <div className="saved-header">
        <div className="search-filter-bar">
          <input 
            type="text" 
            placeholder="Sök efter maträtt..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Sortera och filtrera"
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {activeTab === 'yes' && (
          <button
            className="add-dish-btn"
            onClick={() => setIsDishFormModalOpen(true)}
          >
            <Plus size={20} />
            Lägg till maträtt
          </button>
        )}

        {/* Toggle-meny för Sortering och Filtrering som fälls ut */}
        {showFilters && (
          <div className="filter-dropdown">
            <p>Sortera på: <span>A-Ö</span> | <span>Senast tillagd</span></p>
            <p>
              Filtrera:{' '}
              <span><Clock size={16} aria-hidden="true" /> Snabb</span>
              {' | '}
              <span><Hourglass size={16} aria-hidden="true" /> Långkok</span>
            </p>
          </div>
        )}

        {/* Flikar (Tabs) */}
        <div className="saved-tabs">
          <button 
            className={`tab-btn ${activeTab === 'yes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('yes')}
            aria-label="Ja-listan"
          >
            <Smile size={22} />
          </button>
          <button 
            className={`tab-btn ${activeTab === 'maybe' ? 'active' : ''}`} 
            onClick={() => setActiveTab('maybe')}
            aria-label="Kanske"
          >
            <Meh size={22} />
          </button>
          <button 
            className={`tab-btn ${activeTab === 'no' ? 'active' : ''}`} 
            onClick={() => setActiveTab('no')}
            aria-label="Nej-listan"
          >
            <Trash size={22} />
          </button>
        </div>
      </div>

      {/* Listan med rätter */}
      <div className="saved-list">
        {filteredDishes.length > 0 ? (
          filteredDishes.map(dish => (
            <DishCard key={dish.id} dish={dish} variant="calendar">
              
              <div className="compact-actions">
                {activeTab === 'maybe' && (
                  <button 
                    className="action-icon add" 
                    aria-label="Flytta till Ja-listan"
                    // 4. Klickar man på Plus skickas rätten till Ja-listan ('yes')
                    onClick={() => updateDishStatus(dish.id, 'yes')}
                  >
                    <Plus size={20} />
                  </button>
                )}
                
                {/* Ta bort användarens val så rätten blir osedd igen. */}
                <button 
                  className="action-icon remove" 
                  aria-label="Ta bort"
                  onClick={() => updateDishStatus(dish.id, undefined)}
                >
                  <X size={20} />
                </button>
              </div>

            </DishCard>
          ))
        ) : (
          <p className="empty-state">Inga rätter hittades i den här listan.</p>
        )}
      </div>

      <DishFormModal
        isOpen={isDishFormModalOpen}
        onClose={() => setIsDishFormModalOpen(false)}
      />
    </div>
  );
}