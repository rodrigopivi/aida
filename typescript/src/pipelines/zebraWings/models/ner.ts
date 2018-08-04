import * as tf from '@tensorflow/tfjs';
import { chunk, flatMapDeep } from 'lodash';
import * as types from '../../../types';
import { EmbeddingsModel } from '../embeddings/EmbeddingsModel';

export default class NerModel extends types.PipelineModel implements types.IPipelineModel {
    private static setup(config: types.INerModelParams & types.IDefaultModelParams, datasetParams: types.IDatasetParams) {
        const maxWords = datasetParams.maxWordsPerSentence;
        const { drop, embeddingDimensions, maxCharsPerWord, numFilters } = config;
        const numSlotTypes = Object.keys(datasetParams.slotsToId).length;
        const LEARNING_RATE = 0.0066; // use 1e-4 as default as alternative starting point
        const ADAM_BETA_1 = 0.0025;
        const ADAM_BETA_2 = 0.1;
        const optimizer = tf.train.adam(LEARNING_RATE, ADAM_BETA_1, ADAM_BETA_2);
        const classLabelInput = tf.input({ dtype: 'float32', shape: [datasetParams.intents.length] });
        const classLabelRepeated = tf.layers.repeatVector({ n: maxWords }).apply(classLabelInput) as tf.SymbolicTensor;

        // WORD LEVEL EMBEDDINGS
        const embeddedSentencesInput = tf.input({ dtype: 'float32', shape: [maxWords, embeddingDimensions] });
        const convLayer1 = tf.layers
            .conv1d({
                activation: 'relu',
                filters: numFilters[0],
                inputShape: [maxWords, embeddingDimensions],
                kernelInitializer: 'randomNormal',
                kernelSize: 1,
                padding: 'valid'
            })
            .apply(embeddedSentencesInput) as tf.SymbolicTensor;
        const convLayer2 = tf.layers
            .conv1d({
                activation: 'relu',
                filters: numFilters[0],
                kernelInitializer: 'randomNormal',
                kernelSize: 1,
                padding: 'valid'
            })
            .apply(convLayer1) as tf.SymbolicTensor;
        // CHARACTER LEVEL EMBEDDINGS
        const embeddedCharactersInput = tf.input({
            dtype: 'float32',
            shape: [maxWords, maxCharsPerWord * embeddingDimensions]
        });
        const convCLayer1 = tf.layers
            .conv1d({
                activation: 'relu',
                filters: numFilters[1],
                inputShape: [maxWords, maxCharsPerWord * embeddingDimensions],
                kernelInitializer: 'randomNormal',
                kernelSize: 1,
                padding: 'valid'
            })
            .apply(embeddedCharactersInput) as tf.SymbolicTensor;
        const dropOutC1 = tf.layers.dropout({ rate: drop }).apply(convCLayer1) as tf.SymbolicTensor;
        const convCLayer2 = tf.layers
            .conv1d({
                activation: 'relu',
                filters: numFilters[1],
                kernelInitializer: 'randomNormal',
                kernelSize: 1,
                padding: 'valid'
            })
            .apply(dropOutC1) as tf.SymbolicTensor;
        // CONCATENATE BOTH CNN ENCODERS (WORD AND CHAR) WITH THE INPUT AND THE CHAR CNN LAYER 1
        const concated = tf.layers.concatenate().apply([classLabelRepeated, embeddedSentencesInput, convLayer2, convCLayer2]);
        const biLstm = tf.layers
            .bidirectional({
                layer: tf.layers.lstm({ units: maxWords, returnSequences: true }) as tf.RNN,
                mergeMode: 'concat'
            })
            .apply(concated) as tf.SymbolicTensor;

        const outputs = tf.layers
            .dense({
                activation: 'softmax',
                units: numSlotTypes
            })
            .apply(biLstm) as tf.SymbolicTensor;
        const model = tf.model({ inputs: [classLabelInput, embeddedSentencesInput, embeddedCharactersInput], outputs });
        model.compile({ loss: 'categoricalCrossentropy', metrics: ['accuracy'], optimizer });
        return model;
    }

    private config: types.INerModelParams & types.IDefaultModelParams;
    private datasetParams: types.IDatasetParams;
    private model: tf.Model;
    private embeddingsModel: EmbeddingsModel;
    private logger: types.IPipelineModelLogger;
    private nerTrainStatsHandler: types.ITrainStatsHandler['ner'] | undefined;

    constructor(
        config: types.INerModelParams & types.IDefaultModelParams,
        datasetParams: types.IDatasetParams,
        embeddingsModel: EmbeddingsModel,
        logger: types.IPipelineModelLogger,
        pretrainedModel?: tf.Model,
        nerTrainStatsHandler?: types.ITrainStatsHandler['ner']
    ) {
        super();
        this.config = config;
        this.datasetParams = datasetParams;
        this.embeddingsModel = embeddingsModel;
        this.model = pretrainedModel ? pretrainedModel : NerModel.setup(this.config, this.datasetParams);
        this.logger = logger;
        this.nerTrainStatsHandler = nerTrainStatsHandler;
    }

