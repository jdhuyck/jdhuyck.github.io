import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Portfolio from './pages/Portfolio'
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
        <Route path='/admin' element={<AdminDashboard />}/>
        <Route path='/admin/new' element={<CreatePost />}/>
        <Route path="/admin/edit/:id" element={<EditPost />}/>
      </Routes>
    </div>
  )
}

export default App