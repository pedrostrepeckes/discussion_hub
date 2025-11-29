import React from 'react';
import { Layout, Menu, Button, Typography } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { TEXTS } from '../utils/textDictionary';
import { Role } from '../types';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isAuthenticated } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        {
            key: '/',
            label: TEXTS.DASHBOARD_TITLE,
            onClick: () => navigate('/'),
        },
        {
            key: '/settings',
            label: 'Configurações',
            onClick: () => navigate('/settings'),
        },
    ];

    if (user?.role === Role.MODERATOR || user?.role === Role.ADMIN) {
        menuItems.push({
            key: '/moderation',
            label: TEXTS.MODERATION_TITLE,
            onClick: () => navigate('/moderation'),
        });
    }

    return (
        <Layout className="layout" style={{ minHeight: '100vh' }}>
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="logo" style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
                    <Title level={4} style={{ color: 'white', margin: 0 }}>{TEXTS.APP_TITLE}</Title>
                </div>
                <Menu
                    theme="dark"
                    mode="horizontal"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    style={{ flex: 1, minWidth: 0 }}
                />
                <div>
                    {isAuthenticated() ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: 'white' }}>{user?.name}</span>
                            <Button type="primary" danger onClick={handleLogout}>
                                {TEXTS.LOGOUT_BUTTON}
                            </Button>
                        </div>
                    ) : (
                        <Button type="primary" onClick={() => navigate('/login')}>
                            {TEXTS.LOGIN_BUTTON}
                        </Button>
                    )}
                </div>
            </Header>
            <Content style={{ padding: '0 50px', marginTop: '20px' }}>
                <div className="site-layout-content" style={{ background: '#fff', padding: 24, minHeight: 380, borderRadius: '8px' }}>
                    <Outlet />
                </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>
                {TEXTS.APP_TITLE} ©{new Date().getFullYear()} Created by Antigravity
            </Footer>
        </Layout>
    );
};

export default MainLayout;
