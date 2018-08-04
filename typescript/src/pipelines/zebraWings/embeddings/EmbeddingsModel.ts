import * as tf from '@tensorflow/tfjs';
import * as types from '../../../types';
import { CombineNgramsLayer } from './CombineNgramsLayer';
import { PreSavedEmbeddingsInitializer } from './PreSavedEmbeddingsInitializer';

export class EmbeddingsModel {
    public static setupModel(dict: types.IPretrainedDictionary, maxWords: number, maxNgrams: number, embeddingDimensions: number) {
        const model = tf.sequential();
        const embedLayer = tf.layers.embedding({
            embeddingsInitializer: new PreSavedEmbeddingsInitializer({
                dict: dict.PRETRAINED,
                embeddingDimensions,
                maxNgrams,
                maxWords
            }),
            inputDim: dict.PRETRAINED.size,
            inputLength: [maxNgrams],
            maskZero: true,
            outputDim: embeddingDimensions,
            trainable: false
        });
        model.add(tf.layers.timeDistributed({ layer: embedLayer, inputShape: [maxWords, maxNgrams] }));
        model.add(new CombineNgramsLayer({}));
        return model;
    }

    public tokenizer: types.IAidaTokenizer;

    private dict: types.IPretrainedDictionary;
    private maxCharsPerWord: number;
    private maxWords: number;
    private maxNgrams: number;
    private embeddingDimensions: number;
    private model: tf.Model;

    constructor(
        dict: types.IPretrainedDictionary,
        maxCharsPerWord: number,
        maxWords: number,
        maxNgrams: number,
        embeddingDimensions: number,
        tokenizer: types.IAidaTokenizer
    ) {
        this.dict = dict;
        this.maxCharsPerWord = maxCharsPerWord;
        this.maxWords = maxWords;
        this.maxNgrams = maxNgrams;
        this.embeddingDimensions = embeddingDimensions;
        this.model = EmbeddingsModel.setupModel(this.dict, this.maxWords, this.maxNgrams, this.embeddingDimensions);
        this.tokenizer = tokenizer;
    }

    public embed = (sentences: string[]) => {
        return tf.tidy(() => {
            const maxWords = this.maxWords;
            const maxNgrams = this.maxNgrams;
            const input = tf.layers.input({ shape: [maxWords, maxNgrams], dtype: 'int32' });
            const embedded = this.model.apply(input) as tf.SymbolicTensor;
            const entryModel = tf.model({ inputs: input, outputs: embedded });
            const sentencesTensor = this.sentencesToWordIds(sentences);
            const output = entryModel.predictOnBatch(sentencesTensor) as tf.Tensor<tf.Rank.R3>;
            sentencesTensor.dispose();
            return output;
        });
    };

    public dictionary = () => this.dict;

    public sentencesToCharacterVectors = (sentences: string[]): tf.Tensor<tf.Rank.R3> => {
        return tf.tidy(() => {
            const WORDS_TO_VECTORS_MAP = this.dict.PRETRAINED;
            const sentencesSplittedByWords = sentences.map(s => this.tokenizer.splitSentenceToWords(s));
            const buffer: tf.TensorBuffer<tf.Rank.R3> = tf.buffer(
                [sentences.length, this.maxWords, this.maxCharsPerWord * this.embeddingDimensions],
                'float32'
            );
            sentencesSplittedByWords.forEach((s, sentenceIndex) => {
                s.forEach((w: string, widx: number) => {
                    w.split('').forEach((letter, lidx) => {
                        let vec = WORDS_TO_VECTORS_MAP.get(letter);
                        if (!vec) {
                            vec = WORDS_TO_VECTORS_MAP.get(this.tokenizer.UNKNOWN_NGRAM_KEY);
                        }
                        if (!vec) {
                            return;
                        }
                        vec.forEach((x: number, i: number) => {
                            buffer.set(x, sentenceIndex, widx, lidx * this.embeddingDimensions + i);
                        });
                    });
                });
            });
            return buffer.toTensor();
        });
    };

    private sentencesToWordIds = (sentences: string[]) => {
        return tf.tidy(() => {
            const sentencesSplittedByWords = sentences.map(s => this.tokenizer.splitSentenceToWords(s));
            const buffer = tf.buffer([sentences.length, this.maxWords, this.maxNgrams], 'int32') as tf.TensorBuffer<tf.Rank.R3>;
            sentencesSplittedByWords.forEach((s, sentenceIndex) => {
                s.forEach((w: string, wordIndex: number) => {
                    if (this.dict.WORD_TO_ID_MAP[w] !== undefined) {
                        // use the word dictionary
                        buffer.set(this.dict.WORD_TO_ID_MAP[w], sentenceIndex, wordIndex, 0);
                    } else if (w.length) {
                        this.generateWordIdsFromNGrams(w).forEach((gram, gramIndex) => {
                            if (gramIndex > this.maxNgrams) {
                                // tslint:disable-next-line:no-console
                                console.warn('Word exceeding max n grams per word: ', w);
                                return;
                            }
                            buffer.set(gram, sentenceIndex, wordIndex, gramIndex);
                        });
                    }
                });
            });
            return buffer.toTensor();
        });
    };

    private generateWordIdsFromNGrams = (word: string): number[] => {
        let vecIds: number[] = [];
        const addToVecsIfNotUndefined = (k: string) => {
            if (this.dict.WORD_TO_ID_MAP[k] === undefined) {
                return false;
            }
            vecIds.push(this.dict.WORD_TO_ID_MAP[k]);
            return true;
        };
        // first try using ngrams to reconstruct the word vector
        if (word.length > 2) {
            let allNgramsFound = true;
            const wordNgrams = this.tokenizer.splitWordToBiGrams(word);
            wordNgrams.forEach(wt => {
                if (!addToVecsIfNotUndefined(wt) && allNgramsFound) {
                    allNgramsFound = false;
                }
            });
            if (allNgramsFound) {
                return vecIds;
            }
        }
        // if not by ngrams use characters to construct the word vector
        vecIds = [];
        // TODO: use characters to construct ngrams, not the word
        word.split('').forEach(addToVecsIfNotUndefined);
        return vecIds;
    };
}
