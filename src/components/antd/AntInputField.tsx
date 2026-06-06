import React from 'react';
import { Input as AntInputComponent, Form } from 'antd';
import { useFormContext, Controller } from 'react-hook-form';
import type { InputProps as AntInputProps } from 'antd';

interface AntInputFieldProps extends Omit<AntInputProps, 'name'> {
  name: string;
  label?: string;
  required?: boolean;
  tooltip?: string;
  helperText?: string;
}

export const AntInputField = React.forwardRef<any, AntInputFieldProps>(
  ({
    name,
    label,
    required = false,
    tooltip,
    helperText,
    placeholder,
    type = 'text',
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
            <AntInputComponent
              ref={ref}
              {...field}
              type={type}
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

AntInputField.displayName = 'AntInputField';

export default AntInputField;
