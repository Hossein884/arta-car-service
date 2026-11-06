import React, { useCallback, useEffect, useState } from 'react';
import { Star, User, ClipboardList, MessageSquareText, Send, Quote, Wrench } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Field from '../components/Field';
import Alert from '../components/Alert';
import StarRating from '../components/StarRating';
import { api, post, formatNumber } from '../api';

const RATING_TEXT = { 1: 'ضعیف', 2: 'نیاز به بهبود', 3: 'متوسط', 4: 'خوب', 5: 'عالی' };
const COLORS = ['#2563eb', '#7c3aed', '#0f766e', '#be123c', '#b45309', '#0369a1'];

// رنگ آواتار هر مشتری (بر اساس اسمش ثابت می‌ماند)
const avatarColor = (name) => COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length];

function Survey() {
  const [data, setData] = useState(null);                 // آمار + لیست نظرها
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);               // پذیرش‌های مشتری انتخاب‌شده
  const [customerId, setCustomerId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const loadFeedback = useCallback(() => {
    api('/api/feedback').then(setData).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadFeedback();
    api('/api/customers').then(setCustomers).catch(() => setCustomers([]));
  }, [loadFeedback]);

  // وقتی مشتری عوض شد، پذیرش‌های همان مشتری را می‌گیریم
  useEffect(() => {
    if (!customerId) {
      setOrders([]);
      return;
    }
    api(`/api/service-orders?customer_id=${customerId}`).then(setOrders).catch(() => setOrders([]));
  }, [customerId]);

  const handleCustomerChange = (e) => {
    setCustomerId(e.target.value);
    setOrderId('');
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!customerId || !rating || comment.trim().length < 5) {
      setError('لطفاً مشتری را انتخاب کنید، امتیاز بدهید و نظر خود را (حداقل ۵ حرف) بنویسید.');
      return;
    }

    setLoading(true);
    try {
      await post('/api/feedback', {
        customer_id: Number(customerId),
        order_id: orderId ? Number(orderId) : null,
        rating,
        comment,
      });
      setSuccess('نظر شما ثبت شد. از اینکه وقت گذاشتید سپاسگزاریم.');
      setRating(0);
      setComment('');
      setOrderId('');
      loadFeedback();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const summary = data && data.summary;

  return (
    <div className="page">
      <div className="page-inner">
        <PageHeader icon={Star} title="نظرسنجی مشتریان" subtitle="تجربه‌ی خود از خدمات نمایندگی را با ما در میان بگذارید." />

        {/* ---------- خلاصه‌ی امتیازها ---------- */}
        {summary && (
          <div className="rating-summary fade-in">
            <div className="rating-score">
              <strong>{formatNumber(summary.average)}</strong>
              <StarRating value={Math.round(summary.average)} size={20} />
              <span>از مجموع {formatNumber(summary.count)} نظر</span>
            </div>
            <div className="rating-bars">
              {[5, 4, 3, 2, 1].map((star) => {
                const n = summary.distribution[star] || 0;
                const percent = summary.count ? (n / summary.count) * 100 : 0;
                return (
                  <div className="bar-row" key={star}>
                    <span>{formatNumber(star)} ستاره</span>
                    <div className="bar"><i style={{ width: `${percent}%` }} /></div>
                    <b>{formatNumber(n)}</b>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="survey-grid">
          {/* ---------- فرم ثبت نظر ---------- */}
          <div className="card fade-in">
            <h2 className="card-title"><MessageSquareText size={20} /> نظر خود را ثبت کنید</h2>

            <Field icon={User} label="مشتری">
              <select value={customerId} onChange={handleCustomerChange}>
                <option value="">انتخاب کنید...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>
                ))}
              </select>
            </Field>

            <Field icon={ClipboardList} label="خدمت دریافت‌شده" optional>
              <select value={orderId} onChange={(e) => setOrderId(e.target.value)} disabled={!customerId}>
                <option value="">{customerId ? 'انتخاب پذیرش...' : 'اول مشتری را انتخاب کنید'}</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    پذیرش {formatNumber(o.id)} — {o.problem_description.split(' - ')[0]}
                  </option>
                ))}
              </select>
            </Field>

            <div className="field">
              <span className="field-label"><Star size={16} /> امتیاز شما</span>
              <div className="rate-input">
                <StarRating value={rating} onChange={setRating} size={32} />
                <span className="rate-text">{rating ? RATING_TEXT[rating] : 'ستاره‌ها را انتخاب کنید'}</span>
              </div>
            </div>

            <Field icon={MessageSquareText} label="نظر شما">
              <textarea rows="4" maxLength="500" placeholder="از برخورد کارکنان، سرعت کار یا کیفیت تعمیر بنویسید..."
                        value={comment} onChange={(e) => setComment(e.target.value)} />
            </Field>

            <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={loading}>
              {loading ? <><span className="spinner" /> در حال ثبت...</> : <><Send size={18} /> ثبت نظر</>}
            </button>

            {error && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}
          </div>

          {/* ---------- لیست نظرها ---------- */}
          <div className="reviews fade-in">
            <h2 className="reviews-title"><Quote size={20} /> نظر مشتریان</h2>

            {!data && !error && <p className="muted">در حال بارگذاری...</p>}

            {data && data.items.map((item) => (
              <article className="review-card" key={item.id}>
                <div className="review-top">
                  <span className="avatar" style={{ background: avatarColor(item.customer_name) }}>
                    {item.customer_name.trim().charAt(0)}
                  </span>
                  <div className="review-who">
                    <strong>{item.customer_name}</strong>
                    <small>{new Date(item.created_at).toLocaleDateString('fa-IR')}</small>
                  </div>
                  <StarRating value={item.rating} size={17} />
                </div>
                {item.service_title && (
                  <span className="service-chip"><Wrench size={13} /> {item.service_title}</span>
                )}
                <p>{item.comment}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Survey;
