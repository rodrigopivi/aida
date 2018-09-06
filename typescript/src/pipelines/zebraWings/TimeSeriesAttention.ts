import * as tf from '@tensorflow/tfjs';
import { InputSpec } from '@tensorflow/tfjs-layers/dist/engine/topology';

// NOTE:
// The implementtation is currently incomplete and not working until fixing
// https://github.com/tensorflow/tfjs/issues/681
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
        const dimensions = inputShape[2];
        const t = inputShape[1];
        const timed = tf.sequential({ name: 'per_time_step' });
        timed.add(tf.layers.dense({ inputShape: [dimensions], activation: 'softmax', units: dimensions, kernelInitializer: 'zeros' }));
        timed.add(tf.layers.dense({ activation: 'tanh', units: dimensions, kernelInitializer: 'glorotNormal' }));
        this.timed = tf.layers.timeDistributed({ layer: timed, inputShape });
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
            const encoded = (this.timed as tf.layers.Layer).apply(inputs[0]) as tf.Tensor;
            const permuted = tf.layers.permute({ dims: [2, 1] }).apply(encoded) as tf.Tensor;
            // encoded.dispose();
            const unstackedInput = tf.unstack(inputs[0]);
            const unstackedPermuted = tf.unstack(permuted);
            // permuted.dispose();
            const dotProds = unstackedInput.map((ui, i) => tf.dot(ui, unstackedPermuted[i]));
            unstackedPermuted.forEach(u => u.dispose());
            const selfAttend = tf.stack(dotProds);
            // dotProds.forEach(d => d.dispose());
            const attention = tf.softmax(selfAttend);
            // selfAttend.dispose();
            const attentionPermuted = tf.layers.permute({ dims: [2, 1] }).apply(attention) as tf.Tensor;
            // attention.dispose();
            const unstackedAttention = tf.unstack(attentionPermuted);
            // attentionPermuted.dispose();
            const unstackedOutput = unstackedAttention.map((ua, i) => tf.dot(ua, unstackedInput[i]));
            // unstackedInput.forEach(u => u.dispose());
            // unstackedAttention.forEach(u => u.dispose());
            const output = tf.stack(unstackedOutput);
            // unstackedOutput.forEach(u => u.dispose());
            return output;
        });
    }

    public computeOutputShape(inputShape: number[]) {
        return inputShape;
    }
}

tf.serialization.SerializationMap.register(TimeSeriesAttention);

// WIP!
export function batchDot(x: tf.Tensor, y: tf.Tensor): tf.Tensor {
    const xNdim = x.shape.length;
    const yNdim = y.shape.length;
    const axes = [xNdim - 1, yNdim - 2];
    let reshapedX = x;
    let reshapedY = y;
    let diff = 0;
    if (xNdim > yNdim) {
        diff = xNdim - yNdim;
        reshapedY = tf.reshape(y, y.shape.concat(Array(diff).fill(1)));
    } else if (yNdim > xNdim) {
        diff = yNdim - xNdim;
        reshapedX = tf.reshape(x, x.shape.concat(Array(diff).fill(1)));
    }
    let out;
    if (xNdim === 2 && yNdim === 2) {
        if (axes[0] === axes[1]) {
            out = tf.sum(tf.mul(reshapedX, reshapedY), axes[0]);
        } else {
            out = tf.sum(tf.mul(tf.transpose(reshapedX, [1, 0]), reshapedY), axes[1]);
        }
    } else {
        const adjX = axes[0] !== xNdim - 1;
        const adjY = axes[1] === yNdim - 1;
        out = tf.matMul(reshapedX, reshapedY, adjX, adjY);
    }
    if (diff) {
        const idx = xNdim > yNdim - 3 ? xNdim + yNdim - 3 : xNdim - 1;
        out = tf.squeeze(out, Array.from(Array(idx + diff).keys()));
    }
    if (out.shape.length === 1) {
        out = tf.expandDims(out, 1);
    }
    return out;
}
