import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import NewRental from "./NewRental";

import Customers from "./Customers";

import Settings from "./Settings";

import Vehicles from "./Vehicles";

import ActiveRentals from "./ActiveRentals";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    NewRental: NewRental,
    
    Customers: Customers,
    
    Settings: Settings,
    
    Vehicles: Vehicles,
    
    ActiveRentals: ActiveRentals,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/NewRental" element={<NewRental />} />
                
                <Route path="/Customers" element={<Customers />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Vehicles" element={<Vehicles />} />
                
                <Route path="/ActiveRentals" element={<ActiveRentals />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}