import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// پیام موفقیت (سبز) یا خطا (قرمز)
function Alert({ type = 'error', children }) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div className={`alert ${type}`} role="alert">
      <Icon size={18} />
      <span>{children}</span>
    </div>
  );
}

export default Alert;
