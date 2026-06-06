import React from 'react';
import { Row, Col, Card, Statistic, Space, Progress, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface StatItem {
  title: string;
  value: string | number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  precision?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number | string;
  tooltip?: string;
  color?: string;
  secondaryValue?: string;
}

interface AntStatsProps {
  stats: StatItem[];
  columns?: number;
  gutter?: number;
}

export const AntStats: React.FC<AntStatsProps> = ({
  stats = [],
  columns = 4,
  gutter = 16,
}) => {
  const colSpan = Math.ceil(24 / columns);

  return (
    <Row gutter={[gutter, gutter]}>
      {stats.map((stat, index) => (
        <Col xs={24} sm={24} md={Math.ceil(24 / Math.min(columns, 2))} lg={colSpan} key={index}>
          <Tooltip title={stat.tooltip}>
            <Card
              bordered={false}
              style={{
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              }}
            >
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix}
                suffix={
                  <Space size={4}>
                    {stat.suffix && <span>{stat.suffix}</span>}
                    {stat.trend === 'up' && (
                      <ArrowUpOutlined style={{ color: '#52c41a' }} />
                    )}
                    {stat.trend === 'down' && (
                      <ArrowDownOutlined style={{ color: '#f5222d' }} />
                    )}
                    {stat.trendValue && (
                      <span style={{
                        color: stat.trend === 'up' ? '#52c41a' : stat.trend === 'down' ? '#f5222d' : '#666',
                        fontSize: 12,
                      }}>
                        {stat.trendValue}
                      </span>
                    )}
                  </Space>
                }
                precision={stat.precision}
                valueStyle={{ color: stat.color || '#000' }}
              />
              {stat.secondaryValue && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                  {stat.secondaryValue}
                </div>
              )}
            </Card>
          </Tooltip>
        </Col>
      ))}
    </Row>
  );
};

interface AntProgressStatsProps {
  items: Array<{
    title: string;
    percent: number;
    status?: 'success' | 'exception' | 'normal' | 'active';
    color?: string;
  }>;
}

export const AntProgressStats: React.FC<AntProgressStatsProps> = ({ items }) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {items.map((item, index) => (
        <div key={index}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>{item.title}</span>
            <span style={{ fontWeight: 'bold' }}>{item.percent}%</span>
          </div>
          <Progress
            percent={item.percent}
            status={item.status}
            strokeColor={item.color || '#ff8c42'}
          />
        </div>
      ))}
    </Space>
  );
};

export default AntStats;
