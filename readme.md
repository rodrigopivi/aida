<p align="center">
  <a href="https://aida.dor.ai">
    <img alt="Aida" src="icon.png" width="60" />
  </a>
</p>
<h1 align="center">
  Aida
</h1>

<p align="center">
  <a href="https://aida.dor.ai" title="License">
    <img alt="License" src="https://img.shields.io/github/license/rodrigopivi/aida.svg" width="100" />
  </a>
  <br />
  <strong>Your application can understand natural language in house.</strong><br>
  Use open source AI models that can train from the browser using javascript or python and can run everywhere.
</p>

<h3 align="center">
  <a href="https://aida.dor.ai">
    Main
  </a> | 
  <a href="https://aida.dor.ai/train">
    Train your own assistant
  </a> | 
  <a href="https://aida.dor.ai/demo">
    Live demo
  </a>
</h3>

<hr />
<br/>
<p align="center">
<a href="https://www.patreon.com/bePatron?u=13643440" title="Become a Patron!">
<img alt="Become a Patron!" src="https://c5.patreon.com/external/logo/become_a_patron_button.png" width="170" />
</a>
<br/><br/>
Designing and maintaining aida takes time and effort, if it was usefull for you, please consider making a donation and share the abundance! :)
</p>

<hr />
<br/>

## Setup and training

1. Clone the GH proejct and install dependencies:
      - Run `npm install` from the `./typescript` directory
      - Run `pip3 install -r requirements.txt` from the `./python` directory

2. Edit or create the chatito files inside `./typescript/examples/en/intents` to customize the dataset generation as you need.

3. From `./typescript` run `npm run dataset:en:process`. This will generate many files at the `./typescript/public/models` directory. The dataset, the dataset parameters, the testing parameters and the embeddings dictionary. You can further inspect those generated files to make sence of their content. (Note: Aida also supports spanish language, if you need other language you can add if you first download the fastText embeddings for that language).

4. You can start training from 3 local environments:
      - From python: just open `./python/main.ipynb` with jupyter notebook or jupyter lab. Python will load your custom settings generated at step 3. After running the notebook, convert the models to tensorflow.js web format running `npm run python:convert` from the `./typescript` directory.

      - From web browsers: from `./typescript` run `npm run web:start`. Then navigate to `http://localhost:8000/train` for the training web UI. After training, downloading the model to the `./typescript/public/pretrained/web` directory.

      - From node.js: from `./typescript` run `npm run node:start`.

    NOTE: After training (and converting for python), the models should be available at `./typescript/public/pretrained` with a custom directory for each platform:

## Technical overview

Aida's NLP pipeline is composed of 3 models. The `Embeddings model` takes text sentences and encodes them to high dimensional vector representations. The `text classification model` takes the encoded sentences and predicts the intent of the sentence. And finally the `Named entity recognition model` takes the sentence embeddings by bigrams and the text classification output (the intent tags), and returns the sentence slots. Here is a more detailed description of the models.

### Embeddings model

Plot:

![Alt text](docs/embedding.png "embeddings model")

The embeddings model uses a pre-trained fastText dictionary of bigrams to form word representations. For text classification, the embeddings model first takes a sentence, then breaks the sentence into words and then splits the words by bigrams. Here is an example of this process (sentence => words => word bigrams):

```
"hi friend" => ["hi", "friend"] => [["hi"],["fr", "ri", "ie", "en", "nd"]]
```

 Then each word bigram is replaced by its 300 dimensional representation provided by fastText. Then we obtain a single 300 dimensional vector for each word of the sentence by the sum and average of the bigrams.

The dimension each sentence tensor is: `21 (length in words of the dataset longest sentence)` by `300 (embedding dimensions)`. Here is a visualization of the embeddings tensor given this sentence: `please remind to me watch real madrid match tomorrow at 9pm`

![Alt text](docs/embedded_sentence.png "embedded senttence")


### Text classification model

Plot:

![Alt text](docs/classification.png "text classification model")

The text classification model is composed of 3 CNN layers concated and with a skip-layer connection and a dense layer output. The input is the output of the embeddings model for a given sentence using bigram embeddings and the ouput is the list of probabilities this sentence belongs to each of the classification classes.

Here is an animation of the 3 convolutional layers activations during training, we see the convolutional layer filters learn features from the 300 dimensional vector representations and also the output layer visualization. We pass the same sentence (`please remind to me watch real madrid match tomorrow at 9pm`) to the model at the end of each training batch (~50 batches) and plot the activations to see how they evolve as the model learns to classify. (note: frame 0 is empty for 1 second, and the last frame also pauses for 1 second).

First convolutional layer activations animation:

![text classification Conv 1](docs/classConv1.gif "text classification Conv 1")

Second convolutional layer activations animation:

![text classification Conv 2](docs/classConv2.gif "text classification Conv 2")

Third convolutional layer activations animation:

![text classification Conv 3](docs/classConv3.gif "text classification Conv 3")

Output layer visualization:

![text classification output](docs/classOutput.gif "text classification output")

NOTE: The model for text classification performs good and fast enough so there was no need to add a simple self-attention mechanism but it can be explored.

### Named entity recognition model
Plot:

![Alt text](docs/ner.png "ner model")

The named entity recognition (NER) model uses 2 inputs. The sentence embeddings at the word bigrams level and the one hot encoded classification tag for the sentence (the text classification model output).

The training data is one-hot encoded with inside-outside (IO) tagging format. The model architecture uses a CNN at the sentence-word-bigram level concatenated with the classification tags repeated to match the length of words, then a bidirectional LSTM with no merge mode, with optional time-series attention mechanism applied only to the forward lstm, and a final dense output layer.

Given a sentence, the model will return its tags and the class of the tag. e.g.:
```json
{
  "sentence": "please remind to me watch real madrid match tomorrow at 9pm",
  "slots": {
    "dateTime": [{ "value": "tomorrow at 9am" }],
    "calendarEvent": [{ "value": "real madrid match" } ]
  }
}
```

Here is an animation of the 2 deep convolutional layers activations during training, we see the convolutional layer filters learn features from the 300 dimensional vector representations and also the output layer visualization. We pass the same sentence (`please remind to me watch real madrid match tomorrow at 9pm`) to the model at the end of each training batch (~50 batches) and plot the activations to see how they evolve as the model learns to perform NER. (note: frame 0 is empty for 1 second, and the last frame also pauses for 1 second).

First convolutional layer activations animation:

![NER Conv 1](docs/nerConv1.gif "NER Conv 1")

Second convolutional layer activations animation:

![NER Conv 2](docs/nerConv2.gif "NER Conv 2")

Output layer visualization:

![NER output](docs/nerOutput.gif "NER output")

## Visualization code snippets for python

There is code at `classification.py` and `ner.py` marked inside `# ===   Visualization code block   ===` comments that can be uncommented to generate images and then gif's of the activation progress for a given phrase. Also at the jupyter notebook, there is code for plotting the model diagrams.

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

# Author and maintainer
Rodrigo Pimentel

# License
The code is open sourced under the BSD-3-Clause license, please contact me if you want to use the code under a less restrictive license.

Copyright 2018 Rodrigo Pimentel

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
