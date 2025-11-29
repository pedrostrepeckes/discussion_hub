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
            <Header style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px'
            }}>
                <div className="logo" style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
                    <Title level={4} style={{ margin: 0, color: 'var(--text-color)' }}>{TEXTS.APP_TITLE}</Title>
                </div>
                <Menu
                    mode="horizontal"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    style={{ flex: 1, minWidth: 0 }}
                />
                <div>
                    {isAuthenticated() ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: 'var(--text-color)' }}>{user?.name}</span>
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
                <div className="site-layout-content" style={{ padding: 32, minHeight: 380 }}>
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
