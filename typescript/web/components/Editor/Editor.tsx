import axios from 'axios';
import { Button, Icon, Progress } from 'antd';
import * as React from 'react';
import * as chatito from 'chatito';
import * as webAdapter from 'chatito/dist/adapters/web';
import * as utils from 'chatito/dist/utils';
import { withPrefix } from 'gatsby-link';
import { debounce } from 'lodash';
import { chatitoPrism, IEditorTabs } from './editorConfig';
import * as es from './editorStyles';
import { ITrainingDashboardProps } from '../TrainingDashboard';
import { dictionariesFromDataset } from '../../../src/utils/dictionaryUtils';
import englishTokenizer from '../../../src/languages/en/EnglishTokenizer';
import { IDatasetParams, IPretrainedDictionary, ITrainingParams, ITestingParams } from '../../../src/types';

interface IEditorProps {
    tabs: IEditorTabs[];
    children: (p: ITrainingDashboardProps) => any;
}
interface IEditorState {
    error: null | string;
    warning: null | string;
    activeTabIndex: number;
    trainingDataset: webAdapter.IDefaultDataset;
    testingDataset: webAdapter.IDefaultDataset;
    showDrawer: boolean;
    generating: boolean;
    isDownloading: boolean;
    downloadProgress: number;
    datasetParams?: IDatasetParams;
    trainingParams?: ITrainingParams;
    testingParams?: ITestingParams;
    embeddingsAndTrainingDatasetLoaded?: boolean;
    ngramToIdDictionary?: IPretrainedDictionary['NGRAM_TO_ID_MAP'];
    pretrainedNGramVectors?: IPretrainedDictionary['PRETRAINED'];
    datasetStats?: { intent: string; training: number; testing: number }[];
}

// NOTE: for SSR, wrap the require in check for window (since it's pre rendered by gatsbyjs)
let CodeFlask: any = null;
let ReactJson: any = null;
if (typeof window !== `undefined`) {
    // tslint:disable-next-line:no-var-requires
    CodeFlask = require('codeflask').default;
    // tslint:disable-next-line:no-var-requires
    ReactJson = require('react-json-view').default;
}

