import React, { useState } from 'react';
import { Star } from 'lucide-react';

// ستاره‌های امتیاز (۱ تا ۵)؛ اگر onChange بدهیم قابل کلیک است، وگرنه فقط نمایش می‌دهد
function StarRating({ value = 0, onChange, size = 22 }) {
  const [hover, setHover] = useState(0);           // ستاره‌ای که ماوس روی آن است
  const shown = hover || value;
  const interactive = Boolean(onChange);

  return (
    <div className={`stars ${interactive ? 'interactive' : ''}`} role={interactive ? 'radiogroup' : 'img'} aria-label={`امتیاز ${value} از ۵`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= shown ? 'star on' : 'star'}
          disabled={!interactive}
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          aria-label={`${n} ستاره`}
        >
          <Star size={size} fill={n <= shown ? '#f59e0b' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export default StarRating;
