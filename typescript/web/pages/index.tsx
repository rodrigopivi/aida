import * as React from 'react';
import DefaultHeader from '../components/DefaultHeader';
import LandingFooter from '../components/Landing/LandingFooter';
import LandingHeader from '../components/Landing/LandingHeader';
import LandingMain from '../components/Landing/LandingMain';
import LandingSecondary from '../components/Landing/LandingSecondary';

export default () => {
    return [
        <LandingHeader key="header" />,
        <LandingMain key="main" />,
        <LandingSecondary key="secondary" />,
        <LandingFooter key="footer" />,
        <DefaultHeader />
    ];
};
