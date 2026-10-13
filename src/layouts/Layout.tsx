// innehåller <Header />, din sida-yta via <Oultet /> och längst ner <Navbar />
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import '../styles/layout.css';

export default function Layout() {
  return (
    <div className="app-layout">
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
        <Footer />
    </div>
  );
}