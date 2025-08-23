import { Routes, Route } from 'react-router-dom'
import Navbar from './components/blog/Navbar'
import Home from './pages/Home'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Portfolio from './pages/Portfolio'
import Login from './components/admin/Login'
import AuthCallback from './pages/AuthCallback'
import ProtectedRoute from './components/blog/ProtectedRoute'
import AdminDashboard from './components/admin/AdminDashboard'
import CreatePost from './pages/CreatePost'
import EditPost from './pages/EditPost'

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/auth/callback" element={<AuthCallback />} />

        {/* Protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/new"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit/:id"
          element={
            <ProtectedRoute>
              <EditPost />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App