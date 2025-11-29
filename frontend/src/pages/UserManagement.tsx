import React, { useEffect, useState } from 'react';
import { Table, Select, message, Typography, Card } from 'antd';
import api from '../services/api';
import { Role, type User } from '../types';

const { Title } = Typography;
const { Option } = Select;

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users/');
            setUsers(response.data);
        } catch (error) {
            message.error('Erro ao carregar usuários.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId: number, newRole: Role) => {
        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            message.success('Permissão atualizada com sucesso!');
            // Update local state to reflect change
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId ? { ...user, role: newRole } : user
                )
            );
        } catch (error: any) {
            console.error(error);
            if (error.response && error.response.status === 403) {
                message.error(error.response.data.detail || 'Permissão negada.');
            } else {
                message.error('Erro ao atualizar permissão.');
            }
            // Revert change in UI if needed (though we didn't optimistically update yet)
            fetchUsers(); // Refresh to ensure consistency
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Nome',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: Role, record: User) => (
                <Select
                    defaultValue={role}
                    style={{ width: 120 }}
                    onChange={(value) => handleRoleChange(record.id, value)}
                >
                    <Option value={Role.REGULAR}>Regular</Option>
                    <Option value={Role.MODERATOR}>Moderator</Option>
                    <Option value={Role.ADMIN}>Admin</Option>
                </Select>
            ),
        },
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Card>
                <Title level={2}>Gerenciamento de Usuários</Title>
                <Table
                    dataSource={users}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default UserManagement;
