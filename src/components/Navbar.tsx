import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-xl font-bold">Jody Huyck-Jones</Link>
        <div className="space-x-4">
          <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
          <Link to="/portfolio" className="text-gray-300 hover:text-white">Portfolio</Link>
          <Link to="/blog" className="text-gray-300 hover:text-white">Blog</Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar