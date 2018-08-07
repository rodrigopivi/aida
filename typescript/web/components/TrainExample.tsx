import { Button, Card, Col, Progress, Row } from 'antd';
import axios from 'axios';
import { withPrefix } from 'gatsby-link';
import * as React from 'react';
import * as types from '../../src/types';
import { buildDictionary } from '../../src/utils/dictionaryUtils';
import TrainingDashboard from './TrainingDashboard';

interface ITrainExampleState {
    datasetDictionary: types.IPretrainedDictionary | null;
    datasetParams: types.IDatasetParams | null;
    datasetTest: types.ITestingParams | null;
    datasetTraining: types.ITrainingParams | null;
    downloadProgress: number;
    embeddingsAndTrainingDatasetLoaded: boolean;
    isDownloading: boolean;
}

export default class TrainExample extends React.Component<{}, ITrainExampleState> {
    public state: ITrainExampleState = {
        datasetDictionary: null,
        datasetParams: null,
        datasetTest: null,
        datasetTraining: null,
        downloadProgress: 0,
        embeddingsAndTrainingDatasetLoaded: false,
        isDownloading: false
    };

    public render() {
        const { embeddingsAndTrainingDatasetLoaded, datasetParams, datasetTraining, datasetTest, datasetDictionary } = this.state;
        if (embeddingsAndTrainingDatasetLoaded && datasetParams && datasetTraining && datasetTest && datasetDictionary) {
            return (
                <TrainingDashboard
                    datasetParams={datasetParams}
                    trainDataset={datasetTraining}
                    testDataset={datasetTest}
                    dictionary={datasetDictionary}
                />
            );
        }
        const disableDownload = this.state.isDownloading || this.state.downloadProgress === 100;
        const buttonMessage = disableDownload ? (this.state.downloadProgress === 100 ? 'Loading...' : 'Downloading...') : 'Start training';
        return (
            <Row type="flex">
                <Col span={12}>
                    <h2>Train your model from scratch</h2>
                    <p>
                        The pipeline is composed of two models. Text classification model determines the intent of a sentence, named entity
                        recognition model extracts the slots. Once the training finishes, will run the test dataset on them and give you a
                        report, finally your browser will ask you to accept the download of the trained model files.
                    </p>
                    {this.renderIntentsList()}
                    <p>Click 'start training' to continue.</p>
                </Col>
                <Col span={12}>
                    <Card style={{ marginLeft: '2em', textAlign: 'center' }}>
                        <div>
                            <Progress type="circle" percent={this.state.downloadProgress} />
                        </div>
                        <br />
                        <div>
                            <Button type="primary" size="large" disabled={disableDownload} onClick={this.trainTestAndSaveModels}>
                                {buttonMessage}
                            </Button>
                        </div>
                        <br />
                        <p>
                            Will download the embeddings dictionary (about 1mb compressed), generate the dataset, then train and test the
                            models. This process may take several minutes to complete, you will get feedback of the progress but the webpage
                            might feel unresponsive while training.
                        </p>
                    </Card>
                </Col>
            </Row>
        );
    }

    private renderIntentsList = () => (
        <div>
            <p>The pipeline is going to start training on this list of intents and slots:</p>
            <div>
                <ul>
                    <li>greet</li>
                    <li>bye</li>
                    <li>affirmative</li>
                    <li>negative</li>
                    <li>wtf (detect insults and out of context stuff)</li>
                    <li>playMusic -> slots: artist, song</li>
                    <li>addEventToCalendar -> slots: calendarEvent, dateTime</li>
                </ul>
            </div>
            <p>
                Check the{' '}
                <a target="_blank" href="https://github.com/rodrigopivi/aida/tree/master/typescript/intents">
                    chatito definition files at the github repo
                </a>
                &nbsp; for more details about the training examples generation.
            </p>
        </div>
    );

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

    private timeoutInMs = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    private trainTestAndSaveModels = async () => {
        const files = [
            withPrefix('/models/dictionary.json'),
            withPrefix('/models/dataset_params.json'),
            withPrefix('/models/dataset_training.json'),
            withPrefix('/models/dataset_testing.json')
        ];
        const jsonFiles = await this.downloadFiles(files);
        const embeddingDictionaryJson = jsonFiles[0].data;
        const datasetParams = jsonFiles[1].data;
        const datasetTraining = jsonFiles[2].data;
        const datasetTest = jsonFiles[3].data;
        const datasetDictionary = buildDictionary(embeddingDictionaryJson);
        await this.timeoutInMs(200); // give some time for the state update after the model setup (before the gpu blocks)
        this.setState({
            datasetDictionary,
            datasetParams,
            datasetTest,
            datasetTraining,
            embeddingsAndTrainingDatasetLoaded: true
        });
    };
}
