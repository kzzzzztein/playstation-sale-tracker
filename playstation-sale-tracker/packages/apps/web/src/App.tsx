import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar.js";
import { Footer } from "./components/Footer.js";
import Home from "./pages/Home.js";
import Games from "./pages/Games.js";
import GameDetail from "./pages/GameDetail.js";
import Sales from "./pages/Sales.js";
import BiggestDiscounts from "./pages/BiggestDiscounts.js";
import LowestPrices from "./pages/LowestPrices.js";
import Regions from "./pages/Regions.js";
import Search from "./pages/Search.js";
import About from "./pages/About.js";
import Admin from "./pages/Admin.js";
import NotFound from "./pages/NotFound.js";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/:slug" element={<GameDetail />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sales/biggest-discounts" element={<BiggestDiscounts />} />
          <Route path="/sales/lowest-prices" element={<LowestPrices />} />
          <Route path="/regions" element={<Regions />} />
          <Route path="/search" element={<Search />} />
          <Route path="/about" element={<About />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
