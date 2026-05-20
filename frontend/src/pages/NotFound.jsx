import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-800">404</h1>
        <p className="mt-2 text-slate-500">Page not found</p>
        <Link to="/dashboard" className="btn-primary mt-6 inline-flex">Go home</Link>
      </div>
    </div>
  );
}