    public tfModel = () => this.model;

    public rawPrediction = (sentences: string[], classificationPred: types.IClassificationPred[]) => {
        return tf.tidy(() => {
            const { maxWordsPerSentence: maxWords, slotsToId } = this.datasetParams;
            const slotTypesLength = Object.keys(slotsToId).length;
            const embeddedSentences = this.embeddingsModel.embed(sentences);
            const embeddedCharacters = this.embeddingsModel.sentencesToCharacterVectors(sentences);
            const encodedIntent = classificationPred.map(p => {
                const intentEncoded = new Array(this.datasetParams.intents.length).fill(0) as number[];
                const idx = this.datasetParams.intents.indexOf(p.intent);
                if (idx !== -1) {
                    intentEncoded[idx] = 1;
                }
                return intentEncoded;
            });
            const intentsFlat = flatMapDeep(encodedIntent);
            const classLabel = tf.tensor2d(intentsFlat, [encodedIntent.length, this.datasetParams.intents.length]);
            const output = this.model.predict([classLabel, embeddedSentences, embeddedCharacters]) as tf.Tensor<tf.Rank>;
            const flattenedPredictions = output.dataSync() as Float32Array;
            output.dispose();
            classLabel.dispose();
            embeddedSentences.dispose();
            embeddedCharacters.dispose();
            // word predictions for each sentence in the form [sentence, word, slots scores]
            const chunks = chunk(flattenedPredictions, maxWords * slotTypesLength).map(sp => chunk(sp, slotTypesLength));
            return chunks.map(sentencePreds => {
                return sentencePreds.map(wordTagPredictions => {
                    let highestIndex = 0;
                    let confidence = wordTagPredictions.length ? wordTagPredictions[highestIndex] : 0;
                    wordTagPredictions.forEach((tp, ti) => {
                        if (wordTagPredictions[highestIndex] < tp) {
                            highestIndex = ti;
                            confidence = tp;
                        }
                    });
                    return { highestIndex, confidence };
                });
            });
        });
    };

    public predict = (sentences: string[], classificationPred: types.IClassificationPred[]) => {
        const { lowConfidenceThreshold } = this.config;
        const { slotsToId } = this.datasetParams;
        const wordPredictionsChunk = this.rawPrediction(sentences, classificationPred);
        return sentences.map((s, i) => {
            const sentenceWordPredictionIds = wordPredictionsChunk[i];
            const sentenceWords = this.embeddingsModel.tokenizer.splitSentenceToWords(s);
            return sentenceWords.reduce(
                (accumulator: types.ISlotReducer, w: string, currentIndex) => {
                    if (accumulator.current && accumulator.current.confidence === 0) {
                        accumulator.current.confidence = sentenceWordPredictionIds[currentIndex].confidence;
                    }
                    const currentSlotKey = Object.keys(slotsToId).find(
                        slotKey =>
                            sentenceWordPredictionIds[currentIndex] &&
                            slotsToId[slotKey] === sentenceWordPredictionIds[currentIndex].highestIndex
                    );
                    if (!currentSlotKey || !accumulator.current) {
                        return accumulator;
                    }
                    if (accumulator.current.key !== currentSlotKey) {
                        if (
                            accumulator.current.key &&
                            accumulator.current.key !== 'O' &&
                            accumulator.current.confidence >= lowConfidenceThreshold
                        ) {
                            if (!accumulator.slots[accumulator.current.key]) {
                                accumulator.slots[accumulator.current.key] = [];
                            }
                            accumulator.slots[accumulator.current.key].push({
                                confidence: accumulator.current.confidence,
                                value: accumulator.current.value
                            });
                        }
                        accumulator.current = {
                            confidence: sentenceWordPredictionIds[currentIndex].confidence,
                            key: currentSlotKey,
                            value: w
                        };
                    } else {
                        // todo: add a join words handler for languages that tokenize differently
                        accumulator.current.value += ` ${w}`;
                        accumulator.current.confidence =
                            (sentenceWordPredictionIds[currentIndex].confidence + accumulator.current.confidence) / 2;
                    }
                    if (currentIndex + 1 === sentenceWords.length) {
                        if (accumulator.current.key !== 'O' && accumulator.current.confidence >= lowConfidenceThreshold) {
                            if (!accumulator.slots[accumulator.current.key]) {
                                accumulator.slots[accumulator.current.key] = [];
                            }
                            accumulator.slots[accumulator.current.key].push({
                                confidence: accumulator.current.confidence,
                                value: accumulator.current.value
                            });
                        }
                        return { sentence: s, slots: accumulator.slots };
                    }
                    return accumulator;
                },
                { current: { key: '', value: '', confidence: 0 }, slots: {}, sentence: '' }
            );
        });
    };

