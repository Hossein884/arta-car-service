import React from 'react';
import { Link } from 'react-router-dom';
import { LogoMark, LogoWordmark } from './Logo';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <LogoMark size={56} dark />
          <div>
            <LogoWordmark height={30} className="logo-word" />
            <p>سامانه مدیریت خدمات نمایندگی خودرو — پذیرش، ثبت خودرو و تخمین هوشمند هزینه و زمان تعمیرات با یادگیری ماشین</p>
          </div>
        </div>

        <div className="footer-links">
          <Link to="/predict">خدمات مشتری</Link>
          <Link to="/service-order">ثبت پذیرش</Link>
          <Link to="/dashboard">داشبورد</Link>
          <Link to="/survey">نظرسنجی</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <span>ارتا — پروژه درسی، حسین سبزعلیان (God) و امید نادری </span>
        <div className="tech-chips">
          <span>React</span>
          <span>FastAPI</span>
          <span>PostgreSQL</span>
          <span>scikit-learn</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
