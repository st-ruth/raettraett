import { Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import Home from './pages/Home';
import Randomizer from './pages/Randomizer';
import Calendar from './pages/Calendar';
import Saved from './pages/Saved';

import {DishProvider} from './context/DishContext';

export default function App() {
  return (
    <DishProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="slumpa" element={<Randomizer />} />
          <Route path="kalender" element={<Calendar />} />
          <Route path="sparat" element={<Saved />} />
        </Route>
      </Routes>
    </DishProvider>
  );
}