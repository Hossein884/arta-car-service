import React, { useEffect, useState } from 'react';
import { Calculator, Car, CarFront, Gauge, FileText, Wrench, Banknote, Timer, Info, Target, Activity } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Field from '../components/Field';
import Alert from '../components/Alert';
import { api, post, formatNumber } from '../api';
import { carData, problemList } from '../data';

function Predict() {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [mileage, setMileage] = useState('');
  const [problemType, setProblemType] = useState('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);          // دقت مدل

  // هنگام باز شدن صفحه، دقت مدل را از سرور می‌گیریم
  useEffect(() => {
    api('/api/model-info').then(setInfo).catch(() => setInfo(null));
  }, []);

  // با تغییر برند، مدل قبلی پاک می‌شود
  const handleBrandChange = (e) => {
    setBrand(e.target.value);
    setModel('');
  };

  const handlePredict = async () => {
    setError('');
    setResult(null);

    if (!brand || !model || !mileage || !problemType) {
      setError('لطفاً تمام فیلدهای ضروری را پر کنید.');
      return;
    }

    setLoading(true);
    try {
      const data = await post('/api/predict', {
        brand,
        model,
        mileage: Number(mileage),
        problem_type: problemType,
        problem_description: description || null,
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-inner">
        <PageHeader
          icon={Calculator}
          title="خدمات مشتری"
          subtitle="مشخصات خودرو و نوع خرابی را وارد کنید تا هزینه و زمان تقریبی تعمیر تخمین زده شود."
        />

        <div className="split">
          {/* ---------- فرم ---------- */}
          <div className="card fade-in">
            <h2 className="card-title"><Wrench size={20} /> اطلاعات خودرو و خرابی</h2>

            <div className="row-2">
              <Field icon={Car} label="برند خودرو">
                <select value={brand} onChange={handleBrandChange}>
                  <option value="">انتخاب کنید...</option>
                  {Object.keys(carData).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </Field>

              <Field icon={CarFront} label="مدل خودرو">
                <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand}>
                  <option value="">{brand ? 'انتخاب مدل...' : 'اول برند را انتخاب کنید'}</option>
                  {brand && carData[brand].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field icon={Gauge} label="کیلومتر کارکرد">
              <input
                type="number"
                min="0"
                placeholder="مثلاً 85000"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
              />
            </Field>

            <Field icon={Wrench} label="علائم خرابی / مشکل">
              <select value={problemType} onChange={(e) => setProblemType(e.target.value)}>
                <option value="">انتخاب کنید...</option>
                {problemList.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </Field>

            <Field icon={FileText} label="توضیحات بیشتر" optional>
              <textarea
                rows="3"
                placeholder="اگر نیاز به توضیح بیشتر دارید اینجا بنویسید"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <button className="btn btn-primary btn-block" onClick={handlePredict} disabled={loading}>
              {loading ? (
                <><span className="spinner" /> در حال محاسبه...</>
              ) : (
                <><Calculator size={19} /> محاسبه هزینه و زمان</>
              )}
            </button>

            {error && <Alert type="error">{error}</Alert>}
          </div>

          {/* ---------- نتیجه ---------- */}
          <div className="card result-card fade-in">
            <h2 className="card-title"><Activity size={20} /> نتیجه‌ی تخمین</h2>

            {result ? (
              <>
                <div className="result-grid">
                  <div className="result-tile tile-cost">
                    <Banknote size={24} />
                    <span>هزینه تخمینی</span>
                    <strong>{formatNumber(result.estimated_cost)}</strong>
                    <small>تومان</small>
                  </div>
                  <div className="result-tile tile-time">
                    <Timer size={24} />
                    <span>زمان تخمینی</span>
                    <strong>{formatNumber(result.estimated_time)}</strong>
                    <small>ساعت</small>
                  </div>
                </div>
                <p className="hint"><Info size={16} /> این اعداد تخمین هستند و هزینه‌ی نهایی پس از بازدید فنی مشخص می‌شود.</p>
              </>
            ) : (
              <div className="placeholder">
                <span className="placeholder-icon"><Gauge size={34} /></span>
                <p>فرم را تکمیل کنید تا نتیجه‌ی تخمین هوشمند اینجا نمایش داده شود.</p>
              </div>
            )}

            {info && (
              <div className="model-box">
                <h3><Target size={16} /> دقت مدل ({info.algorithm})</h3>
                <div className="chips">
                  <span className="chip">R² هزینه: {formatNumber(info.cost.r2)}</span>
                  <span className="chip">R² زمان: {formatNumber(info.time.r2)}</span>
                  <span className="chip">خطای هزینه: {formatNumber(info.cost.mape)}٪</span>
                  <span className="chip">خطای زمان: {formatNumber(info.time.mape)}٪</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Predict;
