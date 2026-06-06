import React from 'react';
import { Form as AntFormComponent, Row, Col, Space, Button, Spin } from 'antd';
import { useForm, FormProvider, FieldValues, DefaultValues, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';

interface AntFormProps<T extends FieldValues> {
  schema: ZodSchema;
  onSubmit: SubmitHandler<T>;
  initialValues?: DefaultValues<T>;
  layout?: 'vertical' | 'horizontal' | 'inline';
  loading?: boolean;
  submitText?: string;
  resetText?: string;
  onCancel?: () => void;
  children: React.ReactNode;
  className?: string;
  cols?: number;
}

export const AntForm = React.forwardRef<any, AntFormProps<any>>(
  ({
    schema,
    onSubmit,
    initialValues,
    layout = 'vertical',
    loading = false,
    submitText = 'Guardar',
    resetText = 'Cancelar',
    onCancel,
    children,
    className = '',
    cols = 1,
  }, ref) => {
    const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: initialValues,
      mode: 'onChange',
    });

    return (
      <FormProvider {...form}>
        <Spin spinning={loading}>
          <AntFormComponent
            layout={layout}
            onFinish={form.handleSubmit(onSubmit)}
            form={AntFormComponent.useForm()[0]}
            className={`ant-form-wrapper ${className}`}
          >
            <Row gutter={[16, 16]}>
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  return <Col xs={24} sm={24 / cols} key={child.key}>{child}</Col>;
                }
                return child;
              })}
            </Row>

            <Space style={{ marginTop: 24, width: '100%' }}>
              <Button type="primary" htmlType="submit" loading={loading}>
                {submitText}
              </Button>
              {onCancel && (
                <Button onClick={onCancel}>
                  {resetText}
                </Button>
              )}
            </Space>
          </AntFormComponent>
        </Spin>
      </FormProvider>
    );
  }
);

AntForm.displayName = 'AntForm';

export default AntForm;
