import * as tf from '@tensorflow/tfjs';
import * as initializers from '@tensorflow/tfjs-layers/dist/initializers';
import { flatMapDeep } from 'lodash';

export interface IEmbeddingsModelConfig {
    pretrainedNGramVectors: Map<string, Float32Array>;
    embeddingDimensions: number;
}

export class PreSavedEmbeddingsInitializer extends initializers.Initializer {
    public static className = 'PreSavedEmbeddingsInitializer';
    public config: IEmbeddingsModelConfig;
    public className = PreSavedEmbeddingsInitializer.className;
    constructor(config: IEmbeddingsModelConfig) {
        super();
        this.config = config;
    }
    public apply(shape: tf.Shape, dtype: tf.DataType): tf.Tensor {
        if (!this.config || !this.config.pretrainedNGramVectors) {
            return tf.zeros(shape, dtype);
        }
        return tf.tidy(() => {
            const flatMat = flatMapDeep([...this.config.pretrainedNGramVectors.values()]);
            return tf.tensor2d(flatMat, [this.config.pretrainedNGramVectors.size, this.config.embeddingDimensions], 'float32');
        });
    }

    public getConfig() {
        return this.config.pretrainedNGramVectors as any;
    }
}
tf.serialization.SerializationMap.register(PreSavedEmbeddingsInitializer);
