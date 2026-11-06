import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator, ClipboardList, Sparkles, Banknote, Timer, Users, Car, LayoutDashboard,
  Database, Brain, CheckCircle2, ArrowLeft, Gauge, CarFront, Layers, ListChecks, Target,
} from 'lucide-react';
import { api, formatNumber } from '../api';
import { carData, problemList } from '../data';

// کارت‌های امکانات سایت
const features = [
  { icon: Banknote, color: 'blue', title: 'تخمین هزینه تعمیر', text: 'هزینه‌ی تقریبی تعمیر بر اساس برند، مدل، کیلومتر و نوع خرابی، در چند ثانیه.' },
  { icon: Timer, color: 'teal', title: 'تخمین زمان تعمیر', text: 'برآورد مدت زمان لازم برای تعمیر تا مشتری بداند خودرو چه زمانی آماده می‌شود.' },
  { icon: Users, color: 'violet', title: 'مدیریت مشتریان', text: 'ثبت مشتری با کنترل شماره موبایل و کد ملی و جلوگیری از ثبت تکراری.' },
  { icon: Car, color: 'amber', title: 'ثبت خودرو', text: 'ثبت پلاک، مدل و کیلومتر هر خودرو و اتصال آن به صاحبش.' },
  { icon: ClipboardList, color: 'rose', title: 'پذیرش خدمات', text: 'ثبت پذیرش همراه با تخمین هوشمند هزینه و زمان که خودکار ذخیره می‌شود.' },
  { icon: LayoutDashboard, color: 'sky', title: 'داشبورد مدیریتی', text: 'آمار کلی، فهرست پذیرش‌ها و تغییر وضعیت هر پذیرش در یک صفحه.' },
];

// مراحل کار با سامانه
const howItWorks = [
  { icon: Users, title: 'ثبت مشتری و خودرو', text: 'اطلاعات مشتری و خودروی او یک‌بار ثبت می‌شود.' },
  { icon: ClipboardList, title: 'ثبت پذیرش', text: 'نوع خرابی انتخاب می‌شود و پذیرش ثبت می‌گردد.' },
  { icon: Sparkles, title: 'تخمین هوشمند', text: 'مدل یادگیری ماشین هزینه و زمان را پیش‌بینی می‌کند.' },
];

