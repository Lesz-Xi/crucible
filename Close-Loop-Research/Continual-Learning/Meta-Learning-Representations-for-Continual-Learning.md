

Meta-Learning Representations for
## Continual Learning
## Khurram Javed, Martha White
Department of Computing Science
University of Alberta
## T6G 1P8
kjaved@ualberta.ca, whitem@ualberta.ca
## Abstract
A continual learning agent should be able to build on top of existing knowledge to
learn on new data quickly while minimizing forgetting. Current intelligent systems
based on neural network function approximators arguably do the opposite—they
are highly prone to forgetting and rarely trained to facilitate future learning. One
reason for this poor behavior is that they learn from a representation that is not
explicitly trained for these two goals. In this paper, we proposeOML, an objective
that directly minimizes catastrophic interference by learning representations that
accelerate future learning and are robust to forgetting under online updates in con-
tinual learning. We show that it is possible to learn naturally sparse representations
that are more effective for online updating.  Moreover, our algorithm is comple-
mentary to existing continual learning strategies, such as MER and GEM. Finally,
we demonstrate that a basic online updating strategy on representations learned by
OML is competitive with rehearsal based methods for continual learning.
## 1
## 1  Introduction
Continual learning—also called cumulative learning and lifelong learning—is the problem setting
where an agent faces a continual stream of data, and must continually make and learn new predictions.
The two main goals of continual learning are (1) to exploit existing knowledge of the world to quickly
learn predictions on new samples (accelerate future learning) and (2) reduce interference in updates,
particularly avoiding overwriting older knowledge.  Humans, as intelligence agents, are capable
of doing both.  For instance, an experienced programmer can learn a new programming language
significantly faster than someone who has never programmed before and does not need to forget
the old language to learn the new one. Current state-of-the-art learning systems, on the other hand,
struggle with both (French, 1999; Kirkpatrick et al., 2017).
Several methods have been proposed to address catastrophic interference. These can generally be
categorized into methods that (1) modify the online update to retain knowledge, (2) replay or generate
samples for more updates and (3) use semi-distributed representations. Knowledge retention methods
prevent important weights from changing too much, by introducing a regularization term for each
parameter weighted by its importance (Kirkpatrick et al., 2017; Aljundi et al., 2018; Zenke et al.,
2017; Lee et al., 2017; Liu et al., 2018). Rehearsal methods interleave online updates with updates
on samples from a model. Samples from a model can be obtained by replaying samples from older
data (Lin, 1992; Mnih et al., 2015; Chaudhry et al., 2019; Riemer et al., 2019; Rebuffi et al., 2017;
Lopez-Paz and Ranzato, 2017; Aljundi et al., 2019), by using a generative model learned on previous
data (Sutton, 1990; Shin et al., 2017), or using knowledge distillation which generates targets using
## 1
We release an implementation of our method athttps://github.com/khurramjaved96/mrcl
33rd Conference on Neural Information Processing Systems (NeurIPS 2019), Vancouver, Canada.
arXiv:1905.12588v2  [cs.LG]  30 Oct 2019

Representation Learning Network (RLN)
x
## 1
x
## 2
x
n
## ...
## Input
Prediction Learning Network (PLN)
## Learned
representation
y
## Output
## Meta-parameters
(Only updated in the outer loop
during meta-training)
## Adaptation Parameters
(Updated in the inner loop
and at meta-testing)
## ...
r
## 1
r
## 2
r
## 3
r
## 4
## Network
## Connections
Could be any differentiable
layer e.g a conv layer + relu
or fc layer + relu
r
d
## Network
## Connections
## Network
## Connections
## Network
## Connections
## Network
## Connections
## Network
## Connections
## Network
## Connections
Figure 1: An example of our proposed architecture for learning representations for continual learning.
During the inner gradient steps for computing the meta-objective, we only update the parameters
in the prediction learning network (PLN). We then update both the representation learning network
(RLN) and the prediction learning network (PLN) by taking a gradient step with respect to our
meta-objective. The online updates for continual learning also only modify the PLN. Both RLN and
PLN can be arbitrary models.
predictions from an older predictor (Li and Hoiem, 2018). These ideas are all complementary to that
of learning representations that are suitable for online updating.
Early work on catastrophic interference focused on learning semi-distributed (also called sparse)
representations (French, 1991, 1999). Recent work has revisited the utility of sparse representations
for mitigating interference (Liu et al., 2019) and for using model capacity more conservatively to
leave room for future learning (Aljundi et al., 2019). These methods, however, use sparsity as a proxy,
which alone does not guarantee robustness to interference. A recently proposed online update for
neural networks implicitly learns representations to obtain non-interfering updates (Riemer et al.,
2019). Their objective maximizes the dot product between gradients computed for different samples.
The idea is to encourage the network to reach an area in the parameter space where updates to the
entire network have minimal interference and positive generalization. This idea is powerful: to specify
an objective to explicitly mitigate interference—rather than implicitly with sparse representations.
In this work,  we propose to explicitly learn a representation for continual learning that avoids
interference and promotes future learning.  We propose to train the representation withOML– a
meta-objective that uses catastrophic interference as a training signal by directly optimizing through
an online update.  The goal is to learn a representation such that the stochastic online updates the
agent will use at meta-test time improve the accuracy of its predictions in general.  We show that
using our objective, it is possible to learn representations that are more effective for online updating
in sequential regression and classification problems. Moreover, these representations are naturally
highly sparse.  Finally, we show that existing continual learning strategies, like Meta Experience
Replay (Riemer et al., 2019), can learn more effectively from these representations.
## 2  Problem Formulation
A Continual Learning Prediction (CLP) problem consists of an unending stream of samples
## T= (X
## 1
## ,Y
## 1
## ),(X
## 2
## ,Y
## 2
## ),...,(X
t
## ,Y
t
## ),...
for inputsX
t
and prediction targetsY
t
, from setsXandYrespectively.
## 2
The random vectorY
t
is sam-
pled according to an unknown distributionp(Y|X
t
). We assume the processX
## 1
## ,X
## 2
## ,...,X
t
## ,...has
a marginal distributionμ:X →[0,∞), that reflects how often each input is observed. This assump-
tion allows for a variety of correlated sequences. For example,X
t
could be sampled from a distribution
## 2
This definition encompasses the continual learning problem where the tuples also include task descriptors
## T
t
(Lopez-Paz and Ranzato, 2017).T
t
in the tuple(X
t
## , T
t
## , Y
t
)can simply be considered as part of the inputs.
## 2

