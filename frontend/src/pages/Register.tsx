import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { TEXTS } from '../utils/textDictionary';

const { Title, Text } = Typography;

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            await api.post('/auth/register', {
                email: values.email,
                name: values.name,
                password: values.password,
            });
            message.success(TEXTS.SUCCESS_GENERIC);
            navigate('/login');
        } catch (error: any) {
            message.error(error.response?.data?.detail || TEXTS.ERROR_GENERIC);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 400 }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <Title level={3}>{TEXTS.REGISTER_TITLE}</Title>
                </div>
                <Form
                    name="register"
                    onFinish={onFinish}
                    layout="vertical"
                >
                    <Form.Item
                        label={TEXTS.NAME_LABEL}
                        name="name"
                        rules={[{ required: true, message: 'Please input your name!' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label={TEXTS.EMAIL_LABEL}
                        name="email"
                        rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Invalid email!' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label={TEXTS.PASSWORD_LABEL}
                        name="password"
                        rules={[{ required: true, message: 'Please input your password!' }]}
                    >
                        <Input.Password />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            {TEXTS.REGISTER_BUTTON}
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Text>
                            <Link to="/login">{TEXTS.HAS_ACCOUNT}</Link>
                        </Text>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Register;
