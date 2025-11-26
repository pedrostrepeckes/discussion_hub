import React, { useEffect, useState } from 'react';
import { Tabs, List, Tag, Button, Typography, Skeleton, message } from 'antd';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { DiscussionStatus, Role } from '../types';
import type { Discussion } from '../types';
import { TEXTS } from '../utils/textDictionary';
import { useAuthStore } from '../store/authStore';

const { Title } = Typography;

const Dashboard: React.FC = () => {
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        fetchDiscussions();
    }, []);

    const fetchDiscussions = async () => {
        try {
            const response = await api.get<Discussion[]>('/discussions/');
            setDiscussions(response.data);
        } catch (error) {
            message.error(TEXTS.ERROR_GENERIC);
        } finally {
            setLoading(false);
        }
    };

    const activeDiscussions = discussions.filter(d => d.status === DiscussionStatus.ATIVA);
    const finishedDiscussions = discussions.filter(d => d.status === DiscussionStatus.FINALIZADA);

    const DiscussionList = ({ data }: { data: Discussion[] }) => (
        <List
            itemLayout="horizontal"
            dataSource={data}
            renderItem={(item) => (
                <List.Item
                    actions={[<Link to={`/discussion/${item.id}`}>Ver Detalhes</Link>]}
                >
                    <List.Item.Meta
                        title={<Link to={`/discussion/${item.id}`}>{item.title}</Link>}
                        description={
                            <>
                                <div>{item.content.substring(0, 100)}...</div>
                                <div style={{ marginTop: 8 }}>
                                    <Tag color={item.status === DiscussionStatus.ATIVA ? 'green' : 'red'}>
                                        {item.status.toUpperCase()}
                                    </Tag>
                                    <span style={{ fontSize: '12px', color: '#888' }}>
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </>
                        }
                    />
                </List.Item>
            )}
        />
    );

    const items = [
        {
            key: '1',
            label: TEXTS.TAB_ACTIVE,
            children: <DiscussionList data={activeDiscussions} />,
        },
        {
            key: '2',
            label: TEXTS.TAB_FINISHED,
            children: <DiscussionList data={finishedDiscussions} />,
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Title level={2}>{TEXTS.DASHBOARD_TITLE}</Title>
                {user?.role === Role.ADMIN && (
                    <Button type="primary">{TEXTS.NEW_DISCUSSION_BUTTON}</Button>
                )}
            </div>

            {loading ? (
                <Skeleton active />
            ) : (
                <Tabs defaultActiveKey="1" items={items} />
            )}
        </div>
    );
};

export default Dashboard;
