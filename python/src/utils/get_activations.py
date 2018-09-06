import keras
import numpy as np
import matplotlib.pyplot as plt

def visualize_layer_output(layer_name, m, inputs, file_name=None):
    intermediate_layer_model = keras.models.Model(inputs=m.input, outputs=m.get_layer(layer_name).output)
    intermediate_output = intermediate_layer_model.predict(inputs)
    visualize(intermediate_output, file_name)

def visualize(inputs, file_name=None):
    print ('Shape of squeezed:', inputs.shape)
    n = inputs.shape[0]
    n = int(np.ceil(np.sqrt(n)))
    fig = plt.figure()
    for i in range(len(inputs)):
        ax = fig.add_subplot(n,n,i+1)
        ax.imshow(inputs[i], cmap='magma')
    if file_name:
        plt.savefig(file_name)
    else:
        plt.show()
