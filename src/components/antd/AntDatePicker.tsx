import React from 'react';
import { DatePicker, RangePicker, Space } from 'antd';
import type { DatePickerProps, RangePickerProps } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

interface AntDatePickerProps extends Omit<DatePickerProps, 'value' | 'onChange'> {
  value?: string | Date;
  onChange?: (value: string | Date | null) => void;
  format?: string;
  label?: string;
  error?: string;
}

export const AntDatePicker: React.FC<AntDatePickerProps> = ({
  value,
  onChange,
  format = 'DD/MM/YYYY',
  label,
  error,
  ...props
}) => {
  const dayjsValue = value ? dayjs(value) : null;

  return (
    <div>
      {label && <label style={{ display: 'block', marginBottom: 8 }}>{label}</label>}
      <DatePicker
        value={dayjsValue}
        onChange={(date) => onChange?.(date ? date.toDate() : null)}
        format={format}
        style={{ width: '100%' }}
        {...props}
      />
      {error && <div style={{ color: '#f5222d', fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
};

interface AntDateRangeProps extends Omit<RangePickerProps, 'value' | 'onChange'> {
  value?: [string | Date, string | Date] | null;
  onChange?: (dates: [string | Date, string | Date] | null) => void;
  format?: string;
  label?: string;
  error?: string;
  placeholder?: [string, string];
}

export const AntDateRange: React.FC<AntDateRangeProps> = ({
  value,
  onChange,
  format = 'DD/MM/YYYY',
  label,
  error,
  placeholder = ['Desde', 'Hasta'],
  ...props
}) => {
  const dayjsValue = value
    ? [dayjs(value[0]), dayjs(value[1])]
    : null;

  return (
    <div>
      {label && <label style={{ display: 'block', marginBottom: 8 }}>{label}</label>}
      <RangePicker
        value={dayjsValue}
        onChange={(dates) => {
          if (dates) {
            onChange?.([dates[0].toDate(), dates[1].toDate()]);
          } else {
            onChange?.(null);
          }
        }}
        format={format}
        style={{ width: '100%' }}
        placeholder={placeholder}
        {...props}
      />
      {error && <div style={{ color: '#f5222d', fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
};

interface DateRangeFilterProps {
  onApply?: (dates: [Date, Date]) => void;
  onReset?: () => void;
}

export const AntDateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onApply,
  onReset,
}) => {
  const [dates, setDates] = React.useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  return (
    <Space>
      <RangePicker
        value={dates}
        onChange={(value) => setDates(value as [dayjs.Dayjs, dayjs.Dayjs] | null)}
        format="DD/MM/YYYY"
      />
      {dates && (
        <>
          <button
            onClick={() => {
              onApply?.([dates[0].toDate(), dates[1].toDate()]);
            }}
            style={{
              padding: '4px 16px',
              background: '#ff8c42',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Aplicar
          </button>
          <button
            onClick={() => {
              setDates(null);
              onReset?.();
            }}
            style={{
              padding: '4px 16px',
              background: '#f5f5f5',
              color: '#000',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Limpiar
          </button>
        </>
      )}
    </Space>
  );
};

export default AntDatePicker;
