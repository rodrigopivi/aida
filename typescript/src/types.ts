import * as tf from '@tensorflow/tfjs';

/*=====================================================================
 *   Interfaces and Types related to tokenizer, lang utils and config
 *=====================================================================*/
export interface IAidaPipelineConfig {
    // Configuration properties for dataset generation
    dataset: {
        trainingDataset: string;
        testingDataset: string;
        // will write 3 a file here: dataset_(`params`|`testing`|`training`).json. e.g.: '../../public/models'
        modelsOutput: string;
    };
    language: 'en' | 'es';
}
export interface IAidaTokenizer {
    FILTER_CHARS_REGEXP: RegExp;
    WORD_SEPARATORS_REGEXP: RegExp;
    NON_ALPHANUMERIC_REGEXP: RegExp;
    UNKNOWN_NGRAM_KEY: string;
    NUMBERS_MAP: { [key: string]: string };

    sanitizeSentence: (sentence: string) => string;
    splitSentenceToWords: (sentence: string) => string[];
    splitWordToBiGrams: (word: string) => string[];
    joinWordsToSentence: (words: string[]) => string;
}
/*=====================================================================
 *         Interfaces and Types related to dataset generation
 *=====================================================================*/
export interface IDatasetParams {
    maxWordsPerSentence: number; // the max number of words dataset santences have
    slotsToId: { [k: string]: number }; // the slot names
    intents: string[]; // intents e.g.: ["intent1", "intent2"]
    intentsWithSlots: string[];
    language: 'en' | 'es';
}
export interface ITrainingParams {
    trainX: string[]; // the training sentences e.g.: ["sentence", "sentence2", ...]
    trainY: number[]; // one hot encoded intents e.g.: [ 1, 2 ]
    trainY2: number[][]; // the encoding for slots e.g.: [[0,0,3,3...], [1,1,0,2...], ...]
}
export interface ITestingParams {
    testX: string[]; // the training sentences e.g.: ["sentence", "sentence2", ...]
    testY: number[]; // one hot encoded intents e.g.: [ 1, 2 ]
    testY2: number[][]; // the encoding for slots e.g.: [[0,0,3,3...], [1,1,0,2...], ...]
}
export type IDictionariesFromDataset = IDatasetParams & ITrainingParams & ITestingParams;
export type PretrainedDict = Map<string, Float32Array>;
export interface IPretrainedDictionary {
    ID_TO_WORD_MAP: any;
    WORD_TO_ID_MAP: any;
    PRETRAINED: PretrainedDict;
}
export type IDictJsonItem = [string, Float32Array];

/*=====================================================================
 *         Interfaces and Types related to model predictions
 *=====================================================================*/
export interface IStatsHandlerArgs {
    batch: number;
    currentBatchSize: number;
    batchEpochs: number;
    totalBatches: number;
    trainingLoss: number | tf.Tensor<tf.Rank>;
    trainingAccuracy: number | tf.Tensor<tf.Rank>;
    validationLoss: number | tf.Tensor<tf.Rank>;
    validationAccuracy: number | tf.Tensor<tf.Rank>;
    tensorsInMemory: number;
}
export interface ITrainStatsHandler {
    classification: (config: IStatsHandlerArgs) => void;
    ner: (config: IStatsHandlerArgs) => void;
}
export interface IClassificationPred {
    sentence: string;
    intent: string;
    confidence: number;
}
export interface ISlotPrediction {
    confidence: number;
    value: string;
}
export interface ISlotsPredicted {
    [key: string]: ISlotPrediction[];
}
export interface ITestSlot {
    [key: string]: string[];
}
export interface ISlotReducer {
    current?: { key: string; value: string; confidence: number };
    slots: ISlotsPredicted;
    sentence: string;
}
export interface INerPred {
    slots: ISlotsPredicted;
    sentence: string;
}
export interface IPredictionStats {
    correct: number;
    wrong: number;
    lowConfidence?: number;
}
export type ITestPredictionsHandler = (
    x: string[],
    y: number[] | number[][],
    output: IClassificationPred[] | number[][],
    stats: IPredictionStats
) => IPredictionStats;

/*=====================================================================
 * Interfaces and Types related to model pipeline parameters generation
 *=====================================================================*/
export interface IPipelineModelLogger {
    debug: (t: any) => void;
    log: (t: any) => void;
    error: (t: any) => void;
    warn: (t: any) => void;
}
export class PipelineModel {}
export interface IPipelineModel {
    tfModel: () => tf.Model;
    predict: (sentences: string[], ...moreArgs: any[]) => IClassificationPred[] | INerPred[];
    train: (trainDatasetParams: ITrainingParams) => Promise<void>;
    test: (testDataset: ITestingParams) => Promise<IPredictionStats>;
}
export interface IPipelineConfig {
    classification: IClassificationModelParams;
    default: IDefaultModelParams;
    ner: INerModelParams;
}
export interface IDefaultModelParams {
    batchSize: number;
    drop: number;
    embeddingDimensions: number;
    maxNgrams: number;
    trainingValidationSplit: number;
    lossThresholdToStopTraining: number;
}
export interface IClassificationModelParams {
    epochs: number;
    filterSizes: [number, number, number];
    lowConfidenceThreshold: number;
    numFilters: number;
}
export interface INerModelParams {
    epochs: number;
    lowConfidenceThreshold: number;
    maxCharsPerWord: number;
    numFilters: [number, number];
}
export interface IPipelineDefinition {
    config: IPipelineConfig;
}
