import React from 'react';
import { toInputDate, fromInputDate } from '../../utils/dateUtils';

interface DatePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function DatePicker({ label, value, onChange, className = '' }: DatePickerProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
      <input
        type="date"
        value={toInputDate(value)}
        onChange={(e) => { if (e.target.value) onChange(fromInputDate(e.target.value)); }}
        className={`rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 ${className}`}
      />
    </div>
  );
}
