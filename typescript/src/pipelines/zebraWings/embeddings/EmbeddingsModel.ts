import * as tf from '@tensorflow/tfjs';
import * as types from '../../../types';
import { CombineNgramsLayer } from './CombineNgramsLayer';
import { PreSavedEmbeddingsInitializer } from './PreSavedEmbeddingsInitializer';

export class EmbeddingsModel {
    public static setupModel(
        pretrainedNGramVectors: types.PretrainedDict,
        maxWords: number,
        maxNgrams: number,
        embeddingDimensions: number
    ) {
        const model = tf.sequential();
        const embedLayer = tf.layers.embedding({
            embeddingsInitializer: new PreSavedEmbeddingsInitializer({
                embeddingDimensions,
                pretrainedNGramVectors
            }),
            inputDim: pretrainedNGramVectors.size,
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

    private ngramToIdDictionary: { [key: string]: number };
    private maxWords: number;
    private maxNgrams: number;
    private embeddingDimensions: number;
    private model: tf.Model;

    constructor(
        ngramToIdDictionary: { [key: string]: number },
        maxWords: number,
        maxNgrams: number,
        embeddingDimensions: number,
        tokenizer: types.IAidaTokenizer,
        pretrainedEmbeddingModel?: tf.Model,
        pretrainedNGramVectors?: types.PretrainedDict
    ) {
        this.ngramToIdDictionary = ngramToIdDictionary;
        this.maxWords = maxWords;
        this.maxNgrams = maxNgrams;
        this.embeddingDimensions = embeddingDimensions;
        this.model = pretrainedEmbeddingModel
            ? pretrainedEmbeddingModel
            : EmbeddingsModel.setupModel(pretrainedNGramVectors || new Map(), this.maxWords, this.maxNgrams, this.embeddingDimensions);
        this.tokenizer = tokenizer;
    }

    public tfModel = () => this.model;

    // Embeds by word bigrams
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

    public dictionary = () => this.ngramToIdDictionary;

    public embedByWordCharacters = (sentences: string[]) => {
        return tf.tidy(() => {
            const maxWords = this.maxWords;
            const maxNgrams = this.maxNgrams;
            const input = tf.layers.input({ shape: [maxWords, maxNgrams], dtype: 'int32' });
            const embedded = this.model.apply(input) as tf.SymbolicTensor;
            const entryModel = tf.model({ inputs: input, outputs: embedded });
            const sentencesTensor = this.sentencesToCharIds(sentences);
            const output = entryModel.predictOnBatch(sentencesTensor) as tf.Tensor<tf.Rank.R3>;
            sentencesTensor.dispose();
            return output;
        });
    };

    private sentencesToCharIds = (sentences: string[]) => {
        return tf.tidy(() => {
            const sentencesSplittedByWords = sentences.map(s => this.tokenizer.splitSentenceToWords(s));
            const buffer = tf.buffer([sentences.length, this.maxWords, this.maxNgrams], 'int32') as tf.TensorBuffer<tf.Rank.R3>;
            sentencesSplittedByWords.forEach((s, sentenceIndex) => {
                s.forEach((w: string, wordIndex: number) => {
                    w.split('').forEach((letter, lidx) => {
                        if (lidx >= this.maxNgrams) {
                            return;
                        }
                        if (this.ngramToIdDictionary[letter] !== undefined) {
                            buffer.set(this.ngramToIdDictionary[letter], sentenceIndex, wordIndex, lidx);
                        } else {
                            buffer.set(0, sentenceIndex, wordIndex, lidx);
                        }
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
                    if (this.ngramToIdDictionary[w] !== undefined) {
                        // use the word dictionary
                        buffer.set(this.ngramToIdDictionary[w], sentenceIndex, wordIndex, 0);
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
            if (this.ngramToIdDictionary[k] === undefined) {
                return false;
            }
            vecIds.push(this.ngramToIdDictionary[k]);
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
