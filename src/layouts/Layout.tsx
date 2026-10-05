// innehåller <Header />, din sida-yta via <Oultet /> och längst ner <Navbar />
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";

export default function Layout() {
  return (
    <div className="app-layout">
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
        <Navbar />
    </div>
  );
}