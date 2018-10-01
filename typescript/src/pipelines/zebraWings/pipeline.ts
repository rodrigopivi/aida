import * as tf from '@tensorflow/tfjs';
import englishTokenizer from '../../languages/en/EnglishTokenizer';
import spanishTokenizer from '../../languages/es/SpanishTokenizer';
import * as types from '../../types';
import { EmbeddingsModel } from './embeddings/EmbeddingsModel';
import ClassificationModel from './models/classification';
import NerModel from './models/ner';

function getTokenizer(language: 'en' | 'es') {
    const lang = language ? language.toLowerCase() : language;
    if (lang === 'en') {
        return englishTokenizer;
    } else if (lang === 'es') {
        return spanishTokenizer;
    }
    throw new Error("Invalid config language. Only 'en' and 'es' are supported.");
}

export const defaultPipelineDefinition: types.IPipelineDefinition = {
    config: {
        classification: {
            epochs: 5,
            filterSizes: [2, 4, 8],
            lowConfidenceThreshold: 0.3,
            numFilters: 128
        },
        default: {
            batchSize: 120,
            drop: 0.5,
            embeddingDimensions: 300,
            lossThresholdToStopTraining: 1e-6,
            maxNgrams: 20,
            trainingValidationSplit: 0.3
        },
        ner: {
            addAttention: true,
            epochs: 5,
            lowConfidenceThreshold: 0.2,
            numFilters: [128, 128],
            rnnUnits: 100
        }
    }
};
export class AidaPipeline {
    private pipelineDefinition: types.IPipelineDefinition = defaultPipelineDefinition;
    private datasetParams: types.IDatasetParams;
    private embeddingsModel: EmbeddingsModel;
    private classificationModel: ClassificationModel;
    private nerModel: NerModel;
    private logger: types.IPipelineModelLogger;
    private tokenizer: types.IAidaTokenizer;

    constructor(cfg: {
        datasetParams: types.IDatasetParams;
        logger: types.IPipelineModelLogger;
        ngramToIdDictionary: { [key: string]: number };
        trainStatsHandler?: types.ITrainStatsHandler;
        pipelineDefinition?: types.IPipelineDefinition;
        pretrainedClassifier?: tf.Model;
        pretrainedNer?: tf.Model;
        pretrainedEmbedding?: tf.Model;
        pretrainedNGramVectors?: types.PretrainedDict;
    }) {
        if (cfg.pipelineDefinition) {
            this.pipelineDefinition = cfg.pipelineDefinition;
        }
        this.datasetParams = cfg.datasetParams;
        this.logger = cfg.logger;
        this.tokenizer = getTokenizer(this.datasetParams.language);
        this.embeddingsModel = new EmbeddingsModel(
            cfg.ngramToIdDictionary,
            cfg.datasetParams.maxWordsPerSentence,
            this.pipelineDefinition.config.default.maxNgrams,
            this.pipelineDefinition.config.default.embeddingDimensions,
            this.tokenizer,
            cfg.pretrainedEmbedding,
            cfg.pretrainedNGramVectors
        );
        const classificationCfg = Object.assign({}, this.pipelineDefinition.config.default, this.pipelineDefinition.config.classification);
        let classificationTrainStatsHandler;
        let nerTrainStatsHandler;
        if (cfg.trainStatsHandler) {
            classificationTrainStatsHandler = cfg.trainStatsHandler.classification;
            nerTrainStatsHandler = cfg.trainStatsHandler.ner;
        }
        this.classificationModel = new ClassificationModel(
            classificationCfg,
            this.datasetParams,
            this.embeddingsModel,
            this.logger,
            cfg.pretrainedClassifier,
            classificationTrainStatsHandler
        );
        const nerCfg = Object.assign({}, this.pipelineDefinition.config.default, this.pipelineDefinition.config.ner);
        this.nerModel = new NerModel(
            nerCfg,
            this.datasetParams,
            this.embeddingsModel,
            this.logger,
            cfg.pretrainedNer,
            nerTrainStatsHandler
        );
    }

    public train = async (trainDataset: types.ITrainingParams): Promise<void> => {
        this.logger.log('START TRAINING PIPELINE MODELS!');
        this.logger.log('==================================================================================================');
        await this.classificationModel.train(trainDataset);
        const slotsLength = Object.keys(this.datasetParams.slotsToId).length;
        // NOTE: only train the ner model if there are slots in the training params
        if (slotsLength >= 2) {
            await this.nerModel.train(trainDataset);
        } else {
            this.logger.log('SKIPPING NER MODEL (NO SLOTS FOUND)!');
            this.logger.log('==================================================================================================');
        }
        this.logger.log('FINISHED TRAINING PIPELINE MODELS!');
        this.logger.log('==================================================================================================');
    };

    public test = async (testDataset: types.ITestingParams) => {
        this.logger.log('START TESTING PIPELINE MODELS!');
        this.logger.log('==================================================================================================');
        const classificationStats = await this.classificationModel.test(testDataset);
        // NOTE: only use the ner model if there are slots in the training params
        const slotsLength = Object.keys(this.datasetParams.slotsToId).length;
        const nerStats = slotsLength >= 2 ? await this.nerModel.test(testDataset) : { correct: 0, wrong: 0 };
        return { classificationStats, nerStats };
    };

    public predict = (sentences: string[]) => {
        const classification = this.classificationModel.predict(sentences);
        // NOTE: only use the ner model if there are slots in the training params
        const slotsLength = Object.keys(this.datasetParams.slotsToId).length;
        const ner: types.ISlotReducer[] = slotsLength >= 2 ? this.nerModel.predict(sentences, classification) : [];
        return { classification, ner };
    };

    public save = async (cfg: { classificationPath: string; nerPath: string; embeddingPath: string }) => {
        this.logger.log('SAVING PIPELINE MODELS!');
        this.logger.log('==================================================================================================');
        await this.classificationModel.tfModel().save(cfg.classificationPath);
        const slotsLength = Object.keys(this.datasetParams.slotsToId).length;
        // NOTE: only download the ner model if there are slots
        if (slotsLength >= 2) {
            await this.nerModel.tfModel().save(cfg.nerPath);
        }
        await this.embeddingsModel.tfModel().save(cfg.embeddingPath);
    };
}
