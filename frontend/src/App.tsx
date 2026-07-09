import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Routes>
      {/* Redirect Root */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* 404 */}
      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </Routes>
  );
}

export default App;