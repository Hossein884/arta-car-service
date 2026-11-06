import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, User, Phone, IdCard, UserPlus, ArrowLeft } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Stepper from '../components/Stepper';
import Field from '../components/Field';
import Alert from '../components/Alert';
import { post } from '../api';

function Customer() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalCode, setNationalCode] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);       // مشتری ثبت‌شده
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSaved(null);

    if (!fullName || !phone) {
      setError('نام و شماره موبایل الزامی است.');
      return;
    }

    setLoading(true);
    try {
      const body = { full_name: fullName, phone };
      if (nationalCode) body.national_code = nationalCode;

      const data = await post('/api/customers', body);
      setSaved(data);
      setFullName('');
      setPhone('');
      setNationalCode('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-inner narrow">
        <PageHeader icon={Users} title="ثبت مشتری" subtitle="اطلاعات مشتری جدید را وارد کنید." />
        <Stepper current={1} />

        <div className="card fade-in">
          <Field icon={User} label="نام و نام خانوادگی">
            <input type="text" placeholder="مثلاً علی رضایی" value={fullName}
                   onChange={(e) => setFullName(e.target.value)} />
          </Field>

          <div className="row-2">
            <Field icon={Phone} label="شماره موبایل">
              <input type="text" inputMode="numeric" placeholder="09121234567" value={phone}
                     onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field icon={IdCard} label="کد ملی" optional>
              <input type="text" inputMode="numeric" placeholder="۱۰ رقم" value={nationalCode}
                     onChange={(e) => setNationalCode(e.target.value)} />
            </Field>
          </div>

          <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> در حال ثبت...</> : <><UserPlus size={19} /> ثبت مشتری</>}
          </button>

          {error && <Alert type="error">{error}</Alert>}
          {saved && <Alert type="success">{`مشتری «${saved.full_name}» با موفقیت ثبت شد.`}</Alert>}

          {saved && (
            <div className="next-step">
              <p>مرحله بعد: ثبت خودرو برای این مشتری</p>
              <button className="btn btn-outline"
                      onClick={() => navigate('/vehicle', { state: { customerId: saved.id } })}>
                ثبت خودرو <ArrowLeft size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Customer;
