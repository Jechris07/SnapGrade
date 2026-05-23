import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-5xl font-bold text-red-500 mb-4">404</h1>
      <p className="text-2xl mb-6">Page Not Found</p>
      <p className="text-lg mb-8">
        The page you are looking for does not exist or has been removed.
      </p>
      <Link to="/home" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
        Go to Homepage
      </Link>
    </div>
  );
};

export default NotFound;