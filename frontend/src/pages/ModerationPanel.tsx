import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Tag, Typography } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../services/api';
import type { Response } from '../types';
import { TEXTS } from '../utils/textDictionary';

const { Title } = Typography;

const ModerationPanel: React.FC = () => {
    const [responses, setResponses] = useState<Response[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingResponses();
    }, []);

    const fetchPendingResponses = async () => {
        setLoading(true);
        try {
            const res = await api.get<Response[]>('/moderation/responses/pending');
            setResponses(res.data);
        } catch (error) {
            message.error(TEXTS.ERROR_GENERIC);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: number, action: 'approve' | 'reject') => {
        try {
            await api.put(`/moderation/responses/${id}/${action}`);
            message.success(action === 'approve' ? TEXTS.SUCCESS_GENERIC : "Resposta rejeitada.");
            fetchPendingResponses();
        } catch (error) {
            message.error(TEXTS.ERROR_GENERIC);
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60,
        },
        {
            title: 'Conteúdo',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
        },
        {
            title: 'Autor',
            dataIndex: ['author', 'name'],
            key: 'author',
            render: (text: string) => text || 'Desconhecido',
        },
        {
            title: 'Tipo',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={type === 'concordo' ? 'green' : 'red'}>{type.toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Data',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleString(),
        },
        {
            title: 'Ações',
            key: 'actions',
            render: (_: any, record: Response) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => handleAction(record.id, 'approve')}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                        {TEXTS.APPROVE_BUTTON}
                    </Button>
                    <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleAction(record.id, 'reject')}
                    >
                        {TEXTS.REJECT_BUTTON}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Title level={2}>{TEXTS.MODERATION_TITLE}</Title>
            <Table
                dataSource={responses}
                columns={columns}
                rowKey="id"
                loading={loading}
            />
        </div>
    );
};

export default ModerationPanel;
