import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Card, Typography, Tag, Divider, Button, Form, Input, Radio, message, Badge, Tooltip, Space } from 'antd';
import { CheckCircleOutlined, LikeOutlined, DislikeOutlined, MessageOutlined } from '@ant-design/icons';
import api from '../services/api';
import { ResponseType, DiscussionStatus, Role } from '../types';
import type { Discussion, Response } from '../types';
import { TEXTS } from '../utils/textDictionary';
import { useAuthStore } from '../store/authStore';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface ResponseItemProps {
    item: Response;
    onVote: (id: number, type: 'up' | 'down') => void;
    onReply: (id: number) => void;
    replyingTo: number | null;
    onCancelReply: () => void;
    onSubmitReply: (values: any) => void;
    submittingReply: boolean;
    isRoot?: boolean;
    containerStyle?: React.CSSProperties;
    cardStyle?: React.CSSProperties;
}

const ResponseItem: React.FC<ResponseItemProps> = ({
    item,
    onVote,
    onReply,
    replyingTo,
    onCancelReply,
    onSubmitReply,
    submittingReply,
    isRoot = false,
    containerStyle,
    cardStyle
}) => {
    const [form] = Form.useForm();

    // Reset form when replyingTo changes to this item
    useEffect(() => {
        if (replyingTo === item.id) {
            form.resetFields();
        }
    }, [replyingTo, item.id, form]);

    const isReplying = replyingTo === item.id;

    const getBorderColor = () => {
        if (item.is_reliable_source) return '#52c41a';
        if (item.type === ResponseType.CONCORDO) return '#b7eb8f'; // Light green
        if (item.type === ResponseType.DISCORDO) return '#ffa39e'; // Light red
        return undefined;
    };

    return (
        <div style={{ marginBottom: 16, ...containerStyle }}>
            <Card
                style={{
                    borderColor: getBorderColor(),
                    borderLeft: item.type === ResponseType.CONCORDO ? '5px solid #52c41a' : '5px solid #f5222d',
                    ...cardStyle
                }}
                size="small"
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                            <Text strong>{item.author?.name || 'Usuário'}</Text>
                            {item.type === ResponseType.CONCORDO ?
                                <Tag color="success">Concorda</Tag> :
                                <Tag color="error">Discorda</Tag>
                            }
                        </Space>
                        {item.is_reliable_source && (
                            <Tooltip title={TEXTS.RELIABLE_SOURCE_BADGE}>
                                <Badge status="success" text={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
                            </Tooltip>
                        )}
                    </div>
                }
            >
                <Paragraph>{item.content}</Paragraph>
                <div style={{ display: 'flex', gap: 16, color: '#888', fontSize: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button
                        type={item.user_vote === 'up' ? 'primary' : 'text'}
                        shape="circle"
                        icon={<LikeOutlined />}
                        onClick={() => onVote(item.id, 'up')}
                        size="small"
                    />
                    <span>{item.upvotes}</span>

                    <Button
                        type={item.user_vote === 'down' ? 'primary' : 'text'}
                        shape="circle"
                        icon={<DislikeOutlined />}
                        onClick={() => onVote(item.id, 'down')}
                        danger={item.user_vote === 'down'}
                        size="small"
                    />
                    <span>{item.downvotes}</span>

                    <Divider type="vertical" />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>

                    {isRoot && (
                        <>
                            <Divider type="vertical" />
                            <Button
                                type="link"
                                icon={<MessageOutlined />}
                                onClick={() => onReply(item.id)}
                                size="small"
                            >
                                Responder
                            </Button>
                        </>
                    )}
                </div>

                {isReplying && (
                    <div style={{ marginTop: 16, background: '#fafafa', padding: 16, borderRadius: 8 }}>
                        <Form form={form} onFinish={onSubmitReply} layout="vertical">
                            <Form.Item name="type" rules={[{ required: true, message: 'Escolha um lado!' }]}>
                                <Radio.Group buttonStyle="solid" size="small">
                                    <Radio.Button value={ResponseType.CONCORDO} style={{ color: '#52c41a' }}>Concordo</Radio.Button>
                                    <Radio.Button value={ResponseType.DISCORDO} style={{ color: '#f5222d' }}>Discordo</Radio.Button>
                                </Radio.Group>
                            </Form.Item>
                            <Form.Item name="content" rules={[{ required: true, message: 'Escreva sua resposta!' }]}>
                                <TextArea rows={3} placeholder="Escreva sua resposta..." />
                            </Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={submittingReply} size="small">
                                    Enviar
                                </Button>
                                <Button onClick={onCancelReply} size="small">
                                    Cancelar
                                </Button>
                            </Space>
                        </Form>
                    </div>
                )}
            </Card>

            {/* Nested Replies */}
            {item.replies && item.replies.length > 0 && (
                <div style={{ marginLeft: 32, marginTop: 8, display: 'flex', flexDirection: 'column' }}>
                    {item.replies.map(reply => {
                        const isAgree = reply.type === ResponseType.CONCORDO;
                        const replyContainerStyle: React.CSSProperties = {
                            alignSelf: isAgree ? 'flex-start' : 'flex-end',
                            width: '85%'
                        };
                        const replyCardStyle: React.CSSProperties = isAgree ?
                            { borderLeft: '4px solid #52c41a', textAlign: 'left' as const } :
                            { borderRight: '4px solid #f5222d', borderLeft: 'none', textAlign: 'right' as const };

                        return (
                            <ResponseItem
                                key={reply.id}
                                item={reply}
                                onVote={onVote}
                                onReply={onReply}
                                replyingTo={replyingTo}
                                onCancelReply={onCancelReply}
                                onSubmitReply={onSubmitReply}
                                submittingReply={submittingReply}
                                isRoot={false} // Nested items are not root
                                containerStyle={replyContainerStyle}
                                cardStyle={replyCardStyle}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const DiscussionDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuthStore();
    const [discussion, setDiscussion] = useState<Discussion | null>(null);
    const [responses, setResponses] = useState<Response[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [submittingReply, setSubmittingReply] = useState(false);

    // Main form for top-level responses
    const [mainForm] = Form.useForm();

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

    const handleMainSubmit = async (values: any) => {
        setSubmitting(true);
        try {
            await api.post(`/discussions/${id}/responses/`, {
                content: values.content,
                type: values.type,
                parent_id: null
            });
            message.success("Resposta enviada para moderação!");
            mainForm.resetFields();
            fetchData(); // Refresh to see if it appears (if moderation allows) or just to sync
        } catch (error: any) {
            message.error(error.response?.data?.detail || TEXTS.ERROR_GENERIC);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReplySubmit = async (values: any) => {
        if (!replyingTo) return;

        setSubmittingReply(true);
        try {
            await api.post(`/discussions/${id}/responses/`, {
                content: values.content,
                type: values.type,
                parent_id: replyingTo
            });
            message.success("Resposta enviada para moderação!");
            setReplyingTo(null);
            fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.detail || TEXTS.ERROR_GENERIC);
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleFinishDiscussion = async () => {
        try {
            const response = await api.put<Discussion>(`/discussions/${id}/finish`);
            setDiscussion(response.data);
            message.success("Discussão finalizada com sucesso!");
        } catch (error) {
            message.error("Erro ao finalizar discussão.");
        }
    };

    const handleVote = async (responseId: number, voteType: 'up' | 'down') => {
        try {
            // Optimistic update
            const updateVoteInList = (list: Response[]): Response[] => {
                return list.map(r => {
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
                    if (r.replies) {
                        return { ...r, replies: updateVoteInList(r.replies) };
                    }
                    return r;
                });
            };

            setResponses(prev => updateVoteInList(prev));

            await api.post(`/responses/${responseId}/vote`, null, {
                params: { vote_type: voteType }
            });
        } catch (error) {
            message.error("Erro ao registrar voto.");
            fetchData(); // Revert on error
        }
    };

    // Organize responses: Top level only for the columns, replies nested inside
    const organizeResponses = (allResponses: Response[]) => {
        const map = new Map<number, Response>();
        const roots: Response[] = [];

        // Deep copy to avoid mutating state directly if we were using it elsewhere
        // But here we are building a new structure for render
        const allResponsesCopy = JSON.parse(JSON.stringify(allResponses));

        // Initialize map
        allResponsesCopy.forEach((r: Response) => {
            r.replies = []; // Ensure replies array exists
            map.set(r.id, r);
        });

        allResponsesCopy.forEach((r: Response) => {
            if (r.parent_id) {
                const parent = map.get(r.parent_id);
                if (parent) {
                    parent.replies?.push(r);
                }
            } else {
                roots.push(r);
            }
        });

        return roots;
    };

    const rootResponses = organizeResponses(responses);
    const agreeResponses = rootResponses.filter(r => r.type === ResponseType.CONCORDO);
    const disagreeResponses = rootResponses.filter(r => r.type === ResponseType.DISCORDO);

    if (loading || !discussion) return <div style={{ padding: 24 }}>Carregando...</div>;

    return (
        <div>
            <Card style={{ marginBottom: 24 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={2} style={{ marginBottom: 0 }}>{discussion.title}</Title>
                    {user && (user.role === Role.MODERATOR || user.role === Role.ADMIN) && discussion.status === DiscussionStatus.ATIVA && (
                        <Button danger onClick={handleFinishDiscussion}>
                            Finalizar Discussão
                        </Button>
                    )}
                </div>
                <br />
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
                    {agreeResponses.map(r => (
                        <ResponseItem
                            key={r.id}
                            item={r}
                            onVote={handleVote}
                            onReply={setReplyingTo}
                            replyingTo={replyingTo}
                            onCancelReply={() => setReplyingTo(null)}
                            onSubmitReply={handleReplySubmit}
                            submittingReply={submittingReply}
                            isRoot={true}
                        />
                    ))}
                </Col>
                <Col span={12}>
                    <Title level={4} style={{ color: '#f5222d', textAlign: 'center' }}>{TEXTS.RESPONSE_DISAGREE_TITLE}</Title>
                    {disagreeResponses.map(r => (
                        <ResponseItem
                            key={r.id}
                            item={r}
                            onVote={handleVote}
                            onReply={setReplyingTo}
                            replyingTo={replyingTo}
                            onCancelReply={() => setReplyingTo(null)}
                            onSubmitReply={handleReplySubmit}
                            submittingReply={submittingReply}
                            isRoot={true}
                        />
                    ))}
                </Col>
            </Row>

            <Divider />

            {discussion.status === DiscussionStatus.ATIVA && (
                <Card title="Deixe sua opinião">
                    <Form form={mainForm} onFinish={handleMainSubmit} layout="vertical">
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
