import React from 'react';
import { Users, Car, ClipboardList, Check } from 'lucide-react';

const steps = [
  { label: 'ثبت مشتری', icon: Users },
  { label: 'ثبت خودرو', icon: Car },
  { label: 'ثبت پذیرش', icon: ClipboardList },
];

// نوار مراحل (۱ تا ۳)؛ current = شماره‌ی مرحله‌ی فعلی
function Stepper({ current }) {
  return (
    <ol className="stepper">
      {steps.map((step, index) => {
        const number = index + 1;
        const state = number < current ? 'done' : number === current ? 'active' : '';
        const Icon = number < current ? Check : step.icon;
        return (
          <li key={step.label} className={state}>
            <span className="step-circle"><Icon size={19} /></span>
            <span className="step-label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default Stepper;
