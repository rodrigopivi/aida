import axios from 'axios';
import * as React from 'react';
import ReactPlayer from 'react-player';
import { IClassificationPred, ISlotReducer } from '../../../src/types';

const chrono: any = require('chrono-node');
const Loading: any = require('react-simple-chatbot').Loading;

let synth: SpeechSynthesis | null = null;
if (typeof window !== `undefined`) {
    synth = window.speechSynthesis;
}

/// I'm ok exposing this api key
const YOUTUBE_API_KEY = 'AIzaSyBtqW2hAcQB3fzz76eUan0T1EhuK2B6PtQ';
const YOUTUBE_URL = 'https://www.googleapis.com/youtube/v3/search';

export interface IChatResponsesProps {
    predict: (s: string) => (IClassificationPred & ISlotReducer) | null;
}
interface IChatResponsesState {
    loading: boolean;
    response: string;
    trigger: boolean;
    disabled: boolean;
    speaking: boolean;
}
interface IChatWidgetStep {
    avatar?: string;
    delay?: number;
    id?: string;
    key?: string;
    message?: string;
    trigger?: string;
    user?: boolean;
    value?: string;
    component?: React.ReactNode;
    waitAction?: boolean;
    asMessage?: boolean;
}
interface IChatWidgetChildProps {
    previousStep?: IChatWidgetStep;
    step?: IChatWidgetStep;
    steps?: { [key: string]: IChatWidgetStep };
    triggerNextStep?: () => void;
}
export default class ChatResponses extends React.Component<IChatResponsesProps & IChatWidgetChildProps, IChatResponsesState> {
    public state = { loading: true, response: '', trigger: false, disabled: false, speaking: false };
    public mounted = false;
    public componentWillMount() {
        this.queryApi();
    }
    public componentDidMount() {
        this.mounted = true;
    }
    public render() {
        if (this.state.loading) {
            return <Loading />;
        }
        return <div>{this.state.response}</div>;
    }

    private triggerNext = () => {
        if (this.mounted) {
            this.setState({ trigger: true }, this.props.triggerNextStep);
        }
    };

    private queryApi = async () => {
        const steps = this.props.steps as { [key: string]: IChatWidgetStep };
        if (!(steps && steps.input && steps.input.value)) {
            return;
        }
        const inp = steps.input as IChatWidgetStep;
        const input = (inp.value as string).replace(/ +(?= )/g, '');
        const prediction = this.props.predict(input);
        if (!prediction || prediction.confidence < 0.35) {
            return "I'm not sure what you mean";
        }
        const responseMap: { [key: string]: () => Promise<any> } = {
            greet: async () => 'Hey, how can i help you?',
            bye: async () => 'Ok, bye',
            affirmative: async () => 'Allright.',
            negative: async () => 'Ok, i understand no.',
            wtf: async () => "hm... i'm just an AI assistant, how can i help you?",
            playMusic: async () => await this.playMusic(prediction),
            addEventToCalendar: async () => await this.addEventToCalendar(prediction)
        };
        const resp: any = responseMap[prediction.intent]
            ? await responseMap[prediction.intent]()
            : 'Not sure what you mean, how can i help you?';
        if (synth && typeof resp === 'string') {
            this.speak(resp);
        }
        this.setState({ response: resp, loading: false }, this.triggerNext);
    };

    private getVoice = () => {
        if (!synth) {
            return null;
        }
        const voices = synth.getVoices();
        const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
        if (!englishVoices.length) {
            return;
        } else if (englishVoices.length > 1) {
            const voice = englishVoices.find(
                e => e.name === 'Karen' || e.name === 'Moira' || e.name === 'Samantha' || e.name === 'Tessa' || e.name === 'Veena'
            );
            return voice || voices[0];
        } else {
            return voices[0];
        }
    };

    private speak = (text: string) => {
        const voice = this.getVoice();
        if (!voice || this.state.speaking) {
            return;
        }
        this.setState({ speaking: true }, () => {
            if (!synth) {
                return;
            }
            const speakText = new SpeechSynthesisUtterance(text);
            speakText.onend = () => this.setState({ speaking: false });
            speakText.onerror = e => console.error('Something went wrong', e);
            speakText.voice = voice;
            synth.speak(speakText);
        });
    };

    private playMusic = async (prediction: IClassificationPred & ISlotReducer) => {
        try {
            if (prediction.slots) {
                const { song, artist } = prediction.slots;
                const retMsg = 'sure, what song or artist you want?';
                if (!song && !artist) {
                    return retMsg;
                }
                const songQuery = (song || [])
                    .map(s => (s.confidence > 0.5 ? s.value : ''))
                    .join(' ')
                    .replace(/\s\s+/g, ' ')
                    .trim();
                const artistQuery = (artist || [])
                    .map(s => (s.confidence > 0.5 ? s.value : ''))
                    .join(' ')
                    .replace(/\s\s+/g, ' ')
                    .trim();
                if (!songQuery && !artistQuery) {
                    return retMsg;
                }
                const response = await axios.get(YOUTUBE_URL, {
                    params: {
                        q: `${songQuery} - ${artistQuery}`,
                        part: 'snippet',
                        key: YOUTUBE_API_KEY,
                        maxResults: 1,
                        type: 'video',
                        videoEmbeddable: true,
                        videoSyndicated: true
                    }
                });
                if (response && response.data) {
                    if (response.data.items && response.data.items.length) {
                        const id = response.data.items[0].id.videoId;
                        let text = 'found a youtube video of';
                        if (songQuery) {
                            text += ` the song ${songQuery}`;
                        }
                        if (artistQuery) {
                            text += ` of artist ${artistQuery}`;
                        }
                        this.speak(text);
                        return (
                            <ReactPlayer
                                url={`https://www.youtube.com/watch?v=${id}`}
                                width="151"
                                height="153"
                                youtubeConfig={{ playerVars: { autoplay: 1 } }}
                            />
                        );
                    } else {
                        return 'No results found...';
                    }
                } else {
                    throw new Error();
                }
            }
        } catch (e) {
            console.error(e);
            return 'hm... I was not able to get your music, maybe there is no internet connection?';
        }
    };

    private addEventToCalendar = async (prediction: IClassificationPred & ISlotReducer) => {
        if (prediction.slots) {
            const { calendarEvent, dateTime } = prediction.slots;
            const retMsg = 'i need an event name and date-time to schedule something at your calendar';
            if (!calendarEvent && !dateTime) {
                return retMsg;
            }
            const calendarEventQuery = (calendarEvent || [])
                .map(s => (s.confidence > 0.5 ? s.value : ''))
                .join(' ')
                .replace(/\s\s+/g, ' ')
                .trim();
            const dateTimeQuery = (dateTime || [])
                .map(s => (s.confidence > 0.5 ? s.value : ''))
                .join(' ')
                .replace(/\s\s+/g, ' ')
                .trim();
            let parsedDate = null;
            let dateString = null;
            if (dateTimeQuery) {
                try {
                    parsedDate = chrono.parseDate(dateTimeQuery);
                    dateString = parsedDate.toLocaleTimeString('EN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                } catch (e) {
                    console.error(e);
                }
            }
            if (!calendarEventQuery && !parsedDate) {
                return retMsg;
            } else if (parsedDate && !calendarEventQuery) {
                return `i need a name for the event to schedule at "${dateString}"`;
            } else if (calendarEventQuery && !parsedDate) {
                return `i need a date time for the "${calendarEventQuery}" event`;
            } else {
                return `Ok. I've added the event '${calendarEventQuery}' at '${dateString}'... aahh this is just a demo so there is no calendar, remember?`;
            }
        }
    };
}
