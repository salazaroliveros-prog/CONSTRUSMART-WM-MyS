import React, { ReactNode } from 'react'
import { Table, Modal, Drawer, Select, DatePicker, Form, Col, Space } from 'antd'
import { useResponsive } from '@/hooks/useResponsive'

interface ResponsiveTableProps {
  columns: any[]
  dataSource: any[]
  [key: string]: any
}

interface ResponsiveModalProps {
  title?: ReactNode
  children?: ReactNode
  width?: number | string
  [key: string]: any
}

interface ResponsiveFormProps {
  layout?: 'horizontal' | 'vertical' | 'inline'
  children?: ReactNode
  [key: string]: any
}

interface ResponsiveColProps {
  xs?: number | { span: number }
  sm?: number | { span: number }
  md?: number | { span: number }
  lg?: number | { span: number }
  xl?: number | { span: number }
  xxl?: number | { span: number }
  children?: ReactNode
  [key: string]: any
}

/**
 * Responsive Table - Auto-hide columns on mobile
 */
export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  dataSource,
  ...props
}) => {
  const { isMobile } = useResponsive()

  const responsiveColumns = columns.map(col => ({
    ...col,
    responsive: col.responsive || (isMobile && col.hideOnMobile ? ['md'] : undefined),
  }))

  return (
    <Table
      columns={responsiveColumns}
      dataSource={dataSource}
      size={isMobile ? 'small' : 'middle'}
      scroll={isMobile ? { x: true } : undefined}
      {...props}
    />
  )
}

/**
 * Responsive Modal - Auto-adjust width for mobile
 */
export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  width,
  ...props
}) => {
  const { isMobile } = useResponsive()
  const modalWidth = isMobile ? '95vw' : width || 600

  return <Modal width={modalWidth} {...props} />
}

/**
 * Responsive Drawer - Full-width on mobile
 */
export const ResponsiveDrawer: React.FC<any> = (props) => {
  const { isMobile } = useResponsive()
  const drawerWidth = isMobile ? '100vw' : props.width || 378

  return <Drawer width={drawerWidth} {...props} />
}

/**
 * Responsive Form - Vertical layout on mobile, horizontal on desktop
 */
export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  layout = 'horizontal',
  ...props
}) => {
  const { isMobile } = useResponsive()
  const formLayout = isMobile ? 'vertical' : layout

  return <Form layout={formLayout} {...props} />
}

/**
 * Responsive Col - Smart breakpoint management
 */
export const ResponsiveCol: React.FC<ResponsiveColProps> = ({
  xs = 24,
  sm = 24,
  md = 12,
  lg = 8,
  xl = 6,
  xxl = 4,
  children,
  ...props
}) => {
  return (
    <Col xs={xs} sm={sm} md={md} lg={lg} xl={xl} xxl={xxl} {...props}>
      {children}
    </Col>
  )
}

/**
 * Responsive Space - Adjust gap based on screen size
 */
export const ResponsiveSpace: React.FC<any> = (props) => {
  const { isMobile } = useResponsive()
  const size = isMobile ? 'small' : props.size || 'middle'

  return <Space size={size} {...props} />
}

/**
 * Responsive Container with padding
 */
export const ResponsiveContainer: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`responsive-container ${className}`}>{children}</div>
}

/**
 * Mobile-optimized Select
 */
export const ResponsiveSelect = React.forwardRef<any, any>(
  ({ optionLabelProp = 'label', notFoundContent = 'No hay datos', ...props }, ref) => (
    <Select
      ref={ref}
      optionLabelProp={optionLabelProp}
      notFoundContent={notFoundContent}
      {...props}
    />
  )
)
ResponsiveSelect.displayName = 'ResponsiveSelect'

/**
 * Mobile-optimized DatePicker
 */
export const ResponsiveDatePicker = React.forwardRef<any, any>(
  ({ picker = 'date', ...props }, ref) => (
    <DatePicker ref={ref} picker={picker} {...props} />
  )
)
ResponsiveDatePicker.displayName = 'ResponsiveDatePicker'
