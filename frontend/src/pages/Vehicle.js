import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Car, User, Hash, CarFront, CalendarDays, Gauge, Plus, ArrowLeft } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Stepper from '../components/Stepper';
import Field from '../components/Field';
import Alert from '../components/Alert';
import { api, post } from '../api';
import { carData } from '../data';

function Vehicle() {
  const navigate = useNavigate();
  const location = useLocation();                       // اگر از صفحه‌ی ثبت مشتری آمده باشیم، مشتری از قبل انتخاب شده
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(location.state?.customerId ? String(location.state.customerId) : '');
  const [plateNumber, setPlateNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);             // خودروی ثبت‌شده
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api('/api/customers').then(setCustomers).catch((err) => setError(err.message));
  }, []);

  const handleBrandChange = (e) => {
    setBrand(e.target.value);
    setModel('');
  };

  const handleSubmit = async () => {
    setError('');
    setSaved(null);

    if (!customerId || !plateNumber || !brand || !model || !mileage) {
      setError('لطفاً تمام فیلدهای ضروری را پر کنید.');
      return;
    }

    setLoading(true);
    try {
      const body = {
        customer_id: Number(customerId),
        plate_number: plateNumber,
        brand,
        model,
        mileage: Number(mileage),
      };
      if (year) body.year = Number(year);

      const data = await post('/api/vehicles', body);
      setSaved(data);
      setPlateNumber('');
      setBrand('');
      setModel('');
      setYear('');
      setMileage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-inner narrow">
        <PageHeader icon={Car} title="ثبت خودرو" subtitle="مشخصات خودرو را وارد کنید و آن را به یک مشتری وصل کنید." />
        <Stepper current={2} />

        <div className="card fade-in">
          <Field icon={User} label="صاحب خودرو (مشتری)">
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">انتخاب کنید...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>
              ))}
            </select>
          </Field>

          <Field icon={Hash} label="شماره پلاک">
            <input type="text" placeholder="مثلاً ۱۲ب۳۴۵-۶۷" value={plateNumber}
                   onChange={(e) => setPlateNumber(e.target.value)} />
          </Field>

          <div className="row-2">
            <Field icon={Car} label="برند">
              <select value={brand} onChange={handleBrandChange}>
                <option value="">انتخاب کنید...</option>
                {Object.keys(carData).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field icon={CarFront} label="مدل">
              <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand}>
                <option value="">{brand ? 'انتخاب مدل...' : 'اول برند را انتخاب کنید'}</option>
                {brand && carData[brand].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="row-2">
            <Field icon={CalendarDays} label="سال ساخت" optional>
              <input type="number" placeholder="مثلاً 1402" value={year}
                     onChange={(e) => setYear(e.target.value)} />
            </Field>
            <Field icon={Gauge} label="کیلومتر کارکرد">
              <input type="number" min="0" placeholder="مثلاً 85000" value={mileage}
                     onChange={(e) => setMileage(e.target.value)} />
            </Field>
          </div>

          <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> در حال ثبت...</> : <><Plus size={19} /> ثبت خودرو</>}
          </button>

          {error && <Alert type="error">{error}</Alert>}
          {saved && <Alert type="success">{`خودرو با پلاک «${saved.plate_number}» با موفقیت ثبت شد.`}</Alert>}

          {saved && (
            <div className="next-step">
              <p>مرحله بعد: ثبت پذیرش خدمات برای این خودرو</p>
              <button className="btn btn-outline"
                      onClick={() => navigate('/service-order', { state: { customerId: saved.customer_id, vehicleId: saved.id } })}>
                ثبت پذیرش <ArrowLeft size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Vehicle;
