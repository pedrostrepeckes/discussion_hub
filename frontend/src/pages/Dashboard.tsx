import React, { useEffect, useState } from 'react';
import { Tabs, Row, Col, Card, Tag, Button, Typography, Skeleton, message, Modal, Form, Input } from 'antd';
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
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

    const handleCreateDiscussion = async (values: { title: string; content: string }) => {
        try {
            await api.post('/discussions/', values);
            message.success(TEXTS.SUCCESS_GENERIC || 'Discussão criada com sucesso!');
            setIsModalOpen(false);
            form.resetFields();
            fetchDiscussions();
        } catch (error) {
            message.error(TEXTS.ERROR_GENERIC);
        }
    };

    const activeDiscussions = discussions.filter(d => d.status === DiscussionStatus.ATIVA);
    const finishedDiscussions = discussions.filter(d => d.status === DiscussionStatus.FINALIZADA);

    const DiscussionGrid = ({ data }: { data: Discussion[] }) => (
        <Row gutter={[24, 24]}>
            {data.map((item) => (
                <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                    <Link to={`/discussion/${item.id}`} style={{ textDecoration: 'none' }}>
                        <Card className="bento-card" bordered={false}>
                            <div style={{ flex: 1 }}>
                                <Title level={4} style={{ marginBottom: 12, fontSize: '18px', fontWeight: 700, lineHeight: 1.3 }} ellipsis={{ rows: 2 }}>
                                    {item.title}
                                </Title>
                                <div style={{
                                    color: 'var(--text-secondary)',
                                    marginBottom: 24,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    fontSize: '14px',
                                    lineHeight: 1.5
                                }}>
                                    {item.content}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                <Tag
                                    color={item.status === DiscussionStatus.ATIVA ? 'green' : 'red'}
                                    style={{ borderRadius: '12px', padding: '0 10px', border: 'none', fontWeight: 500 }}
                                >
                                    {item.status.toUpperCase()}
                                </Tag>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </Card>
                    </Link>
                </Col>
            ))}
        </Row>
    );

    const items = [
        {
            key: '1',
            label: TEXTS.TAB_ACTIVE,
            children: <DiscussionGrid data={activeDiscussions} />,
        },
        {
            key: '2',
            label: TEXTS.TAB_FINISHED,
            children: <DiscussionGrid data={finishedDiscussions} />,
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Title level={2}>{TEXTS.DASHBOARD_TITLE}</Title>
                {user?.role === Role.ADMIN && (
                    <Button type="primary" onClick={() => setIsModalOpen(true)}>{TEXTS.NEW_DISCUSSION_BUTTON}</Button>
                )}
            </div>

            {loading ? (
                <Skeleton active />
            ) : (
                <Tabs defaultActiveKey="1" items={items} />
            )}

            <Modal
                title="Nova Discussão"
                open={isModalOpen}
                onOk={form.submit}
                onCancel={() => setIsModalOpen(false)}
                okText="Criar"
                cancelText="Cancelar"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateDiscussion}
                >
                    <Form.Item
                        name="title"
                        label="Título"
                        rules={[{ required: true, message: 'Por favor, insira o título!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="content"
                        label="Conteúdo"
                        rules={[{ required: true, message: 'Por favor, insira o conteúdo!' }]}
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Dashboard;
