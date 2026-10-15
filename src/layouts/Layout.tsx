// innehåller <Header />, din sida-yta via <Oultet /> och längst ner <Navbar />
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import '../styles/layout.css';

export default function Layout() {
  return (
    <div className="app-layout">
        <a className="skip-link" href="#main-content">Hoppa till innehåll</a>
        <Header />
        <main className="main-content" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <Footer />
    </div>
  );
}