import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GuestPage from '../src/pages/Guest';
import HostPage from '../src/pages/Host';
// import AdminPage from '../src/components/admin/AdminDashboard';
import './App.css';

function App() {
  return (
    // <AdminPage />
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<GuestPage />} />
          <Route path="/host" element={<HostPage />} />
          {/* <Route path="/admin" element={<AdminDashboard />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;