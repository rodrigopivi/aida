import '@babel/polyfill';
import { Icon, Layout, Menu } from 'antd';
import Link from 'gatsby-link';
import * as React from 'react';
import styled from 'styled-components';
import { Logo } from './Logo';

const { Header, Content, Footer } = Layout;

const demoRouteRE = /^\/demo(\/.*)?$/i;
const trainRouteRE = /^\/train(\/.*)?$/i;

const StyledContent = styled(Content)`
    > p {
        text-align: justify;
    }
    background: #fcfcfc;
    padding: 48px 48px 48px 72px;
    min-height: 280px;
`;

export default class MainLayout extends React.Component<any, {}> {
    public render() {
        let defaultSelectedKeys = '0';
        if (demoRouteRE.test(this.props.location.pathname)) {
            defaultSelectedKeys = '0';
        } else if (trainRouteRE.test(this.props.location.pathname)) {
            defaultSelectedKeys = '1';
        }
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Header style={{ background: '#fcfcfc', padding: 0, display: 'flex' }}>
                    <Logo style={{ textAlign: 'right', width: 200, paddingLeft: 24, paddingRight: 24 }}>
                        <Link to="/" href="/">
                            {`< Aida />`}
                        </Link>
                    </Logo>
                    <div style={{ flex: 1 }} />
                    <div style={{ padding: '0 48px 0 24px', display: 'inline-block', textAlign: 'right', float: 'right' }}>
                        <a href="https://github.com/rodrigopivi/aida" title="Aida" style={{ fontSize: 26 }}>
                            <Icon type="github" />
                        </a>
                    </div>
                </Header>
                <Layout style={{ flexDirection: 'row' }}>
                    <Layout.Sider width={200} breakpoint="lg" collapsedWidth="0" theme="light" style={{ backgroundColor: '#fcfcfc' }}>
                        <Menu theme="light" mode="inline" defaultSelectedKeys={[defaultSelectedKeys]} style={{ background: '#fcfcfc' }}>
                            <Menu.Item key="0">
                                <Link to="/demo" href="/demo">
                                    <Icon type="right-circle-o" />
                                    Demo
                                </Link>
                            </Menu.Item>
                            <Menu.Item key="1">
                                <Link to="/train" href="/train">
                                    <Icon type="right-circle-o" />
                                    Train your own
                                </Link>
                            </Menu.Item>
                        </Menu>
                    </Layout.Sider>
                    <Layout style={{ padding: '24px 0 0 24px' }}>
                        <StyledContent>{this.props.children}</StyledContent>
                        <Footer style={{ textAlign: 'center' }}>Aida © 2018 Rodrigo Pimentel</Footer>
                    </Layout>
                </Layout>
            </Layout>
        );
    }
}
