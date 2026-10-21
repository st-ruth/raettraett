// innehåller <Header />, din sida-yta via <Oultet /> och längst ner <Navbar />
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useDishContext } from "../context/useDishContext";
import '../styles/layout.css';

export default function Layout() {
  const { dishActionNotice, clearDishActionNotice } = useDishContext();

  return (
    <div className="app-layout">
        <a className="skip-link" href="#main-content">Hoppa till innehåll</a>
        <Header />
        {dishActionNotice && (
          <div
            className={`dish-action-notice ${dishActionNotice.type}`}
            role={dishActionNotice.type === 'error' ? 'alert' : 'status'}
          >
            <p>{dishActionNotice.message}</p>
            <button type="button" onClick={clearDishActionNotice} aria-label="Stäng meddelandet">
              Stäng
            </button>
          </div>
        )}
        <main className="main-content" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <Footer />
    </div>
  );
}