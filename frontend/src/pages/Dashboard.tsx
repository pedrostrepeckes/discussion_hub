import React, { useEffect, useState } from 'react';
import { Tabs, List, Tag, Button, Typography, Skeleton, message, Modal, Form, Input } from 'antd';
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
