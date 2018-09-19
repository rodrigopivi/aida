import keras
import numpy as np
import matplotlib.pyplot as plt

import pdb

def visualize_layer_output(layer_name, m, inputs, file_name=None):
    intermediate_layer_model = keras.models.Model(inputs=m.input, outputs=m.get_layer(layer_name).output)
    intermediate_output = intermediate_layer_model.predict(inputs)
    visualize(intermediate_output, file_name)

def visualize(inputs, file_name=None):
    print ('Shape of squeezed:', inputs.shape)
    if (len(inputs.shape) == 2):
        inp = np.expand_dims(inputs, axis=0)
        print ('Shape of expanded:', inp.shape)
    else:
        inp = inputs
    n = inp.shape[0]
    n = int(np.ceil(np.sqrt(n)))
    fig = plt.figure()
    for i in range(len(inp)):
        ax = fig.add_subplot(n,n,i+1)
        ax.imshow(inp[i], cmap='magma')
    if file_name:
        plt.savefig(file_name)
    else:
        plt.show()