function Home() {
  const [info, setInfo] = useState(null);   // دقت مدل (از سرور)

  useEffect(() => {
    api('/api/model-info').then(setInfo).catch(() => setInfo(null));
  }, []);

  const modelCount = Object.values(carData).flat().length;

  const stats = [
    { icon: Car, color: 'blue', value: formatNumber(modelCount), label: 'مدل خودرو' },
    { icon: ListChecks, color: 'amber', value: formatNumber(problemList.length), label: 'نوع خرابی' },
    { icon: Database, color: 'violet', value: info ? formatNumber(info.total_rows) : '—', label: 'رکورد آموزشی' },
    { icon: Target, color: 'green', value: info ? formatNumber(info.cost.r2) : '—', label: 'دقت مدل (R²)' },
  ];

  return (
    <div className="home">
      {/* ---------- بخش اصلی (Hero) ---------- */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <span className="hero-badge"><Sparkles size={15} /> ارتا؛ نظم و هوش در خدمات خودرو</span>
            <h1>
              سامانه مدیریت خدمات <span className="highlight">نمایندگی خودرو</span>
            </h1>
            <p>
              پذیرش خودرو، ثبت اطلاعات مشتری و تخمین هوشمند هزینه و زمان تعمیرات
              با الگوریتم یادگیری ماشین؛ همه در یک سامانه‌ی یکپارچه.
            </p>
            <div className="hero-actions">
              <Link to="/predict" className="btn btn-accent">
                <Calculator size={19} /> شروع تخمین هزینه
              </Link>
              <Link to="/service-order" className="btn btn-ghost">
                <ClipboardList size={19} /> ثبت پذیرش جدید
              </Link>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="glass-card">
              <div className="glass-head">
                <span className="glass-icon"><CarFront size={22} /></span>
                <div>
                  <strong>تخمین هوشمند</strong>
                  <small>نمونه‌ی خروجی سامانه</small>
                </div>
              </div>
              <div className="glass-row">
                <span><Banknote size={16} /> هزینه تخمینی</span>
                <b>۲۱٬۵۰۰٬۰۰۰ تومان</b>
              </div>
              <div className="glass-row">
                <span><Timer size={16} /> زمان تخمینی</span>
                <b>۷٫۵ ساعت</b>
              </div>
              <div className="glass-bar"><i style={{ width: '88%' }} /></div>
              <small className="glass-note">اطمینان مدل برای این نمونه: ۸۸٪</small>
            </div>
            <span className="floating-chip chip-top"><Brain size={16} /> Multiple Linear Regression</span>
            <span className="floating-chip chip-bottom"><Gauge size={16} /> خطای میانگین حدود ۹٪</span>
          </div>
        </div>
      </section>

      {/* ---------- آمار ---------- */}
      <section className="stats-strip">
        {stats.map(({ icon: Icon, color, value, label }) => (
          <div className="stat-box" key={label}>
            <span className={`icon-box ${color}`}><Icon size={22} /></span>
            <div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ---------- امکانات ---------- */}
      <section className="section">
        <div className="section-inner">
          <div className="section-head">
            <span className="section-tag"><Layers size={14} /> امکانات</span>
            <h2>هر آنچه یک نمایندگی برای شروع نیاز دارد</h2>
            <p>از ثبت مشتری تا پیش‌بینی هزینه، بدون پیچیدگی و در یک نگاه.</p>
          </div>
          <div className="features-grid">
            {features.map(({ icon: Icon, color, title, text }) => (
              <div className="feature-card" key={title}>
                <span className={`icon-box big ${color}`}><Icon size={26} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- مراحل کار ---------- */}
      <section className="section section-white">
        <div className="section-inner">
          <div className="section-head">
            <span className="section-tag"><ListChecks size={14} /> روند کار</span>
            <h2>در سه قدم ساده</h2>
          </div>
          <div className="how-grid">
            {howItWorks.map(({ icon: Icon, title, text }, index) => (
              <div className="how-card" key={title}>
                <span className="how-number">{formatNumber(index + 1)}</span>
                <span className="icon-box big blue"><Icon size={26} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- هوش مصنوعی ---------- */}
      <section className="section">
        <div className="section-inner">
          <div className="ai-box">
            <div className="ai-text">
              <span className="section-tag dark"><Brain size={14} /> هوش مصنوعی</span>
              <h2>تخمین هزینه چطور انجام می‌شود؟</h2>
              <ul className="check-list">
                <li><CheckCircle2 size={20} /> مدل با سابقه‌ی تعمیرات ذخیره‌شده در دیتابیس (PostgreSQL) آموزش می‌بیند.</li>
                <li><CheckCircle2 size={20} /> الگوریتم Multiple Linear Regression ورودی‌ها را به هزینه و زمان تبدیل می‌کند.</li>
                <li><CheckCircle2 size={20} /> دقت مدل روی داده‌ی تست اندازه‌گیری و در سایت نمایش داده می‌شود.</li>
              </ul>
            </div>
            <div className="formula-card" dir="ltr">
              <small>model</small>
              <code>log(cost) = b0 + b1·model + b2·problem + b3·mileage</code>
              <small>output</small>
              <code>cost = exp( prediction )</code>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- دعوت به اقدام ---------- */}
      <section className="section cta-section">
        <div className="section-inner">
          <div className="cta-banner">
            <div>
              <h2>همین حالا هزینه تعمیر خودرو را تخمین بزنید</h2>
              <p>فقط چند فیلد را پر کنید؛ نتیجه در چند ثانیه آماده است.</p>
            </div>
            <Link to="/predict" className="btn btn-light">
              شروع کنید <ArrowLeft size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
