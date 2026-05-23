import React, { useState } from 'react';
import StaffLoginPage from './pages/StaffLoginPage';
import MainDashboardShell from './layouts/MainDashboardShell';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInStaff, setLoggedInStaff] = useState(null);

  const handleLoginSuccess = (staffMember) => {
    setLoggedInStaff(staffMember);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setLoggedInStaff(null);
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-slate-900">
      {isLoggedIn ? (
        <MainDashboardShell loggedInStaff={loggedInStaff} onLogout={handleLogout} />
      ) : (
        <StaffLoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;
