import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, User, Car, Wrench, FileText, Sparkles, Banknote, Timer, LayoutDashboard } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Stepper from '../components/Stepper';
import Field from '../components/Field';
import Alert from '../components/Alert';
import { api, post, formatNumber } from '../api';
import { problemList } from '../data';

function ServiceOrder() {
  const location = useLocation();                       // اگر از صفحه‌ی ثبت خودرو آمده باشیم، مشتری و خودرو از قبل انتخاب شده‌اند
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customerId, setCustomerId] = useState(location.state?.customerId ? String(location.state.customerId) : '');
  const [vehicleId, setVehicleId] = useState(location.state?.vehicleId ? String(location.state.vehicleId) : '');
  const [problemType, setProblemType] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);             // پذیرش ثبت‌شده
  const [loading, setLoading] = useState(false);

  // لیست مشتریان
  useEffect(() => {
    api('/api/customers').then(setCustomers).catch((err) => setError(err.message));
  }, []);

  // وقتی مشتری عوض شد، فقط خودروهای همان مشتری را از سرور می‌گیریم
  useEffect(() => {
    if (!customerId) {
      setVehicles([]);
      return;
    }
    api(`/api/vehicles?customer_id=${customerId}`)
      .then(setVehicles)
      .catch(() => setVehicles([]));
  }, [customerId]);

  const handleCustomerChange = (e) => {
    setCustomerId(e.target.value);
    setVehicleId('');
  };

  const handleSubmit = async () => {
    setError('');
    setOrder(null);

    if (!customerId || !vehicleId || !problemType) {
      setError('لطفاً مشتری، خودرو و نوع خرابی را انتخاب کنید.');
      return;
    }

    setLoading(true);
    try {
      const data = await post('/api/service-orders', {
        customer_id: Number(customerId),
        vehicle_id: Number(vehicleId),
        problem_type: problemType,
        problem_description: description || null,
      });
      setOrder(data);
      setProblemType('');
      setDescription('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-inner narrow">
        <PageHeader icon={ClipboardList} title="ثبت پذیرش" subtitle="پذیرش خودرو را ثبت کنید؛ هزینه و زمان تعمیر به‌صورت هوشمند تخمین زده می‌شود." />
        <Stepper current={3} />

        <div className="card fade-in">
          <div className="row-2">
            <Field icon={User} label="مشتری">
              <select value={customerId} onChange={handleCustomerChange}>
                <option value="">انتخاب کنید...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>
                ))}
              </select>
            </Field>
            <Field icon={Car} label="خودرو">
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={!customerId}>
                <option value="">{customerId ? 'انتخاب خودرو...' : 'اول مشتری را انتخاب کنید'}</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.brand} {v.model} — {v.plate_number}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field icon={Wrench} label="علائم خرابی / مشکل">
            <select value={problemType} onChange={(e) => setProblemType(e.target.value)}>
              <option value="">انتخاب کنید...</option>
              {problemList.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </Field>

          <Field icon={FileText} label="توضیحات بیشتر" optional>
            <textarea rows="3" placeholder="اگر نیاز به توضیح بیشتر دارید اینجا بنویسید"
                      value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>

          <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> در حال ثبت...</> : <><Sparkles size={19} /> ثبت پذیرش و تخمین هزینه</>}
          </button>

          {error && <Alert type="error">{error}</Alert>}
          {order && <Alert type="success">{`پذیرش شماره ${formatNumber(order.id)} با موفقیت ثبت شد.`}</Alert>}

          {order && (
            <div className="order-result">
              <h3><Sparkles size={18} /> نتیجه‌ی تخمین هوش مصنوعی</h3>
              {order.estimated_cost ? (
                <div className="result-grid">
                  <div className="result-tile tile-cost">
                    <Banknote size={24} />
                    <span>هزینه تخمینی</span>
                    <strong>{formatNumber(order.estimated_cost)}</strong>
                    <small>تومان</small>
                  </div>
                  <div className="result-tile tile-time">
                    <Timer size={24} />
                    <span>زمان تخمینی</span>
                    <strong>{formatNumber(order.estimated_time)}</strong>
                    <small>ساعت</small>
                  </div>
                </div>
              ) : (
                <p className="hint">برای این مدل خودرو تخمین در دسترس نیست.</p>
              )}
              <Link to="/dashboard" className="btn btn-outline">
                <LayoutDashboard size={18} /> مشاهده در داشبورد
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceOrder;