const timeoutInMs = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default class Editor extends React.Component<IEditorProps, IEditorState> {
    public state: IEditorState = {
        error: null,
        warning: null,
        activeTabIndex: 0,
        trainingDataset: {},
        testingDataset: {},
        showDrawer: false,
        generating: false,
        isDownloading: false,
        downloadProgress: 0
    };
    private tabsContainer = React.createRef() as React.RefObject<HTMLDivElement>;
    private codeflask: any = null;
    private editorUpdatesSetupCount = 0;
    private codeInputValue = '';
    private tabs: IEditorTabs[] = [];

    private debouncedTabDSLValidation = debounce(() => {
        if (!this.codeInputValue.length) {
            if (this.state.error || this.state.warning) {
                this.setState({ error: null, warning: null });
            }
            return;
        }
        const validation = this.getDSLValidation(this.codeInputValue);
        let newState = {};
        if (validation && validation.error) {
            newState = { error: validation.error, warning: null };
        } else if (validation && validation.warning) {
            newState = { error: null, warning: validation.warning };
        } else {
            newState = { error: null, warning: null };
        }
        this.setState(newState, () => {
            this.saveToLocalStorage();
        });
    }, 300);

    public componentDidMount() {
        if (!CodeFlask) {
            return;
        }
        this.loadFromLocalStorage(() => {
            const flask = new CodeFlask('#my-code-editor', {
                language: 'chatito',
                lineNumbers: true
            });
            flask.addLanguage('chatito', chatitoPrism);
            flask.onUpdate((code: string) => {
                if (!this.tabs || !this.tabs[this.state.activeTabIndex]) {
                    return;
                }
                this.codeInputValue = code;
                this.tabs[this.state.activeTabIndex].value = code;
                // NOTE: ugly hack to know when codeflask is mounted (it makes 2 calls to update on mount)
                if (this.editorUpdatesSetupCount < 2) {
                    this.editorUpdatesSetupCount++;
                } else {
                    this.setState({ trainingDataset: {}, testingDataset: {} });
                    this.debouncedTabDSLValidation();
                }
            });
            if (this.tabs && this.tabs[this.state.activeTabIndex]) {
                flask.updateCode(this.tabs[this.state.activeTabIndex].value);
            }
            flask.setLineNumber();
            this.codeflask = flask;
        });
    }

    public render() {
        const s = this.state;
        if (
            !s.generating &&
            !s.isDownloading &&
            s.embeddingsAndTrainingDatasetLoaded &&
            s.datasetParams &&
            s.trainingParams &&
            s.testingParams &&
            s.datasetStats &&
            this.props.children &&
            s.ngramToIdDictionary &&
            s.pretrainedNGramVectors
        ) {
            return this.props.children({
                datasetParams: s.datasetParams,
                trainDataset: s.trainingParams,
                testDataset: s.testingParams,
                ngramToIdDictionary: s.ngramToIdDictionary,
                pretrainedNGramVectors: s.pretrainedNGramVectors,
                datasetStats: s.datasetStats
            });
        }
        const alertState = !!s.error ? 'error' : !!s.warning ? 'warning' : 'success';
        const loading = s.generating ? <Icon type="loading" theme="outlined" /> : null;
        return (
            <div>
                <h2>Train a custom assistant</h2>
                <p>
                    Chatito, is a language that helps create and maintain datasets. You can improve and customize the assistant accuracy and
                    knowledge by extending intents, slots and sentences to build a cloud of possible combinations and only pull the examples
                    needed. Click 'Generate dataset' to continue.
                </p>
                <es.EditorWrapper>
                    <es.EditorHeader style={{ display: 'block', textAlign: 'right', padding: 16 }}>
                        <Button onClick={this.onAddFile} style={{ marginRight: 32 }} type="dashed">
                            <Icon type="plus" theme="outlined" />
                            Add new file
                        </Button>
                        <Button type="primary" onClick={this.onToggleDrawer} disabled={!!s.error}>
                            <Icon type="play-circle" theme="outlined" />
                            Generate dataset
                        </Button>
                    </es.EditorHeader>
                    <es.EditorHeader>
                        <es.TabsArea innerRef={this.tabsContainer}>{this.tabs.map(this.renderTabButton)}</es.TabsArea>
                    </es.EditorHeader>
                    <es.CodeStyles id="my-code-editor" />
                    <es.AlertNotification state={alertState}> {s.error || s.warning || `Correct syntax!`}</es.AlertNotification>
                    <es.EditorOverlay onClick={this.onCloseDrawer} showDrawer={s.showDrawer || s.generating}>
                        {loading}
                        <es.Drawer onClick={e => e.stopPropagation()} showDrawer={s.showDrawer}>
                            <Icon type="close" theme="outlined" onClick={this.onCloseDrawer} />
                            {this.renderDatasetPreviewer()}
                        </es.Drawer>
                    </es.EditorOverlay>
                </es.EditorWrapper>
            </div>
        );
    }

    /* ================== Renderers ================== */
    private renderDatasetPreviewer = () => {
        if (!ReactJson) {
            return null;
        }
        return [
            <div style={{ padding: '20px 20px 0 20px', textAlign: 'center' }} key="top_drawer">
                <Progress type="circle" percent={this.state.downloadProgress} style={{ marginBottom: 20, marginLeft: 30 }} />
                <br />
                <Button type="primary" onClick={this.trainTestAndSaveModels} disabled={this.state.isDownloading}>
                    <Icon type="play-circle" theme="outlined" />
                    Start training!
                </Button>
                <es.StrokeText>
                    Will download the embeddings dictionary (about 1mb) then train and test the models with your dataset. This process may
                    take some time to complete depending on your hardware, please don't change the browser tab.
                </es.StrokeText>
            </div>,
            <es.BlockWrapper key="bottom_drawer">
                <es.BlockWrapperTitle>Review the generated training dataset:</es.BlockWrapperTitle>
                <ReactJson
                    style={{ padding: 20 }}
                    src={this.state.trainingDataset}
                    theme="chalk"
                    iconStyle="square"
                    enableClipboard={false}
                    displayDataTypes={false}
                    name={false}
                    collapsed={1}
                />
            </es.BlockWrapper>
        ];
    };

    private renderTabButton = (t: IEditorTabs, i: number) => {
        const changeTab = () => this.changeTab(i);
        const onCloseTab = this.closerTab(i);
        return (
            <es.TabButton active={this.state.activeTabIndex === i} key={`tab-${i}`} onClick={changeTab}>
                {t.title}
                <Icon type="close" theme="outlined" onClick={onCloseTab} />
            </es.TabButton>
        );
    };
    /* ================== Event Handlers ================== */
    private onCloseDrawer = () => this.setState({ showDrawer: false, trainingDataset: {}, testingDataset: {} });

    private onAddFile = () => {
        let filename = 'newFile';
        if (window && window.prompt) {
            filename = prompt('Please enter the new .chatito file name:', filename) || '';
        }
        if (filename) {
            this.tabs.push({ title: `${filename}.chatito`, value: '' });
            this.changeTab(this.tabs.length - 1, () => {
                if (!this.tabsContainer || !this.tabsContainer.current) {
                    return;
                }
                this.tabsContainer.current.scrollTo({
                    left: this.tabsContainer.current.scrollWidth,
                    behavior: 'smooth'
                });
            });
        }
    };

    private onToggleDrawer = () => {
        if (!this.state.showDrawer) {
            let validChatitoFiles = false;
            try {
                validChatitoFiles = this.validateChatitoFiles();
            } catch (e) {
                return;
            }
            if (validChatitoFiles) {
                this.setState({ showDrawer: false, generating: true }, async () => {
                    // dataset generation may take time and block rendering, give some time to render the loading state
                    await timeoutInMs(80);
                    await this.generateDataset();
                });
            } else {
                if (window && window.alert) {
                    window.alert('Please fix the errors or warnings found in the code.');
                }
            }
        }
    };
    /* ================== Utils ================== */
    private saveToLocalStorage = () => {
        if (window && localStorage) {
            localStorage.setItem('tabs', JSON.stringify(this.tabs));
        }
    };
    private loadFromLocalIfPresent = (key: string, parseAsJSON: boolean) => {
        if (window && localStorage) {
            try {
                const item = localStorage.getItem(key);
                if (!parseAsJSON) {
                    return item;
                }
                if (item) {
                    try {
                        return JSON.parse(item);
                    } catch (e) {
                        // just catch the error
                    }
                }
            } catch (e) {
                // tslint:disable-next-line:no-console
                console.error(e);
            }
        }
    };
    private loadFromLocalStorage = (cb: () => void) => {
        if (window && localStorage) {
            const localTabs = this.loadFromLocalIfPresent('tabs', true);
            this.tabs = localTabs ? localTabs : this.props.tabs;
        } else {
            this.tabs = this.props.tabs;
        }
        cb();
    };
    private changeTab = (i: number, cb?: () => void) => {
        if (!this.codeflask) {
            return;
        }
        this.setState({ activeTabIndex: i }, () => {
            this.codeflask.updateCode(this.tabs[this.state.activeTabIndex].value);
            this.codeflask.setLineNumber();
            if (cb) {
                setTimeout(cb, 600); // note; hack using setTimeout because codeflask uses a timeout on update code
            }
        });
    };
    private closerTab = (i: number) => {
        return (e: React.SyntheticEvent) => {
            if (e) {
                e.stopPropagation();
            }
            if (this.tabs[i].value) {
                if (!window.confirm(`Do you really want to remove '${this.tabs[i].title}'?`)) {
                    return;
                }
            }
            const ati = this.state.activeTabIndex;
            let newActiveTabIndex = this.state.activeTabIndex;
            if (ati === i && ati > 0) {
                newActiveTabIndex = ati - 1;
            }
            this.tabs = [...this.tabs.slice(0, i), ...this.tabs.slice(i + 1)];
            if (!this.tabs.length) {
                this.tabs.push({ title: 'newFile.chatito', value: '' });
                newActiveTabIndex = 0;
            }
            this.saveToLocalStorage();
            this.changeTab(newActiveTabIndex);
        };
    };
    private getDSLValidation = (dsl: string): null | { error?: string; warning?: string } => {
        try {
            const ast = chatito.astFromString(dsl);
            const intentsWithoutLimit = ast.filter(entity => entity.type === 'IntentDefinition' && entity.args === null);
            if (intentsWithoutLimit.length) {
                return {
                    warning: `Warning: Limit the number of generated examples for intents. E.g.: %[${
                        intentsWithoutLimit[0].key
                    }]('training': '100')`
                };
            }
            return null;
        } catch (e) {
            const error =
                e.constructor === Error
                    ? e.toString()
                    : `${e.name}: ${e.message} Line: ${e.location.start.line}, Column: ${e.location.start.column}`;
            return { error };
        }
    };

    private validateChatitoFiles = () => {
        return !this.tabs.some((tab, i) => {
            if (tab.value) {
                const validation = this.getDSLValidation(tab.value);
                if (validation !== null) {
                    this.changeTab(i);
                    return true;
                }
            }
            return false;
        });
    };

    private generateDataset = async () => {
        let trainingDataset: webAdapter.IDefaultDataset = {};
        let testingDataset: webAdapter.IDefaultDataset = {};
        for (const [i, tab] of this.tabs.entries()) {
            try {
                const { training, testing } = await webAdapter.adapter(tab.value, trainingDataset);
                trainingDataset = training;
                utils.mergeDeep(testingDataset, testing);
            } catch (e) {
                this.setState({ trainingDataset: {}, testingDataset: {}, showDrawer: false, generating: false }, () => {
                    this.changeTab(i, () =>
                        this.setState({ error: e.message }, () => {
                            if (window && window.alert) {
                                window.alert(`Please fix error: ${e.message}`);
                            }
                        })
                    );
                });
                return;
            }
        }
        this.setState({ trainingDataset, testingDataset, generating: false, showDrawer: true });
    };

    private downloadFiles = async (files: string[]) => {
        let total = 0;
        let progress = 0;
        this.setState({ isDownloading: true, downloadProgress: 0 });
        const downloads = await Promise.all(
            files.map(file =>
                axios.get(file, {
                    onDownloadProgress: progressEvent => {
                        const totalLength = progressEvent.lengthComputable
                            ? progressEvent.total
                            : progressEvent.target.getResponseHeader('content-length') ||
                              progressEvent.target.getResponseHeader('x-decompressed-content-length');
                        if (totalLength !== null) {
                            total += totalLength;
                            progress += Math.round((progressEvent.loaded * 100) / total);
                        }
                        this.setState({ downloadProgress: progress });
                    }
                })
            )
        );
        this.setState({ isDownloading: false, downloadProgress: 100 });
        return downloads;
    };

    private trainTestAndSaveModels = async () => {
        const files = [withPrefix('/models/dictionary.json'), withPrefix('/models/ngram_to_id_dictionary.json')];
        const jsonFiles = await this.downloadFiles(files);
        const pretrainedNGramVectors = new Map<string, Float32Array>(jsonFiles[0].data);
        const ngramToIdDictionary = jsonFiles[1].data;
        const {
            dictionary: {
                maxWordsPerSentence,
                slotsToId,
                intents,
                intentsWithSlots,
                testX,
                testY,
                testY2,
                trainX,
                trainY,
                trainY2,
                language
            },
            stats
        } = dictionariesFromDataset(this.state.trainingDataset, this.state.testingDataset, englishTokenizer, 'en');
        const trainingParams: ITrainingParams = { trainX, trainY, trainY2 };
        const testingParams: ITestingParams = { testX, testY, testY2 };
        const datasetParams = {
            language,
            intents,
            intentsWithSlots,
            maxWordsPerSentence,
            slotsToId
        } as IDatasetParams;
        await timeoutInMs(200); // give some time for the state update after the model setup (before the gpu blocks)
        this.setState({
            trainingParams,
            testingParams,
            datasetParams,
            embeddingsAndTrainingDatasetLoaded: true,
            ngramToIdDictionary,
            pretrainedNGramVectors,
            datasetStats: stats
        });
    };
}
