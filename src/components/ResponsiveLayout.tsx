import React from 'react'
import { Layout, Drawer, Button } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { useResponsive } from '@/hooks/useResponsive'

interface ResponsiveLayoutProps {
  header?: React.ReactNode
  sider?: React.ReactNode
  content: React.ReactNode
  footer?: React.ReactNode
  siderWidth?: number
  collapsible?: boolean
  theme?: 'light' | 'dark'
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  header,
  sider,
  content,
  footer,
  siderWidth = 200,
  collapsible = true,
  theme = 'light',
}) => {
  const { isMobile, isTablet } = useResponsive()
  const [siderCollapsed, setSiderCollapsed] = React.useState(isMobile)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  React.useEffect(() => {
    if (isMobile) {
      setSiderCollapsed(true)
    }
  }, [isMobile])

  const effectiveSiderWidth = isMobile ? '100%' : siderWidth

  if (isMobile) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {header && <Layout.Header>{header}</Layout.Header>}

        <Layout style={{ flex: 1, overflow: 'auto' }}>
          <Layout.Content style={{ padding: '8px 12px', flex: 1 }}>
            {content}
          </Layout.Content>
        </Layout>

        <Drawer
          title="Menu"
          placement="left"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          width={effectiveSiderWidth}
          bodyStyle={{ padding: 0 }}
        >
          <Layout.Sider
            style={{ background: 'transparent' }}
            width={effectiveSiderWidth}
          >
            {sider}
          </Layout.Sider>
        </Drawer>

        <Button
          type="primary"
          icon={drawerOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={() => setDrawerOpen(!drawerOpen)}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 50,
            height: 50,
            borderRadius: '50%',
            zIndex: 100,
          }}
        />

        {footer && <Layout.Footer>{footer}</Layout.Footer>}
      </Layout>
    )
  }

  if (isTablet) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {header && <Layout.Header>{header}</Layout.Header>}

        <Layout style={{ flex: 1, overflow: 'hidden' }}>
          {sider && !siderCollapsed && (
            <Layout.Sider
              width={siderWidth * 0.8}
              theme={theme}
              collapsible={collapsible}
              collapsed={siderCollapsed}
              onCollapse={setSiderCollapsed}
            >
              {sider}
            </Layout.Sider>
          )}
          <Layout style={{ overflow: 'auto' }}>
            <Layout.Content style={{ padding: '12px' }}>
              {content}
            </Layout.Content>
          </Layout>
        </Layout>

        {footer && <Layout.Footer>{footer}</Layout.Footer>}
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {header && <Layout.Header>{header}</Layout.Header>}

      <Layout style={{ flex: 1, overflow: 'hidden' }}>
        {sider && (
          <Layout.Sider
            width={siderWidth}
            theme={theme}
            collapsible={collapsible}
            collapsed={siderCollapsed}
            onCollapse={setSiderCollapsed}
          >
            {sider}
          </Layout.Sider>
        )}
        <Layout style={{ overflow: 'auto' }}>
          <Layout.Content style={{ padding: '16px' }}>
            {content}
          </Layout.Content>
        </Layout>
      </Layout>

      {footer && <Layout.Footer>{footer}</Layout.Footer>}
    </Layout>
  )
}

export default ResponsiveLayout
