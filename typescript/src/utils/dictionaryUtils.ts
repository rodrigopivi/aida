import { IDefaultDataset } from 'chatito/dist/adapters/web';
import { ISentenceTokens } from 'chatito/dist/types';
import { flatten, shuffle } from 'lodash';
import { IAidaTokenizer, IDictionariesFromDataset, IDictJsonItem, IPretrainedDictionary } from '../types';

/// Build an object that contains the max words size, the train x, y and the intents
export function dictionariesFromDataset(
    training: IDefaultDataset,
    testing: IDefaultDataset,
    tokenizer: IAidaTokenizer,
    language: 'en' | 'es'
) {
    const ret: IDictionariesFromDataset = {
        intents: Object.keys(training),
        intentsWithSlots: [],
        language,
        maxWordsPerSentence: 0,
        slotsToId: { O: 0 },
        testX: [],
        testY: [],
        testY2: [],
        trainX: [],
        trainY: [],
        trainY2: []
    };
    const intentTrainingStats: number[] = new Array(ret.intents.length).fill(0);
    const intentTestingStats: number[] = new Array(ret.intents.length).fill(0);
    let processedTrainingSentences: Array<{ sentence: string; intentId: number; tagsForSentence: number[] }> = [];
    let processedTestingSentences: Array<{ sentence: string; intentId: number; tagsForSentence: number[] }> = [];
    const intentsWithSlotsSet = new Set();
    ret.intents.forEach(intent => {
        let containsSlots = false;
        const getProcessedSentence = (sentenceTokens: ISentenceTokens[]) => {
            const y2Tags: number[][] = sentenceTokens.map(token => {
                const words = tokenizer.splitSentenceToWords(token.value);
                const encodedSentenceFrag: number[] = new Array(words.length).fill(0);
                const slotName = token.slot;
                if (slotName) {
                    intentsWithSlotsSet.add(intent);
                    if (!containsSlots) {
                        containsSlots = true;
                    }
                    const internalKey = slotName;
                    if (ret.slotsToId[internalKey] === undefined) {
                        ret.slotsToId[internalKey] = Object.keys(ret.slotsToId).length;
                    }
                    words.forEach((w, i) => {
                        encodedSentenceFrag[i] = ret.slotsToId[internalKey];
                    });
                }
                return encodedSentenceFrag;
            });
            const tagsForSentence = flatten(y2Tags);
            const sentence = sentenceTokens.map(d => d.value).join('');
            const sentenceWords = tokenizer.splitSentenceToWords(sentence);
            if (ret.maxWordsPerSentence < sentenceWords.length) {
                ret.maxWordsPerSentence = sentenceWords.length;
            }
            const intentId = ret.intents.findIndex(k => k === intent);
            return { sentence, intentId, tagsForSentence };
        };
        const intentProcessedSentences = training[intent].map(getProcessedSentence);
        processedTrainingSentences = processedTrainingSentences.concat(intentProcessedSentences);
        const intentTestingProcessedSentences = testing[intent].map(getProcessedSentence);
        processedTestingSentences = processedTestingSentences.concat(intentTestingProcessedSentences);
    });
    ret.intentsWithSlots = [...intentsWithSlotsSet];
    shuffle(processedTrainingSentences).forEach(s => {
        intentTrainingStats[s.intentId]++;
        ret.trainX.push(s.sentence);
        ret.trainY.push(s.intentId);
        ret.trainY2.push(s.tagsForSentence);
    });
    shuffle(processedTestingSentences).forEach(s => {
        intentTestingStats[s.intentId]++;
        ret.testX.push(s.sentence);
        ret.testY.push(s.intentId);
        ret.testY2.push(s.tagsForSentence);
    });
    const stats = ret.intents.map((intentKey, index) => ({
        intent: intentKey,
        testing: intentTestingStats[index],
        training: intentTrainingStats[index]
    }));
    return { dictionary: ret, stats };
}

export function buildDictionary(dictJson: IDictJsonItem[]): IPretrainedDictionary {
    const dictionaryCache = {
        ID_TO_WORD_MAP: {},
        PRETRAINED: new Map(), // the actual pretrained word to vectors map
        WORD_TO_ID_MAP: {}
    } as IPretrainedDictionary;
    dictionaryCache.PRETRAINED = new Map(dictJson);
    [...dictionaryCache.PRETRAINED.keys()].forEach((word, id) => {
        dictionaryCache.ID_TO_WORD_MAP[id] = word;
        dictionaryCache.WORD_TO_ID_MAP[word] = id;
    });
    return dictionaryCache;
}
