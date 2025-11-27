import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Card, Typography, Tag, Divider, Button, Form, Input, Radio, message, Badge, Tooltip } from 'antd';
import { CheckCircleOutlined, LikeOutlined, DislikeOutlined } from '@ant-design/icons';
import api from '../services/api';
import { ResponseType, DiscussionStatus } from '../types';
import type { Discussion, Response } from '../types';
import { TEXTS } from '../utils/textDictionary';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const DiscussionDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [discussion, setDiscussion] = useState<Discussion | null>(null);
    const [responses, setResponses] = useState<Response[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [discRes, respRes] = await Promise.all([
                api.get<Discussion>(`/discussions/${id}`),
                api.get<Response[]>(`/discussions/${id}/responses/`)
            ]);
            setDiscussion(discRes.data);
            setResponses(respRes.data);
        } catch (error) {
            message.error(TEXTS.ERROR_GENERIC);
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            await api.post(`/discussions/${id}/responses/`, {
                content: values.content,
                type: values.type,
                parent_id: null // Top level for now
            });
            message.success("Resposta enviada para moderação!");
            form.resetFields();
            // Don't refresh responses immediately as it needs moderation
        } catch (error: any) {
            message.error(error.response?.data?.detail || TEXTS.ERROR_GENERIC);
        } finally {
            setSubmitting(false);
        }
    };

    const handleVote = async (responseId: number, voteType: 'up' | 'down') => {
        try {
            // Optimistic update
            setResponses(prevResponses => prevResponses.map(r => {
                if (r.id === responseId) {
                    let newUpvotes = r.upvotes;
                    let newDownvotes = r.downvotes;
                    let newUserVote = r.user_vote;

                    if (r.user_vote === voteType) {
                        // Toggle off
                        newUserVote = null;
                        if (voteType === 'up') newUpvotes--;
                        else newDownvotes--;
                    } else {
                        // Change vote or new vote
                        if (r.user_vote === 'up') newUpvotes--;
                        if (r.user_vote === 'down') newDownvotes--;

                        newUserVote = voteType;
                        if (voteType === 'up') newUpvotes++;
                        else newDownvotes++;
                    }

                    return {
                        ...r,
                        upvotes: newUpvotes,
                        downvotes: newDownvotes,
                        user_vote: newUserVote
                    };
                }
                return r;
            }));

            await api.post(`/responses/${responseId}/vote`, null, {
                params: { vote_type: voteType }
            });
        } catch (error) {
            message.error("Erro ao registrar voto.");
            // Revert optimistic update if needed (optional, keeping it simple for now)
            // Ideally we should refetch or revert here
        }
    };

    // Organize responses: Top level only for the columns, replies nested inside
    const organizeResponses = (allResponses: Response[]) => {
        const map = new Map<number, Response>();
        const roots: Response[] = [];

        // Initialize map with replies array
        allResponses.forEach(r => {
            map.set(r.id, { ...r, replies: [] });
        });

        allResponses.forEach(r => {
            if (r.parent_id) {
                const parent = map.get(r.parent_id);
                if (parent) {
                    parent.replies?.push(map.get(r.id)!);
                }
            } else {
                roots.push(map.get(r.id)!);
            }
        });

        return roots;
    };

    const rootResponses = organizeResponses(responses);
    const agreeResponses = rootResponses.filter(r => r.type === ResponseType.CONCORDO);
    const disagreeResponses = rootResponses.filter(r => r.type === ResponseType.DISCORDO);

    const ResponseCard = ({ item }: { item: Response }) => (
        <Card
            style={{ marginBottom: 16, borderColor: item.is_reliable_source ? '#52c41a' : undefined }}
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>{item.author?.name || 'Usuário'}</Text>
                    {item.is_reliable_source && (
                        <Tooltip title={TEXTS.RELIABLE_SOURCE_BADGE}>
                            <Badge status="success" text={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
                        </Tooltip>
                    )}
                </div>
            }
        >
            <Paragraph>{item.content}</Paragraph>
            <div style={{ display: 'flex', gap: 16, color: '#888', fontSize: 12, alignItems: 'center' }}>
                <Button
                    type={item.user_vote === 'up' ? 'primary' : 'text'}
                    shape="circle"
                    icon={<LikeOutlined />}
                    onClick={() => handleVote(item.id, 'up')}
                />
                <span>{item.upvotes}</span>

                <Button
                    type={item.user_vote === 'down' ? 'primary' : 'text'}
                    shape="circle"
                    icon={<DislikeOutlined />}
                    onClick={() => handleVote(item.id, 'down')}
                    danger={item.user_vote === 'down'}
                />
                <span>{item.downvotes}</span>

                <Divider type="vertical" />
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
            {item.replies && item.replies.length > 0 && (
                <div style={{ marginTop: 16, paddingLeft: 16, borderLeft: '2px solid #f0f0f0' }}>
                    {item.replies.map(reply => (
                        <div key={reply.id} style={{ marginBottom: 8 }}>
                            <Text strong>{reply.author?.name}: </Text>
                            <Text>{reply.content}</Text>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );

    if (loading || !discussion) return <div style={{ padding: 24 }}>Carregando...</div>;

    return (
        <div>
            <Card style={{ marginBottom: 24 }}>
                <Title level={2}>{discussion.title}</Title>
                <div style={{ marginBottom: 16 }}>
                    <Tag color={discussion.status === DiscussionStatus.ATIVA ? 'green' : 'red'}>
                        {discussion.status.toUpperCase()}
                    </Tag>
                    <Text type="secondary">
                        {TEXTS.AUTHOR_PREFIX} {discussion.author?.name} {TEXTS.DATE_PREFIX} {new Date(discussion.created_at).toLocaleDateString()}
                    </Text>
                </div>
                <Paragraph style={{ fontSize: 16 }}>{discussion.content}</Paragraph>
            </Card>

            <Row gutter={24}>
                <Col span={12}>
                    <Title level={4} style={{ color: '#52c41a', textAlign: 'center' }}>{TEXTS.RESPONSE_AGREE_TITLE}</Title>
                    {agreeResponses.map(r => <ResponseCard key={r.id} item={r} />)}
                </Col>
                <Col span={12}>
                    <Title level={4} style={{ color: '#f5222d', textAlign: 'center' }}>{TEXTS.RESPONSE_DISAGREE_TITLE}</Title>
                    {disagreeResponses.map(r => <ResponseCard key={r.id} item={r} />)}
                </Col>
            </Row>

            <Divider />

            {discussion.status === DiscussionStatus.ATIVA && (
                <Card title="Deixe sua opinião">
                    <Form form={form} onFinish={onFinish} layout="vertical">
                        <Form.Item name="type" rules={[{ required: true, message: 'Escolha um lado!' }]}>
                            <Radio.Group buttonStyle="solid">
                                <Radio.Button value={ResponseType.CONCORDO} style={{ color: '#52c41a' }}>Concordo</Radio.Button>
                                <Radio.Button value={ResponseType.DISCORDO} style={{ color: '#f5222d' }}>Discordo</Radio.Button>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item name="content" rules={[{ required: true, message: 'Escreva sua resposta!' }]}>
                            <TextArea rows={4} placeholder="Escreva seus argumentos..." />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={submitting}>
                                {TEXTS.SEND_RESPONSE_BUTTON}
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )}
        </div>
    );
};

export default DiscussionDetail;
