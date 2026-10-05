// Navigationsmeny alltid synlig i botten på mobilversion. Dataversionen får jag fundera på
import { NavLink } from 'react-router-dom';
import { Home, Dices, CalendarDays, Heart } from 'lucide-react';

export default function NavBar() {
  return (
    <div className='navbar-container'>
        <nav className='navbar'>
          
          <NavLink to='/' className='nav-item' aria-label='Hem'>
            <Home className='nav-icon' />
          </NavLink>

           <NavLink to='/slumpa' className='nav-item' aria-label='Slumpa'>
            <Dices className='nav-icon' />
          </NavLink>

           <NavLink to='/kalender' className='nav-item' aria-label='Kalender'>
            <CalendarDays className='nav-icon' />
          </NavLink>

           <NavLink to='/sparat' className='nav-item' aria-label='Sparat'>
            <Heart className='nav-icon' />
          </NavLink>
        </nav>
    </div>
  );
}