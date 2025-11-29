import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { TEXTS } from '../utils/textDictionary';
import type { AuthResponse, User } from '../types';

const { Title, Text } = Typography;

const Login: React.FC = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // 1. Login to get token
            const loginResponse = await api.post<AuthResponse>('/auth/login', {
                email: values.email,
                password: values.password,
            });

            const token = loginResponse.data.access_token;

            // 2. Get user details
            const userResponse = await api.get<User>('/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setAuth(userResponse.data);
            message.success(TEXTS.SUCCESS_GENERIC);
            navigate('/');
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
                    <Title level={3}>{TEXTS.LOGIN_TITLE}</Title>
                </div>
                <Form
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                >
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
                            {TEXTS.LOGIN_BUTTON}
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Text>
                            <Link to="/register">{TEXTS.NO_ACCOUNT}</Link>
                        </Text>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
