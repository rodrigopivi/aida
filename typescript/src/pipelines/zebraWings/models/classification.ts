import * as tf from '@tensorflow/tfjs';
import { chunk } from 'lodash';
import * as types from '../../../types';
import { EmbeddingsModel } from '../embeddings/EmbeddingsModel';

export default class ClassificationModel extends types.PipelineModel implements types.IPipelineModel {
    private static setup(
        config: types.IClassificationModelParams & types.IDefaultModelParams,
        { maxWordsPerSentence: maxWords, intents }: types.IDatasetParams
    ) {
        const numClasses = intents.length;
        const LEARNING_RATE = 0.0066; // use 1e-4 as default as alternative starting point
        const ADAM_BETA_1 = 0.0025;
        const ADAM_BETA_2 = 0.1;
        const optimizer = tf.train.adam(LEARNING_RATE, ADAM_BETA_1, ADAM_BETA_2);
        // Layer 1: Convolution + max pool
        const input = tf.input({ dtype: 'float32', shape: [maxWords, config.embeddingDimensions] });
        const convLayer1 = tf.layers
            .conv1d({
                activation: 'relu',
                filters: config.numFilters,
                inputShape: [maxWords, config.embeddingDimensions],
                kernelInitializer: 'randomNormal',
                kernelSize: [config.filterSizes[0]],
                padding: 'valid'
            })
            .apply(input);
        const maxpool1 = tf.layers
            .maxPooling1d({
                padding: 'valid',
                poolSize: maxWords - config.filterSizes[0] + 1
            })
            .apply(convLayer1) as tf.SymbolicTensor;
        // Layer 2: Convolution + max pool
        const convLayer2 = tf.layers
            .conv1d({
                activation: 'relu',
                filters: config.numFilters,
                inputShape: [maxWords, config.embeddingDimensions],
                kernelInitializer: 'randomNormal',
                kernelSize: [config.filterSizes[1]],
                padding: 'valid'
            })
            .apply(input);
        const maxpool2 = tf.layers
            .maxPooling1d({
                padding: 'valid',
                poolSize: maxWords - config.filterSizes[1] + 1
            })
            .apply(convLayer2) as tf.SymbolicTensor;
        // Layer 3: Convolution + max pool
        const convLayer3 = tf.layers
            .conv1d({
                activation: 'relu',
                filters: config.numFilters,
                inputShape: [maxWords, config.embeddingDimensions],
                kernelInitializer: 'randomNormal',
                kernelSize: [config.filterSizes[2]],
                padding: 'valid'
            })
            .apply(input);
        const maxpool3 = tf.layers
            .maxPooling1d({
                padding: 'valid',
                poolSize: maxWords - config.filterSizes[2] + 1
            })
            .apply(convLayer3) as tf.SymbolicTensor;
        // Concatenation of all CNN layers on different levels and apply a fully connected dense layer
        const concatLayer = tf.layers.concatenate({ axis: 1 }).apply([maxpool1, maxpool2, maxpool3]);
        const flat = tf.layers.flatten().apply(concatLayer);
        const dropOut = tf.layers.dropout({ rate: config.drop }).apply(flat) as tf.SymbolicTensor;
        const flatPool1 = tf.layers.flatten().apply(maxpool1) as tf.SymbolicTensor;
        const concatForClassification = tf.layers.concatenate({ axis: 1 }).apply([dropOut, flatPool1]);
        const outClassification = tf.layers
            .dense({
                activation: 'softmax',
                units: numClasses
            })
            .apply(concatForClassification) as tf.SymbolicTensor;
        const model = tf.model({ inputs: input, outputs: outClassification });
        model.compile({
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy'],
            optimizer
        });
        return model;
    }

    private config: types.IClassificationModelParams & types.IDefaultModelParams;
    private datasetParams: types.IDatasetParams;
    private model: tf.Model;
    private embeddingsModel: EmbeddingsModel;
    private logger: types.IPipelineModelLogger;
    private classificationTrainStatsHandler: types.ITrainStatsHandler['classification'] | undefined;
    constructor(
        config: types.IClassificationModelParams & types.IDefaultModelParams,
        datasetParams: types.IDatasetParams,
        embeddingsModel: EmbeddingsModel,
        logger: types.IPipelineModelLogger,
        pretrainedModel?: tf.Model,
        classificationTrainStatsHandler?: types.ITrainStatsHandler['classification']
    ) {
        super();
        this.config = config;
        this.datasetParams = datasetParams;
        this.embeddingsModel = embeddingsModel;
        this.model = pretrainedModel ? pretrainedModel : ClassificationModel.setup(this.config, this.datasetParams);
        this.logger = logger;
        this.classificationTrainStatsHandler = classificationTrainStatsHandler;
    }

    public tfModel = () => this.model;

