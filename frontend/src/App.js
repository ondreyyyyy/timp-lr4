import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Incidents from './pages/Incidents';
import Vulnerabilities from './pages/Vulnerabilities';
import ResponseLogs from './pages/ResponseLogs';
import VulTypes from './pages/Vultype';
import ResponseMeasures from './pages/responsemeasures';
import Objects from './pages/Objects';
import Staff from './pages/Staff';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Toast from './components/Toast';

function App() {
  return (
    <>
      <Toast />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={
              <ProtectedRoute>
                  <Layout />
              </ProtectedRoute>
          }>
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/vulnerabilities" element={<Vulnerabilities />} />
              <Route path="/response-logs" element={<ResponseLogs />} />
              <Route path="/objects" element={<Objects />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/vul-types" element={<VulTypes />} />
              <Route path="/response-measures" element={<ResponseMeasures />} />    
              
              <Route path="/" element={<Navigate to="/incidents" replace />} />
          </Route>
          
          <Route path="*" element={<h1 style={{textAlign: 'center', marginTop: '50px'}}>404 - Страница не найдена</h1>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;