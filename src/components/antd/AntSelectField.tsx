import React from 'react';
import { Select as AntSelectComponent, Form } from 'antd';
import { useFormContext, Controller } from 'react-hook-form';
import type { SelectProps as AntSelectProps } from 'antd';

interface AntSelectFieldProps extends Omit<AntSelectProps, 'name'> {
  name: string;
  label?: string;
  required?: boolean;
  tooltip?: string;
  helperText?: string;
  options?: Array<{ label: string; value: any }>;
  placeholder?: string;
}

export const AntSelectField = React.forwardRef<any, AntSelectFieldProps>(
  ({
    name,
    label,
    required = false,
    tooltip,
    helperText,
    options = [],
    placeholder,
    ...props
  }, ref) => {
    const { control, formState: { errors } } = useFormContext();
    const error = errors[name];

    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Form.Item
            label={label}
            required={required}
            help={error?.message as string || helperText}
            validateStatus={error ? 'error' : ''}
            tooltip={tooltip}
          >
            <AntSelectComponent
              ref={ref}
              {...field}
              options={options}
              placeholder={placeholder}
              status={error ? 'error' : ''}
              {...props}
            />
          </Form.Item>
        )}
      />
    );
  }
);

AntSelectField.displayName = 'AntSelectField';

export default AntSelectField;
