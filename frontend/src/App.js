import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Predict from './pages/Predict';
import Customer from './pages/Customer';
import Vehicle from './pages/Vehicle';
import ServiceOrder from './pages/ServiceOrder';
import Dashboard from './pages/Dashboard';
import Survey from './pages/Survey';
import NotFound from './pages/NotFound';
import './App.css';

// با عوض شدن صفحه، به بالای صفحه برمی‌گردد
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/customer" element={<Customer />} />
            <Route path="/vehicle" element={<Vehicle />} />
            <Route path="/service-order" element={<ServiceOrder />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/survey" element={<Survey />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
