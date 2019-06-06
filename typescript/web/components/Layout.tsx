import '@babel/polyfill';
import { Icon, Layout, Menu } from 'antd';
import Link from 'gatsby-link';
import * as React from 'react';
import styled from 'styled-components';
import { Logo } from './Logo';

const { Content, Footer } = Layout;

const startRouteRE = /^\/start(\/.*)?$/i;
const overviewRouteRE = /^\/overview(\/.*)?$/i;
const demoRouteRE = /^\/demo(\/.*)?$/i;
const trainRouteRE = /^\/train(\/.*)?$/i;

export const InnerContent = styled(Content)`
    > p {
        text-align: justify;
    }
    background: #fcfcfc;
    min-height: '95vh';
`;

export const InnerPaddedContent = styled(InnerContent)`
    padding: 28px 28px 28px 52px;
`;

export default class MainLayout extends React.Component<{ location: { pathname: string }; addPadding?: boolean }, {}> {
    public render() {
        let defaultSelectedKeys = '-1';
        if (startRouteRE.test(this.props.location.pathname)) {
            defaultSelectedKeys = '0';
        } else if (trainRouteRE.test(this.props.location.pathname)) {
            defaultSelectedKeys = '1';
        } else if (demoRouteRE.test(this.props.location.pathname)) {
            defaultSelectedKeys = '2';
        } else if (overviewRouteRE.test(this.props.location.pathname)) {
            defaultSelectedKeys = '3';
        }
        const IC = this.props.addPadding ? InnerPaddedContent : InnerContent;
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Layout style={{ flexDirection: 'row' }}>
                    <Layout.Sider width={200} breakpoint="lg" collapsedWidth="0" theme="light" style={{ backgroundColor: '#fcfcfc' }}>
                        <Logo style={{ textAlign: 'center', width: 200, padding: 24 }} className="static">
                            <Link to="/">{`< Aida />`}</Link>
                        </Logo>
                        <Menu theme="light" mode="inline" defaultSelectedKeys={[defaultSelectedKeys]} style={{ background: '#fcfcfc' }}>
                            <Menu.Item key="0">
                                <Link to="/start">
                                    <Icon type="right-circle-o" />
                                    Getting started
                                </Link>
                            </Menu.Item>
                            <Menu.Item key="1">
                                <Link to="/train">
                                    <Icon type="right-circle-o" />
                                    Train assistant
                                </Link>
                            </Menu.Item>
                            <Menu.Item key="2">
                                <Link to="/demo">
                                    <Icon type="right-circle-o" />
                                    Demo
                                </Link>
                            </Menu.Item>
                            <Menu.Item key="3">
                                <Link to="/overview">
                                    <Icon type="right-circle-o" />
                                    Technical Overview
                                </Link>
                            </Menu.Item>
                        </Menu>
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            <a href="https://github.com/rodrigopivi/aida" title="Aida" style={{ fontSize: 26 }}>
                                <Icon type="github" />
                            </a>
                        </div>
                    </Layout.Sider>
                    <Layout style={{ padding: '24px 0 0 24px' }}>
                        <IC>{this.props.children}</IC>
                        <Footer style={{ textAlign: 'center' }}>By Rodrigo Pimentel</Footer>
                    </Layout>
                </Layout>
            </Layout>
        );
    }
}
