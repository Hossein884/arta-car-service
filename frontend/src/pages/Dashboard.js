import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Car, ClipboardList, Hourglass, Wrench, BadgeCheck, Loader2, Plus, Inbox,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Alert from '../components/Alert';
import { api, formatNumber } from '../api';
import { STATUS } from '../data';

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api('/api/dashboard')
      .then((d) => { setData(d); setError(''); })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  // تغییر وضعیت یک پذیرش، سپس بارگذاری دوباره‌ی داشبورد
  const changeStatus = async (orderId, status) => {
    try {
      await api(`/api/service-orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const cards = data && [
    { icon: Users, color: 'violet', label: 'مشتریان', value: data.customers },
    { icon: Car, color: 'amber', label: 'خودروها', value: data.vehicles },
    { icon: ClipboardList, color: 'blue', label: 'کل پذیرش‌ها', value: data.orders },
    { icon: Hourglass, color: 'slate', label: 'در انتظار', value: data.pending },
    { icon: Wrench, color: 'sky', label: 'در حال تعمیر', value: data.in_progress },
    { icon: BadgeCheck, color: 'green', label: 'تکمیل‌شده', value: data.done },
  ];

  return (
    <div className="page">
      <div className="page-inner">
        <PageHeader icon={LayoutDashboard} title="داشبورد مدیریتی" subtitle="آمار کلی نمایندگی و فهرست آخرین پذیرش‌ها." />

        {error && <Alert type="error">{error}</Alert>}

        {!data && !error && (
          <div className="loading"><Loader2 size={22} className="spin" /> در حال بارگذاری...</div>
        )}

        {data && (
          <>
            <div className="stat-cards fade-in">
              {cards.map(({ icon: Icon, color, label, value }) => (
                <div className="stat-card" key={label}>
                  <span className={`icon-box ${color}`}><Icon size={22} /></span>
                  <div>
                    <strong>{formatNumber(value)}</strong>
                    <span>{label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card table-card fade-in">
              <div className="table-head">
                <h2 className="card-title"><ClipboardList size={20} /> آخرین پذیرش‌ها</h2>
                <Link to="/service-order" className="btn btn-primary btn-sm"><Plus size={17} /> پذیرش جدید</Link>
              </div>

              {data.recent_orders.length === 0 ? (
                <div className="empty-state">
                  <span className="placeholder-icon"><Inbox size={34} /></span>
                  <p>هنوز پذیرشی ثبت نشده است.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>کد</th>
                        <th>مشتری</th>
                        <th>خودرو</th>
                        <th>مشکل</th>
                        <th>هزینه تخمینی</th>
                        <th>زمان</th>
                        <th>وضعیت</th>
                        <th>تاریخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_orders.map((o) => (
                        <tr key={o.id}>
                          <td>{formatNumber(o.id)}</td>
                          <td>
                            <b>{o.customer_name}</b>
                            <small>{o.phone}</small>
                          </td>
                          <td>
                            {o.vehicle}
                            <small>{o.plate_number}</small>
                          </td>
                          <td className="problem-cell">{o.problem_description}</td>
                          <td>{o.estimated_cost ? `${formatNumber(o.estimated_cost)} تومان` : '—'}</td>
                          <td>{o.estimated_time ? `${formatNumber(o.estimated_time)} ساعت` : '—'}</td>
                          <td>
                            <select
                              className={`status-select ${STATUS[o.status]?.css || ''}`}
                              value={o.status}
                              onChange={(e) => changeStatus(o.id, e.target.value)}
                            >
                              {Object.entries(STATUS).map(([key, s]) => (
                                <option key={key} value={key}>{s.label}</option>
                              ))}
                            </select>
                          </td>
                          <td>{new Date(o.created_at).toLocaleDateString('fa-IR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
