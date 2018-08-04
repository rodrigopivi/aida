import * as tf from '@tensorflow/tfjs';
import * as initializers from '@tensorflow/tfjs-layers/dist/initializers';
import { flatMapDeep } from 'lodash';

export interface IEmbeddingsModelConfig {
    dict: Map<string, Float32Array>;
    maxWords: number;
    maxNgrams: number;
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
    public apply(shape: tf.Shape): tf.Tensor {
        return tf.tidy(() => {
            const flatMat = flatMapDeep([...this.config.dict.values()]);
            return tf.tensor2d(flatMat, [this.config.dict.size, this.config.embeddingDimensions], 'float32');
        });
    }

    public getConfig() {
        return this.config.dict as any;
    }
}
tf.serialization.SerializationMap.register(PreSavedEmbeddingsInitializer);
