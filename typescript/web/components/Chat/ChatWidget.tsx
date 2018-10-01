import * as React from 'react';
import { ThemeProvider } from 'styled-components';
import ChatResponses, { IChatResponsesProps } from './ChatResponses';

const SimpleChat: any = require('react-simple-chatbot').default;

const theme = {
    background: '#f5f8fb',
    fontFamily: 'Helvetica Neue',
    headerBgColor: '#ac24e2',
    headerFontColor: '#fff',
    headerFontSize: '15px',
    botBubbleColor: '#ac24e2',
    botFontColor: '#fff',
    userBubbleColor: '#fff',
    userFontColor: '#4a4a4a'
};

export default class ChatWidget extends React.Component<IChatResponsesProps, {}> {
    public render() {
        const responses = <ChatResponses predict={this.props.predict} />;
        const initialSteps = [
            { id: 'hi', message: 'Hi, how can i help you?', trigger: 'input' },
            { id: 'input', trigger: 'response', user: true },
            { id: 'response', trigger: 'input', component: responses, waitAction: true, asMessage: true }
        ];
        return (
            <ThemeProvider theme={theme}>
                <SimpleChat
                    headerTitle="Chat demo"
                    steps={initialSteps}
                    recognitionEnable={true}
                    recognitionLang="en"
                    userDelay="300"
                    botDelay="300"
                />
            </ThemeProvider>
        );
    }
}
