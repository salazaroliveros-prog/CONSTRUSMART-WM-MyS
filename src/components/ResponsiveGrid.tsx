import React from 'react'
import { Row, Col, ColProps } from 'antd'
import { useResponsive } from '@/hooks/useResponsive'

interface ResponsiveGridProps {
  gutter?: number | [number, number]
  children: React.ReactNode
  className?: string
}

interface ResponsiveColProps extends ColProps {
  responsive?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    xxl?: number
  }
  children?: React.ReactNode
}

/**
 * Grid responsivo con gutter automático según breakpoint
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  gutter = [16, 16],
  children,
  className = '',
}) => {
  const { isMobile } = useResponsive()

  const effectiveGutter = isMobile ? (Array.isArray(gutter) ? [8, 8] : 8) : gutter

  return (
    <Row gutter={effectiveGutter} className={className}>
      {children}
    </Row>
  )
}

/**
 * Columna responsiva con presets comunes
 */
export const ResponsiveCol: React.FC<ResponsiveColProps> = ({
  responsive,
  children,
  ...props
}) => {
  const defaults = responsive || {
    xs: 24,
    sm: 24,
    md: 12,
    lg: 8,
    xl: 6,
    xxl: 4,
  }

  return (
    <Col
      xs={defaults.xs}
      sm={defaults.sm}
      md={defaults.md}
      lg={defaults.lg}
      xl={defaults.xl}
      xxl={defaults.xxl}
      {...props}
    >
      {children}
    </Col>
  )
}

/**
 * Grilla de 2 columnas en tablet/desktop, 1 en móvil
 */
export const TwoColGrid: React.FC<ResponsiveGridProps> = (props) => {
  return (
    <ResponsiveGrid {...props}>
      {React.Children.map(props.children, (child) =>
        React.isValidElement(child) ? (
          <ResponsiveCol
            responsive={{ xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 }}
          >
            {child}
          </ResponsiveCol>
        ) : (
          child
        )
      )}
    </ResponsiveGrid>
  )
}

/**
 * Grilla de 3 columnas en desktop, 2 en tablet, 1 en móvil
 */
export const ThreeColGrid: React.FC<ResponsiveGridProps> = (props) => {
  return (
    <ResponsiveGrid {...props}>
      {React.Children.map(props.children, (child) =>
        React.isValidElement(child) ? (
          <ResponsiveCol
            responsive={{ xs: 24, sm: 24, md: 12, lg: 8, xl: 8, xxl: 8 }}
          >
            {child}
          </ResponsiveCol>
        ) : (
          child
        )
      )}
    </ResponsiveGrid>
  )
}

/**
 * Grilla de 4 columnas en desktop, 2 en tablet, 1 en móvil
 */
export const FourColGrid: React.FC<ResponsiveGridProps> = (props) => {
  return (
    <ResponsiveGrid {...props}>
      {React.Children.map(props.children, (child) =>
        React.isValidElement(child) ? (
          <ResponsiveCol
            responsive={{ xs: 24, sm: 12, md: 12, lg: 6, xl: 6, xxl: 6 }}
          >
            {child}
          </ResponsiveCol>
        ) : (
          child
        )
      )}
    </ResponsiveGrid>
  )
}

/**
 * Grilla adaptativa: 1-2-3-4-6 columnas según breakpoint
 */
export const AdaptiveGrid: React.FC<ResponsiveGridProps> = (props) => {
  return (
    <ResponsiveGrid {...props}>
      {React.Children.map(props.children, (child) =>
        React.isValidElement(child) ? (
          <ResponsiveCol
            responsive={{ xs: 24, sm: 12, md: 8, lg: 6, xl: 4, xxl: 4 }}
          >
            {child}
          </ResponsiveCol>
        ) : (
          child
        )
      )}
    </ResponsiveGrid>
  )
}

/**
 * Layout de formulario responsivo: Label + Input lado a lado en desktop, stacked en móvil
 */
export const FormGrid: React.FC<{ children: React.ReactNode; gutter?: number | [number, number] }> = ({
  children,
  gutter = [16, 12],
}) => {
  const { isMobile } = useResponsiveResponsive

  return (
    <Row gutter={isMobile ? [8, 8] : gutter}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? (
          <Col xs={24} sm={24} md={12} lg={12} xl={8} xxl={8}>
            {child}
          </Col>
        ) : (
          child
        )
      )}
    </Row>
  )
}

/**
 * Layout de tarjetas responsivo
 */
export const CardGrid: React.FC<{ children: React.ReactNode; columns?: number }> = ({
  children,
  columns = 3,
}) => {
  const { isMobile, isTablet } = useResponsive()

  let colSpan = 24
  if (columns === 2) {
    colSpan = isMobile ? 24 : 12
  } else if (columns === 3) {
    colSpan = isMobile ? 24 : isTablet ? 12 : 8
  } else if (columns === 4) {
    colSpan = isMobile ? 24 : isTablet ? 12 : 6
  }

  return (
    <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? (
          <Col xs={colSpan} sm={colSpan} md={colSpan} lg={colSpan} xl={colSpan}>
            {child}
          </Col>
        ) : (
          child
        )
      )}
    </Row>
  )
}

/**
 * Sidebar + Content layout responsivo
 */
export const SidebarLayout: React.FC<{
  sidebar: React.ReactNode
  content: React.ReactNode
  sidebarWidth?: number
}> = ({ sidebar, content, sidebarWidth = 250 }) => {
  const { isMobile } = useResponsive()

  if (isMobile) {
    return (
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          {sidebar}
        </Col>
        <Col xs={24}>
          {content}
        </Col>
      </Row>
    )
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={6} lg={5} style={{ minWidth: sidebarWidth }}>
        {sidebar}
      </Col>
      <Col xs={24} md={18} lg={19}>
        {content}
      </Col>
    </Row>
  )
}
