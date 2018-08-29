import * as tf from '@tensorflow/tfjs';
import { Alert, Card, Col, Row, Steps } from 'antd';
import * as React from 'react';
import styled from 'styled-components';
import { AidaPipeline } from '../../src/pipelines/zebraWings/pipeline';
import * as types from '../../src/types';
import LineChart, { ILineChartDataValues } from './LineChart';
import TrainedPipelineTestInput from './TrainedPipelineTestInput';

const globalLog: string[] = [
    '==================================================================================================',
    'WARNING: Training may take several minutes depending on your hardware, your browser may be slow while training.',
    'NOTE: Will train classification model, then NER model, then run the test dataset on both and finally download the trained models.',
    '        The line-plotting of the training models will show at the end to avoid extra GPU/CPU load during training.',
    '=================================================================================================='
];
const LoggerFeed = styled.div`
    white-space: pre-wrap;
    height: 130px;
    overflow: scroll;
    background-color: #ededed;
    padding: 10px 20px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column-reverse;
    border: 1px solid #ccc;
    font-size: 12px;
    margin-bottom: 20px;
`;

interface ITrainingDashboardProps {
    datasetParams: types.IDatasetParams;
    trainDataset: types.ITrainingParams;
    testDataset: types.ITestingParams;
    dictionary: types.IPretrainedDictionary;
}

interface ITrainingDashboardState {
    currentStep: number;
    logLinesCounter: number;
    pipelineFinishedTraining: boolean;
    valuesClassification: ILineChartDataValues;
    valuesNer: ILineChartDataValues;
    plot: boolean;
}

export default class TrainingDashboard extends React.Component<ITrainingDashboardProps, ITrainingDashboardState> {
    public state: ITrainingDashboardState = {
        currentStep: 0,
        logLinesCounter: 0,
        pipelineFinishedTraining: false,
        plot: false, // only plot at the end of training to make training fast (avoid any gpu external use)
        valuesClassification: [],
        valuesNer: []
    };
    private pipeline: AidaPipeline | null = null;
    private trainStatsClassification: types.IStatsHandlerArgs[] = [];
    private trainStatsNer: types.IStatsHandlerArgs[] = [];

    public componentDidMount() {
        this.trainTestAndSaveModels();
    }

    public componentWillUnmount() {
        this.pipeline = null;
        // tslint:disable-next-line:no-console
        console.log(tf.memory());
        tf.disposeVariables();
    }

    public render() {
        return (
            <div>
                <Steps size="small" current={this.state.currentStep} style={{ marginBottom: '20px' }}>
                    <Steps.Step title="Train classification model" />
                    <Steps.Step title="Train NER model" />
                    <Steps.Step title="Test models" />
                    <Steps.Step title="Download and try" />
                </Steps>
                {this.renderPipelineManualTestInput()}
                <h3 style={{ marginTop: '20px' }}>Training logs:</h3>
                <LoggerFeed>{globalLog.join('\n')}</LoggerFeed>
                <Row type="flex" justify="center">
                    <Col span={12}>
                        {this.renderChart('Classification model stats', this.state.valuesClassification, this.trainStatsClassification)}
                    </Col>
                    <Col span={12}>{this.renderChart('NER model stats', this.state.valuesNer, this.trainStatsNer)}</Col>
                </Row>
            </div>
        );
    }

    private renderPipelineManualTestInput = () => {
        if (this.state.currentStep === 3 && this.pipeline) {
            return (
                <>
                    <Alert
                        message="Finished training! You can test sentences manually or look at the logs for stats."
                        type="success"
                        style={{ marginBottom: 20 }}
                    />
                    <TrainedPipelineTestInput pipeline={this.pipeline} />
                </>
            );
        }
        return null;
    };

    private renderChart = (title: string, values: ILineChartDataValues, stats: types.IStatsHandlerArgs[]) => {
        if (!stats.length || !values.length) {
            return (
                <Card title={title} style={{ minHeight: '100%' }}>
                    <p>Waiting...</p>
                </Card>
            );
        }
        const batchInfo = `Batch ${values.length} of ${stats[stats.length - 1].totalBatches}`;
        const lineChart = this.state.plot ? <LineChart dataValues={values} /> : null;
        return (
            <Card title={title} extra={batchInfo} style={{ minHeight: '100%' }}>
                {lineChart}
                <p style={{ fontSize: '12px' }}>
                    <strong>Train Accuracy:</strong> {stats[stats.length - 1].trainingAccuracy}
                    <br />
                    <strong>Validation Accuracy:</strong> {stats[stats.length - 1].validationAccuracy}
                    <br />
                    <strong>Train Loss:</strong> {stats[stats.length - 1].trainingLoss}
                    <br />
                    <strong>Validation Loss:</strong> {stats[stats.length - 1].validationLoss}
                    <br />
                </p>
            </Card>
        );
    };

    private trainStatsHandler = (): types.ITrainStatsHandler => ({
        classification: stats => {
            this.trainStatsClassification.push(stats);
            const { batch, validationLoss, trainingLoss } = stats;
            this.setState(s => ({
                valuesClassification: s.valuesClassification.concat([{ batch, validationLoss, trainingLoss }])
            }));
        },
        ner: stats => {
            this.trainStatsNer.push(stats);
            const { batch, validationLoss, trainingLoss } = stats;
            this.setState(s => ({
                currentStep: s.currentStep === 0 ? 1 : s.currentStep,
                valuesNer: s.valuesNer.concat([{ batch, validationLoss, trainingLoss }])
            }));
        }
    });

    private trainTestAndSaveModels = async () => {
        const logHandler = (...args: any[]) => {
            globalLog.push(...args);
            this.setState(prev => ({ logLinesCounter: prev.logLinesCounter + 1 }));
        };
        const logger: types.IPipelineModelLogger = {
            debug: () => null,
            error: logHandler,
            log: logHandler,
            warn: logHandler
        };
        this.pipeline = new AidaPipeline({
            datasetParams: this.props.datasetParams,
            dictionary: this.props.dictionary,
            logger,
            trainStatsHandler: this.trainStatsHandler()
        });
        if (!this.pipeline) {
            return null;
        }
        await this.pipeline.train(this.props.trainDataset);
        this.setState({ currentStep: 2 });
        const stats = await this.pipeline.test(this.props.testDataset);
        this.setState({ currentStep: 3 });
        logger.log('==================================================================================================');
        logger.log('Test dataset stats:');
        logger.log(JSON.stringify(stats, null, 2));
        logger.log('==================================================================================================');
        await this.pipeline.save({ classificationPath: 'downloads://classification', nerPath: 'downloads://ner' });
        this.setState({ plot: true });
    };
}
