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

  const toggleSimulation = () => {
    setIsSimulationRunning(prev => !prev);
    toast.info(`Course simulation ${!isSimulationRunning ? 'started' : 'stopped'}`);
  };

  useEffect(() => {
    // Simulate real-time updates only if simulation is running
    let updateInterval;
    let isMounted = true;
    
    if (isSimulationRunning) {
      updateInterval = setInterval(async () => {
        try {
          // Check if component is still mounted
          if (!isMounted) return;
          
          // Fetch current courses to determine the number of courses
          const currentCourses = await courseService.getCourses();

          // Only continue if the component is still mounted
          if (!isMounted) return;

          // Randomly decide the type of update
          const action = Math.random();

          if (action < 0.5) {
            // Add 1-2 new courses (50% chance)
            const numCoursesToAdd = Math.random() < 0.5 ? 1 : 2;
            const newCourses = generateMockCourses(numCoursesToAdd);
            for (const newCourse of newCourses) {
              if (!isMounted) return;
              await courseService.addCourse(newCourse);
              toast.info(`New course added: ${newCourse.title}`, { autoClose: 3000 });
            }
          } else if (currentCourses.length >= 3) {
            // Delete 1-2 random courses (50% chance, if there are at least 3 courses)
            const numCoursesToDelete = Math.random() < 0.5 ? 1 : 2;
            const coursesToDelete = [];
            for (let i = 0; i < numCoursesToDelete && currentCourses.length > 2; i++) {
              if (!isMounted) return;
              const randomIndex = Math.floor(Math.random() * currentCourses.length);
              const courseToDelete = currentCourses[randomIndex];
              if (!coursesToDelete.includes(courseToDelete)) {
                coursesToDelete.push(courseToDelete);
                await courseService.deleteCourse(courseToDelete.id);
                toast.warn(`Course deleted: ${courseToDelete.title}`, { autoClose: 3000 });
              }
              currentCourses.splice(randomIndex, 1); // Remove from local array to avoid re-selecting
            }
          }
        } catch (error) {
          console.error('Simulation error:', error);
        }
      }, 10000); // Run every 10 seconds
    }

    return () => {
      isMounted = false;
      if (updateInterval) clearInterval(updateInterval);
    };
  }, [isSimulationRunning]);

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
