import * as webAdapter from 'chatito/dist/adapters/web';
import * as fs from 'fs';
import * as path from 'path';
import englishTokenizer from '../languages/en/EnglishTokenizer';
import spanishTokenizer from '../languages/es/SpanishTokenizer';
import { IAidaTokenizer, IDatasetParams, ITestingParams, ITrainingParams } from '../types';
import { dictionariesFromDataset } from './dictionaryUtils';

interface IRetLanguage {
    tokenizer: IAidaTokenizer;
    dictionary: string;
}
export function getTokenizerAndDictionaryForLanguage(language: 'en' | 'es'): IRetLanguage {
    const lang = language ? language.toLowerCase() : language;
    if (lang === 'en') {
        return { tokenizer: englishTokenizer, dictionary: path.resolve(__dirname, '../languages/en/dict.json') };
    } else if (lang === 'es') {
        return { tokenizer: spanishTokenizer, dictionary: path.resolve(__dirname, '../languages/es/dict.json') };
    }
    throw new Error("Invalid config language. Only 'en' and 'es' are supported.");
}

export interface IDatasetGenerationArgs {
    language: 'en' | 'es';
    trainingChatitoDataset: webAdapter.IDefaultDataset;
    testingChatitoDataset: webAdapter.IDefaultDataset;
    outputPath: string;
}

export const datasetGeneration = async (config: IDatasetGenerationArgs) => {
    const { tokenizer } = getTokenizerAndDictionaryForLanguage(config.language);
    const {
        dictionary: { maxWordsPerSentence, slotsToId, intents, intentsWithSlots, testX, testY, testY2, trainX, trainY, trainY2, language },
        stats
    } = dictionariesFromDataset(config.trainingChatitoDataset, config.testingChatitoDataset, tokenizer, config.language);
    process.stdout.write(`Saving files...\n`);
    if (!fs.existsSync(config.outputPath)) {
        fs.mkdirSync(config.outputPath);
    }
    fs.writeFileSync(
        path.resolve(process.cwd(), config.outputPath, 'dataset_params.json'),
        JSON.stringify({
            intents,
            intentsWithSlots,
            language,
            maxWordsPerSentence,
            slotsToId
        } as IDatasetParams)
    );
    fs.writeFileSync(
        path.resolve(process.cwd(), config.outputPath, 'dataset_training.json'),
        JSON.stringify({
            trainX,
            trainY,
            trainY2
        } as ITrainingParams)
    );
    fs.writeFileSync(
        path.resolve(process.cwd(), config.outputPath, 'dataset_testing.json'),
        JSON.stringify({
            testX,
            testY,
            testY2
        } as ITestingParams)
    );
    process.stdout.write(`Done! ${JSON.stringify(stats, null, 2)}`);
};
