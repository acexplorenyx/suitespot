import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GuestPage from '../src/pages/Guest';
import HostPage from '../src/pages/Host';
// import AdminPage from '../src/components/admin/AdminDashboard';
import VerificationSuccess from '../src/components/common/VerificationSuccess';

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
          <Route path="/verify-success" element={<VerificationSuccess />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;