## Solution Manifold
for Task 1
Solution manifolds in a
representation space not
optimized for continual learning
## Joint Training
## Soluion
## Parameter Space
Solution manifolds in a
representation space ideal
for continual learning
## W
## W
p
## 1
p
## 2
p
## 3
p
## 1
p
## 2
p
## 3
Figure 2: Effect of the representation on continual learning, for a problem where targets are generated
from three different distributionsp
## 1
(Y|x),p
## 2
(Y|x)andp
## 3
(Y|x).   The representation results in
different solution manifolds for the three distributions; we depict two different possibilities here. We
show the learning trajectory when training incrementally from data generates first byp
## 1
, thenp
## 2
andp
## 3
. On the left, the online updates interfere, jumping between distant points on the manifolds.
On the right, the online updates either generalize appropriately—for parallel manifolds—or avoid
interference because manifolds are orthogonal.
potentially dependent on past variablesX
t−1
andX
t−2
. The targetsY
t
, however, are dependent only
onX
t
, and not on pastX
i
. We defineS
k
## = (X
j+1
## Y
j+1
## ),(X
j+2
## Y
j+2
## )...,(X
j+k
## ,Y
j+k
), a random
trajectory of lengthksampled from theCLPproblemT. Finally,p(S
k
|T)gives a distribution over
all trajectories of lengthkthat can be sampled from problemT.
For a given CLP problem, our goal is to learn a functionf
## W,θ
that can predictY
t
givenX
t
## . More
concretely, let`:Y×Y →Rbe the function that defines loss between a predictionˆy∈Yand target
yas`(ˆy,y). If we assume that inputsXare seen proportionally to some densityμ:X →[0,∞),
then we want to minimize the following objective for a CLP problem:
## L
## CLP
(W,θ)
def
=E[`(f
## W,θ
## (X),Y)] =
## ∫
## [
## ∫
## `(f
## W,θ
## (x),y)p(y|x)dy
## ]
μ(x)dx.(1)
whereWandθrepresent the set of parameters that are updated to minimize the objective.  To
minimizeL
## CLP
, we limit ourselves to learning by online updates on a singleklength trajectory
sampled fromp(S
k
|T). This changes the learning problem from the standard iid setting – the agent
sees a single trajectory of correlated samples of lengthk, rather than getting to directly sample from
p(x,y) =p(y|x)μ(x). This modification can cause significant issues when simply applying standard
algorithms for the iid setting. Instead, we need to design algorithms that take this correlation into
account.
A variety of continual problems can be represented by this formulation. One example is an online
regression problem, such as predicting the next spatial location for a robot given the current location;
another is the existing incremental classification benchmarks. The CLP formulation also allows for
targetsY
t
that are dependent on a history of the most recentmobservations. This can be obtained by
defining eachX
t
to be the lastmobservations. The overlap betweenX
t
andX
t−1
does not violate
the assumptions on the correlated sequence of inputs. Finally, the prediction problem in reinforcement
learning—predicting the value of a policy from a state—can be represented by considering the inputs
## X
t
to be states and the targets to be sampled returns or bootstrapped targets.
3  Meta-learning Representations for Continual Learning
Neural networks, trained end-to-end, are not effective at minimizing theCLPloss using a single
trajectory sampled fromp(S
k
|T)for two reasons.   First,  they are extremely sample-inefficient,
requiring multiple epochs of training to converge to reasonable solutions. Second, they suffer from
catastrophic interference when learning online from a correlated stream of data (French, 1991). Meta-
learning is effective at making neural networks more sample efficient (Finn et al., 2017). Recently,
Nagabandi et al. (2019); Al-Shedivat et al. (2018) showed that it can also be used for quick adaptation
from a stream of data. However, they do not look at the catastrophic interference problem. Moreover,
## 3

their work meta-learns a model initialization, an inductive bias we found insufficient for solving the
catastrophic interference problem (See Appendix C.1).
To apply neural network to the CLP problem, we propose meta-learning a functionφ
θ
(X)– a deep
Representation Learning Network (RLN) parametrized byθ– fromX →R
d
. We then learn another
functiong
## W
fromR
d
→ Y, called a Prediction Learning Network (PLN). By composing the two
functions we getf
## W,θ
(X) =g
## W
## (φ
θ
(X)), which constitute our model for the CLP tasks as shown in
Figure 1. We treatθas meta-parameters that are learned by minimizing a meta-objective and then
later fixed at meta-test time. After learningθ, we learng
## W
fromR
d
→Yfor a CLP problem from a
single trajectorySusing fully online SGD updates in a single pass. A similar idea has been proposed
by Bengio et al. (2019) for learning causal structures.
For meta-training, we assume a distribution over CLP problems given byp(T). We consider two
meta-objectives for updating the meta-parametersθ. (1) MAML-Rep, a MAML (Finn et al., 2017)
like few-shot-learning objective that learns an RLN instead of model initialization, andOML(Online
aware Meta-learning) – an objective that also minimizes interference in addition to maximizing fast
adaptation for learning the RLN. Our OML objective is defined as:
min
## W,θ
## ∑
## T
i
∼p(T)
OML(W,θ)
def
## =
## ∑
## T
i
∼p(T)
## ∑
## S
j
k
∼p(S
k
## |T
i
## )
## [
## L
## CLP
i
## (
U(W,θ,S
j
k
## )
## ]
## (2)
whereS
j
k
## = (X
i
j+1
## Y
i
j+1
## ),(X
i
j+2
## Y
i
j+2
## ),...,(X
i
j+k
## Y
i
j+k
## )
## .U(W
t
,θ,S
j
k
## ) = (W
t+k
## ,θ
) represents an
update function whereW
t+k
is the weight vector afterksteps of stochastic gradient descent. Thejth
update step inUis taken using parameters(W
t+j−1
,θ)on sample(X
i
t+j
## ,Y
i
t+j
)to give(W
t+j
## ,θ).
MAML-Rep andOMLobjectives can be implemented as Algorithm 1 and 2 respectively, with the
primary difference between the two highlighted in blue. Note that MAML-Rep uses the complete
batch of dataS
k
to dolinner updates (wherelis a hyper-parameter) whereasOMLuses one data
point fromS
k
for one update.  This allowsOMLto take the effects of online continual learning –
such as catastrophic forgetting – into account.
Algorithm 1:Meta-Training : MAML-Rep
Require:p(T): distribution over CLP problems
Require:α,β: step size hyperparameters
Require:l: No of inner gradient steps
1:randomly initializeθ
2:whilenot donedo
3:randomly initializeW
4:Sample CLP problemT
i
∼p(T)
5:SampleS
train
fromp(S
k
## |T
i
## )
## 6:W
## 0
## =W
## 7:forjin1,2,...,ldo
## 8:W
j
## =W
j−1
## −α∇
## W
j−1
## `
i
## (f
θ,W
l
## (S
train
## [:,0]),S
train
## [:,1])
9:end for
10:SampleS
test
fromp(S
k
## |T
i
## )
11:Updateθ←θ−β∇
θ
## `
i
## (f
θ,W
l
## (S
test
## [:,0]),S
test
## [:,1])
12:end while
The  goal  of  theOMLob-
jective is to learn represen-
tations  suitable  for  online
continual learnings. For an
illustration of what would
constitute an effective rep-
resentation   for   continual
learning,  suppose  that  we
have three clusters of inputs,
which have significantly dif-
ferentp(Y|x), correspond-
ing top
## 1
## ,p
## 2
andp
## 3
## .   For
a fixed 2-dimensional repre-
sentationφ
θ
## :X →R
## 2
, we
can consider the manifold
of solutionsW∈R
## 2
given
by a linear model that pro-
vide equivalently accurate solutions for eachp
i
. These three manifolds are depicted as three different
colored lines in theW∈R
## 2
parameter space in Figure 2. The goal is to find one parameter vector
Wthat is effective for all three distributions by learning online on samples from three distributions
sequentially. For two different representations, these manifolds, and their intersections can look very
different. The intuition is that online updates from aWare more effective when the manifolds are
either parallel—allowing for positive generalization—or orthogonal—avoiding interference.  It is
unlikely that a representation producing such manifolds would emerge naturally. Instead, we will
have to explicitly find it. By taking into account the effects of online continual learning, theOML
objective optimizes for such a representation.
We can optimize this objective similarly to other gradient-based meta-learning objectives. Early work
on learning-to-learn considered optimizing parameters through learning updates themselves, though
typically considering approaches using genetic algorithms (Schmidhuber, 1987).  Improvements
## 4

in automatic differentiation have made it more feasible to compute gradient-based meta-learning
updates (Finn, 2018).   Some meta-learning algorithms have similarly considered optimizations
through multiple steps of updating for the few-shot learning setting (Finn et al., 2017; Li et al., 2017;
Al-Shedivat et al., 2018; Nagabandi et al., 2019) for learning model initializations. The successes
in these previous works in optimizing similar objectives motivateOMLas a feasible objective for
Meta-learning Representations for Continual Learning.
## 4  Evaluation
Algorithm 2:Meta-Training : OML
Require:p(T): distribution over CLP problems
Require:α,β: step size hyperparameters
1:randomly initializeθ
2:whilenot donedo
3:randomly initializeW
4:Sample CLP problemT
i
∼p(T)
5:SampleS
train
fromp(S
k
## |T
i
## )
## 6:W
## 0
## =W
## 7:forj= 1,2,...,kdo
## 8:(X
j
## ,Y
j
## ) =S
train
## [j]
## 9:W
j
## =W
j−1
## −α∇
## W
j−1
## `
i
## (f
θ,W
j−1
## (X
j
## ),Y
j
## )
10:end for
11:SampleS
test
fromp(S
k
## |T
i
## )
12:Updateθ←θ−β∇
θ
## `
i
## (f
θ,W
k
## (S
test
## [:,0]),S
test
## [:,1])
13:end while
In this section,  we investigate the
question: can we learn a representa-
tion for continual learning that pro-
motes future learning and reduces
interference?   We  investigate  this
question by meta-learning the repre-
sentations offline on a meta-training
dataset.  At meta-test time, we ini-
tialize the continual learner with this
representation and measure predic-
tion  error  as  the  agent  learns  the
PLN online on a new set of CLP
problems (See Figure 1).
4.1  CLP Benchmarks
We evaluate on a simulated regres-
sion problem and a sequential clas-
sification problem using real data.
Incremental Sine Waves:An Incremental Sine Wave CLP problem is defined by ten (randomly
generated) sine functions, withx= (z,n)forz∈[−5,5]as input to the sine function andna
one-hot vector for{1,...,10}indicating which function to use. The targets are deterministic, where
(x,y)corresponds toy=sin
n
(z). Each sine function is generated once by randomly selecting an
amplitude in the range[0.1,5]and phase in[0,π]. A trajectoryS
## 400
from the CLP problem consists
of 40 mini-batches from the first sine function in the sequence (Each mini-batch has eight elements),
and then 40 from the second and so on. Such a trajectory has sufficient information to minimize loss
for the complete CLP problem. We use a single regression head to predict all ten functions, where
the input idnmakes it possible to differentiate outputs for the different functions. Though learnable,
this input results in significant interference across different functions.
Split-Omniglot:Omniglot is a dataset of over 1623 characters from 50 different alphabets (Lake et al.,
2015). Each character has 20 hand-written images. The dataset is divided into two parts. The first 963
classes constitute the meta-training dataset whereas the remaining 660 the meta-testing dataset. To
define a CLP problem on this dataset, we sample an ordered set of 200 classes(C
## 1
## ,C
## 2
## ,C
## 3
## ,...,C
## 200
## ).
XandY, then, constitute of all images of these classes. A trajectoryS
## 1000
from such a problem is a
trajectory of images – five images per class – where we see all five images ofC
## 1
followed by five
images ofC
## 2
and so on. This makesk= 5×200 = 1000. Note that the sampling operation defines
a distributionp(T)over problems that we use for meta-training.
4.2  Meta-Training Details
Incremental Sine Waves:We sample 400 functions to create our meta-training set and 500 for
benchmarking the learned representation. We meta-train by sampling multiple CLP problems. During
each meta-training step, we sample ten functions from our meta-training set and assign them task
ids from one to ten.  We concatenate 40 mini-batches generated from function one, then function
two and so on, to create our training trajectoryS
## 400
. For evaluation, we similarly randomly sample
ten functions from the test set and create a single trajectory. We use SGD on the MSE loss with a
mini-batch size of 8 for online updates, and Adam (Kingma and Ba, 2014) for optimizing theOML
objective. Note that theOMLobjective involves computing gradients through a network unrolled for
## 5

## Pretraining
## SR-NN
## OML
## Oracle

## Mean
## Squared
## Error
No of functions learned
## 0.0
## 0.5
## 1.0
## 1.5
## 1379510
## 864
## 2
Continual Regression ExperimentError Distribution
## 13791086425
## 1
## 2
## 3
## 0
## 1
## 2
## 3
## 0
## 1
## 2
## 3
## 0
Task ID

## Mean
## Squared
## Error
Figure 3: Mean squared error across all 10 regression tasks. The x-axis in (a) corresponds to seeing
all data points of samples for class 1, then class 2 and so on. These learning curves are averaged over
50 runs, with error bars representing 95% confidence interval drawn by 1,000 bootstraps. We can see
that the representation trained on iid data—Pre-training—is not effective for online updating. Notice
that in the final prediction accuracy in (b), Pre-training and SR-NN representations have accurate
predictions for task 10, but high error for earlier tasks.OML, on the other hand, has a slight skew
in error towards later tasks in learning but is largely robust. Oracle uses iid sampling and multiple
epochs and serves as a best case bound.
400 steps. At evaluation time, we use the same learning rate as used during the inner updates in the
meta-training phase forOML. For our baselines, we do a grid search over learning rates and report
the results for the best performing parameter.
We found that having a deeper representation learning network (RLN) improved performance. We use
six layers for the RLN and two layers for the PLN. Each hidden layer has a width of 300. The RLN
is only updated with the meta-update and acts as a fixed feature extractor during the inner updates in
the meta-learning objective and at evaluation time.
Split-Omniglot:We learn an encoder – a deep CNN with 6 convolution and two FC layers – using
the MAML-Rep and theOMLobjective.  We treat the convolution parameters asθand FC layer
parameters asW. Because optimizing theOMLobjective is computationally expensive forH= 1000
(It involves unrolling the computation graph for 1,000 steps), we approximate the two objectives.
For MAML-Rep we learn theφ
θ
by maximizing fast adaptation for a 5 shot 5-way classifier. For
OML, instead of doing|S
train
|no of inner-gradient steps as described in Algorithm 2, we go over
## S
train
five steps at a time.  Forkthfive steps in the inner loop, we accumulate our meta-loss on
## S
test
[0 : 5×k], and update our meta-parameters using these accumulated gradients at the end as
explained in Algorithm 3 in the Appendix. This allows us to never unroll our computation graphs for
more than five steps (Similar to truncated back-propagation through time) and still take into account
the effects of interference at meta-training.
Finally, both MAML-Rep andOMLuse 5 inner gradient steps and similar network architectures for a
fair comparison. Moreover, for both methods, we try multiple values for the inner learning rateαand
report the results for the best parameter. For more details about hyper-parameters see the Appendix.
For more details on implementation, see Appendix B.
## 4.3  Baselines
We compare MAML-Rep andOML– the two Meta-learneing based Representations Leanring
methods to three baselines.
Scratchsimply learns online from a random network initialization, with no meta-training.
## Pre-training
uses standard gradient descent to minimize prediction error on the meta-training set.
We then fix the first few layers in online training. Rather than restricting to the same 6-2 architecture
for the RLN and PLN, we pick the best split using a validation set.
SR-NNuse the Set-KL method to learn a sparse representation (Liu et al., 2019) on the meta-training
set.  We use multiple values of the hyper-parameterβfor SR-NN and report results for one that
performs the best. We include this baseline to compare to a method that learns a sparse representation.
## 6

## Accuracy
## 0.0
## 0.2
## 0.4
## 0.6
## 0.8
## 1.0
## 0.0
## 0.2
## 0.4
## 0.6
## 0.8
## 1.0
No of classes learned incrementally
## 0.0
## 0.2
## 0.4
## 0.6
## 0.8
## 1.0
IID, Multiple Epochs, Train ErrorIID, Multiple Epochs, Test Error
MAML-Rep
## SRNN
## 020010050150020010050150
## (c)(d)
## OML
## Scratch
All of them
Online, Single Pass, Train ErrorOnline, Single Pass, Test Error
## OML
MAML-Rep
## SRNN
## 020010050150020010050150
## 0.0
## 0.2
## 0.4
## 0.6
## 0.8
## 1.0
## (a)(b)
## Pretraining
## Scratch
## OML
MAML-Rep
## SRNN
## Pretraining
## Scratch
Figure 4: Comparison of representations learned by the MAML-Rep,OMLobjective and the baselines
on Split-Omniglot. All curves are averaged over 50 CLP runs with 95% confidence intervals drawn
using 1,000 bootstraps. At every point on the x-axis, we only report accuracy on the classes seen
so far.  Even though both MAML-Rep andOMLlearn representations that result in comparable
performance of classifiers trained under the IID setting (c and d),OMLout-performs MAML-Rep
when learning online on a highly correlated stream of data showing it learns representations more
robust to interference. SR-NN, which does not do meta-learning, performs worse even under the IID
setting showing it learns worse representations.
4.4  Meta-Testing
We report results ofL
## CLP
## (W
online
## ,θ
meta
)for fully online updates on a singleS
k
for each CLP
problem. For each of the methods, we separately tune the learning rate on a five validation trajectories
and report results for the best performing parameter.
Incremental Sine Waves:We plot the average mean squared error over 50 runs on the full testing
set, when learning online on unseen sequences of functions, in Figure 3 (left).OMLcan learn new
functions with a negligible increase in average MSE. The Pre-training baseline, on the other hand,
clearly suffers from interference, with increasing error as it tries to learn more and more functions.
SR-NN, with its sparse representation, also suffers from noticeably more interference thanOML.
From the distribution of errors for each method on the ten functions, shown in Figure 3 (right), we
can see that both Pre-training and SR-NN have high errors for functions learned in the beginning
whereas OML performs only slightly worse on those.
## 161816186201081214
## 0.6
## 0.4
## 0.2
## 0.3
## 0.2
## 0.5
## 0.4
## 0.1
## Pretraining
## OML
## OML
## Pretraining
## 6201081214
## 1.0
## 0.8
## Meta-testing: Train Accuracy
## Accuracy
No of classes learned incrementally
## SR-NN
## SR-NN
## Meta-testing: Test Accuracy
Figure 5:OMLscales to more complex datasets
such a Mini-imagenet. We use the existing meta-
training/meta-testing split of mini-imagenet.  At
meta-testing, we learn a 20 way classifier using 30
samples per class.
Split-Omniglot:
We report classification accuracy on the train-
ing trajectory (S
train
) as well as the test set in
Figure 4. Note that training accuracy is a mean-
ingful metric in continual learning as it measures
forgetting.  The test set accuracy reflects both
forgetting and generalization error. Our method
can learn the training trajectory almost perfectly
with minimal forgetting. The baselines, on the
other hand, suffer from forgetting as they learn
more classes sequentially. The higher training
accuracy of our method also translates into bet-
ter generalization on the test set. The difference
in the train and test performance is mainly due
to how few samples are given per class: only 15
for training and 5 for testing.
As a sanity check, we also trained classifiers by sampling data IID for 5 epochs and report the results
in Fig. 4 (c) and (d). The fact thatOMLand MAML-Rep do equally well with IID sampling indicates
that the quality of representations (φ
θ
## =R
d
) learned by both objectives are comparable and the
higher performance ofOMLis indeed because the representations are more suitable for incremental
learning.
Moreover, to test ifOMLcan learn representations on more complex datasets, we run the same
experiments on mini-imagenet and report the results in Figure 5.
## 7

## OML
## SR-NN
(Sparse)
## Pre-training
Random Instance 1Random Instance 2Average Activation
## 0.0
## 1.0
## Random Instance 3
## SR-NN
Figure 6: We reshape the 2304 length representation vectors into 32x72, normalize them to have a
maximum value of one and visualize them; here random instance means representation for a randomly
chosen input from the training set, whereas average activation is the mean representation for the
complete dataset. For SR-NN, we re-train the network with a different value of parameterβto have
the same instance sparsity asOML. Note that SR-NN achieves this sparsity by never using a big part
of representation space.OML, on the other hand, uses the full representation space. In-fact,OML
has no dead neurons whereas even pre-training results in some part of the representation never being
used.
4.5  What kind of representations does OML learn?
As discussed earlier, French (1991) proposed that sparse representations could mitigate forgetting.
Ideally, such a representation is instance sparse–using a small percentage of activations to represent
an input– while also utilizing the representation to its fullest. This means that while most neurons
would be inactive for a given input, every neuron would participate in representing some input. Dead
neurons, which are inactive for all inputs, are undesirable and may as well be discarded. An instance
sparse representation with no dead neurons reduces forgetting because each update changes only a
small number of weights which in turn should only affect a small number of inputs. We hypothesize
that the representation learned byOMLwill be sparse, even though the objective does not explicitly
encourage this property.
We compute the average instance sparsity on the Omniglot training set, forOML, SR-NN, and
Pre-training.OMLproduces the most sparse network, without any dead neurons.  The network
learned by Pre-training, in comparison, uses over 10 times more neurons on average to represent an
input. The best performing SR-NN used in Figure 4 uses 4 times more neurons. We also re-trained
SR-NN with a parameter to achieve a similar level of sparsity asOML, to compare representations of
similar sparsity rather than representations chosen based on accuracy. We useβ= 0.05which results
in an instance sparsity similar to OML.
Table 1: Instance sparisty and dead neuron percentage
for different methods.OMLlearns highly sparse repre-
sentations without any dead neurons. Even Pre-training,
which does not optimize for sparsity, ends up with some
dead neurons, on the other hand.
MethodInstance SparsityDead Neurons
## OML3.8%0%
SR-NN (Best)15%0.7%
SR-NN (Sparse)4.9%14%
Pre-Training38%3%
We  visualize  all  the  solutions  in  Figure
-   The  plots  highlight  thatOMLlearns
a highly sparse and well-distributed rep-
resentation, taking the most advantage of
the  large  capacity  of  the  representation.
Surprisingly,OMLhas no dead neurons,
which is a well-known problem when learn-
ing sparse representations (Liu et al., 2019).
Even  Pre-training,  which  does  not  have
an explicit penalty to enforce sparsity, has
some dead neurons. Instance sparsity and
dead neurons percentage for each method
are reported in Table 1.
5  Improvements by Combining with Knowledge Retention Approaches
We have shown thatOMLlearns effective representations for continual learning. In this section, we
answer a different question:  how doesOMLbehave when it is combined with existing continual
## 8

Table 2:OMLcombined with existing continual learning methods.  All memory-based methods
use a buffer of 200.  Error margins represent one std over 10 runs.  Performance of all methods is
considerably improved when they learn from representations learned byOMLmoreover, even online
updates are competitive with rehearsal based methods withOML. Finally, online updates onOML
outperform all methods when they learn from other representations. Note that MER does better than
approx IID in some cases because it does multiple rehearsal-based updates for every sample.
Split-Omniglot
One class per task, 50 tasksFive classes per task, 20 tasks
MethodStandardOMLPre-trainingStandardOMLPre-training
## Online04.64±2.6164.72±2.5721.16±2.7101.40±0.4355.32±2.2511.80±1.92
Approx IID53.95±5.5075.12±3.2454.29±3.4848.02±5.6767.03±2.1046.02±2.83
ER-Reservoir52.56±2.1268.16±3.1236.72±3.0624.32±5.3760.92±2.4137.44±1.67
## MER54.88±4.1276.00±2.0762.76±2.1629.02±4.0162.05±2.1942.05±3.71
## EWC05.08±2.4764.44±3.1318.72±3.9702.04±0.3556.03±3.2010.03±1.53
learning methods? We test the performance of EWC (Lee et al., 2017), MER (Riemer et al., 2019) and
ER-Reservoir (Chaudhry et al., 2019), in their standard form—learning the whole network online—as
well as with pre-trained fixed representations.  We use pre-trained representations fromOMLand
Pre-training, obtained in the same way as described in earlier sections. For the Standard online form
of these algorithms, to avoid the unfair advantage of meta-training, we initialize the networks by
learning iid on the meta-training set.
As baselines, we also report results for (a) fully online SGD updates that update one point at a time in
order on the trajectory and (b) approximate IID training where SGD updates are used on a random
shuffling of the trajectory, removing the correlation.
We report the test set results for learning 50 tasks with one class per task and learning 20 tasks with 5
tasks per class in Split-Omniglot in Table 2. For each of the methods, we do a 15/5 train/test split
for each Omniglot class and test multiple values for all the hyperparameters and report results for
the best setting. The conclusions are surprisingly clear. (1)OMLimproves all the algorithms; (2)
simply providing a fixed representation, as in Pre-training, does not provide nearly the same gains as
OMLand (3)OMLwith a basic Online updating strategy is already competitive, outperforming all
the continual learning methods withoutOML. There are a few additional outcomes of note.OML
outperforms even approximate IID sampling, suggesting it is not only mitigating interference but also
making learning faster on new data. Finally, the difference in online and experience replay based
algorithms for OML is not as pronounced as it is for other representations.
6  Conclusion and Discussion
In this paper, we proposed a meta-learning objective to learn representations that are robust to inter-
ference under online updates and promote future learning. We showed that using our representations,
it is possible to learn from highly correlated data streams with significantly improved robustness to
forgetting. We found sparsity emerges as a property of our learned representations, without explicitly
training for sparsity. We finally showed that our method is complementary to the existing state of the
art continual learning methods, and can be combined with them to achieve significant improvements
over each approach alone.
An important next step for this work is to demonstrate how to learn these representations online
without a separate meta-training phase.  Initial experiments suggest it is effective to periodically
optimize the representation on a recent buffer of data, and then continue online update with this
updated fixed representation. This matches common paradigms in continual learning—based on the
ideas of a sleep phase and background planning—and is a plausible strategy for continually adapting
the representation network for a continual stream of data. Another interesting extension to the work
would be to use theOMLobjective to meta-learn some other aspect of the learning process – such as
a local learning rule (Metz et al., 2019) or an attention mechanism – by minimizing interference.
## 9

## References
Al-Shedivat, Maruan, Trapit Bansal, Yuri Burda, Ilya Sutskever, Igor Mordatch, and Pieter Abbeel
(2018). Continuous adaptation via meta-learning in nonstationary and competitive environments.
International Conference on Learning Representations.
Aljundi, Rahaf, Francesca Babiloni, Mohamed Elhoseiny, Marcus Rohrbach, and Tinne Tuytelaars
(2018).  Memory aware synapses:  Learning what (not) to forget.  InEuropean Conference on
## Computer Vision.
Aljundi, Rahaf, Min Lin, Baptiste Goujaud, and Yoshua Bengio (2019).  Gradient based sample
selection for online continual learning.Advances in Neural Information Processing Systems.
Aljundi, Rahaf, Marcus Rohrbach, and Tinne Tuytelaars (2019). Selfless sequential learning.Interna-
tional Conference on Learning Representations.
Bengio, Yoshua, Tristan Deleu, Nasim Rahaman, Rosemary Ke, Sébastien Lachapelle, Olexa Bilaniuk,
Anirudh Goyal, and Christopher Pal (2019). A meta-transfer objective for learning to disentangle
causal mechanisms.arXiv preprint arXiv:1901.10912.
Chaudhry,  Arslan,  Marc’Aurelio  Ranzato,  Marcus  Rohrbach,  and  Mohamed  Elhoseiny  (2019).
Efficient lifelong learning with a-gem.International Conference on Learning Representations.
Chaudhry, Arslan, Marcus Rohrbach, Mohamed Elhoseiny, Thalaiyasingam Ajanthan, Puneet K
Dokania, Philip HS Torr, and Marc’Aurelio Ranzato (2019). Continual learning with tiny episodic
memories.arXiv:1902.10486.
Finn, Chelsea (2018, Aug).Learning to Learn with Gradients.  Ph. D. thesis, EECS Department,
University of California, Berkeley.
Finn, Chelsea, Pieter Abbeel, and Sergey Levine (2017).  Model-agnostic meta-learning for fast
adaptation of deep networks. InInternational Conference on Machine Learning.
French, Robert M (1991). Using semi-distributed representations to overcome catastrophic forgetting
in connectionist networks. InAnnual cognitive science society conference. Erlbaum.
French, Robert M (1999).  Catastrophic forgetting in connectionist networks.Trends in cognitive
sciences.
Kingma,  Diederik  P  and  Jimmy  Ba  (2014).Adam:   A  method  for  stochastic  optimization.
arXiv:1412.6980.
Kirkpatrick, James, Razvan Pascanu, Neil Rabinowitz, Joel Veness, Guillaume Desjardins, Andrei A
Rusu, Kieran Milan, John Quan, Tiago Ramalho, Agnieszka Grabska-Barwinska, et al. (2017).
Overcoming catastrophic forgetting in neural networks.National academy of sciences.
Lake, Brenden M, Ruslan Salakhutdinov, and Joshua B Tenenbaum (2015). Human-level concept
learning through probabilistic program induction.Science.
Lee, Sang-Woo, Jin-Hwa Kim, Jaehyun Jun, Jung-Woo Ha, and Byoung-Tak Zhang (2017). Overcom-
ing catastrophic forgetting by incremental moment matching. InAdvances in Neural Information
## Processing Systems.
Li, Zhizhong and Derek Hoiem (2018). Learning without forgetting.IEEE Transactions on Pattern
Analysis and Machine Intelligence.
Li, Zhenguo, Fengwei Zhou, Fei Chen, and Hang Li (2017). Meta-sgd: Learning to learn quickly for
few-shot learning.arXiv:1707.09835.
Lin, Long-Ji (1992). Self-improving reactive agents based on reinforcement learning, planning and
teaching.Machine learning.
Liu,  Vincent,  Raksha Kumaraswamy,  Lei Le,  and Martha White (2019).   The utility of sparse
representations for control in reinforcement learning.AAAI Conference on Artificial Intelligence.
## 10

Liu, Xialei, Marc Masana, Luis Herranz, Joost Van de Weijer, Antonio M Lopez, and Andrew D
Bagdanov  (2018).   Rotate your  networks:  Better  weight consolidation and  less  catastrophic
forgetting. InInternational Conference on Pattern Recognition.
Lopez-Paz,  David and Marc’Aurelio Ranzato (2017).   Gradient episodic memory for continual
learning. InAdvances in Neural Information Processing Systems.
Metz, Luke, Niru Maheswaranathan, Brian Cheung, and Jascha Sohl-dickstein (2019). Meta-learning
update rules for unsupervised representation learning.International Conference on Learning
## Representations.
Mnih, Volodymyr, Koray Kavukcuoglu, David Silver, Andrei A Rusu, Joel Veness, Marc G Bellemare,
Alex Graves, Martin Riedmiller, Andreas K Fidjeland, Georg Ostrovski, et al. (2015). Human-level
control through deep reinforcement learning.Nature.
Nagabandi, Anusha, Chelsea Finn, and Sergey Levine (2019). Deep online learning via meta-learning:
Continual adaptation for model-based rl.International Conference on Learning Representations.
Rebuffi, Sylvestre-Alvise, Alexander Kolesnikov, Georg Sperl, and Christoph H Lampert (2017).
icarl: Incremental classifier and tation learning. InConference on Computer Vision and Pattern
## Recognition.
Riemer, Matthew, Ignacio Cases, Robert Ajemian, Miao Liu, Irina Rish, Yuhai Tu, and Gerald
Tesauro (2019).  Learning to learn without forgetting by maximizing transfer and minimizing
interference.International Conference on Learning Representations.
Schmidhuber, Jurgen (1987).Evolutionary principles in self-referential learning, or on learning how
to learn. Ph. D. thesis, Institut fur Informatik,Technische Universitat Munchen.
Shin, Hanul, Jung Kwon Lee, Jaehong Kim, and Jiwon Kim (2017). Continual learning with deep
generative replay. InAdvances in Neural Information Processing Systems.
Sutton, Richard (1990). Integrated architectures for learning planning and reacting based on approxi-
mating dynamic programming. InInternational Conference on Machine Learning.
Zenke, Friedemann, Ben Poole, and Surya Ganguli (2017).  Continual learning through synaptic
intelligence. InInternational Conference on Machine Learning.
## 11

## ...
Sample a trajectory
from the stream
## RLN
## PLN
## W
## 0
UseL(Y
i+1
## ,Y
## 0
i+1
## )
toupdateW
## 0
toW
## 1
UseL(Y
i+k
## ,Y
## 0
i+k
## )
toupdateW
k 1
toW
k
## W
## 1
## RLN
## PLN
## RLN
## PLN
## S
test
## =(X
rand
## ,Y
rand
## )
Sample a random
batch of data
## 2
## RLN
## PLN
## ‘
Data stream
## T=(X
## 0
## ,Y
## 0
## ),(X
## 1
## ,Y
## 1
## ),...,(X
k
## ,Y
k
## ),...,(X
n
## ,Y
n
## ),...,
## RLN
## PLN
## W
## 0
## 0
## 4
## 1
## 3
Update RLN and PLN using
gradients from random batch
## ✓
## 0
## ✓
## ✓✓
## ✓
## S
k
## =(X
i+1
## ,Y
i+1
## ),(X
i+2
## ,Y
i+2
## ),...,(X
i+k
## ,Y
i+k
## )
## W
k
## W
k
## X
i+1
## Y
## 0
i+1
## X
i+2
## Y
## 0
i+2
## L(Y
i+1
## ,Y
## 0
i+1
## )
## X
rand
## +
## X
traj
## Y
## 0
rand
## +
## Y
## 0
traj
## L(Y
rand
## +Y
traj
## ,Y
## 0
rand
## +Y
## 0
traj
## )
## Backpropogation
Minimize loss on a random
batch with respect to
initial parameters
Figure 7: Flowchart elucidating a single gradient update for representation learning. (1) We sample
trajectoryS
k
from our stream of data for inner updates in the meta-training, and another trajectory
## S
test
for evaluation. (2) We useS
k
to dokgradient updates on the PLN (Prediction learning network).
(3) We then use this updated network to compute loss on theS
k
## +S
test
and compute gradients for
this loss with respect to the initial parametersθ
## 1
## ,W
## 1
. (4) Finally, we update our initial parameters
θ,W
## 0
toθ
## ′
## ,W
## ′
## 0
## .
Table 3: Parameters for Sinusoidal Regression Experiment
ParameterDescriptionValue
Meta LRLearning rate used for the meta-update1e-4
Meta Update OptimizerOptimizer used for the meta-updateAdam
Inner LRLR used for the inner updates for meta-learning0.003
Inner LR SearchInner LRs tried before picking the best[0.1, 1e-6]
Steps-per-functionNumber of gradient updates for each of the ten tasks40
Inner stepsNumber of inner gradient steps400
Total layersTotal layers in the fully connected NN9
Layer WidthNumber of neurons in each layer300
Non-linearlyNon-linearly usedrelu
RLN LayersNumber of layers used for learning representation6
Pre-training setNumber of functions in the meta-training set400
## Appendix
A  Discussion on the Connection to Few-Shot Meta-Learning
Our approach is different from gradient-based meta-learning in two ways; first, we only update PLN
during the inner updates whereas maml (and other gradient-based meta-learning techniques) update
all the parameters in the inner update. By not updating the initial layers in the inner update, we change
the optimization problem from "finding a model initialization withxyzproperties" to "finding a model
initialization and learning a fixed representation such that starting from the learned representation
it hasxyzproperties." This gives our model freedom to transform the input into a more desirable
representation for the task—such as a sparse representation.
Secondly, we sample trajectories and do correlated updates in the inner updates, and compute the
meta-loss with respect to a batch of data representing the CLP problem at large. This changes the
## 12

Table 4: Parameters for Omniglot Representation Learning
ParameterDescriptionValue
Meta LRLearning rate used for the meta-update1e-4
Meta update optimizerOptimizer used for the meta-updateAdam
Inner LRLR used for the inner updates for meta-learning0.03
Inner LR SearchInner LRs tried before picking the best[0.1, 1e-6]
Inner stepsNumber of inner gradient steps20
Conv-layersTotal convolutional layers6
FC LayersTotal fully connected layers2
RLNLayers in RLN6
KernelSize of the convolutional kernel3x3
Non-linearlyNon-linearly usedrelu
StrideStride for convolution operation in each layer[2,1,2,1,2,2]
# kernelsNumber of convolution kernels in each layer256 each
InputDimension of the input image84 x 84
optimization from "finding an initialization that allows for quick adaptation" (such as in maml Finn
(2018)) to "finding an initialization that minimizes interference and maximizes transfer." Note that
we learn the RLN and the initialization for PLN using a single objective in an end-to-end manner.
We empirically found that having an RLN is extremely important for effective continual learning, and
vanilla maml trained with correlated trajectories performed poorly for online learning.
## B  Reproducing Results
We release our code, and pretrainedOMLmodels for Split-Omniglot and Incremental Sine Waves
available athttps://github.com/Khurramjaved96/mrcl. In addition, we also provide details
of hyper-parameters used from learning the representations of Incremental Sine Waves experiment
and Split-Omniglot in Table 3 and 4 respectively.
For online learning experiments in Figure 3 and 4, we did a sweep over the only hyper-parameter,
learning rate, in the list [0.3, 0.1, 0.03, 0.01, 0.003, 0.001, 0.0003, 0.0001, 0.00003, 0.00001] for each
method on a five validation trajectories and reported result for the best learning rate on 50 random
trajectories.
## B.1  Computing Infrastructure
We learn all representations on a single V100 GPU; even with a deep neural network and meta-updates
involving roll-outs of length up to 400,OMLcan learn representations in less than five hours for both
the regression problem and omniglot experiments. For smaller roll-outs in Omniglot, it is possible
to learn good representations with-in an hour. Note that this is despite the fact that we did not use
batch-normalization layers or skip connections which are known to stabilize and accelerate training.
## C  Representations
We present more samples of the learned representations in Figure 8. We also include the averaged
representation for the best performing SR-NN model (15% instance sparsity) in Figure 10 which was
excluded from Figure 6 due to lack of space.
## 13

## OML
## SR-NN (4.9%)
## SR-NN (15%)
## Pretraining
Figure 8:  More samples of representations for random input images for different methods.  Here
SR-NN (4.9%) is trained to have similar sparsity asOMLwhereas SR-NN (15%) is trained to have
the best performance on Split-Omniglot benchmark.
OML: Learning RLN
OML: Learning an Initialization
Number of classes learned
## Accuracy
## 255075100125150175
## 0.0
## 0.2
## 0.4
## 0.6
## 0.8
## 1.0
## 10
## Omniglot Training Trajectory Performance
Figure 9: Instead of learning an encoderφ
θ
, we learn an initialization by updating bothθandW
in the inner loop of meta-training. In "OMLwithout RLN," we also update both at meta-test time
whereas in "OMLwithout RLN at test time," we fixthetaat meta-test time just like we do forOML.
For each of the methods, we report the training error during meta-testing. It’s clear from the results
that a model initialization is not an effective bias for incremental learning. Interestingly, "OMLwith
RLN at test time" doesn’t do very poorly. However, if we know we’ll be fixingθat meta-test time, it
doesn’t make sense to update it in the inner loop of meta-training (Since we’d want the inner loop
setting to be as similar to meta-test setting as possible.
Figure 10: Average activation map for the best performing SR-NN with 15% sparsity. Scale goes
from 0 to max (Light to dark green.)
## 14

Algorithm 3:Meta-Training : Approximate Implementation of the OML Objective
Require:p(T): distribution over tasks
Require:α,β: step size hyperparameters
Require:m: No of inner gradient steps per update before truncation
1:randomly initializeθ,W
2:whilenot donedo
3:Sample taskT
i
∼p(T)
4:SampleS
i
train
fromp(S
k
## |T
i
## )
## 5:W
## 0
## =W
## 6:∇
accum
## =0
7:whilej≤|S
train
## |do
## 8:forkin1,2,...,mdo
## 9:W
j
## =W
j−1
## −α∇
## W
j−1
## `
i
## (f
θ,W
j−1
## (X
i
j
## ),Y
i
j
## )
## 10:j=j+ 1
11:end for
12:SampleS
i
test
fromp(S
k
## |T
i
## )
## 13:θ=θ+∇
θ
## `
i
## (f
θ,W
j
## [S
test
[0 :j,0]],S
i
test
## [0 :j,1])
14:Stop Gradients(f
θ,W
j
## ))
15:end while
16:end while
C.1  Why Learn an Encoder Instead of an Initialization
We empirically found that learning an encoder results in significantly better performance than learning
just an initialization as shown in Fig 9. Moreover, the meta-learning optimization problem is more
well-behaved when learning an encoder (Less sensitive to hyper-parameters and converges faster).
One explanation for this difference is that a global and greedy update algorithm – such as gradient
descent – will greedily change the weights of the initial layers of the neural network with respect
to current samples when learning on a highly correlated stream of data. Such changes in the initial
layers will interfere with the past knowledge of the model. As a consequence, an initialization is not
an effective inductive bias for incremental learning. When learning an encoderφ
θ
, on the other hand,
it is possible for the neural network to learn highly sparse representations which make the update less
global (Since weights connecting to features that are zero remain unchanged).
## 15