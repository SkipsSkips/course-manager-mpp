import React, { useEffect } from 'react';
// Remove Link from imports as it's not used directly in this file
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import AddCourse from './pages/AddCourse';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Navigation from './components/Navigation';
import { courseService } from './services/courseService';
import { generateMockCourses } from './utils/generateMockCourses';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ConnectionStatus from './components/ConnectionStatus';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Something went wrong.</h1>
          <p className="text-gray-600">{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Create a context to share simulation state across components
export const SimulationContext = React.createContext({
  isSimulationRunning: false,
  toggleSimulation: () => {}
});

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = React.useContext(AuthContext);
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function AppContent() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [editingCourse, setEditingCourse] = React.useState(null);
  const [isSimulationRunning, setIsSimulationRunning] = React.useState(false);
  const navigate = useNavigate();
  const { currentUser } = React.useContext(AuthContext);

  const handleAdd = () => {
    setRefreshKey(prev => prev + 1);
    setEditingCourse(null);
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    navigate('/add');
  };

  const toggleSimulation = async () => {
    try {
      if (isSimulationRunning) {
        // Stop simulation
        await fetch('/api/simulation/stop', { method: 'POST' });
        setIsSimulationRunning(false);
        toast.info("Course simulation stopped");
      } else {
        // Start simulation
        await fetch('/api/simulation/start', { method: 'POST' });
        setIsSimulationRunning(true);
        toast.info("Course simulation started");
      }
    } catch (error) {
      console.error("Error toggling simulation:", error);
      toast.error("Failed to toggle simulation");
    }
  };

  useEffect(() => {
    // Check simulation status when component mounts
    const checkSimulationStatus = async () => {
      try {
        const response = await fetch('/api/simulation/status');
        const data = await response.json();
        setIsSimulationRunning(data.isRunning);
      } catch (error) {
        console.error("Error checking simulation status:", error);
      }
    };
    
    checkSimulationStatus();
    
    // Setup SSE for real-time updates
    const eventSource = new EventSource('/api/courses/events');
    
    eventSource.addEventListener('courseUpdated', (event) => {
      const data = JSON.parse(event.data);
      if (data.action === 'add') {
        toast.info(data.message || "New course added");
      } else if (data.action === 'delete') {
        toast.warn(data.message || "Course deleted");
      }
      
      // Trigger refresh
      window.dispatchEvent(new Event('courseUpdated'));
    });
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <SimulationContext.Provider value={{ isSimulationRunning, toggleSimulation }}>
      <div className="min-h-screen bg-gray-50">
        {/* Only show main nav on authenticated routes */}
        {currentUser && (
          <Navigation />
        )}
        
        <Routes>
          {/* Public routes */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Home key={refreshKey} onEdit={handleEdit} />
            </ProtectedRoute>
          } />
          <Route path="/add" element={
            <ProtectedRoute>
              <AddCourse onAdd={handleAdd} initialData={editingCourse} />
            </ProtectedRoute>
          } />
          
          {/* Redirect to landing or home based on auth status */}
          <Route path="*" element={
            currentUser ? <Navigate to="/" /> : <Navigate to="/landing" />
          } />
        </Routes>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <ConnectionStatus />
      </div>
    </SimulationContext.Provider>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
