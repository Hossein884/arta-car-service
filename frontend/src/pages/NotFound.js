import React from 'react';
import { Link } from 'react-router-dom';
import { SearchX, Home } from 'lucide-react';

function NotFound() {
  return (
    <div className="page">
      <div className="page-inner narrow">
        <div className="card not-found">
          <span className="placeholder-icon"><SearchX size={36} /></span>
          <h1>صفحه پیدا نشد</h1>
          <p>آدرسی که وارد کردید وجود ندارد.</p>
          <Link to="/" className="btn btn-primary"><Home size={18} /> بازگشت به خانه</Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
