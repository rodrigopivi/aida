import keras
from keras import activations, initializers, regularizers, constraints
from keras.engine import InputSpec, Layer
import keras.backend as K

# NOTE:
# Attention of multi dimensional time series following the implementation 
# from the great NLP course "Tensorflow Solutions for Text" by Will Ballard.
# References:
# https://www.safaribooksonline.com/library/view/tensorflow-solutions-for/9781788399180/
class TimeSeriesAttention(Layer):
    def __init__(self, **kwargs):
        if 'input_shape' not in kwargs and 'input_dim' in kwargs:
            kwargs['input_shape'] = (kwargs.pop('input_dim'),)
        super(TimeSeriesAttention, self).__init__(**kwargs)
        self.input_spec = InputSpec(ndim=3)
        self.supports_masking = True

    def build(self, input_shape):
        dimensions = input_shape[2]
        timed = keras.models.Sequential(name='per_time_step')
        timed.add(
            keras.layers.Dense(dimensions, input_shape=(dimensions,), kernel_initializer='zeros', activation='softmax', name='att_dense1')
        )
        timed.add(keras.layers.Dense(dimensions, kernel_initializer='glorot_normal', activation='tanh', name='att_dense2'))
        self.timed = keras.layers.TimeDistributed(timed, name='att_td')
        self.timed.build(input_shape)
        self.trainable_weights = self.timed.trainable_weights
        self.non_trainable_weights = self.timed.non_trainable_weights
        self.built = True

    def call(self, inputs):
        encoded = self.timed(inputs)
        self_attended = K.batch_dot(inputs, K.permute_dimensions(encoded, (0, 2, 1)))
        attention = K.softmax(self_attended)
        attention = K.permute_dimensions(attention, (0, 2, 1))
        return K.batch_dot(attention, inputs)

    def compute_output_shape(self, input_shape):
        return input_shape