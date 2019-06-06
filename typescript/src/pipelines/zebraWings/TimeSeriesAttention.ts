import * as tf from '@tensorflow/tfjs';
import { InputSpec } from '@tensorflow/tfjs-layers/dist/engine/topology';

// NOTE:
// Attention of multi dimensional time series following the implementation
// from the great NLP course "Tensorflow Solutions for Text" by Will Ballard.
// References:
// https://www.safaribooksonline.com/library/view/tensorflow-solutions-for/9781788399180/
export class TimeSeriesAttention extends tf.layers.Layer {
    public static className = 'TimeSeriesAttention';
    public className = TimeSeriesAttention.className;

    public timed: tf.layers.Layer | null = null;

    constructor(config?: any) {
        super(config || {});
        this.inputSpec = [new InputSpec({ ndim: 3 })];
        this.supportsMasking = true;
    }

    public build(inputShape: tf.Shape): void {
        const dimensions = inputShape[2] as number;
        const timed = tf.sequential({ name: 'per_time_step' });
        timed.add(
            tf.layers.dense({
                activation: 'softmax',
                inputShape: [dimensions],
                kernelInitializer: 'zeros',
                name: 'att_dense1',
                units: dimensions
            })
        );
        timed.add(tf.layers.dense({ units: dimensions, kernelInitializer: 'glorotNormal', activation: 'tanh', name: 'att_dense2' }));
        this.timed = tf.layers.timeDistributed({ layer: timed, name: 'att_td' });
        this.timed.build(inputShape);
        this.trainableWeights = this.timed.trainableWeights;
        this.nonTrainableWeights = this.timed.nonTrainableWeights;
        this.built = true;
    }

    public call(inputs: tf.Tensor[], kwargs: any) {
        if (!this.built || !this.timed) {
            throw new Error('Calling TimeSeriesAttention layer before it was built correctly.');
        }
        return tf.tidy(() => {
            this.invokeCallHook(inputs, kwargs);
            const encoded = (this.timed as tf.layers.Layer).apply(inputs) as tf.Tensor;
            const permuted = tf.layers.permute({ dims: [2, 1] }).apply(encoded) as tf.Tensor;
            // NOTE: this code is a workaround the absense of batch_dot in tfjs
            // TODO: replace this with batch_dot
            const unstackedInput = tf.unstack(inputs[0]);
            const unstackedPermuted = tf.unstack(permuted);
            const dotProds = unstackedInput.map((ui, i) => tf.dot(ui, unstackedPermuted[i]));
            const selfAttend = tf.stack(dotProds);
            const attention = tf.softmax(selfAttend);
            const attentionPermuted = tf.layers.permute({ dims: [2, 1] }).apply(attention) as tf.Tensor;
            const unstackedAttention = tf.unstack(attentionPermuted);
            const unstackedOutput = unstackedAttention.map((ua, i) => tf.dot(ua, unstackedInput[i]));
            const output = tf.stack(unstackedOutput);
            return output;
        });
    }

    public computeOutputShape(inputShape: tf.Shape) {
        return inputShape;
    }
}

tf.serialization.SerializationMap.register(TimeSeriesAttention);

// WIP!
// export function batchDot(x: tf.Tensor, y: tf.Tensor): tf.Tensor {
//     const xNdim = x.shape.length;
//     const yNdim = y.shape.length;
//     const axes = [xNdim - 1, yNdim - 2];
//     let reshapedX = x;
//     let reshapedY = y;
//     let diff = 0;
//     if (xNdim > yNdim) {
//         diff = xNdim - yNdim;
//         reshapedY = tf.reshape(y, y.shape.concat(Array(diff).fill(1)));
//     } else if (yNdim > xNdim) {
//         diff = yNdim - xNdim;
//         reshapedX = tf.reshape(x, x.shape.concat(Array(diff).fill(1)));
//     }
//     let out;
//     if (xNdim === 2 && yNdim === 2) {
//         if (axes[0] === axes[1]) {
//             out = tf.sum(tf.mul(reshapedX, reshapedY), axes[0]);
//         } else {
//             out = tf.sum(tf.mul(tf.transpose(reshapedX, [1, 0]), reshapedY), axes[1]);
//         }
//     } else {
//         const adjX = axes[0] !== xNdim - 1;
//         const adjY = axes[1] === yNdim - 1;
//         out = tf.matMul(reshapedX, reshapedY, adjX, adjY);
//     }
//     if (diff) {
//         const idx = xNdim > yNdim - 3 ? xNdim + yNdim - 3 : xNdim - 1;
//         out = tf.squeeze(out, Array.from(Array(idx + diff).keys()));
//     }
//     if (out.shape.length === 1) {
//         out = tf.expandDims(out, 1);
//     }
//     return out;
// }
