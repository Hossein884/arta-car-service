import React from 'react';

// عنوان بالای هر صفحه: آیکن + عنوان + توضیح کوتاه
function PageHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="page-header">
      <span className="page-header-icon"><Icon size={28} /></span>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

export default PageHeader;