    public predict = (sentences: string[]): types.IClassificationPred[] => {
        const prediction = [] as types.IClassificationPred[];
        tf.tidy(() => {
            const embeddedSentences = this.embeddingsModel.embed(sentences);
            const output = this.model.predict(embeddedSentences) as tf.Tensor<tf.Rank>;
            const d = output.dataSync() as Float32Array;
            output.dispose();
            embeddedSentences.dispose();
            const intents = this.datasetParams.intents;
            sentences.forEach((s, i) => {
                const preds = d.slice(i * intents.length, i * intents.length + intents.length);
                const sentencePreds: types.IClassificationPred[] = [];
                preds.forEach((p, idx) =>
                    sentencePreds.push({
                        confidence: p,
                        intent: intents[idx],
                        sentence: s
                    })
                );
                sentencePreds.sort((a: any, b: any) => (a.confidence > b.confidence ? -1 : 1));
                prediction.push(sentencePreds[0]);
            });
        });
        return prediction;
    };

    public train = async (trainDataset: types.ITrainingParams): Promise<void> => {
        const trainYChunks = chunk(trainDataset.trainY, this.config.batchSize);
        const trainXChunks = chunk(trainDataset.trainX, this.config.batchSize);
        this.logger.log('Start training classification model!');
        const m = this.model;
        let enoughAccuracyReached = false;
        for (const [index, xChunk] of trainXChunks.entries()) {
            if (enoughAccuracyReached) {
                return;
            }
            const embeddedSentences = this.embeddingsModel.embed(xChunk);
            const dataLabels = tf.tensor1d(trainYChunks[index], 'int32');
            const hotEncodedLabels = tf.oneHot(dataLabels, this.datasetParams.intents.length);
            await m.fit(embeddedSentences, hotEncodedLabels, {
                // batchSize: this.config.batchSize,
                callbacks: { onBatchEnd: tf.nextFrame },
                epochs: this.config.epochs,
                shuffle: true,
                validationSplit: this.config.trainingValidationSplit
            });
            dataLabels.dispose();
            embeddedSentences.dispose();
            hotEncodedLabels.dispose();
            const h = m.history.history;
            const c = h.val_loss.length - 1;
            if (this.classificationTrainStatsHandler) {
                this.classificationTrainStatsHandler({
                    batch: index + 1,
                    batchEpochs: m.history.epoch.length,
                    currentBatchSize: trainXChunks[index].length,
                    tensorsInMemory: tf.memory().numTensors,
                    totalBatches: trainXChunks.length,
                    trainingAccuracy: h.acc[c],
                    trainingLoss: h.loss[c],
                    validationAccuracy: h.val_acc[c],
                    validationLoss: h.val_loss[c]
                });
            }
            this.logger.log(`Trained ${m.history.epoch.length} epochs on batch ${index + 1} of ${trainXChunks.length}`);
            this.logger.log(`Training Loss: ${h.loss[c]} | Training Accuracy: ${h.acc[c]}`);
            this.logger.log(`Validation Loss: ${h.val_loss[c]} | Validation Accuracy: ${h.val_acc[c]}`);
            this.logger.warn(`(Memory) Number of tensors in memory at the end of batch: ${tf.memory().numTensors}`);
            this.logger.log('==================================================================================================');
            if (
                this.config.lossThresholdToStopTraining &&
                h.loss[c] < this.config.lossThresholdToStopTraining &&
                h.val_loss[c] < this.config.lossThresholdToStopTraining
            ) {
                enoughAccuracyReached = true;
                this.logger.warn(`Enough accuracy reached! Ending training after batch ${index + 1} of ${trainXChunks.length}`);
                this.logger.log('==================================================================================================');
            }
        }
    };

    public test = async (
        testExamples: types.ITestingParams,
        resultsHandler?: types.ITestPredictionsHandler
    ): Promise<types.IPredictionStats> => {
        const handler = resultsHandler ? resultsHandler : this.defaultResultsLogger;
        const stats: types.IPredictionStats = { correct: 0, wrong: 0, lowConfidence: 0 };
        const x = chunk(testExamples.testX, this.config.batchSize);
        const y = chunk(testExamples.testY, this.config.batchSize);
        for (const [i, sentences] of x.entries()) {
            const predictions = this.predict(sentences);
            handler(sentences, y[i], predictions, stats);
        }
        return stats;
    };

    private defaultResultsLogger = (
        x: types.ITestingParams['testX'],
        y: types.ITestingParams['testY'],
        o: types.IClassificationPred[],
        stats: types.IPredictionStats
    ): types.IPredictionStats => {
        x.forEach((s, i) => {
            const intent = this.datasetParams.intents[y[i]];
            const correct = o[i].intent === intent;
            if (o[i].confidence < this.config.lowConfidenceThreshold) {
                if (stats.lowConfidence === undefined) {
                    return;
                }
                stats.lowConfidence++;
                this.logger.warn(`LOW CONFIDENCE (intent: ${o[i].intent}, confidence: ${o[i].confidence}) - ${s}`);
            } else if (correct) {
                stats.correct++;
                this.logger.debug(`CORRECT (intent: ${o[i].intent}, confidence: ${o[i].confidence}) - ${s}`);
            } else {
                stats.wrong++;
                this.logger.error(`WRONG (intent: ${o[i].intent}, confidence: ${o[i].confidence}) - ${s}`);
            }
        });
        return stats;
    };
}
