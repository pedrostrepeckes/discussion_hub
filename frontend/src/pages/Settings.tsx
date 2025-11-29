import React, { useState } from 'react';
import { Form, Input, Button, Radio, Card, message, Typography } from 'antd';
import { useThemeStore } from '../store/themeStore';
import type { Theme } from '../store/themeStore';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const { Title } = Typography;

const Settings: React.FC = () => {
    const { theme, setTheme } = useThemeStore();
    const { user, setAuth } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const updateData: any = {};
            if (values.name) updateData.name = values.name;
            if (values.password) updateData.password = values.password;

            if (Object.keys(updateData).length === 0) {
                message.info('Nenhuma alteração detectada.');
                setLoading(false);
                return;
            }

            const response = await api.put('/users/me', updateData);
            setAuth({ ...user!, name: response.data.name });
            message.success('Perfil atualizado com sucesso!');
            form.resetFields(['password']);
        } catch (error) {
            message.error('Erro ao atualizar perfil.');
        } finally {
            setLoading(false);
        }
    };

    const handleThemeChange = (e: any) => {
        setTheme(e.target.value as Theme);
        message.success(`Tema alterado para ${e.target.value}`);
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
            <Title level={2}>Configurações</Title>

            <Card title="Aparência" style={{ marginBottom: 20 }}>
                <Radio.Group value={theme} onChange={handleThemeChange}>
                    <Radio.Button value="light">Claro</Radio.Button>
                    <Radio.Button value="dark">Escuro</Radio.Button>
                    <Radio.Button value="rage">Rage</Radio.Button>
                </Radio.Group>
            </Card>

            <Card title="Perfil">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ name: user?.name }}
                >
                    <Form.Item
                        label="Nome de Exibição"
                        name="name"
                    >
                        <Input placeholder="Seu nome" />
                    </Form.Item>

                    <Form.Item
                        label="Nova Senha"
                        name="password"
                        help="Deixe em branco para manter a senha atual"
                    >
                        <Input.Password placeholder="Nova senha" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Salvar Alterações
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Settings;
