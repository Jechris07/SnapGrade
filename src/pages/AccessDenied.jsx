import { Link } from 'react-router-dom';

const AccessDenied = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-5xl font-bold text-red-600 mb-4">403</h1>
      <p className="text-2xl mb-6">Access Denied</p>
      <p className="text-lg mb-8">
        You do not have permission to view this page.
        Administrative privileges are required.
      </p>
      <Link to="/home" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
        Go to Homepage
      </Link>
    </div>
  );
};

export default AccessDenied;