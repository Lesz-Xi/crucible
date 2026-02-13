

Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
## Chelsea Finn
## 1
## Pieter Abbeel
## 1 2
## Sergey Levine
## 1
## Abstract
We propose an algorithm for meta-learning that
is  model-agnostic,  in  the  sense  that  it  is  com-
patible with any model trained with gradient de-
scent  and  applicable  to  a  variety  of  different
learning  problems,  including  classification,  re-
gression,  and reinforcement learning.  The goal
of  meta-learning  is  to  train  a  model  on  a  vari-
ety of learning tasks, such that it can solve new
learning tasks using only a small number of train-
ing samples.  In our approach, the parameters of
the model are explicitly trained such that a small
number  of  gradient  steps  with  a  small  amount
of  training  data  from  a  new  task  will  produce
good generalization performance on that task. In
effect,  our  method  trains  the  model  to  be  easy
to fine-tune.  We demonstrate that this approach
leads to state-of-the-art performance on two few-
shot image classification benchmarks,  produces
good results on few-shot regression, and acceler-
ates fine-tuning for policy gradient reinforcement
learning with neural network policies.
## 1. Introduction
Learning  quickly  is  a  hallmark  of  human  intelligence,
whether it involves recognizing objects from a few exam-
ples  or  quickly  learning  new  skills  after  just  minutes  of
experience.  Our artificial agents should be able to do the
same, learning and adapting quickly from only a few exam-
ples, and continuing to adapt as more data becomes avail-
able. This kind of fast and flexible learning is challenging,
since the agent must integrate its prior experience with a
small amount of new information, while avoiding overfit-
ting to the new data.   Furthermore,  the form of prior ex-
perience and new data will depend on the task.  As such,
for the greatest applicability, the mechanism for learning to
learn (or meta-learning) should be general to the task and
## 1
University of California, Berkeley
## 2
OpenAI. Correspondence
to: Chelsea Finn<cbfinn@eecs.berkeley.edu>.
Proceedings  of  the34
th
International  Conference  on  Machine
Learning,  Sydney,  Australia,  PMLR 70,  2017.  Copyright 2017
by the author(s).
the form of computation required to complete the task.
In  this  work,  we  propose  a  meta-learning  algorithm  that
is general and model-agnostic, in the sense that it can be
directly  applied  to  any  learning  problem  and  model  that
is  trained  with  a  gradient  descent  procedure.   Our  focus
is  on  deep  neural  network  models,  but  we  illustrate  how
our approach can easily handle different architectures and
different problem settings, including classification, regres-
sion, and policy gradient reinforcement learning, with min-
imal modification. In meta-learning, the goal of the trained
model is to quickly learn a new task from a small amount
of new data, and the model is trained by the meta-learner
to  be  able  to  learn  on  a  large  number  of  different  tasks.
The key idea underlying our method is to train the model’s
initial parameters such that the model has maximal perfor-
mance on a new task after the parameters have been up-
dated through one or more gradient steps computed with
a small amount of data from that new task.  Unlike prior
meta-learning  methods  that  learn  an  update  function  or
learning  rule  (Schmidhuber,  1987;  Bengio  et  al.,  1992;
Andrychowicz et al., 2016; Ravi & Larochelle, 2017), our
algorithm does not expand the number of learned param-
eters nor place constraints on the model architecture (e.g.
by requiring a recurrent model (Santoro et al., 2016) or a
Siamese network (Koch, 2015)), and it can be readily com-
bined with fully connected, convolutional, or recurrent neu-
ral networks. It can also be used with a variety of loss func-
tions,  including differentiable supervised losses and non-
differentiable reinforcement learning objectives.
The process of training a model’s parameters such that a
few gradient steps, or even a single gradient step, can pro-
duce good results on a new task can be viewed from a fea-
ture learning standpoint as building an internal representa-
tion that is broadly suitable for many tasks.  If the internal
representation is suitable to many tasks, simply fine-tuning
the parameters slightly (e.g. by primarily modifying the top
layer weights in a feedforward model) can produce good
results.  In effect, our procedure optimizes for models that
are easy and fast to fine-tune,  allowing the adaptation to
happen in the right space for fast learning. From a dynami-
cal systems standpoint, our learning process can be viewed
as maximizing the sensitivity of the loss functions of new
tasks with respect to the parameters:  when the sensitivity
is high, small local changes to the parameters can lead to
arXiv:1703.03400v3  [cs.LG]  18 Jul 2017

Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
large improvements in the task loss.
The primary contribution of this work is a simple model-
and  task-agnostic  algorithm  for  meta-learning  that  trains
a model’s parameters such that a small number of gradi-
ent updates will lead to fast learning on a new task.   We
demonstrate the algorithm on different model types, includ-
ing fully connected and convolutional networks, and in sev-
eral distinct domains, including few-shot regression, image
classification, and reinforcement learning.  Our evaluation
shows  that  our  meta-learning  algorithm  compares  favor-
ably to state-of-the-art one-shot learning methods designed
specifically for supervised classification, while using fewer
parameters, but that it can also be readily applied to regres-
sion and can accelerate reinforcement learning in the pres-
ence of task variability, substantially outperforming direct
pretraining as initialization.
- Model-Agnostic Meta-Learning
We aim to train models that can achieve rapid adaptation, a
problem setting that is often formalized as few-shot learn-
ing.  In this section, we will define the problem setup and
present the general form of our algorithm.
2.1. Meta-Learning Problem Set-Up
The goal of few-shot meta-learning is to train a model that
can quickly adapt to a new task using only a few datapoints
and training iterations.  To accomplish this,  the model or
learner  is  trained  during  a  meta-learning  phase  on  a  set
of tasks, such that the trained model can quickly adapt to
new tasks using only a small number of examples or trials.
In effect, the meta-learning problem treats entire tasks as
training examples.  In this section, we formalize this meta-
learning  problem  setting  in  a  general  manner,  including
brief examples of different learning domains.  We will dis-
cuss two different learning domains in detail in Section 3.
We  consider  a  model,   denotedf,   that  maps  observa-
tionsxto  outputsa.    During  meta-learning,  the  model
is  trained  to  be  able  to  adapt  to  a  large  or  infinite  num-
ber  of  tasks.   Since  we  would  like  to  apply  our  frame-
work  to  a  variety  of  learning  problems,  from  classifica-
tion  to  reinforcement  learning,  we  introduce  a  generic
notion  of  a  learning  task  below.Formally,  each  task
T={L(x
## 1
## ,a
## 1
## ,...,x
## H
## ,a
## H
## ),q(x
## 1
## ),q(x
t+1
## |x
t
## ,a
t
## ),H}
consists of a loss functionL, a distribution over initial ob-
servationsq(x
## 1
),  a  transition  distributionq(x
t+1
## |x
t
## ,a
t
## ),
and an episode lengthH. In i.i.d. supervised learning prob-
lems, the lengthH= 1.  The model may generate samples
of lengthHby choosing an outputa
t
at each timet.  The
lossL(x
## 1
## ,a
## 1
## ,...,x
## H
## ,a
## H
)→R,  provides  task-specific
feedback, which might be in the form of a misclassification
loss or a cost function in a Markov decision process.
meta-learning
learning/adaptation
θ
## ∇L
## 1
## ∇L
## 2
## ∇L
## 3
θ
## ∗
## 1
θ
## ∗
## 2
θ
## ∗
## 3
Figure 1.Diagram  of  our  model-agnostic  meta-learning  algo-
rithm (MAML), which optimizes for a representationθthat can
quickly adapt to new tasks.
In our meta-learning scenario,  we consider a distribution
over tasksp(T)that we want our model to be able to adapt
to.  In theK-shot learning setting, the model is trained to
learn a new taskT
i
drawn fromp(T)from onlyKsamples
drawn fromq
i
and feedbackL
## T
i
generated byT
i
## .  During
meta-training, a taskT
i
is sampled fromp(T), the model
is  trained  withKsamples  and  feedback  from  the  corre-
sponding lossL
## T
i
fromT
i
, and then tested on new samples
fromT
i
. The modelfis then improved by considering how
thetesterror on new data fromq
i
changes with respect to
the parameters. In effect, the test error on sampled tasksT
i
serves as the training error of the meta-learning process. At
the end of meta-training, new tasks are sampled fromp(T),
and meta-performance is measured by the model’s perfor-
mance  after  learning  fromKsamples.   Generally,  tasks
used for meta-testing are held out during meta-training.
2.2. A Model-Agnostic Meta-Learning Algorithm
In  contrast  to  prior  work,  which  has  sought  to  train  re-
current  neural  networks  that  ingest  entire  datasets  (San-
toro  et  al.,  2016;  Duan  et  al.,  2016b)  or  feature  embed-
dings that can be combined with nonparametric methods at
test time (Vinyals et al., 2016; Koch, 2015), we propose a
method that can learn the parameters of any standard model
via meta-learning in such a way as to prepare that model
for fast adaptation.  The intuition behind this approach is
that  some  internal  representations  are  more  transferrable
than  others.   For  example,  a  neural  network  might  learn
internal features that are broadly applicable to all tasks in
p(T), rather than a single individual task. How can we en-
courage the emergence of such general-purpose representa-
tions?  We take an explicit approach to this problem: since
the model will be fine-tuned using a gradient-based learn-
ing rule on a new task, we will aim to learn a model in such
a way that this gradient-based learning rule can make rapid
progress on new tasks drawn fromp(T), without overfit-
ting.  In effect, we will aim to find model parameters that
aresensitiveto changes in the task, such that small changes
in the parameters will produce large improvements on the
loss function of any task drawn fromp(T), when altered in
the direction of the gradient of that loss (see Figure 1). We

Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
Algorithm 1Model-Agnostic Meta-Learning
Require:p(T): distribution over tasks
Require:α,β: step size hyperparameters
1:randomly initializeθ
2:whilenot donedo
3:Sample batch of tasksT
i
∼p(T)
4:for allT
i
do
5:Evaluate∇
θ
## L
## T
i
## (f
θ
)with respect toKexamples
6:Compute  adapted  parameters  with  gradient  de-
scent:θ
## ′
i
## =θ−α∇
θ
## L
## T
i
## (f
θ
## )
7:end for
8:Updateθ←θ−β∇
θ
## ∑
## T
i
∼p(T)
## L
## T
i
## (f
θ
## ′
i
## )
9:end while
make no assumption on the form of the model, other than
to assume that it is parametrized by some parameter vector
θ, and that the loss function is smooth enough inθthat we
can use gradient-based learning techniques.
Formally,    we   consider   a   model   represented   by   a
parametrized functionf
θ
with parametersθ.  When adapt-
ing to a new taskT
i
, the model’s parametersθbecomeθ
## ′
i
## .
In our method, the updated parameter vectorθ
## ′
i
is computed
using one or more gradient descent updates on taskT
i
## . For
example, when using one gradient update,
θ
## ′
i
## =θ−α∇
θ
## L
## T
i
## (f
θ
## ).
The step sizeαmay be fixed as a hyperparameter or meta-
learned.  For simplicity of notation, we will consider one
gradient update for the rest of this section, but using multi-
ple gradient updates is a straightforward extension.
The model parameters are trained by optimizing for the per-
formance off
θ
## ′
i
with respect toθacross tasks sampled from
p(T). More concretely, the meta-objective is as follows:
min
θ
## ∑
## T
i
∼p(T)
## L
## T
i
## (f
θ
## ′
i
## ) =
## ∑
## T
i
∼p(T)
## L
## T
i
## (f
θ−α∇
θ
## L
## T
i
## (f
θ
## )
## )
Note  that  the  meta-optimization  is  performed  over  the
model parametersθ, whereas the objective is computed us-
ing the updated model parametersθ
## ′
.   In effect,  our pro-
posed method aims to optimize the model parameters such
that one or a small number of gradient steps on a new task
will produce maximally effective behavior on that task.
The   meta-optimization   across   tasks   is   performed   via
stochastic gradient descent (SGD), such that the model pa-
rametersθare updated as follows:
θ←θ−β∇
θ
## ∑
## T
i
∼p(T)
## L
## T
i
## (f
θ
## ′
i
## )(1)
whereβis the meta step size.  The full algorithm, in the
general case, is outlined in Algorithm 1.
The  MAML  meta-gradient  update  involves  a  gradient
through a gradient. Computationally, this requires an addi-
tional backward pass throughfto compute Hessian-vector
products, which is supported by standard deep learning li-
braries  such  as  TensorFlow  (Abadi  et  al.,  2016).   In  our
experiments,  we  also  include  a  comparison  to  dropping
this backward pass and using a first-order approximation,
which we discuss in Section 5.2.
- Species of MAML
In  this  section,  we  discuss  specific  instantiations  of  our
meta-learning algorithm for supervised learning and rein-
forcement learning. The domains differ in the form of loss
function and in how data is generated by the task and pre-
sented to the model, but the same basic adaptation mecha-
nism can be applied in both cases.
3.1. Supervised Regression and Classification
Few-shot learning is well-studied in the domain of super-
vised tasks, where the goal is to learn a new function from
only a few input/output pairs for that task, using prior data
from similar tasks for meta-learning. For example, the goal
might be to classify images of a Segway after seeing only
one or a few examples of a Segway, with a model that has
previously seen many other types of objects.  Likewise, in
few-shot  regression,  the  goal  is  to  predict  the  outputs  of
a continuous-valued function from only a few datapoints
sampled from that function,  after training on many func-
tions with similar statistical properties.
To  formalize  the  supervised  regression  and  classification
problems in the context of the meta-learning definitions in
Section 2.1, we can define the horizonH= 1and drop the
timestep subscript onx
t
, since the model accepts a single
input and produces a single output, rather than a sequence
of inputs and outputs.  The taskT
i
generatesKi.i.d.  ob-
servationsxfromq
i
, and the task loss is represented by the
error between the model’s output forxand the correspond-
ing target valuesyfor that observation and task.
Two common loss functions used for supervised classifica-
tion and regression are cross-entropy and mean-squared er-
ror (MSE), which we will describe below; though, other su-
pervised loss functions may be used as well. For regression
tasks using mean-squared error, the loss takes the form:
## L
## T
i
## (f
φ
## ) =
## ∑
x
## (j)
## ,y
## (j)
## ∼T
i
## ‖f
φ
## (x
## (j)
## )−y
## (j)
## ‖
## 2
## 2
## ,(2)
wherex
## (j)
## ,y
## (j)
are an input/output pair sampled from task
## T
i
.   InK-shot regression tasks,Kinput/output pairs are
provided for learning for each task.
Similarly,  for  discrete  classification  tasks  with  a  cross-
entropy loss, the loss takes the form:
## L
## T
i
## (f
φ
## ) =
## ∑
x
## (j)
## ,y
## (j)
## ∼T
i
y
## (j)
logf
φ
## (x
## (j)
## )
## + (1−y
## (j)
) log(1−f
φ
## (x
## (j)
## ))
## (3)

Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
Algorithm 2MAML for Few-Shot Supervised Learning
Require:p(T): distribution over tasks
Require:α,β: step size hyperparameters
1:  randomly initializeθ
2:whilenot donedo
3:Sample batch of tasksT
i
∼p(T)
4:for allT
i
do
5:SampleKdatapointsD={x
## (j)
## ,y
## (j)
}fromT
i
6:Evaluate∇
θ
## L
## T
i
## (f
θ
)usingDandL
## T
i
in Equation (2)
or (3)
7:Compute  adapted  parameters  with  gradient  descent:
θ
## ′
i
## =θ−α∇
θ
## L
## T
i
## (f
θ
## )
8:Sample datapointsD
## ′
i
## ={x
## (j)
## ,y
## (j)
}fromT
i
for the
meta-update
9:end for
10:Updateθ←θ−β∇
θ
## ∑
## T
i
∼p(T)
## L
## T
i
## (f
θ
## ′
i
)using eachD
## ′
i
andL
## T
i
in Equation 2 or 3
11:end while
According to the conventional terminology,K-shot classi-
fication tasks useKinput/output pairs from each class, for
a total ofNKdata points forN-way classification. Given a
distribution over tasksp(T
i
), these loss functions can be di-
rectly inserted into the equations in Section 2.2 to perform
meta-learning, as detailed in Algorithm 2.
## 3.2. Reinforcement Learning
In reinforcement learning (RL), the goal of few-shot meta-
learning is to enable an agent to quickly acquire a policy for
a new test task using only a small amount of experience in
the test setting. A new task might involve achieving a new
goal or succeeding on a previously trained goal in a new
environment. For example, an agent might learn to quickly
figure out how to navigate mazes so that, when faced with
a new maze, it can determine how to reliably reach the exit
with only a few samples.  In this section, we will discuss
how MAML can be applied to meta-learning for RL.
Each RL taskT
i
contains an initial state distributionq
i
## (x
## 1
## )
and a transition distributionq
i
## (x
t+1
## |x
t
## ,a
t
),  and the loss
## L
## T
i
corresponds to the (negative) reward functionR.  The
entire task is therefore a Markov decision process (MDP)
with horizonH,  where the learner is allowed to query a
limited number of sample trajectories for few-shot learn-
ing.  Any aspect of the MDP may change across tasks in
p(T).  The model being learned,f
θ
, is a policy that maps
from  statesx
t
to  a  distribution  over  actionsa
t
at  each
timestept∈ {1,...,H}.  The loss for taskT
i
and model
f
φ
takes the form
## L
## T
i
## (f
φ
## ) =−E
x
t
## ,a
t
## ∼f
φ
## ,q
## T
i
## [
## H
## ∑
t=1
## R
i
## (x
t
## ,a
t
## )
## ]
## .(4)
InK-shot reinforcement learning,Krollouts fromf
θ
and
taskT
i
## ,(x
## 1
## ,a
## 1
## ,...x
## H
),  and  the  corresponding  rewards
## R(x
t
## ,a
t
),  may be used for adaptation on a new taskT
i
## .
Algorithm 3MAML for Reinforcement Learning
Require:p(T): distribution over tasks
Require:α,β: step size hyperparameters
1:  randomly initializeθ
2:whilenot donedo
3:Sample batch of tasksT
i
∼p(T)
4:for allT
i
do
5:SampleKtrajectoriesD={(x
## 1
## ,a
## 1
## ,...x
## H
## )}usingf
θ
inT
i
6:Evaluate∇
θ
## L
## T
i
## (f
θ
)usingDandL
## T
i
in Equation 4
7:Compute  adapted  parameters  with  gradient  descent:
θ
## ′
i
## =θ−α∇
θ
## L
## T
i
## (f
θ
## )
8:Sample trajectoriesD
## ′
i
## ={(x
## 1
## ,a
## 1
## ,...x
## H
## )}usingf
θ
## ′
i
inT
i
9:end for
10:Updateθ←θ−β∇
θ
## ∑
## T
i
∼p(T)
## L
## T
i
## (f
θ
## ′
i
)using eachD
## ′
i
andL
## T
i
in Equation 4
11:end while
Since  the  expected  reward  is  generally  not  differentiable
due to unknown dynamics,  we use policy gradient meth-
ods  to  estimate  the  gradient  both  for  the  model  gradient
update(s) and the meta-optimization.   Since policy gradi-
ents are an on-policy algorithm,  each additional gradient
step during the adaptation off
θ
requires new samples from
the current policyf
θ
i
## ′
.  We detail the algorithm in Algo-
rithm 3.   This algorithm has the same structure as Algo-
rithm 2, with the principal difference being that steps 5 and
8 require sampling trajectories from the environment cor-
responding  to  taskT
i
.   Practical  implementations  of  this
method may also use a variety of improvements recently
proposed  for  policy  gradient  algorithms,  including  state
or action-dependent baselines and trust regions (Schulman
et al., 2015).
## 4. Related Work
The  method  that  we  propose  in  this  paper  addresses  the
general  problem  of  meta-learning  (Thrun  &  Pratt,  1998;
Schmidhuber, 1987; Naik & Mammone, 1992), which in-
cludes  few-shot  learning.   A  popular  approach  for  meta-
learning is to train a meta-learner that learns how to up-
date the parameters of the learner’s model (Bengio et al.,
1992; Schmidhuber, 1992; Bengio et al., 1990).  This ap-
proach has been applied to learning to optimize deep net-
works (Hochreiter et al., 2001; Andrychowicz et al., 2016;
Li  &  Malik,  2017),  as  well  as  for  learning  dynamically
changing recurrent networks (Ha et al., 2017).  One recent
approach learns both the weight initialization and the opti-
mizer, for few-shot image recognition (Ravi & Larochelle,
2017). Unlike these methods, the MAML learner’s weights
are updated using the gradient, rather than a learned update;
our  method  does  not  introduce  additional  parameters  for
meta-learning nor require a particular learner architecture.
Few-shot learning methods have also been developed for

Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
specific  tasks  such  as  generative  modeling  (Edwards  &
Storkey, 2017; Rezende et al., 2016) and image recogni-
tion  (Vinyals  et  al.,  2016).   One  successful  approach  for
few-shot  classification  is  to  learn  to  compare  new  exam-
ples  in  a  learned  metric  space  using  e.g.    Siamese  net-
works  (Koch,  2015)  or  recurrence  with  attention  mech-
anisms  (Vinyals  et  al.,  2016;  Shyam  et  al.,  2017;  Snell
et al., 2017). These approaches have generated some of the
most successful results, but are difficult to directly extend
to  other  problems,  such  as  reinforcement  learning.   Our
method, in contrast, is agnostic to the form of the model
and to the particular learning task.
Another  approach  to  meta-learning  is  to  train  memory-
augmented  models  on  many  tasks,  where  the  recurrent
learner is trained to adapt to new tasks as it is rolled out.
Such networks have been applied to few-shot image recog-
nition (Santoro et al., 2016; Munkhdalai & Yu, 2017) and
learning “fast” reinforcement learning agents (Duan et al.,
2016b;  Wang  et  al.,  2016).   Our  experiments  show  that
our  method  outperforms  the  recurrent  approach  on  few-
shot classification. Furthermore, unlike these methods, our
approach simply provides a good weight initialization and
uses the same gradient descent update for both the learner
and meta-update.  As a result, it is straightforward to fine-
tune the learner for additional gradient steps.
Our approach is also related to methods for initialization of
deep networks.  In computer vision, models pretrained on
large-scale image classification have been shown to learn
effective features for a range of problems (Donahue et al.,
2014).   In  contrast,  our  method  explicitly  optimizes  the
model for fast adaptability, allowing it to adapt to new tasks
with only a few examples. Our method can also be viewed
as explicitly maximizing sensitivity of new task losses to
the model parameters.  A number of prior works have ex-
plored sensitivity in deep networks, often in the context of
initialization (Saxe et al., 2014; Kirkpatrick et al., 2016).
Most of these works have considered good random initial-
izations, though a number of papers have addressed data-
dependent initializers (Kr
## ̈
ahenb
## ̈
uhl et al., 2016; Salimans &
Kingma, 2016),  including learned initializations (Husken
& Goerick, 2000; Maclaurin et al., 2015).  In contrast, our
method  explicitly  trains  the  parameters  for  sensitivity  on
a given task distribution,  allowing for extremely efficient
adaptation for problems such asK-shot learning and rapid
reinforcement learning in only one or a few gradient steps.
## 5. Experimental Evaluation
The goal of our experimental evaluation is to answer the
following questions:  (1) Can MAML enable fast learning
of new tasks?  (2) Can MAML be used for meta-learning
in multiple different domains, including supervised regres-
sion, classification, and reinforcement learning?  (3) Can a
model learned with MAML continue to improve with addi-
tional gradient updates and/or examples?
All of the meta-learning problems that we consider require
some amount of adaptation to new tasks at test-time. When
possible, we compare our results to an oracle that receives
the identity of the task (which is a problem-dependent rep-
resentation) as an additional input, as an upper bound on
the performance of the model. All of the experiments were
performed using TensorFlow (Abadi et al., 2016), which al-
lows for automatic differentiation through the gradient up-
date(s) during meta-learning. The code is available online
## 1
## .
## 5.1. Regression
We start with a simple regression problem that illustrates
the basic principles of MAML. Each task involves regress-
ing from the input to the output of a sine wave, where the
amplitude  and  phase  of  the  sinusoid  are  varied  between
tasks.    Thus,p(T)is  continuous,  where  the  amplitude
varies within[0.1,5.0]and the phase varies within[0,π],
and the input and output both have a dimensionality of1.
During training and testing, datapointsxare sampled uni-
formly from[−5.0,5.0]. The loss is the mean-squared error
between the predictionf(x)and true value.   The regres-
sor is a neural network model with2hidden layers of size
40with ReLU nonlinearities. When training with MAML,
we use one gradient update withK= 10examples with
a  fixed  step  sizeα= 0.01,  and  use  Adam  as  the  meta-
optimizer (Kingma & Ba, 2015).   The baselines are like-
wise trained with Adam. To evaluate performance, we fine-
tune a single meta-learned model on varying numbers ofK
examples, and compare performance to two baselines:  (a)
pretraining on all of the tasks, which entails training a net-
work to regress to random sinusoid functions and then, at
test-time, fine-tuning with gradient descent on theKpro-
vided points,  using an automatically tuned step size,  and
(b) an oracle which receives the true amplitude and phase
as input.   In Appendix C, we show comparisons to addi-
tional multi-task and adaptation methods.
We evaluate performance by fine-tuning the model learned
by MAML and the pretrained model onK={5,10,20}
datapoints.  During fine-tuning, each gradient step is com-
puted using the sameKdatapoints. The qualitative results,
shown in Figure 2 and further expanded on in Appendix B
show that the learned model is able to quickly adapt with
only5datapoints, shown as purple triangles, whereas the
model that is pretrained using standard supervised learning
on all tasks is unable to adequately adapt with so few dat-
apoints  without  catastrophic  overfitting.   Crucially,  when
theKdatapoints are all in one half of the input range, the
## 1
Code  for  the  regression  and  supervised  experiments  is  at
github.com/cbfinn/mamland  code  for  the  RL  experi-
ments is atgithub.com/cbfinn/maml_rl

Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
Figure 2.Few-shot adaptation for the simple regression task. Left: Note that MAML is able to estimate parts of the curve where there are
no datapoints, indicating that the model has learned about the periodic structure of sine waves. Right: Fine-tuning of a model pretrained
on the same distribution of tasks without MAML, with a tuned step size. Due to the often contradictory outputs on the pre-training tasks,
this model is unable to recover a suitable representation and fails to extrapolate from the small number of test-time samples.
Figure 3.Quantitative  sinusoid  regression  results  showing  the
learning curve at meta test-time.  Note that MAML continues to
improve with additional gradient steps without overfitting to the
extremely small dataset during meta-testing, achieving a loss that
is substantially lower than the baseline fine-tuning approach.
model trained with MAML can still infer the amplitude and
phase in the other half of the range, demonstrating that the
MAML trained modelfhas learned to model the periodic
nature of the sine wave.  Furthermore, we observe both in
the qualitative and quantitative results (Figure 3 and Ap-
pendix B) that the model learned with MAML continues
to  improve  with  additional  gradient  steps,  despite  being
trained for maximal performance after one gradient step.
This improvement suggests that MAML optimizes the pa-
rameters such that they lie in a region that is amenable to
fast adaptation and is sensitive to loss functions fromp(T),
as discussed in Section 2.2,  rather than overfitting to pa-
rametersθthat only improve after one step.
## 5.2. Classification
To evaluate MAML in comparison to prior meta-learning
and few-shot learning algorithms, we applied our method
to few-shot image recognition on the Omniglot (Lake et al.,
2011) and MiniImagenet datasets.   The Omniglot dataset
consists  of  20  instances  of  1623  characters  from  50  dif-
ferent alphabets.  Each instance was drawn by a different
person.  The MiniImagenet dataset was proposed by Ravi
& Larochelle (2017), and involves 64 training classes, 12
validation classes, and 24 test classes.  The Omniglot and
MiniImagenet image recognition tasks are the most com-
mon recently used few-shot learning benchmarks (Vinyals
et al., 2016; Santoro et al., 2016; Ravi & Larochelle, 2017).
We follow the experimental protocol proposed by Vinyals
et al. (2016), which involves fast learning ofN-way clas-
sification with 1 or 5 shots. The problem ofN-way classi-
fication is set up as follows:  selectNunseen classes, pro-
vide the model withKdifferent instances of each of theN
classes, and evaluate the model’s ability to classify new in-
stances within theNclasses.  For Omniglot, we randomly
select1200characters for training, irrespective of alphabet,
and use the remaining for testing. The Omniglot dataset is
augmented  with  rotations  by  multiples  of90degrees,  as
proposed by Santoro et al. (2016).
Our model follows the same architecture as the embedding
function used by Vinyals et al. (2016), which has 4 mod-
ules with a3×3convolutions and64filters, followed by
batch normalization (Ioffe & Szegedy, 2015), a ReLU non-
linearity,  and2×2max-pooling.   The Omniglot images
are downsampled to28×28, so the dimensionality of the
last hidden layer is64.  As in the baseline classifier used
by Vinyals et al. (2016),  the last layer is fed into a soft-
max.  For Omniglot, we used strided convolutions instead
of max-pooling.  For MiniImagenet, we used32filters per
layer to reduce overfitting, as done by (Ravi & Larochelle,
2017).  In order to also provide a fair comparison against
memory-augmented neural networks (Santoro et al., 2016)
and to test the flexibility of MAML, we also provide re-
sults for a non-convolutional network.  For this, we use a
network with4hidden layers with sizes256,128,64,64,
each including batch normalization and ReLU nonlineari-
ties, followed by a linear layer and softmax. For all models,
the loss function is the cross-entropy error between the pre-
dicted and true class. Additional hyperparameter details are
included in Appendix A.1.
We present the results in Table 1. The convolutional model
learned by MAML compares well to the state-of-the-art re-
sults on this task, narrowly outperforming the prior meth-
ods.   Some  of  these  existing  methods,  such  as  matching
networks, Siamese networks, and memory models are de-
signed  with  few-shot  classification  in  mind,  and  are  not
readily applicable to domains such as reinforcement learn-
ing.   Additionally,  the  model  learned  with  MAML  uses

Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
Table 1.Few-shot classification on held-out Omniglot characters (top) and the MiniImagenet test set (bottom). MAML achieves results
that are comparable to or outperform state-of-the-art convolutional and recurrent models. Siamese nets, matching nets, and the memory
module approaches are all specific to classification, and are not directly applicable to regression or RL scenarios.  The±shows95%
confidence intervals over tasks. Note that the Omniglot results may not be strictly comparable since the train/test splits used in the prior
work were not available. The MiniImagenet evaluation of baseline methods and matching networks is from Ravi & Larochelle (2017).
## 5-way Accuracy20-way Accuracy
Omniglot (Lake et al., 2011)1-shot5-shot1-shot5-shot
MANN, no conv  (Santoro et al., 2016)82.8%94.9%––
MAML, no conv (ours)89.7±1.1%97.5±0.6%––
Siamese nets (Koch, 2015)97.3%98.4%88.2%97.0%
matching nets (Vinyals et al., 2016)98.1%98.9%93.8%98.5%
neural statistician (Edwards & Storkey, 2017)98.1%99.5%93.2%98.1%
memory mod. (Kaiser et al., 2017)98.4%99.6%95.0%98.6%
MAML (ours)98.7±0.4%99.9±0.1%95.8±0.3%98.9±0.2%
## 5-way Accuracy
MiniImagenet (Ravi & Larochelle, 2017)1-shot5-shot
fine-tuning baseline28.86±0.54%49.79±0.79%
nearest neighbor baseline41.08±0.70%51.04±0.65%
matching nets (Vinyals et al., 2016)43.56±0.84%55.31±0.73%
meta-learner LSTM (Ravi & Larochelle, 2017)43.44±0.77%60.60±0.71%
MAML, first order approx. (ours)48.07±1.75%63.15±0.91%
MAML (ours)48.70±1.84%63.11±0.92%
fewer overall parameters compared to matching networks
and the meta-learner LSTM, since the algorithm does not
introduce  any  additional  parameters  beyond  the  weights
of the classifier itself.  Compared to these prior methods,
memory-augmented neural networks (Santoro et al., 2016)
specifically,  and  recurrent  meta-learning  models  in  gen-
eral,  represent  a  more  broadly  applicable  class  of  meth-
ods that, like MAML, can be used for other tasks such as
reinforcement  learning  (Duan  et  al.,  2016b;  Wang  et  al.,
2016). However, as shown in the comparison, MAML sig-
nificantly  outperforms  memory-augmented  networks  and
the meta-learner LSTM on 5-way Omniglot and MiniIm-
agenet classification, both in the1-shot and5-shot case.
A  significant  computational  expense  in  MAML  comes
from  the  use  of  second  derivatives  when  backpropagat-
ing  the  meta-gradient  through  the  gradient  operator  in
the meta-objective (see Equation (1)).  On MiniImagenet,
we  show  a  comparison  to  a  first-order  approximation  of
MAML, where these second derivatives are omitted.  Note
that the resulting method still computes the meta-gradient
at the post-update parameter valuesθ
## ′
i
, which provides for
effective meta-learning.  Surprisingly however, the perfor-
mance of this method is nearly the same as that obtained
with  full  second  derivatives,  suggesting  that  most  of  the
improvement in MAML comes from the gradients of the
objective at the post-update parameter values, rather than
the second order updates from differentiating through the
gradient update.  Past work has observed that ReLU neu-
ral networks are locally almost linear (Goodfellow et al.,
2015), which suggests that second derivatives may be close
to zero in most cases, partially explaining the good perfor-
Figure 4.Top:  quantitative results from 2D navigation task, Bot-
tom: qualitative comparison between model learned with MAML
and with fine-tuning from a pretrained network.
mance of the first-order approximation.  This approxima-
tion removes the need for computing Hessian-vector prod-
ucts in an additional backward pass, which we found led to
roughly33%speed-up in network computation.
## 5.3. Reinforcement Learning
To evaluate MAML on reinforcement learning problems,
we constructed several sets of tasks based off of the sim-
ulated continuous control environments in the rllab bench-
mark suite (Duan et al., 2016a).  We discuss the individual
domains below.  In all of the domains,  the model trained
by MAML is a neural network policy with two hidden lay-
ers  of  size100,  with  ReLU  nonlinearities.   The  gradient
updates  are  computed  using  vanilla  policy  gradient  (RE-
INFORCE) (Williams, 1992), and we use trust-region pol-
icy optimization (TRPO) as the meta-optimizer (Schulman
et al., 2015). In order to avoid computing third derivatives,

Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
Figure 5.Reinforcement learning results for the half-cheetah and ant locomotion tasks,  with the tasks shown on the far right.  Each
gradient step requires additional samples from the environment, unlike the supervised learning tasks. The results show that MAML can
adapt to new goal velocities and directions substantially faster than conventional pretraining or random initialization, achieving good
performs in just two or three gradient steps.  We exclude the goal velocity, random baseline curves, since the returns are much worse
(<−200for cheetah and<−25for ant).
we  use  finite  differences  to  compute  the  Hessian-vector
products  for  TRPO.  For  both  learning  and  meta-learning
updates,  we  use  the  standard  linear  feature  baseline  pro-
posed by Duan et al. (2016a), which is fitted separately at
each iteration for each sampled task in the batch. We com-
pare to three baseline models: (a) pretraining one policy on
all of the tasks and then fine-tuning, (b) training a policy
from randomly initialized weights, and (c) an oracle policy
which receives the parameters of the task as input, which
for the tasks below corresponds to a goal position, goal di-
rection, or goal velocity for the agent. The baseline models
of (a) and (b) are fine-tuned with gradient descent with a
manually tuned step size.   Videos of the learned policies
can be viewed atsites.google.com/view/maml
2D Navigation.In our first meta-RL experiment, we study
a set of tasks where a point agent must move to different
goal positions in 2D, randomly chosen for each task within
a unit square.  The observation is the current 2D position,
and actions correspond to velocity commands clipped to be
in the range[−0.1,0.1]. The reward is the negative squared
distance to the goal, and episodes terminate when the agent
is within0.01of the goal or at the horizon ofH= 100. The
policy was trained with MAML to maximize performance
after1policy  gradient  update  using20trajectories.   Ad-
ditional hyperparameter settings for this problem and the
following RL problems are in Appendix A.2. In our evalu-
ation, we compare adaptation to a new task with up to 4 gra-
dient updates, each with40samples. The results in Figure 4
show the adaptation performance of models that are initial-
ized with MAML, conventional pretraining on the same set
of  tasks,  random  initialization,  and  an  oracle  policy  that
receives the goal position as input.  The results show that
MAML can learn a model that adapts much more quickly
in a single gradient update,  and furthermore continues to
improve with additional updates.
Locomotion.To study how well MAML can scale to more
complex deep RL problems, we also study adaptation on
high-dimensional locomotion tasks with the MuJoCo sim-
ulator  (Todorov et al., 2012).  The tasks require two sim-
ulated robots – a planar cheetah and a 3D quadruped (the
“ant”) – to run in a particular direction or at a particular
velocity.   In  the  goal  velocity  experiments,  the  reward  is
the negative absolute value between the current velocity of
the agent and a goal, which is chosen uniformly at random
between0.0and2.0for the cheetah and between0.0and
3.0for the ant.  In the goal direction experiments, the re-
ward is the magnitude of the velocity in either the forward
or backward direction, chosen at random for each task in
p(T). The horizon isH= 200, with20rollouts per gradi-
ent step for all problems except the ant forward/backward
task, which used40rollouts per step.  The results in Fig-
ure  5  show  that  MAML  learns  a  model  that  can  quickly
adapt its velocity and direction with even just a single gra-
dient update,  and continues to improve with more gradi-
ent steps.  The results also show that, on these challenging
tasks,  the  MAML initialization  substantially  outperforms
random initialization and pretraining.  In fact, pretraining
is  in  some  cases  worse  than  random  initialization,  a  fact
observed in prior RL work (Parisotto et al., 2016).
- Discussion and Future Work
We introduced a meta-learning method based on learning
easily  adaptable  model  parameters  through  gradient  de-
scent.  Our approach has a number of benefits.  It is simple
and does not introduce any learned parameters for meta-
learning. It can be combined with any model representation
that is amenable to gradient-based training, and any differ-
entiable objective, including classification, regression, and
reinforcement learning.   Lastly,  since our method merely
produces  a  weight  initialization,  adaptation  can  be  per-
formed with any amount of data and any number of gra-
dient steps, though we demonstrate state-of-the-art results
on classification with only one or five examples per class.
We also show that our method can adapt an RL agent using
policy gradients and a very modest amount of experience.
Reusing knowledge from past tasks may be a crucial in-
gredient in making high-capacity scalable models, such as
deep neural networks, amenable to fast training with small
datasets. We believe that this work is one step toward a sim-
ple and general-purpose meta-learning technique that can
be applied to any problem and any model. Further research
in this area can make multitask initialization a standard in-
gredient in deep learning and reinforcement learning.

Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
## Acknowledgements
The authors would like to thank Xi Chen and Trevor Darrell
for helpful discussions, Yan Duan and Alex Lee for techni-
cal advice, Nikhil Mishra, Haoran Tang, and Greg Kahn for
feedback on an early draft of the paper, and the anonymous
reviewers for their comments. This work was supported in
part by an ONR PECASE award and an NSF GRFP award.
## References
## Abadi,  Mart
## ́
ın,  Agarwal,  Ashish,  Barham,  Paul,  Brevdo,
## Eugene, Chen, Zhifeng, Citro, Craig, Corrado, Greg S,
Davis, Andy, Dean, Jeffrey, Devin, Matthieu, et al.  Ten-
sorflow: Large-scale machine learning on heterogeneous
distributed systems.arXiv preprint arXiv:1603.04467,
## 2016.
## Andrychowicz,  Marcin,  Denil,  Misha,  Gomez,  Sergio,
Hoffman,  Matthew  W,  Pfau,  David,  Schaul,  Tom,  and
de Freitas, Nando. Learning to learn by gradient descent
by gradient descent.  InNeural Information Processing
Systems (NIPS), 2016.
Bengio,  Samy,  Bengio,  Yoshua,  Cloutier,  Jocelyn,  and
Gecsei, Jan.  On the optimization of a synaptic learning
rule.   InOptimality in Artificial and Biological Neural
Networks, pp. 6–8, 1992.
Bengio,  Yoshua,  Bengio,  Samy,  and  Cloutier,  Jocelyn.
Learning  a  synaptic  learning  rule.Universit
## ́
e  de
## Montr
## ́
eal,  D
## ́
epartement d’informatique et de recherche
op
## ́
erationnelle, 1990.
## Donahue,  Jeff,  Jia,  Yangqing,  Vinyals,  Oriol,  Hoffman,
Judy, Zhang, Ning, Tzeng, Eric, and Darrell, Trevor. De-
caf:  A deep convolutional activation feature for generic
visual recognition.  InInternational Conference on Ma-
chine Learning (ICML), 2014.
## Duan,  Yan,  Chen,  Xi,  Houthooft,  Rein,  Schulman,  John,
and Abbeel, Pieter.   Benchmarking deep reinforcement
learning for continuous control.   InInternational Con-
ference on Machine Learning (ICML), 2016a.
## Duan,  Yan,  Schulman,  John,  Chen,  Xi,  Bartlett,  Peter L,
Sutskever, Ilya, and Abbeel, Pieter.  Rl2: Fast reinforce-
ment  learning  via  slow  reinforcement  learning.arXiv
preprint arXiv:1611.02779, 2016b.
Edwards, Harrison and Storkey, Amos.  Towards a neural
statistician.International Conference on Learning Rep-
resentations (ICLR), 2017.
Goodfellow, Ian J, Shlens, Jonathon, and Szegedy, Chris-
tian.   Explaining and harnessing adversarial examples.
International  Conference  on  Learning  Representations
## (ICLR), 2015.
Ha, David, Dai, Andrew, and Le, Quoc V. Hypernetworks.
International  Conference  on  Learning  Representations
## (ICLR), 2017.
Hochreiter,  Sepp,  Younger,  A  Steven,  and  Conwell,  Pe-
ter  R.    Learning  to  learn  using  gradient  descent.    In
International Conference on Artificial Neural Networks.
## Springer, 2001.
Husken, Michael and Goerick, Christian.  Fast learning for
problem classes using knowledge based network initial-
ization.   InNeural Networks, 2000. IJCNN 2000,  Pro-
ceedings  of  the  IEEE-INNS-ENNS  International  Joint
Conference on, volume 6, pp. 619–624. IEEE, 2000.
Ioffe, Sergey and Szegedy, Christian. Batch normalization:
Accelerating deep network training by reducing internal
covariate  shift.International  Conference  on  Machine
Learning (ICML), 2015.
Kaiser,  Lukasz,  Nachum,  Ofir,  Roy,  Aurko,  and  Bengio,
Samy.  Learning to remember rare events.International
Conference on Learning Representations (ICLR), 2017.
Kingma, Diederik and Ba, Jimmy.   Adam:  A method for
stochastic  optimization.International  Conference  on
Learning Representations (ICLR), 2015.
## Kirkpatrick,  James,  Pascanu,  Razvan,  Rabinowitz,  Neil,
## Veness,  Joel,  Desjardins,  Guillaume,  Rusu,  Andrei  A,
## Milan,  Kieran,  Quan, John,  Ramalho,  Tiago,  Grabska-
Barwinska,   Agnieszka,   et   al.Overcoming   catas-
trophic  forgetting  in  neural  networks.arXiv  preprint
arXiv:1612.00796, 2016.
Koch, Gregory.  Siamese neural networks for one-shot im-
age recognition.ICML Deep Learning Workshop, 2015.
## Kr
## ̈
ahenb
## ̈
uhl,  Philipp,  Doersch,  Carl,  Donahue,  Jeff,  and
Darrell,  Trevor.   Data-dependent initializations of con-
volutional neural networks.International Conference on
Learning Representations (ICLR), 2016.
## Lake,  Brenden  M,  Salakhutdinov,  Ruslan,  Gross,  Jason,
and Tenenbaum, Joshua B.  One shot learning of simple
visual concepts.  InConference of the Cognitive Science
Society (CogSci), 2011.
Li, Ke and Malik, Jitendra.  Learning to optimize.Interna-
tional Conference on Learning Representations (ICLR),
## 2017.
Maclaurin, Dougal, Duvenaud, David, and Adams, Ryan.
Gradient-based hyperparameter optimization through re-
versible learning.   InInternational Conference on Ma-
chine Learning (ICML), 2015.

Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
Munkhdalai,   Tsendsuren   and   Yu,   Hong.Meta   net-
works.International Conferecence on Machine Learn-
ing (ICML), 2017.
Naik, Devang K and Mammone, RJ. Meta-neural networks
that learn by learning. InInternational Joint Conference
on Neural Netowrks (IJCNN), 1992.
Parisotto, Emilio, Ba, Jimmy Lei, and Salakhutdinov, Rus-
lan. Actor-mimic: Deep multitask and transfer reinforce-
ment  learning.International  Conference  on  Learning
Representations (ICLR), 2016.
Ravi,  Sachin  and  Larochelle,  Hugo.    Optimization  as  a
model for few-shot learning.   InInternational Confer-
ence on Learning Representations (ICLR), 2017.
Rei,   Marek.Online   representation   learning   in   re-
current   neural   language   models.arXiv   preprint
arXiv:1508.03854, 2015.
## Rezende,  Danilo  Jimenez,  Mohamed,  Shakir,  Danihelka,
Ivo, Gregor, Karol, and Wierstra, Daan. One-shot gener-
alization in deep generative models.International Con-
ference on Machine Learning (ICML), 2016.
Salimans, Tim and Kingma, Diederik P. Weight normaliza-
tion:  A simple reparameterization to accelerate training
of deep neural networks. InNeural Information Process-
ing Systems (NIPS), 2016.
## Santoro,  Adam,  Bartunov,  Sergey,  Botvinick,  Matthew,
Wierstra, Daan, and Lillicrap, Timothy.   Meta-learning
with memory-augmented neural networks.   InInterna-
tional Conference on Machine Learning (ICML), 2016.
Saxe,  Andrew,  McClelland,  James,  and  Ganguli,  Surya.
Exact solutions to the nonlinear dynamics of learning in
deep linear neural networks.International Conference
on Learning Representations (ICLR), 2014.
Schmidhuber,  Jurgen.Evolutionary  principles  in  self-
referential  learning.On  learning  how  to  learn:   The
meta-meta-...  hook.)  Diploma  thesis,  Institut  f.  Infor-
matik, Tech. Univ. Munich, 1987.
## Schmidhuber,  J
## ̈
urgen.Learning  to  control  fast-weight
memories:   An  alternative  to  dynamic  recurrent  net-
works.Neural Computation, 1992.
## Schulman,  John,  Levine,  Sergey,  Abbeel,  Pieter,  Jordan,
Michael  I,  and  Moritz,  Philipp.Trust  region  policy
optimization.   InInternational Conference on Machine
Learning (ICML), 2015.
Shyam, Pranav, Gupta, Shubham, and Dukkipati, Ambed-
kar. Attentive recurrent comparators.International Con-
ferecence on Machine Learning (ICML), 2017.
Snell, Jake, Swersky, Kevin, and Zemel, Richard S.  Pro-
totypical networks for few-shot learning.arXiv preprint
arXiv:1703.05175, 2017.
Thrun,  Sebastian  and  Pratt,  Lorien.Learning  to  learn.
## Springer Science & Business Media, 1998.
Todorov, Emanuel, Erez, Tom, and Tassa, Yuval.  Mujoco:
A  physics  engine  for  model-based  control.    InInter-
national Conference on Intelligent Robots and Systems
## (IROS), 2012.
## Vinyals, Oriol, Blundell, Charles, Lillicrap, Tim, Wierstra,
Daan, et al. Matching networks for one shot learning. In
Neural Information Processing Systems (NIPS), 2016.
Wang,  Jane  X,  Kurth-Nelson,  Zeb,  Tirumala,  Dhruva,
## Soyer,  Hubert,  Leibo,  Joel  Z,  Munos,  Remi,  Blun-
dell,   Charles,   Kumaran,   Dharshan,   and   Botvinick,
Matt.   Learning to reinforcement learn.arXiv preprint
arXiv:1611.05763, 2016.
Williams, Ronald J.   Simple statistical gradient-following
algorithms   for   connectionist   reinforcement   learning.
Machine learning, 8(3-4):229–256, 1992.

Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
## A. Additional Experiment Details
In this section, we provide additional details of the experi-
mental set-up and hyperparameters.
## A.1. Classification
For  N-way,  K-shot  classification,  each  gradient  is  com-
puted using a batch size ofNKexamples.  For Omniglot,
the  5-way  convolutional  and  non-convolutional  MAML
models were each trained with1gradient step with step size
α= 0.4and a meta batch-size of32tasks.  The network
was  evaluated  using3gradient  steps  with  the  same  step
sizeα= 0.4.   The 20-way convolutional MAML model
was trained and evaluated with5gradient steps with step
sizeα= 0.1. During training, the meta batch-size was set
to16tasks.  For MiniImagenet, both models were trained
using5gradient steps of sizeα= 0.01, and evaluated using
10gradient steps at test time. Following Ravi & Larochelle
(2017),15examples per class were used for evaluating the
post-update meta-gradient.  We used a meta batch-size of
4and2tasks for1-shot and5-shot training respectively.
All  models  were  trained  for60000iterations  on  a  single
NVIDIA Pascal Titan X GPU.
## A.2. Reinforcement Learning
In all reinforcement learning experiments, the MAML pol-
icy was trained using a single gradient step withα= 0.1.
During evaluation, we found that halving the learning rate
after the first gradient step produced superior performance.
Thus, the step size during adaptation was set toα= 0.1
for the first step, andα= 0.05for all future steps.  The
step sizes for the baseline methods were manually tuned for
each domain.  In the 2D navigation, we used a meta batch
size  of20;  in  the  locomotion  problems,  we  used  a  meta
batch size of40tasks.  The MAML models were trained
for up to500meta-iterations, and the model with the best
average return during training was used for evaluation. For
the ant goal velocity task, we added a positive reward bonus
at each timestep to prevent the ant from ending the episode.
## B. Additional Sinusoid Results
In  Figure  6,  we  show  the  full  quantitative  results  of  the
MAML model trained on10-shot learning and evaluated
on5-shot,10-shot, and20-shot.  In Figure 7, we show the
qualitative performance of MAML and the pretrained base-
line on randomly sampled sinusoids.
## C. Additional Comparisons
In this section,  we include more thorough evaluations of
our approach, including additional multi-task baselines and
a comparison representative of the approach of Rei (2015).
C.1. Multi-task baselines
The pretraining baseline in the main text trained a single
network on all tasks, which we referred to as “pretraining
on all tasks”.  To evaluate the model, as with MAML, we
fine-tuned this model on each test task usingKexamples.
In the domains that we study,  different tasks involve dif-
ferent  output  values  for  the  same  input.   As  a  result,  by
pre-training on all tasks, the model would learn to output
the average output for a particular input value. In some in-
stances,  this model may learn very little about the actual
domain,  and  instead  learn  about  the  range  of  the  output
space.
We  experimented  with  a  multi-task  method  to  provide  a
point of comparison, where instead of averaging in the out-
put space, we averaged in the parameter space. To achieve
averaging in parameter space, we sequentially trained500
separate  models  on500tasks  drawn  fromp(T).    Each
model  was  initialized  randomly  and  trained  on  a  large
amount of data from its assigned task.  We then took the
average parameter vector across models and fine-tuned on
5 datapoints with a tuned step size. All of our experiments
for this method were on the sinusoid task because of com-
putational requirements. The error of the individual regres-
sors was low: less than 0.02 on their respective sine waves.
We tried three variants of this set-up.  During training of
the  individual  regressors,  we  tried  using  one  of  the  fol-
lowing:  no regularization,  standard`
## 2
weight decay,  and
## `
## 2
weight regularization to the mean parameter vector thus
far  of  the  trained  regressors.   The  latter  two  variants  en-
courage the individual models to find parsimonious solu-
tions.  When using regularization, we set the magnitude of
the regularization to be as high as possible without signif-
icantly deterring performance.  In our results, we refer to
this approach as “multi-task”. As seen in the results in Ta-
ble 2, we find averaging in the parameter space (multi-task)
performed worse than averaging in the output space (pre-
training on all tasks).   This suggests that it is difficult to
find parsimonious solutions to multiple tasks when training
on tasks separately, and that MAML is learning a solution
that is more sophisticated than the mean optimal parameter
vector.
C.2. Context vector adaptation
Rei (2015) developed a method which learns a context vec-
tor that can be adapted online,  with an application to re-
current language models.   The parameters in this context
vector are learned and adapted in the same way as the pa-
rameters in the MAML model.  To provide a comparison
to using such a context vector for meta-learning problems,
we concatenated a set of free parameterszto the inputx,
and only allowed the gradient steps to modifyz, rather than
modifying the model parametersθ, as in MAML. For im-

Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
Figure 6.Quantitative sinusoid regression results showing test-time learning curves with varying numbers ofKtest-time samples. Each
gradient step is computed using the sameKexamples.  Note that MAML continues to improve with additional gradient steps without
overfitting to the extremely small dataset during meta-testing, and achieves a loss that is substantially lower than the baseline fine-tuning
approach.
Table 2.Additional  multi-task  baselines  on  the  sinusoid  regres-
sion domain, showing 5-shot mean squared error. The results sug-
gest that MAML is learning a solution more sophisticated than the
mean optimal parameter vector.
num. grad steps1510
multi-task, no reg4.193.853.69
multi-task, l2 reg7.185.695.60
multi-task, reg to meanθ2.912.722.71
pretrain on all tasks2.412.232.19
MAML (ours)0.670.380.35
## Table 3.5-way Omniglot Classification
## 1-shot5-shot
context vector94.9±0.9%97.7±0.3%
## MAML98.7±0.4%99.9±0.1%
age inputs,zwas concatenated channel-wise with the input
image.  We ran this method on Omniglot and two RL do-
mains following the same experimental protocol. We report
the results in Tables 3, 4, and 5. Learning an adaptable con-
text vector performed well on the toy pointmass problem,
but sub-par on more difficult problems, likely due to a less
flexible meta-optimization.
Table 4.2D Pointmass, average return
num. grad steps0123
context vector−42.42−13.90−5.17−3.18
MAML (ours)−40.41−11.68−3.33−3.23
Table 5.Half-cheetah forward/backward, average return
num. grad steps0123
context vector−40.49−44.08−38.27−42.50
MAML (ours)−50.69293.19313.48315.65

Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
Figure 7.A random sample of qualitative results from the sinusoid regression task.