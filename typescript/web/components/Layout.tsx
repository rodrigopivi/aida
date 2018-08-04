import '@babel/polyfill';
import { Icon, Layout, Menu } from 'antd';
import Link from 'gatsby-link';
import * as React from 'react';
import { Logo } from './Logo';

const { Header, Content, Footer } = Layout;

const exampleRouteRE = /^\/example(\/.*)?$/i;
const trainRouteRE = /^\/train(\/.*)?$/i;

export default class MainLayout extends React.Component<any, {}> {
    public render() {
        let defaultSelectedKeys = '0';
        if (exampleRouteRE.test(this.props.location.pathname)) {
            defaultSelectedKeys = '1';
        } else if (trainRouteRE.test(this.props.location.pathname)) {
            defaultSelectedKeys = '2';
        }
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Header style={{ background: '#fff', padding: 0, display: 'flex' }}>
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
                    <Layout.Sider width={200} breakpoint="lg" collapsedWidth="0" theme="light">
                        <Menu theme="light" mode="inline" defaultSelectedKeys={[defaultSelectedKeys]}>
                            <Menu.Item key="0">
                                <Link to="/overview" href="/overview">
                                    <Icon type="right-circle-o" />
                                    Overview
                                </Link>
                            </Menu.Item>
                            <Menu.Item key="1">
                                <Link to="/example" href="/example">
                                    <Icon type="right-circle-o" />
                                    Pre-trained Example
                                </Link>
                            </Menu.Item>
                            <Menu.Item key="2">
                                <Link to="/train" href="/train">
                                    <Icon type="right-circle-o" />
                                    Train Example
                                </Link>
                            </Menu.Item>
                        </Menu>
                    </Layout.Sider>
                    <Layout style={{ padding: '24px 24px 0 24px' }}>
                        <Content style={{ background: '#fff', padding: 24, minHeight: 280 }}>{this.props.children}</Content>
                        <Footer style={{ textAlign: 'center' }}>Aida © 2018 Rodrigo Pimentel</Footer>
                    </Layout>
                </Layout>
            </Layout>
        );
    }
}
