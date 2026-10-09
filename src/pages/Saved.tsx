import { useState } from 'react';
import DishCard from '../components/DishCard';
import DishFormModal from '../components/DishFormModal';
import { dummyDishes } from '../data/dummyData';
import { Plus, X, SlidersHorizontal, Smile, Meh, Trash, Clock, Hourglass } from 'lucide-react';
import '../styles/saved.css';

type Tab = 'yes' | 'maybe' | 'blocked';

export default function Saved() {
  const [activeTab, setActiveTab] = useState<Tab>('yes');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isDishFormModalOpen, setIsDishFormModalOpen] = useState(false);

  // Filtrerar fram rätterna baserat på vald flik och sökord
  // (Här antar vi att dina rätter har en status-prop. Justera efter din datastruktur)
  const filteredDishes = dummyDishes.filter(dish => {
    // För testning just nu, vi mappar om statusen lite om den saknas i dummyData
    const matchesTab = dish.status === activeTab || (activeTab === 'yes' && dish.status === 'repo'); 
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
            className={`tab-btn ${activeTab === 'blocked' ? 'active' : ''}`} 
            onClick={() => setActiveTab('blocked')}
            aria-label="Nej-listan"
          >
            <Trash size={22} />
          </button>
        </div>
      </div>

      {/* Listan med rätter (Förberedd för framtida Drag & Drop) */}
      <div className="saved-list">
        {filteredDishes.length > 0 ? (
          filteredDishes.map(dish => (
            <DishCard key={dish.id} dish={dish} variant="calendar">
              
              {/* Children: Dynamiska knappar som hamnar längst till höger i kortet */}
              <div className="compact-actions">
                {activeTab === 'maybe' && (
                  <button className="action-icon add" aria-label="Flytta till Ja-listan">
                    <Plus size={20} />
                  </button>
                )}
                
                {/* Krysset finns på alla listor */}
                <button className="action-icon remove" aria-label="Ta bort">
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