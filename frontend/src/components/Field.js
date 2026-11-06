import React from 'react';

// یک فیلد فرم: برچسب (با آیکن) + ورودی
function Field({ icon: Icon, label, optional, children }) {
  return (
    <label className="field">
      <span className="field-label">
        {Icon && <Icon size={16} />}
        {label}
        {optional && <small className="optional">اختیاری</small>}
      </span>
      {children}
    </label>
  );
}

export default Field;
