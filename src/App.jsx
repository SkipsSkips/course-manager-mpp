import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import AddCourse from './pages/AddCourse';
import { courseService } from './services/courseService';
import { generateMockCourses } from './utils/generateMockCourses';

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

function AppContent() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [editingCourse, setEditingCourse] = React.useState(null);
  const navigate = useNavigate();

  const handleAdd = () => {
    setRefreshKey(prev => prev + 1);
    setEditingCourse(null);
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    navigate('/add');
  };

  useEffect(() => {
    // Simulate real-time updates
    const updateInterval = setInterval(async () => {
      // Fetch current courses to determine the number of courses
      const currentCourses = await courseService.getCourses();

      // Randomly decide the type of update
      const action = Math.random();

      if (action < 0.5) {
        // Add 1-2 new courses (50% chance)
        const numCoursesToAdd = Math.random() < 0.5 ? 1 : 2;
        const newCourses = generateMockCourses(numCoursesToAdd);
        for (const newCourse of newCourses) {
          await courseService.addCourse(newCourse);
          toast.info(`New course added: ${newCourse.title}`, { autoClose: 3000 });
        }
      } else if (currentCourses.length >= 3) {
        // Delete 1-2 random courses (50% chance, if there are at least 3 courses)
        const numCoursesToDelete = Math.random() < 0.5 ? 1 : 2;
        const coursesToDelete = [];
        for (let i = 0; i < numCoursesToDelete && currentCourses.length > 2; i++) {
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
    }, 5000); // Update every 5 seconds

    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 bg-white p-4 shadow-md z-40">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-gray-800">Course Manager</Link>
          <Link to="/add" className="text-blue-600 hover:text-blue-800 transition-colors">Add Course</Link>
        </div>
      </nav>
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<Home key={refreshKey} onEdit={handleEdit} />} />
          <Route
            path="/add"
            element={<AddCourse onAdd={handleAdd} initialData={editingCourse} />}
          />
        </Routes>
      </div>
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
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
