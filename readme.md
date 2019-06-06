<p align="center">
  <a href="https://aida.dor.ai">
    <img alt="Aida" src="icon.png" width="60" />
  </a>
</p>
<h1 align="center">
  Aida
</h1>

<p align="center">
  <strong>Build simple conversational assistants, chatbots, and more.</strong><br>
  Simple deep learning language models that can train and predict from the browser, nodejs and python.
</p>

<h3 align="center">
  <a href="https://aida.dor.ai/demo">
    Demo
  </a> | 
  <a href="https://aida.dor.ai/train">
    Train an assistant
  </a> | 
  <a href="https://aida.dor.ai/overview">
    Technical overview
  </a>
</h3>

<hr />
<br/>

<div>
  <h2>Getting started</h2>
  <h3>Aida is an experimental library for building natural language predictive models. It can help you build a simple chatbot, mood detector and other similar tasks.  with this design principles:</h3>
  <ul>
      <li>
          <strong>Easy to use:</strong> Getting started by creating a dataset and training couldn't be easier thanks to&nbsp;
          <a href="https://rodrigopivi.github.io/Chatito" target="_blank">
              Chatito
          </a>
          , you can create a large dataset in minutes, and start training without any setup, just from the browser.
      </li>
        <li>
          <strong>Low memory consumption:</strong> Having small file size and memory consumption is very important to be able to predict from the browser and mobile devices. The language embeddings give up some information and performance by not using a full word dictionary, instead the model uses pre-trained word character bigrams provided by
          <a href="https://fasttext.cc/" target="_blank">
              fastText
          </a>, to overcome this problem and get good predictive performance, it is required additional training examples, that is why a generative scripting language is provided to overcome this problem (Chatito DSL).
      </li>
      <li>
          <strong>Accurate:</strong> Although the model throws away some information by using bigrams to compose words instead of using full words, the models are able to get to good prediction rates given more data to learn from.
      </li>
      <li>
          <strong>Universal application:</strong> The trained models should be able to run from multiple environments, that is why the
          models have two mirror implementations: in&nbsp;
          <a href="https://js.tensorflow.com/" target="_blank">
              TensorflowJS
          </a>
          &nbsp;to be able to train and run from the browser or NodeJs, and &nbsp;
          <a href="https://keras.io/" target="_blank">
              Keras
          </a> for Python.
      </li>
      <li>
          <strong>Offline support:</strong> It should be able to train and make predictions without connectivty, no need to have a server-side api, although the trained models can also run server-side behind an api if desired. (TODO: add example running as AWS Lambda function)
      </li>
  </ul>
</div>

## [Check the demo](https://aida.dor.ai/demo)

It's a chatbott running from the browser using Tensorflow.js and using the Web Speech API for speach to text and text to speach.

## Train from the browser

You can train from the browser [using Javascript and Tensorflow.js](https://aida.dor.ai/train) (using your local GPU resources) or from the browser [using Python and Keras](https://colab.research.google.com/drive/1nzjxR7w2X99qlxjSD4pGOWksMLqK0eqZ) thanks to Google Colaboratory's free TPU's. There is no need to setup a local environment to start training your own conversational assistant.


## Local setup and training

Alternatively to thhe online training experience. You can also setup a local environment.

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

## Technical Overview

Read the [technical overview documentation](https://aida.dor.ai/overview).

## TODO

- [Universal Language Model Fine-tuning for Text Classification](https://arxiv.org/abs/1801.06146) [(blog post)](http://nlp.fast.ai/classification/2018/05/15/introducting-ulmfit.html)- ULMFiT is the current state of the art for NLP tasks.

# [Donate](https://www.patreon.com/bePatron?u=13643440)
Designing and maintaining aida takes time and effort, if it was usefull for you, please consider making a donation and share the abundance. [Become a Patron!](https://www.patreon.com/bePatron?u=13643440)

# Author and maintainer
Rodrigo Pimentel

# License
The code is open sourced under the BSD-3-Clause license, please contact me if you want to use the code under a less restrictive license.

Copyright 2019 Rodrigo Pimentel

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