    public train = async (trainDataset: types.ITrainingParams) => {
        const trainY2Chunks = chunk(trainDataset.trainY2, this.config.batchSize);
        const trainYChunks = chunk(trainDataset.trainY, this.config.batchSize);
        const trainXChunks = chunk(trainDataset.trainX, this.config.batchSize);
        const { epochs, trainingValidationSplit: validationSplit } = this.config;
        const slotsLength = Object.keys(this.datasetParams.slotsToId).length;
        this.logger.log('Start training NER model!');
        let enoughAccuracyReached = false;
        for (const [index, xChunk] of trainXChunks.entries()) {
            if (enoughAccuracyReached) {
                return;
            }
            // classification hot encoded labels as input
            const intentLabels = tf.tidy(() =>
                tf.oneHot(tf.tensor1d(trainYChunks[index], 'int32'), this.datasetParams.intents.length).asType('float32')
            );
            const embeddedSentenceWords = this.embeddingsModel.embed(xChunk);
            const embeddedSentenceWordChars = this.embeddingsModel.sentencesToCharacterVectors(xChunk);
            // convert sentence-word-slots from the highest index format like [0,0,0,0,4,4,0,0,3,3] for a sentence
            // to one hot encoded sentences with correct maxWords and batch sizes tensor sizes
            const slotTags: tf.Tensor3D = tf.tidy(() => {
                const y2sentences: tf.Tensor2D[] = [];
                for (const wordsSlotId of trainY2Chunks[index]) {
                    const slotIds = tf
                        .tensor1d(wordsSlotId, 'int32')
                        .pad([[0, this.datasetParams.maxWordsPerSentence - wordsSlotId.length]]);
                    const ohe = tf.oneHot(slotIds, slotsLength).asType('float32');
                    slotIds.dispose();
                    y2sentences.push(ohe);
                }
                const stack = tf.stack(y2sentences) as tf.Tensor3D;
                y2sentences.forEach(s => s.dispose());
                return stack;
            });
            await this.model.fit([intentLabels, embeddedSentenceWords, embeddedSentenceWordChars], slotTags, {
                callbacks: { onBatchEnd: tf.nextFrame },
                epochs,
                shuffle: true,
                validationSplit
            });
            intentLabels.dispose();
            embeddedSentenceWords.dispose();
            embeddedSentenceWordChars.dispose();
            await tf.nextFrame();
            const h = this.model.history.history;
            const c = h.val_loss.length - 1;
            const epoch = this.model.history.epoch;
            if (this.nerTrainStatsHandler) {
                this.nerTrainStatsHandler({
                    batch: index + 1,
                    batchEpochs: epoch.length,
                    currentBatchSize: trainXChunks[index].length,
                    tensorsInMemory: tf.memory().numTensors,
                    totalBatches: trainXChunks.length,
                    trainingAccuracy: h.acc[c],
                    trainingLoss: h.loss[c],
                    validationAccuracy: h.val_acc[c],
                    validationLoss: h.val_loss[c]
                });
            }
            this.logger.log(`Trained ${epoch.length} epochs on batch ${index + 1} of ${trainXChunks.length}`);
            this.logger.log(`Training Loss: ${h.loss[c]} | Training Accuracy: ${h.acc[c]}`);
            this.logger.log(`Validation Loss: ${h.val_loss[c]} | Validation Accuracy: ${h.val_acc[c]}`);
            this.logger.warn(`(Memory) Number of tensors in memory at the end of batch: ${tf.memory().numTensors}`);
            this.logger.log('==================================================================================================');
            slotTags.dispose();
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
        const stats: types.IPredictionStats = { correct: 0, wrong: 0 };
        const testX = chunk(testExamples.testX, 100);
        const testY = chunk(testExamples.testY, 100);
        const testY2 = chunk(testExamples.testY2, 100);
        for (const [i, sentences] of testX.entries()) {
            const classifications = testY[i];
            const encodedIntent = sentences.map(
                (p, idx) =>
                    ({
                        confidence: 1,
                        intent: this.datasetParams.intents[classifications[idx]],
                        sentence: p
                    } as types.IClassificationPred)
            );
            const predictions = this.rawPrediction(sentences, encodedIntent).map(sentence => sentence.map(s => s.highestIndex));
            handler(sentences, testY2[i], predictions, stats);
            await tf.nextFrame();
        }
        return stats;
    };

    private defaultResultsLogger = (
        x: types.ITestingParams['testX'],
        y2: types.ITestingParams['testY2'],
        o: types.ITestingParams['testY2'],
        stats: types.IPredictionStats
    ): types.IPredictionStats => {
        x.forEach((s, sentenceIdx) => {
            const expectedTags = y2[sentenceIdx];
            const predictedTags = o[sentenceIdx];
            let correct = true;
            expectedTags.forEach((tag, idx) => {
                if (predictedTags[idx] !== tag && correct) {
                    correct = false;
                }
            });
            if (correct) {
                stats.correct++;
                this.logger.debug(`CORRECT - ${s} expected: ${expectedTags}, predicted: ${predictedTags}`);
            } else {
                stats.wrong++;
                this.logger.error(`WRONG - ${s} expected: ${expectedTags}, predicted: ${predictedTags}`);
            }
        });
        return stats;
    };
}
