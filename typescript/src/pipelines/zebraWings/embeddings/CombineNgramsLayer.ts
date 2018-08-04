import * as tf from '@tensorflow/tfjs';
import { l2Normalize } from '@tensorflow/tfjs-layers/dist/losses';

// given an imput composed of max_ngrams x 300d this layer will sum
// and normalize all the max_ngrams to get a unique 300d vector representation
export class CombineNgramsLayer extends tf.layers.Layer {
    // The output shape removes the ngram dimension
    public computeOutputShape(inputShape: number[]) {
        return [inputShape[0], inputShape[1], inputShape[inputShape.length - 1]];
    }
    public call(inputs: tf.Tensor, kwargs: any) {
        return tf.tidy(() => {
            this.invokeCallHook(inputs, kwargs);
            const combined = tf.sum(inputs, 2);
            const output = l2Normalize(combined, 2);
            combined.dispose();
            return output;
        });
    }
    public getClassName() {
        return 'CombineNgramsLayer';
    }
}
