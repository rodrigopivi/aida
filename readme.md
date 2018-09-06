# Aida NLP

[![Alt text](screenshot.png?raw=true "Screenshot of Aida web UI")](https://aida.dor.ai)

[Try the demo and online training experience](https://aida.dor.ai)

Your application can understand natural language privately and without infrastructure.

Use open source AI models that can train from the browser, nodejs or python and can run everywhere.

[Try it online!](https://aida.dor.ai)

## Technical overview

Aida's NLP pipeline is composed of 3 models. The `Embeddings model` takes text sentences and encodes them to high dimensional vector representations. The `text classification model` takes the encoded sentences and predicts the intent of the sentence. And finally the `Named entity recognition model` takes the sentence embeddings by bigrams, unigrams, and the text classification output (the intent tags), and returns the sentence slots. Here is a more detailed description of the models.

### Embeddings model

Plot:

![Alt text](docs/embedding.png?raw=true "embeddings model")

The embeddings model uses a pre-trained fastText dictionary of unigrams and bigrams to form word representations. For text classification, the embeddings model first takes a sentence, then breaks the sentence into words. Finally and depending on the parameters, it can split the words by bigrams or by characters. Here is an example of using bigrams (sentence => words => word bigrams):

```
"hi friend" => ["hi", "friend"] => [["hi"],["fr", "ri", "ie", "en", "nd"]]
```

 Then each bigram or character inside each word is replaced by its 300 dimensional representation provided by fastText. Then we obtain a single 300 dimensional vector for each word of the sentence by the sum and average of the bigrams or characters of the word.

The dimension each sentence tensor is: `22 (length in words of the dataset longest sentence)` by `300 (embedding dimensions)`. Here is a visualization of the embeddings tensor given this sentence: `add to my calendar that tomorrow 9am i have to go to the dentist`

![Alt text](docs/embedded_sentence.png?raw=true "embedded senttence")


### Text classification model

Plot:

![Alt text](docs/classification.png?raw=true "text classification model")

The text classification model is composed of 3 CNN layers concated and with a skip-layer connection and a dense layer output. The input is the output of the embeddings model for a given sentence using bigram embeddings and the ouput is the list of probabilities this sentence belongs to each of the classification classes.

Here is an animation of the 3 convolutional layers activations during training, we see the convolutional layer filters learn features from the 300 dimensional vector representations. We pass the same sentence (`add to my calendar that tomorrow 9am i have to go to the dentist`) to the model at the end of each training batch (61 batches) and plot the activations at each convolutional layer to see how the activations evolve as the model learns to classify. (note: animations won't loop, refresh to restart animations from frame 0).

First convolutional layer activations animation:

![Alt text](docs/nConv1.gif?raw=true "Conv 1")

Second convolutional layer activations animation:

![Alt text](docs/nConv2.gif?raw=true "Conv 2")

Third convolutional layer activations animation:

![Alt text](docs/nConv3.gif?raw=true "Conv 3")

NOTE: The model for text classification performs good and fast enough so there was no need to add a simple self-attention mechanism but it can be explored.

### Named entity recognition model
Plot:

![Alt text](docs/ner.png?raw=true "ner model")


The named entity recognition (NER) model uses 3 different input values. One input is the sentence embeddings at the word bigrams level, the second input is the sentence embeddings at the word character level, and the third input is the one hot encoded classification tag for the sentence (the text classification model output).

The training data is one-hot encoded with inside-outside (IO) tagging format. The model architecture uses a CNN at the sentence-word-bigram level, another CNN at the sentence-word-character level, both concatenated with the classification tags, then a bidirectional LSTM with an optional masked multi-dimensional time-series attention mechanism and a final dense layer.

Given a sentence, the model will return its tags and the class of the tag. e.g.:
```json
{
  "sentence": "add to my calendar that tomorrow 9am i have to go to the dentist",
  "slots": {
    "dateTime": [{ "value": "tomorrow 9am" }],
    "calendarEvent": [{ "value": "the dentist" } ]
  }
}
```

## Visualization code snippets for python

 - This is the code to plot the models diagrams:

```python
from keras.utils import plot_model
models = pipeline.models()
# save model graphs as png files
plot_model(models['classification'].keras_model(), to_file='classification.png')
plot_model(models['ner'].keras_model(), to_file='ner.png')
plot_model(models['embedding'].keras_model(), to_file='embedding.png')
```

- How to plot how the layers activated at different moments of training for the same sentence:

```python
# import the visualization utility functions
from src.utils.get_activations import visualize, visualize_layer_output

# given a mdodel 'm' defined but not trained, put this code just before calling m.fit:

# use a test sentence and embed it
sentence = 'add to my calendar that tomorrow 9am i have to go to the dentist'
x_viz = self.__embeddings_model.embed([sentence])

# visualize the sentence as a vector representation and save it to embedded_sentence.png
visualize(x_viz, 'embedded_sentence')

# save the image of how the convolution layers actiations looks before training start
visualize_layer_output('conv1', m, x_viz, 'conv1-')
visualize_layer_output('conv2', m, x_viz, 'conv2-')
visualize_layer_output('conv3', m, x_viz, 'conv3-')

# NOTE: Put this code inside the training batches loop.
# inside e.g.: `for idx, t_chunk in enumerate(train_data)` and after `m.fit` call.
# visualize how the same sentence activated the layer at different epochs during training and save to images
visualize_layer_output('conv1', m, x_viz, f'conv1-{idx}')
visualize_layer_output('conv2', m, x_viz, f'conv2-{idx}')
visualize_layer_output('conv3', m, x_viz, f'conv3-{idx}')
```

The previous code would plot a total of `((n_batches + 1) * 3)` images. 

# Resources

 - [Deep Active Learning for Named Entity Recognition](https://arxiv.org/abs/1707.05928) - NER model architecture based on CNN word level, CNN char level, and LSTM + attention decoder

 - [Named Entity Recognition with Bidirectional LSTM-CNNs](https://arxiv.org/abs/1511.08308) - NER model architecture based on CNN word level, CNN Char level, extra features and a biLSTM decoder

 - [Super-Convergence: Very Fast Training of Neural Networks Using Large Learning Rates](https://arxiv.org/abs/1708.07120) - Inspiring work on how to boost the learning speed of NN models.

 - [Automatic Inference, Learning, and Design using Probabilistic Programming](https://github.com/twgr/thesis/blob/master/main.pdf) - Inspiring work on probabilistic programming to simulate or generate datasets

- [Tensorflow Solutions for Text by Will Ballard](https://www.safaribooksonline.com/library/view/tensorflow-solutions-for/9781788399180/) - Excellent course on NLP (goes in depth on how to use fastText trigrams and implements attention mechanisms)

- [fastText](https://fasttext.cc/) - Pretrained embeddings based on ngram analysis for hundreds of languages

- [Keras](https://keras.io/) - High-level neural networks API in Python with almost the same api as Tensorflow.js

- [Tensorflow.js](https://js.tensorflow.org/) - High-level neural networks API in JavaScript with almost the same api as Keras

- [Chatito](https://github.com/rodrigopivi/Chatito) - Dataset generation DSL for text classification and NER tasks

### TODO

- [Universal Language Model Fine-tuning for Text Classification](https://arxiv.org/abs/1801.06146) [(blog post)](http://nlp.fast.ai/classification/2018/05/15/introducting-ulmfit.html)- ULMFiT is the current state of the art for NLP tasks.


# License
The code is open sourced under the BSD-3-Clause license, please contact me if you want to use the code under a less restrictive license.

Copyright 2018 Rodrigo Pimentel

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.