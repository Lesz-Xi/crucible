

arXiv:2103.11990v1  [math.CO]  22 Mar 2021
A Markov chain on the solution space of edge-colorings of bipartite graphs
## Letong Hong
a
## , Istv ́an Mikl ́os
b,c
a
Department of Mathematics, Massachusetts Institute of Technology
email:clhong@mit.edu
b
Alfr ́ed R ́enyi Institute of Mathematics, E ̈otv ̈os Lor ́andResearch Network
email:miklos.istvan@renyi.hu
c
Institute for Computer Science and Control (SZTAKI), E ̈otv ̈os Lor ́and Research Network
## Abstract
In this paper, we exhibit an irreducible Markov chainMon the edgek-colorings of bipartite graphs
based on certain properties of the solution space. We show that diameter of this Markov chain grows
linearly with the number of edges in the graph. We also prove apolynomial upper bound on the
inverse of acceptance ratio of the Metropolis-Hastings algorithm when the algorithm is applied onM
with the uniform distribution of all possible edgek-colorings ofG. A special case of our results is the
solution space of the possible completions of Latin rectangles.
Keywords:Edge Colorings, Latin Squares, MCMC, Metropolis-HastingsAlgorithm
## 1. Introduction
The edgek-coloring problem asks if there is a coloringC:E→ {c
## 1
, c
## 2
, . . . , c
k
}of a simple graph
G= (V, E) such that for any adjacent edgese
## 1
ande
## 2
,C(e
## 1
)6=C(e
## 2
). In this paper, we consider
the solution space of the edgek-coloring problem of bipartite graphs.  Edge colorings of bipartite
graphs have a variety of applications: the round-robin tournament [
2,21], where the two vertex sets
correspond to players from two parties, the pre-determinededges correspond to different kinds of
games, and the edge colors correspond to index of the round; the open shop scheduling problem [25],
where one vertex set corresponds to the list of objects to be manufactured and the other corresponds
to the machines, the edges correspond to existing tasks, andthe edge colors correspond to distinct
categories of tasks; the path coloring problem in fiber-optic communication [
5], where edges correspond
to pairs of nodes (belonging to two channels) with communication needs and edge colors correspond
to frequency of light, under the restriction that no two paths that share a common piece of fiber can
use the same frequency, to prevent interference.
In general, the edgek-coloring problem is NP-complete [
7]. It remains NP-complete if the problem
is restricted to edge 3-coloring of 3-regular simple graphs[
7], and this hardness result has been extended
to edger-coloring ofr-regular graphs for allr≥3 [
## 14].
By Vizing’s theorem [
23], every graph is edgek-colorable withk≥∆ + 1 colors, where ∆ is the
maximum degree of the graph. Vizing also proved that planar graphs with ∆≥8 are edge ∆-colorable
[24]. Sanders and Zhao [20] showed that planar graphs with ∆ = 7 are also edge 7-colorable. For cubic
planar graphs, it can be decided in polynomial time if they are edge 3-colorable or edge 4-colorable
[22,19]. The optimal edge coloring of planar graphs with 4≤∆≤6 remains an open question.
Based on the theorem of K ̈onig [
12], every bipartite graph is edge ∆-colorable. Efficient algorithms
exists for finding such an edge ∆-coloring in bipartite graphs [
## 4,11].
Preprint submitted to ElsevierMarch 23, 2021

Although efficient algorithms exist for finding one particular solution, such a solution might have a
bias inherited from the construction algorithm. In that case, one one would like to generate a random
solution uniformly. Finding a random completion of a Latin rectangle might also be needed in partially
redesigning an experimental design [
13]. Sampling completions of Latin rectangles is also necessary to
give good stochastic estimations on the number of Latin squares of a given size [
## 1].
Sampling and counting are related problems. For many counting problems, approximate counting
and approximate uniform sampling have the same computational complexity [10].  Therefore it is
natural to consider the problem of counting the solutions tothe edgek-coloring problem. It is easy to
develop a dynamic programming algorithm to compute how manyedgek-colorings are there in a graph
with ∆≤2. On the other hand, computing the number of edgek-colorings forr-regular planar graphs
is #P-complete for allk≥r≥3 [3]. The complexity of counting edge colorings of bipartite graphs
remains open, although it is natural to conjecture that thiscounting problem is hard for bipartite
graphs, too. Indeed, there is no known easily computable formula even for a very specific case, the
number of Latin squares, which can be considered as edgen-colorings of the complete bipartite graph
## K
n,n
## .
Even when the exact counting of combinatorial objects is proven to be #P-complete, there might
be efficient algorithms to approximate the number of such objects [
9,18]. Therefore, it is natural
to consider approximate sampling of solutions to the edgek-coloring problem. Markov chain Monte
Carlo methods [17,6] have been widely used for approximate sampling [9,18].
In the Markov chain Monte Carlo framework, a Markov chain is designed that converges to the
uniform distribution of the combinatorial objects. The standard way is to use the Metropolis-Hastings
algorithm [
17,6], which tailors a primary Markov chain to another one converging to a prescribed
equilibrium distribution. In each step of the Metropolis-Hastings algorithm, a new state of the Markov
chain is proposed from the current state based on the primaryMarkov chain. This proposed state
is accepted with a probability computed from the desired equilibrium distribution and the transition
probabilities of the primary Markov chain. Such a Markov chain can be efficiently used for approximate
sampling if the convergence time grows only polynomially with the size of the problem instance.
Jacobson and Matthews introduced a Markov chain that converges to the uniform distribution
of Latin squares [
8]. Although it is conjectured that the Jacobson-Matthew Markov chain is rapidly
mixing, it is not proved yet. A Markov chain similar to the Jacobson-Matthew Markov chain was
developed by Aksenet al.[1] that converges to the uniform distribution on the half-regular factor-
izations of complete bipartite graphs. Both Markov chains have large perturbations. That is, in the
Jacobson-Matthew Markov chain, three not necessarily consecutive rows of a Latin square are changed
at each step to get a new Latin square. Furthermore, the number of entries that might be changed in
these three rows are not bounded. Similarly, the Markov chain developed by Aksenet al.changes the
color of edges incident to three vertices in one vertex classand an unbounded number of vertices on the
other vertex class. Examples are known when the large perturbations cause small acceptance ratios
in the Metropolis-Hastings algorithm and thus torpid mixing of the Markov chain [
16]. However, it is
proved that the inverse of the acceptance ratio is upper bounded by a polynomial of the size of the
problem instance both in case of the Jakobson-Matthew Markov chain and in case of the Markov chain
developed by Aksenet al.Furthermore, small diameter is proved for both Markov chains. Although
these properties do not guarantee rapid mixing, they strengthen the conjecture of rapid mixing.
In this paper, we give perturbations that are sufficient to transform any edgek-coloring of a
bipartite graphG= (V, E) to another edgek-coloring of the same graph. These transformations can
be the transition kernels of a Markov chain, and in fact, we construct such a Markov chain,M(G, k),
## 2

on which the following properties are proved.
(a) The diameter ofM(G, k) grows only linearly with|E|. More specifically, 6|E|perturbations are
sufficient to transform any edge coloring ofGto any another one.
(b) When the Metorpolis-Hastings algorithm is applied onM(G, k) to converge to the uniform
distribution of edgek-colorings ofG, the inverse of the acceptance ratio is upper bounded by a
polynomial of the number of vertices inG. More specifically, the inverse of the acceptance ratio
is upper bounded by 96|V|
## 2
## (|V| −1).
The main contribution of our paper is to show that the perturbations invented by Jacobson and
Matthew for the regular, 1-factorization of the complete bipartite graphs then improved by Aksenet
al. for the half regular factorizations of the complete bipartite graph can be extended to non-regular
and non-complete bipartite graphs.
A special case of our results is the completions of Latin rectangles or equivalently, the edgek-
coloring ofk-regular bipartite graphs. In that special case, we can prove better results on both the
diameter and on the upper bound of the inverse of the acceptance rate. Particularly, the diameter is
upper bounded by 3|E|, and the inverse of the acceptance ratio is upper bounded by 16|V|(|V| −1).
The paper is organized as follows. In Section
2, we introduce basic definitions and propositions
related to edge colorings and Markov chain Monte Carlo, in particular the Metropolis-Hastings algo-
rithm. In Section3, we then explicitly construct the chainMon the solution space of edge colorings
of bipartite graphs and prove our main theorem thatMhas the properties described above. Finally
we dedicate Section
4to apply our result to completion of Latin rectangles.
## 2. Preliminaries
In this section, we introduce the almost edgek-colorings and an imprtant lemma on them. We
also give a short description to the Metropolis-Hastings algorithm.
2.1. Almost edgek-colorings
We define formally edgek-colorings and almost edgek-colorings:
Definition 2.1.Anedgek-coloringof a graphG= (V, E) is a mapC:E(G)→ {c
## 1
, c
## 2
, . . . , c
k
## }such
that there is no adjacent monochromatic edges.
In a mapC:E(G)→ {c
## 1
, c
## 2
, . . . , c
k
}, a vertexv∈Vhas a (+c−c
## ′
)-deficiencyif there are exactly
twocedges incident tov, all other incident edges have different colors, and there is noc
## ′
edge incident
tov.
Analmost edgek-coloringofG= (V, E) is a mapC:E(G)→ {c
## 1
, c
## 2
, . . . , c
k
}such that at most
two vertices have deficiency and all other vertices have no adjacent monochromatic edges.
## Ifc∈ {c
## 1
, c
## 2
, . . . , c
k
}andCis a coloring ofGthenG
## ∣
## ∣
## C,c
is the subgraph that contains only the
edges colored byc.
Observe that a deficient vertex in an almost edgek-coloring might have both (+c−c
## ′
## )-deficiency
and (+c−c
## ′′
)-deficiency for some colorsc
## ′
## 6=c
## ′′
if the degree of the vertex is smaller thank.
We show how to transform almost edgek-colorings to edgek-colorings.
## 3

Lemma 2.1.LetCbe an almost edgek-coloring of a bipartite graphGwith one or two deficient
vertices.  ThenCcan be transformed to an edgek-coloring by flipping colors along at most two
alternating walks with some colorscandc
## ′
## .
Proof.Letv
## 1
be a (+c−c
## ′
)-deficient vertex, and leteandfbe its incident edges with colorc. Consider
the longest alternating walk with colorscandc
## ′
that containse. We claim that this walk is a path
or a walk that ends in the second visit of the other deficient vertex. Particularly, it cannot return to
v
## 1
. Indeed, returning to any vertex other thanv
## 1
would mean a deficient vertex. However, abovev
## 1
## ,
there is at most one more deficient vertex,v
## 2
. If the walk returns tov
## 2
, then lete
## 1
be the edge with
which the walk arrives at the first visit ofv
## 2
, and lete
## 2
be the edge with which the walk arrives at
the second visit ofv
## 2
. We claim thate
## 1
ande
## 2
has the same color since the graph is bipartite.
Also, this walk cannot return tov
## 1
. It could be only with ac-edge, however, this would mean an
odd cycle, which is a contradiction in a bipartite graph.
Therefore, if this longest alternating walk is a path, that starts with edgee, and ends in a vertex
either with ac-edge, and then this end vertex does not have an incidentc
## ′
edge or ends in a vertex
with ac
## ′
edge, and then this end vertex does not have acedge. By flipping the colors along this path,
the (+c−c
## ′
)-deficiency ofv
## 1
is eliminated, and no new deficiency is introduced.
If this longest alternating walk ends at the first visit of theother deficient vertex,v
## 2
, thenv
## 2
has
either (+c−c
## ′
) or (+c
## ′
−c) deficiency. By flipping the colors along this path, both the (+c−c
## ′
## )-
deficiency ofv
## 1
an the deficiency ofv
## 2
are eliminated, and no new deficiency is introduced.
If this longest alternating walk ends at the second visit ofv
## 2
, then flipping the colors along this
walk eliminates the (+c−c
## ′
)-deficiency ofv
## 1
, changes the type of deficiency ofv
## 2
from (+c−c
## ′′
) to
## (+c
## ′
## −c
## ′′
) or from (+c
## ′
## −c
## ′′
) to (+c−c
## ′′
), and does not create any new deficiency.
If there is one more deficient vertex remaining, do the same procedure with it.
2.2. Markov chain Monte Carlo
In the Markov chain Monte Carlo framework, a Markov chain is designed that converges to the
uniform distribution of the combinatorial objects. The standard way is to use the Metropolis-Hastings
algorithm [
17,6], which tailors a primary Markov chain to another one converging to a prescribed
equilibrium distribution. First we define the Markov chains, then the Metropolis-Hastings algorithm.
Definition 2.2.Adiscrete time, finite Markov chainX= (X
## 0
## , X
## 1
, . . .) is a sequence of random
variables taking values on a finite state spaceS, such thatX
n
depends on onlyX
n−1
. That is, for all
m≥0 and all possible sequencei
## 0
, i
## 1
, . . . , i
m+1
## ∈S
m+2
## ,
## P(X
m+1
## =i
m+1
## |X
## 0
## =i
## 0
## , . . . X
m
## =i
m
## ) =P(X
m+1
## =i
m+1
## |X
m
## =i
m
## ).
For sake of simplicity, we will writeP(i
m+1
## |i
m
) instead ofP(X
m+1
## =i
m+1
## |X
m
## =i
m
## ).
AnirreducibleMarkov chain is a Markov chain with only one communicating class, i.e. for any
two statesi, j∈S, the probability of getting fromitojand fromjtoi(in multiple steps) are both
positive.
A Markov chain isaperiodicif all its statesi∈Ssatisfy that
d
i
:= gcd{t≥1|p
## (t)
ii
=P(getting fromito itself viatsteps)>0}= 1,
where gcd stands for greatest common divisor.
## 4

A standard technique to make a Markov chain aperiodic is to haveP(i|i)6= 0 for all statesi.
Frequently,P(i|i) is set at least
## 1
## 2
. Such a Markov chain is calledLazy Markov chain[
## 9,18]. The
spectral analysis of Lazy Markov chains is technically simpler.
Definition 2.3.For a Markov chain that converges to an equilibrium distributionπ, it satisfies the
detailed balance equation,π(i)P(j|i) =π(j)P(i|j).
TheMarkov chain Monte Carlo(MCMC) method is a class of algorithms that achieves the goalof
sampling from a probability distribution. One typical example is the Metropolis-Hastings algorithm
## [
6,17], described below.
Definition 2.4.TheMetropolis-Hastingsalgorithm takes a Markov chain on a state spaceXand
transforms it into another one.
For a given functiong:X→R
## >0
, and an irreducible, aperiodic Markov chain with transition
probabilities such that for all pair of statesx, y∈Xit holds thatP(y|x)6= 0⇒P(x|y)6= 0, a new
Markov chain is constructed on the same state space. The statex
i
is defined based onx
i−1
in the
following steps.
- Propose a candidateyfor the next sampley∼P(·|x
i−1
), where∼stands for “following distri-
bution”.
- Generate a random numberu∼U(0,1), whereU(0,1) is the uniform distribution on the [0,1]
interval.
- The proposed stateyisaccepted, that is,x
i
## =yifu≤
g(y)P(x
i−1
## |y)
g(x
i−1
)P(y|x
i−1
## )
. Otherwise the proposed
state isrejected, that is,x
i
## =x
i−1
## .
Observe that the probability of accepting a proposed stateyis
min
## {
## 1,
g(y)P(x|y)
g(x)P(y|x)
## }
## .
The fraction
g(y)P(x|y)
g(x)P(y|x)
is called theMetropolis-Hastings ratio, and the probability is calledacceptance
probability.
It is easy to prove that the Markov chain defined by the Metropolis-Hastings algorithm is irre-
ducible, aperiodic, and reversible with respect toπ, the probability distribution obtained aftergis
normalized, and thus, it converges to distributionπstarting in an arbitrary state [
9,18]. A variant
of the Metropolis-Hastings algorithm is when for each pair of statesxandy, there are several ways
to transformxtoy:W={w
## 1
, w
## 2
, . . . , w
t
}, and there is a one-to-one mapping fromWto the set
## W
## ′
## ={w
## ′
## 1
, w
## ′
## 2
, . . . , w
## ′
t
}, the possible ways to transformyback tox. Then the Metropolis-Hastings
ratio can be changed to
g(y)P(x, w
## ′
i
## |y)
g(x)P(y, w
i
## |x)
whenyis proposed fromxvia the wayw
i
.  HereP(y, w
i
|x) is the probability thatyis proposed
fromxvia wayw
i
.  It can be proved that the so-obtained Markov chain still converges toπ, the
probability distribution obtained aftergis normalized [
15]. In this paper, we will use this variant of
the Metropolis-Hastings algorithm.
Such a Markov chain can be efficiently used for approximate sampling if the convergence time
grows only polynomially with the size of the problem instance.
## 5

- A Markov chain Monte Carlo on edgek-colorings of a bipartite graph
Below we define a Markov chain on the edgek-colorings of a bipartite graphG= (V, E). We are
going to prove that this Markov chain is irreducible, its diameter is at most 6|E|, and when applied
in a Metropolis-Hastings algorithm, the inverse of the acceptance ratio is upper bounded by a cubic
function of|V|.
Definition 3.1.LetGbe a bipartite graph, and letk≥∆, where ∆ is the maximum degree ofG.
We define a Markov chainM(G, k) on the edgek-colorings ofG. Let the current coloring beC. Then
draw a random edgek-coloring in the following way.
- With probability
## 1
## 2
, do nothing (so the defined Markov chain is a Lazy Markov chain).
- With probability
## 1
## 4
, select two colorscandc
## ′
from the set of colors uniformly among the
## (
k
## 2
## )
possible unordered pairs. Consider the subgraph ofGwith colorscandc
## ′
; let it be denoted by
H. Its non-trivial components are paths and cycles. Then select one of the following:
(a) With probability
## 1
## 3
, do nothing.
(b) With probability
## 1
## 3
, uniformly select a sub-path or a cycle ofHfrom all subpaths and cycles
inH.
(c) With probability
## 1
## 3
, uniformly select two sub-paths ofHfrom all possible pair of sub-paths
such that both of them have exactly one end vertex which is also an end vertex inH.
Flip the colors in the selected subpaths.  If there is any deficient vertex, select one of them
uniformly, then select one of the edges with the same color incident to the selected vertex
uniformly and change its color fromctoc
## ′
orc
## ′
toc. We denote this subcase byi)for reference.
Otherwise, with
## 1
## 2
probability, select either ac-edge or ac
## ′
-edge uniformly from all edges with
colorcandc
## ′
, and change its color to the opposite (c
## ′
orc) (we denote this subcase byii)for
reference) and with
## 1
## 2
probability, do nothing. Eliminate all deficiency by flipping the colors on
appropriate alternating path, selecting uniformly from the two neighbor edges with the same
color incident to deficient vertices.
- With probability
## 1
## 4
select three colors uniformly from the all possible
## (
k
## 3
## )
unordered pairs, and
select uniformly one from the three colors. Let the distinguished color be denoted byc
## ′′
, and
let the other two colors be denoted bycandc
## ′
. Consider the subgraph consisting of the colors
candc
## ′
; let it be denoted byH. Its non-trivial components are paths and cycles. Then select
one of the following:
(a) With probability
## 1
## 3
, do nothing.
(b) With probability
## 1
## 3
, uniformly select a sub-path ofHfrom all subpaths such that at least
one of its end vertices is not an end vertex inH.
(c) With probability
## 1
## 3
, uniformly select two sub-paths ofHfrom all possible pair of sub-paths
such that both of them has exactly one end vertex which is alsoan end vertex inH.
Flip the colors in the selected subpaths. If there are two deficient vertices, select one of them
uniformly.  If there is only one deficient vertex, then with probability
## 1
## 2
select it, and with
probability
## 1
## 2
, select uniformly a non-deficient vertex among those which are incident to both a
## 6

c
## ′′
edge and at least one of acor ac
## ′
edge. If there is no deficient vertex, then select uniformly
a non-deficient vertex among those which are incident to bothac
## ′′
edge and at least one of ac
or ac
## ′
edge.
If a deficient vertex is selected, select uniformly one of theedges with the same color incident to
the selected vertex, and let this color be denoted by  ̃c. Consider the maximal alternating path or
cycle with colors  ̃candc
## ′′
that contains the selected edge. Flip the colors in this pathor cycle.
We denote this subcase byiii)for reference.
If a non-deficient vertex is selected, let its incident edge with colorc
## ′′
be denoted byeand the
incident edge with colorcorc
## ′
be denoted byf, and let this latter edge’s color be denoted by  ̃c.
If there are edges with colorcorc
## ′
, select one of them uniformly. Take the maximal alternating
path with colorsc
## ′′
and  ̃cthat containsebut does not containf. Flip the colors in this path.
We denote this subcase byiv)for reference.
Eliminate all deficiency by flipping the colors on appropriate alternating path, selecting uniformly
from the two neighbor edges with the same color incident to deficient vertices.
First we prove thatM(G, k) is irreducible and has a small diameter. That is, the perturbations
presented in it are sufficient to transform any edgek-coloringC
## 1
to another edgek-coloringC
## 2
of a
bipartite graphG= (V, E) in at most 6|E|steps. Our strategy is the following:
- Fix an order of colors appearing inC
## 2
## :c
## 1
, c
## 2
, . . . , c
l
. We will have thatC
## 1
is transformed via
milestone realizationsC
## 1
## =K
## 0
## , K
## 1
## , K
## 2
## , . . . , K
l−1
## =C
## 2
such that for eachi= 1,2, . . . l−2 and
eachj≤i,G
## ∣
## ∣
## K
i
## ,c
j
## =G
## ∣
## ∣
## C
## 2
## ,c
j
. Furthermore, whenK
i
is transformed intoK
i+1
, no edge with
colorc
## 1
, c
## 2
, . . . , c
i
changes color. TheseK
i
are calledlarge milestones.
- For eachi= 1,2, . . . l−2 we considerH
i
## :=G
## ∣
## ∣
## K
i−1
## ,c
i
## ⊕
## G
## ∣
## ∣
## C
## 2
## ,c
i
where
## ⊕
denotes the symmet-
ric difference. The maximal degree inH
i
is 2, thereforeH
i
can be decomposed into isolated
vertices, paths and cycles.  Let the non-trivial componentsofH
i
be ordered and denoted by
## N
## 1
## , N
## 2
## , . . . , N
m
## .K
i−1
is transformed intoK
i
via milestonesK
i−1
## =L
## 0
## , L
## 1
## , . . . L
m
## =K
i
such
that for allj,L
j
contains colorc
i
only inH
i
, and (G
## ∣
## ∣
## L
j
## ,c
i
## ⊕
## G
## ∣
## ∣
## K
i
## ,c
i
## )∩(N
## 1
## ∪N
## 2
## ∪. . .∪N
j
) is the
empty graph. That is,L
j
andK
i
agrees in colorc
i
on the firstjnon-trivial components ofH
i
## .
TheseL
i
are calledsmall milestones. The last transition fromK
l−2
toK
l−1
## =C
## 2
is handled in
a separate way.
- For eachj= 1,2, . . . , m, the transformation fromL
j−1
toL
j
goes in the following way. In the
description of transformations, we use almost edge colorings (see Definition
2.1), in which at
most two vertices are incident to two edges with the same color. First we give a transforma-
tion via such almost edge coloringsA
## 1
## , A
## 2
,· · ·using transformationsf
## 1
, f
## 2
,· · ·. Then we show
how to transform these almost edge colorings to edge coloringsX
## 1
## , X
## 2
,· · ·using transforma-
tionsφ
## 1
, φ
## 2
,· · ·. The transformation between edge coloringsX
t
andX
t+1
is the composition of
transformationsφ
t+1
## ◦f
t+1
## ◦φ
## −1
t
(see also Figures
## 1and2).
- TransformingK
l−2
toC
## 2
is done in the following way. ConsiderH=G
## ∣
## ∣
## K
l−2
## ,c
l−1
## ⊕
## G
## ∣
## ∣
## C
## 2
## ,c
l−1
## .
The non-trivial components ofHare paths and cycles, each of which is colored alternately with
colorsc
l−2
and non-c
l−2
inK
l−2
. For each component, we change the non-c
l−2
colors toc
l−1
and then flip the colors of the edges. This transformsK
l−2
toC
## 2
## .
## 7

## L
j−1
## A
## 1
## A
## 2
## · · · · · ·A
e−2
## A
e−1
## L
j
## X
## 1
## X
## 2
## · · · · · ·X
e−2
## X
e−1
f
## 1
f
## 2
φ
## 1
φ
## 2
f
## 3
f
e−2
f
e−1
φ
e−2
f
e
φ
e−1
φ
## −1
## 1
φ
## −1
## 2
φ
## −1
e−2
φ
## −1
e−1
Figure 1: The transformation between two small milestones.See text for details.
The precise description of the transformations fromL
j−1
toL
j
is given by the following lemma
and by Lemma
## 2.1.
Lemma 3.1.LetLbe an edge coloring of a bipartite graphGwithk≥3 colors, and letNbe a
connected subgraph ofGwith maximal degree 2 andsedges. Assume that there exists a colorcsuch
that the colors of the edges inNare alternatelycand non-c. We further assume that for a pathN, if
any of its end edges has a non-ccolor thenNcannot be extended with acedge, and if any of the end
edges has colorcthen that vertex has degree less thank. ThenLcan be transformed into an edge
coloringL
## ′
in at most
## ⌈
## 3
## 2
s
## ⌉
steps such thatG
## ∣
## ∣
## L,c
## ⊕
## G
## ∣
## ∣
## L
## ′
## ,c
=Nwith the condition below: there exists
a colorc
## ′
satisfying that at each step, one of the following transformation is performed:
- Changing the color of an edge fromcto somec
## ′
## .
- Changing the color of an edge from somec
## ′
toc.
- In a maximal path or a cycle containing edges alternately colored byc
## ′
andc
## ′′
for some colors
c
## ′
, c
## ′′
6=c, flipping the color of each edge fromc
## ′
toc
## ′′
and vice versa.
Furthermore, at each step, the so-obtained perturbation gives an almost edge coloring.
Before we prove Lemma
3.1, we give an example illustrated on the left hand side in Figure2. In
this example, an edge coloringLis transformed into an edge coloringL
## ′
via almost edge colorings in
five steps. The componentNis a 4-cycle of alternating red and non-red edges, labeled bye
## 1
## ,e
## 2
## ,e
## 3
## ,
ande
## 4
. First the color ofe
## 1
is changed from blue to red. Then the color ofe
## 2
is changed from red
to blue. Then colors of the edges in the alternating cycle of blue and green edges containinge
## 3
are
flipped. Then the color ofe
## 3
is changed from blue to red. Finally the color ofe
## 4
is changed from red
to blue.
Proof of Lemma
3.1.Nis either a path or a cycle. In both cases, the colors of its edges alternate
betweencand non-cinL. Order the vertices ofNby traveling around a cycle or from one to the
another end for a path. Start the walk along the cycle by a non-cedge or from the end with a non-c
edge if such end exists in the path. In both cases, let color ofthe non-cedge be thec
## ′
stated in the
lemma. Otherwise start with acedge. In this case, letc
## ′
be a color that is not among the colors of
those edges incident to the end vertex. Let the vertices along the walk be denoted byv
## 1
, v
## 2
, . . . , v
s
## .
These transformations are applied in the following way: If (v
## 1
, v
## 2
) has colorc
## ′
, then the first step
is to change it toc. In all other cases, the first step is to change the color of (v
## 1
, v
## 2
) fromctoc
## ′
## . Then
we consider the edges along the walk one by one, and change their colors in one step if the color of
the current edge iscand in at most two steps otherwise. If the color of the currentedge isc, the next
step is to change it toc
## ′
. If the color of the current edge isc
## ′
, then the next step is to change it to
c. If the color of the current edgeeis somec
## ′′
6=c, c
## ′
, then first we consider the maximal alternating
## 8

## LN
e
## 1
e
## 2
e
## 3
e
## 4
f
## 1
φ
## 1
## ◦f
## 1
## A
## 1
φ
## 1
## X
## 1
## A
## 2
## X
## 2
f
## 2
φ
## 2
φ
## 2
## ◦f
## 2
## ◦φ
## −1
## 1
## A
## 3
## X
## 3
f
## 3
φ
## 3
φ
## 3
## ◦f
## 3
## ◦φ
## −1
## 2
## A
## 4
## X
## 4
f
## 4
φ
## 4
φ
## 4
## ◦f
## 4
## ◦φ
## −1
## 3
f
## 5
f
## 5
## ◦φ
## −1
## 4
## L
## ′
Figure 2: Transformation of the edge coloringLto the edge coloringL
## ′
. See text for details.
## 9

path or alternating cycle with colorsc
## ′
andc
## ′′
containingeand not containing the previous edge in
Nand flip the colors of the edges of this path or cycle. After this step,ehas colorc
## ′
, so the next step
is to change this color toc.
We claim that along these transformations, we have almost edgek-colorings for some colorscand
c
## ′
## .
Indeed, ifNis a cycle, then the first transformation creates two (+c−c
## ′
)-deficient vertices. If
Nis a path, and its first edge has colorc
## ′
, then the first transformation creates a (+c−c
## ′
## )-deficient
vertex. Indeed, observe thatv
## 1
is not incident to acvertex by the condition in the lemma. IfN
j
is a
path, and its first edge has colorc, then the first transformation creates at most one (+c
## ′
## −c)-deficient
vertex (in case whenv
## 2
has an incidentc
## ′
edge before the transformation).
If the current edgee= (v
l
, v
l+1
) has colorc, then vertexv
l
has a (+c−c
## ′
) deficiency. By changing
the color ofefromctoc
## ′
, we eliminate this deficiency. However, we might create a new, (+c
## ′
## −c)-
deficiency for vertexv
l+1
if it has an incidentc
## ′
edge before the transformation. If the edge (v
l+1
, v
l+2
## )
does not have colorc
## ′
, then its color is somec
## ′′
. Find the longest alternating path or cycle with colors
c
## ′
andc
## ′′
containing (v
l+1
, v
l+2
) but not containing (v
l
, v
l+1
) and flip the colors in it. After this step,
v
l+1
has a (+c
## ′
−c)-deficiency. Now comes changing the color of the edge (v
l+1
, v
l+2
) fromc
## ′
toc,
that eliminates the deficiency ofv
l+1
and creates a (+c−c
## ′
) deficiency forv
l+2
## .
This eliminating a deficiency and creating a new one continues until we get back tov
## 1
in the cycle
or to the other end of the path.
IfNis a cycle, in the last step or possibly in the last but one stepwe change the color of (v
s
, v
## 1
## )
fromctoc
## ′
. This eliminates the (+c−c
## ′
)-deficiency of both vertexv
s
and vertexv
## 1
ifv
## 1
still has
deficiency (+c−c
## ′
## ). Ifv
## 1
changed the type of deficiency from (+c−c
## ′
) to some (+c−c
## ′′
) because in
one of the steps, a maximal alternating path with colorsc
## ′
andc
## ′′
ended inv
## 1
, then flipping the color
of (v
s
, v
## 1
) fromctoc
## ′
changes the type of deficiency ofv
## 1
from (+c−c
## ′′
) to (+c
## ′
## −c
## ′′
). Then consider
a longest alternating path with colorsc
## ′
andc
## ′′
starting inv
## 1
, and flip the colors in it. This eliminates
the deficiency ofv
## 1
## .
IfNis a path, then the last step is to change the color of (v
s−1
, v
s
) fromc
## ′
tocor possibly the
last but one step is to change the color of (v
s−1
, v
s
) fromctoc
## ′
. This eliminates the deficiency of
v
s−1
and possibly creates a new (+c
## ′
−c)-deficiency forv
s
, if it has an incidentc
## ′
edge before the
step in question. In that case, there exists ac
## ′′
color, such thatv
s
is not incident to any edge with
c
## ′′
color. Consider the longest alternating path with colorsc
## ′
andc
## ′′
containing edge (v
s−1
, v
s
## ). Such
an alternating path exists sinceGis a bipartite graph. Indeed, an alternating path could return tov
s
after even number of steps, which would mean an edge with colorc
## ′′
## . However,v
s
does not incident
to an edge with colorc
## ′′
. Flip the colors in this path; this eliminates the deficiencyofv
s
## .
Every second edge can be transformed in one step, and every other edge can be transformed in at
most two steps, furthermore, the first edge can be transformed in one step, and the last in at most
two steps, therefore the number of steps is indeed at most
## ⌈
## 3
## 2
s
## ⌉
steps.
## N
j
is a non-trivial component ofH
i
, and thus either it is a path or a cycle. In both cases, the
color of its edges alternate betweenc
j
and non-c
j
inL
j−1
. If it is a path and any of the end edges
has a non-c
j
color, then it cannot be extended by ac
j
edge. If any of the end edges has colorc
j
, then
its end vertex is not incident to ac
j
edge inC
## 2
, thus its degree is smaller thank. Furthermore, the
number of colors is at least 3, therefore, Lemma
3.1can be applied to transformL
j−1
toL
j
by setting
NtoN
j
and the colorctoc
j
## .
We are ready to state and prove the theorem on irreducibilityand small diameter.
## 10

Theorem 3.1.LetC
## 1
andC
## 2
be two edgek-colorings of the same bipartite graphG= (V, E). Then
## C
## 1
can be transformed intoC
## 2
in at most6|E|steps in the Markov chainM(G, k).
Proof.First we show that these transformations are sufficient, thenwe prove the upper bound on the
number of necessary transformations.
Observe that fromK
## 0
toK
l−2
, any large milestone is also a small milestone. Therefore itis enough
to show that the listed perturbations are sufficient to transform one small milestone to the next small
milestone and they are sufficient to transformK
l−2
toK
l−1
. Observe that the listed perturbations
contains the case when the colors are flipped along a maximal alternating path or cycle. Indeed, in case
(2)(b) in Definition3.1, a maximal sub-path or a cycle can also be selected. These transformations
are sufficient to transformK
l−2
toK
l−1
## .
Any step between two small milestones is a transformation inthe formφ
t+1
## ◦f
t+1
## ◦φ
## −1
t
orφ
## 1
## ◦f
## 1
orf
e
## ◦φ
## −1
e−1
, whereφis a transformation given in Lemma
2.1andfis a transformation given in
## Lemma
3.1(see also Figures1and2.). A transformationφcorrects the deficiency of at most two
vertices by flipping the edges along at most two maximal alternating paths. Therefore, its inverse
creates at most two deficiencies along at most two alternating paths, and these deficiencies appear
at the end of the path that could be extended. With some probability, no deficiency is created, thus
providing the transformations of typeφ
## 1
## ◦f
## 1
## .
A transformationfachieves the following:
i) changes the color of an edge which is adjacent to an edge with the same color. This happens
when the color of an edge is changed fromctoc
## ′
or fromc
## ′
toc, and the previous edge in
componentNdescribed in the proof of Lemma
3.1has also colorcorc
## ′
, or
ii) changes the color of an arbitrary edge if there is no deficient vertex. This happens in the first
step of transforming componentNas described in the proof of Lemma3.1, or
iii) flips the colors along a maximal alternating path or cycle in which one of the vertices is deficient
with one of the colors in the alternating path or cycle. This happens when the current edgee
(as described in the proof of Lemma
3.1) has colorc
## ′′
and is adjacent to two edges with colors
c
## ′
, or
iv) flips the colors along an alternating path thus creating exactly one deficient vertex. This happens
when the current edgee(as described in the proof of Lemma
3.1) has colorc
## ′′
, and the only
adjacent edge with colorc
## ′
is the previous edge in componentN.
These are exactly the four subcases given in Definition3.1.
Finally, the transformationφ
t+1
eliminates all the deficiencies, if such deficiencies exist.
In each subgraphH
i
, in each non-trivial component at least one third of the edges have colorc
i
inC
## 2
. Therefore, the total number of edges of the non-trivial components in allH
i
’s is at most 3|E|.
Since for each component the number of necessary transformations is at most
## ⌈
## 3
## 2
s
## ⌉
≤2s, wheresis
the number of edges in the given component, 6|E|number of steps are sufficient to transform any edge
coloring to any other one.
As an example, we show how to generate the transformations inFigure2by the transformations
in Definition
## 3.1.
## 11

## 1.φ
## 1
## ◦f
## 1
: We select two colors, red and blue, then do nothing (case (2)(a)). Since there is no
deficient vertex, we can change the color of edgee
## 1
from blue to red. Then we eliminate all
deficiencies by flipping the colors along a maximal alternating path between the two deficient
vertices emerged. We can conclude thatP(φ
## 1
## ◦f
## 1
## ) =
## 1
## 4
## ×
## 1
## 3
## ×
## 1
## 3
## ×
## 1
## 2
## ×
## 1
## 8
## ×
## 1
## 2
## . Indeed,
## 1
## 4
is the
probability of case (2), there are
## (
## 3
## 2
## )
= 3 possible pair of colors,
## 1
## 3
is the probability of subcase
(a) in case (2),
## 1
## 2
is the probability of changing the color of an edge when thereis no deficient
vertex in subcase (2)(b), and there are 8 edges with color blue or red, and finally, we select the
path in whichA
## 1
andX
## 1
differ with probability
## 1
## 2
## .
## 2.φ
## 2
## ◦f
## 2
## ◦φ
## −1
## 1
: We select two colors, red and blue, then we select the subpath in whichX
## 1
and
## A
## 1
differ (case (2)(b)). We flip the colors along this path. Since there are two deficient vertices
incident to edgee
## 1
, we select the vertex incident to bothe
## 1
ande
## 2
, then then we select the edge
e
## 2
, and flip its color from red to blue. Finally, we eliminate alldeficiencies by flipping the colors
along a maximal alternating path. We can conclude thatP(φ
## 2
## ◦f
## 2
## ◦φ
## −1
## 1
## ) =
## 1
## 2
## ×
## 1
## 3
## ×
## 1
## 3
## ×
## 1
## 57
## ×
## 1
## 4
## ×
## 1
## 2
## .
## Indeed,
## 1
## 4
is the probability of case (2), there are
## (
## 3
## 2
## )
= 3 possible pair of colors,
## 1
## 3
is the
probability of subcase (b) in case (2), there are
## (
## 8
## 2
## )
×2 subpaths in the subgraph with color
blue and red and 1 cycle, thus we have to select one of the 57 possibilities, selecting edgee
## 2
has
probability
## 1
## 4
(selecting uniformly one of the deficient vertices and uniformly one of the edges
with repeated color), and finally, we select the path in whichA
## 2
andX
## 2
differ with probability
## 1
## 2
## .
## 3.φ
## 3
## ◦f
## 3
## ◦φ
## −1
## 2
: We select three colors, red, blue and green, and we select green as the distinguished
colorc
## ′′
. Then we select the path in whichX
## 2
andA
## 2
differ, and swap the red and blue colors.
We select the alternating blue-green cycle containing the edgee
## 3
and flip the green and blue
colors in it. Then we eliminate the deficiencies by flipping the colors along the path with which
## A
## 3
andX
## 3
differ. We can conclude thatP(φ
## 3
## ◦f
## 2
φ
## −1
## 2
## ) =
## 1
## 4
## ×
## 1
## 3
## ×
## 1
## 3
## ×
## 1
## 57
## ×
## 1
## 4
## ×
## 1
## 2
. Indeed, the
probability of case (3) is
## 1
## 4
, there is one way to select three colors, and there are three ways to
select one of them distinguished, there are
## (
## 8
## 2
## )
×2 subpaths in the subgraph with color blue and
red and 1 cycle, thus we have to select one of the 57 possibilities, selecting edgee
## 3
has probability
## 1
## 4
(selecting uniformly one of the deficient vertices and uniformly one of the edges with repeated
color), and finally, we select the path in whichA
## 3
andX
## 3
differ with probability
## 1
## 2
## .
## 4.φ
## 4
## ◦f
## 4
## ◦φ
## −1
## 3
: We select two colors, red and blue. Then we select the path inwhichX
## 3
andA
## 3
differ, and flip the colors of the edges in it. Then we selecte
## 3
, and flip its color from blue to red.
Finally, we eliminate all deficiencies by flipping the colorsalong a maximal alternating path. We
can conclude thatP(φ
## 4
## ◦f
## 4
## ◦φ
## −1
## 3
## ) =
## 1
## 4
## ×
## 1
## 3
## ×
## 1
## 3
## ×
## 1
## 26
## ×
## 1
## 4
## ×
## 1
## 2
## . Indeed,
## 1
## 4
is the probability of case
(2), there are
## (
## 3
## 2
## )
= 3 possible pair of colors,
## 1
## 3
is the probability of subcase (b) in case (2), there
are
## (
## 4
## 2
## )
×2×2 = 24 subpaths in the subgraph with color blue and red and 2 cycles, thus we
have to select one of the 26 possibilities, selecting edgee
## 3
has probability
## 1
## 4
(selecting uniformly
one of the deficient vertices and uniformly one of the edges with repeated color), and finally, we
select the path in whichA
## 4
andX
## 4
differ with probability
## 1
## 2
## .
## 5.f
## 5
## ◦φ
## −1
## 4
: We select two colors, red and blue. Then we select the path inwhichX
## 4
andA
## 4
differ,
and flip the colors of the edges in it. Then we selecte
## 4
, and flip its color from red to blue. We
can conclude thatP(φ
## 4
## ◦f
## 4
## ◦φ
## −1
## 3
## ) =
## 1
## 4
## ×
## 1
## 3
## ×
## 1
## 3
## ×
## 1
## 26
## ×
## 1
## 4
## . Indeed,
## 1
## 4
is the probability of case (2),
there are
## (
## 3
## 2
## )
= 3 possible pair of colors,
## 1
## 3
is the probability of subcase (b) in case (2), there are
## 12

## (
## 4
## 2
## )
×2×2 = 24 subpaths in the subgraph with color blue and red and 2 cycles, thus we have to
select one of the 26 possibilities, selecting edgee
## 4
has probability
## 1
## 4
(selecting uniformly one of
the deficient vertices and uniformly one of the edges with repeated color).
We can putM(G, k) into a Metropolis-Hastings algorithm to design a Markov chain Monte Carlo
converging to the uniform distribution of edgek-colorings of a bipartite graph. We can use the variant
introduced by Lunteret. al[
15], that is, when an edge coloringC
## 2
is proposed fromC
## 1
in a way
w, we obtain the inverse wayw
## ′
transformingC
## 2
back toC
## 1
, and use the probabilitiesP(C
## 1
, w
## ′
## |C
## 2
## )
andP(C
## 2
, w,|C
## 1
) in the Metropolis-Hastings ratio. Furthermore, since thetarget distributionπis the
uniform one,gcan be set to any constant function, and is cancelled in the Metropolis-Hastings ratio,
which simply becomes
## P(C
## 1
, w
## ′
## |C
## 2
## )
## P(C
## 2
, w|C
## 1
## )
## ,
where edgek-coloringC
## 2
is proposed from edgek-coloringC
## 1
in wayw. Observe that the smallest
acceptance probability is the minimum of the Metropolis-Hastings ratio, so the maximum of the inverse
of the acceptance ratio is the maximum of the inverse of the Metropolis-Hastings ratio, and due to
symmetry, it is simply the maximum of the Metropolis-Hastings ratio. Below we give upper bound
for this maximum whenM(G, k) is used in the Metropolis-Hastings algorithm.
Since for allC
## 1
andC
## 2
and possible transformation waywbetween them,P(C
## 1
, w
## ′
## |C
## 2
)<1, the
maximum of the Metropolis-Hastings ratio is at most
## 1
## P(C
## 2
, w|C
## 1
## )
## .
This already would give a polynomial upper bound for the inverse of the acceptance ratio, however,
with a more careful analysis, a better upper bound could be found.
If nothing is done in the Markov chain, then the Metropolis-Hastings ratio is 1. Otherwise, a step
in the Markov chain does the following:
- It selects either 2 or 3 colors.
- Based on the selected colors, it creates at most two deficient vertices. We denote this transfor-
mationφ
## −1
## 1
## .
- It perturbs the current configuration. We call this perturbationf.
- Eliminates all the deficiencies. We denote this transformationφ
## 2
## .
Observe that in the reverse transformation, the same colorsmust be selected, therefore, the probability
of selecting the particular colors cancels in the Metropolis-Hastings ratio, thus it simplifies to
## P(φ
## −1
## 2
)P(f
## −1
)P(φ
## 1
## )
## P(φ
## −1
## 1
)P(f)P(φ
## 2
## )
We give individual upper bounds on
## P(φ
## −1
## 2
## )
## P(φ
## 2
## )
## ,
## P(f
## −
## 1)
## P(f)
and
## P(φ
## 1
## )
## P(φ
## −1
## 1
## )
, and their product is an upper
bound on the Metropolis-Hastings ratio.
We claim that
## P(φ
## −1
## 2
## )
## P(φ
## 2
## )
## ≤
## 1
## P(φ
## 2
## )
## ≤4.
## 13

Indeed, any probability is smaller than 1, thus the first inequality holds.φ
## 2
eliminates at most two
deficiencies.  It must select uniformly one of the edges with the same color incident to a deficient
vertex, and it has probability
## 1
## 2
. Once the edge is selected, the maximal alternating path with the two
prescribed colors is defined unequivocally, and thus with probability 1. Since at most twice an edge
incident to a deficient vertex must be selected during the procedureφ
## 2
, its probability has a minimum
## 1
## 4
, and thus the second inequality.
Now we show that
## P(φ
## 1
## )
## P(φ
## −1
## 1
## )
## ≤
## 1
## P(φ
## −1
## 1
## )
## ≤12
## (
## |V|
## 2
## )
## .
The reasoning for the first inequality is the same as above.φ
## −1
## 1
creates at most two deficient vertices by
selecting at most two alternating sub-paths in the subgraphHdefined by two colors, and then flipping
the colors along these paths. If one path is selected, then this option is chosen with
## 1
## 3
probability.
After this, a sub-path is selected uniformly. A sub-path is defined by its end vertices, therefore there
cannot be more than
## (
## |V|
## 2
## )
sub-paths, so the probability of selecting one sub-path is at least
## 1
## (
## |V|
## 2
## )
## . If
two sub-paths are selected, then this option is chosen with
## 1
## 3
probability. In this case, both of the
sub-paths must have an end vertex which is an end vertex also inH. Thus only the other end points
must be selected, and there are 2 options for this. Therefore, the number of pair of sub-paths with
the required properties is at most 4
## (
## |V|
## 2
## )
, so the probability of selecting one of them is at least
## 1
## 4
## (
## |V|
## 2
## )
## .
Therefore, it indeed holds that
## 1
## P(φ
## −1
## 1
## )
## ≤
## 1
## 1
## 3
## ×min
## {
## 1
## (
## |V|
## 2
## )
## ,
## 1
## 4
## (
## |V|
## 2
## )
## }
## = 12
## (
## |V|
## 2
## )
## .
Finally, we show that
## P(f
## −1
## )
## P(f)
## ≤
## 1
## P(f)
## ≤4|V|.
The reasoning for the first inequality is the same as above. Theftransformation does one of the
following:
- When two colors are selected and there is a deficient vertex, it selects a deficient vertex, then it
selects one of its edges causing deficiency, then it flips its color. It has probability at least
## 1
## 4
## (
## 1
## 2
for selecting uniformly from two deficient vertices and
## 1
## 2
for selecting uniformly from two edges).
- When two colors are selected and there is no deficient vertex, then with
## 1
## 2
probability, it selects
uniformly a an edge with one of the two prescribed colors, andit flips its color. Observe that
the number of edges with any of a set of two colors is at most thenumber of vertices in an edge
coloring. Therefore, the probability of this transformation is at least
## 1
## 2|V|
## .
- When two colors are selected and there is no deficient vertices, it does nothing with probability
## 1
## 2
## .
- When three colors are selected then either a deficient vertex is selected with at least
## 1
## 2
probability
or a non-deficient vertex is selected with at least
## 1
## 2|V|
probability. If a deficient vertex is selected,
then one of the edges causing deficiency is selected with
## 1
## 2
probability, then colors are flipped
along an unequivocally defined alternating path. If a non-deficient vertex is selected, then the
## 14

colors are flipped along one of at most two paths. The path on which the colors are flipped is
selected with at least
## 1
## 2
probability.
ThereforeP(f) is indeed lower bounded by
## 1
## 4|V|
, thus its inverse is upper bounded by 4|V|.
In this way, we just proved the following theorem.
Theorem 3.2.LetM(G, k)be the Markov chain on the edgek-colorings on the bipartite graphG=
(V, E). Then the inverse of the acceptance ratio in the Metropolis-Hastings algorithm applied with the
constant functiongand with Markov chainM(G, k)is upper bounded by96|V|
## 2
## (|V| −1).
- Latin rectangles
Definition 4.1.ALatin rectangleis ak×ntable such that each row is a permutation of [n] and
each column has no repeats. Whenk=nwe call it aLatin square. Thecompletionof ank×nLatin
rectangleRis ann×nLatin square such that its firstkrows isR.
Observation 4.1.For any(n−k)×nLatin rectangleR, there is ank-regular bipartite graphGwith
nvertices in both vertex classes such that completions ofRand edge-k-colorings ofGare in one-to-one
correspondence.
Proof.Let the two parts of vertices ofGbeA
## 1
## , A
## 2
## , . . . , A
n
andB
## 1
## , . . . , B
n
and defineA
i
## B
j
∈E(G) if
and only if numberidoes not appear in thej-th column ofR. This gives us a desiredk-regular graph
for any given Latin rectangleR.
Indeed, it is clear that eachB
i
is of degreek. ForA
i
’s, observe that they all have degree at least
k. Otherwise, suppose that numberi
## 0
is missed in less thankcolumns (i.e. it appears in at least
n−k+1 columns). We know that there are onlyn−krows, so by the Pigeonhole principle there must
be twoi
## 0
’s in the same row, which contradicts our assumption thatRis a Latin rectangle. Because
|E|=nkand the total degree ofA
i
’s isnk, noA
i
can have degree more thankthus every vertex of
## Gisk-regular.
Now we give the bijection: if and only if numberiis filled in the (n−k+ℓ, j)-grid inR’s completion,
we color edgeA
i
## B
j
using colorc
## ℓ
inG. For one direction, above discussion forGalready shows the
pre-image is a completion ofR. On the other hand, first of all, everyB
j
is adjacent to onec
## ℓ
## -colored
edge for allk. Then, by thek-regularity ofG, each number appearsktimes in the lastkrows of the
table so eachA
i
also has exactly one edge for every color. Thus the image is anedgekcoloring.
Remark.These objects are also in one-to-one correspondence with half-regular factorizations of com-
plete(k+n)-bipartite graphs with edgencolorings, connecting our work to [
## 1].
We now give a simplified version of the Markov chain describedin Definition
3.1on the solution
space of edgek-coloring ofk-regular bipartite graphs, that is, Latin square completions of (n−k)×n
Latin rectangles. In that, we utilize the following observation.
Observation 4.2.LetCbe an almost edgek-coloring of ankregular bipartite graph. Then there are
exactly two deficient vertices inC, furthermore, they are the endpoints of a maximal alternating path
with two colors.
## 15

Proof.By definition, there is at least one deficient vertex,v
## 1
, in an almost edger-coloring. W.l.o.g.,
it has (+c−c
## ′
)-deficiency. Letebe one of the edges with colorcincident tov
## 1
. Consider a longest
alternating path with colorscandc
## ′
containinge. It ends in a vertexv
## 2
either with acedge, and
then there is noc
## ′
edge incident tov
## 2
, or it ends with ac
## ′
edge and then there is nocedge incident to
v
## 2
. However, there arekcolors andv
## 2
has degreek, therefore one of the colors must be repeated on
edges incident tov
## 2
. That is,v
## 2
is a deficient vertex. Also by definition, there cannot be morethan
two deficient vertices inC.
A consequence is that theφoperations always eliminates two deficient vertices by flipping the
colors along an alternating path. This allows us to simplifythe Markov chain in Definition
3.1to get
an irreducible Markov chain on the edgek-colorings ofk-regular bipartite graphs. We also need the
following observation.
Observation 4.3.LetCbe an almost edgek-coloring of ak-regular bipartite graph such thatv
## 1
has
a(+c−c
## ′
)-deficiency andv
## 2
has a(+c
## ′
−c)deficiency. Furthermore, assume thatv
## 1
andv
## 2
are in
the same vertex class. Letc
## ′′
6=c, c
## ′
be a third color. Then the longest alternating walk with colorsc
## ′
andc
## ′′
that starts with colorc
## ′′
inv
## 2
is a cycle.
Proof.Since the graph isk-regular, each non-deficient vertex has exactly onec
## ′
edge and onec
## ′′
edge.
That is, the walk continues until it arrives to a deficient vertex or it travels back tov
## 2
## . Sincev
## 1
and
v
## 2
are in the same vertex class, the alternating walk could arrive tov
## 1
with ac
## ′
edge, however,v
## 1
does
not have an incidentc
## ′
edge. Therefore, the walk arrives back tov
## 2
## .
Definition 4.2.LetGbe ak-regular equi-bipartite graph. We define a Markov chainM(G, k) on
the edgek-colorings ofG. Let the current coloring beC. Then draw a random edgek-coloring in the
following way.
- With probability
## 1
## 2
, do nothing (so the defined Markov chain is a Lazy Markov chain).
- With probability
## 1
## 4
, select two colorscandc
## ′
from the set of colors uniformly among the
## (
k
## 2
## )
possible unordered pairs. Consider the subgraph ofGwith colorscandc
## ′
, let it be denoted by
H. Note thatHconsists of disjoint alternating cycles. Then select one ofthem:
(a) With probability
## 1
## 2
, do nothing.
(b) With probability
## 1
## 2
, uniformly select one of the possible connected subgraphs ofH.
Flip the colors in the selected sub-path.  If there is any deficient vertex, select one of them
uniformly, select the edge with the same color incident to the selected vertex uniformly, and
change its color fromctoc
## ′
orc
## ′
toc. Otherwise, with
## 1
## 2
probability, select either ac-edge or
ac
## ′
-edge, uniformly from all edges with colorcandc
## ′
, and change its color to the opposite (c
## ′
orc), and with
## 1
## 2
probability, do nothing. Eliminate all deficiency by flipping the colors on the
appropriate alternating path, selecting uniformly from the two neighbor edges with the same
color incident to deficient vertices.
- With probability
## 1
## 4
select three colors uniformly from the all possible
## (
k
## 3
## )
unordered pairs, and
select uniformly one from the three colors. Let the distinguished color be denoted byc
## ′′
, and let
the other two colors be denoted bycandc
## ′
. Consider the subgraph consisting of the colorsc
andc
## ′
and let it be denoted byH. Its non-trivial components are again copies of cycles. Then
select one of the following:
## 16

(a) With probability
## 1
## 2
, do nothing.
(b) With probability
## 1
## 2
, uniformly select a sub-path ofHwith even length (even number of
edges).
Flip the colors in the selected sub-path. The number of deficiency must be even. If there are
two deficient vertices, select one of them uniformly. If there is no deficient vertex, then select
uniformly a non-deficient vertex.
If a deficient vertexvis selected, let its repeated color be denoted by  ̃c. Consider the maximal
alternating cycle with colors  ̃candc
## ′′
that containsv(from Observation
4.3we know that this
cycle exists). Flip the colors in this cycle.
If a non-deficient vertex is selected, let its incident edge with colorc
## ′′
be denoted bye. Select
uniformly from the incident edges with colorcorc
## ′
, and let it be denoted byfand its color
be  ̃c. Take the maximal alternating cycle with colorsc
## ′′
and  ̃cthat containseandf. Flip the
colors in this cycle.
Eliminate all deficiency by flipping the colors on the appropriate alternating path, selecting
uniformly from the two neighbor edges with the same color incident to deficient vertices.
We can state the following upper bounds on the diameter and the inverse of acceptance ratio.
Theorem 4.4.LetM(G, k)be the Markov chain on the edgek-colorings of ak-regular bipartite
graphG= (V, E). Then the diameter ofM(G, k)is upper bounded by3|E|and the inverse of the
acceptance ratio in the Metropolis-Hastings algorithm with the uniform distribution is upper bounded
by16|V|(|V| −1).
Proof.In each subgraphH
i
, in each non-trivial component half of the edges have colorc
i
inC
## 2
## .
Indeed, observe that each non-trivial component is an alternating cycle with edges having colorc
i
in
## C
## 1
andC
## 2
. Therefore, the total number of edges of the non-trivial components in allH
i
’s is at most
2|E|. Since for each component the number of necessary transformations is at most
## 3
## 2
s, wheresis the
number of edges in the given component, 3|E|number of steps are sufficient to transform any edge
coloring to any other one.
We can decompose the proposal and backproposal probabilities in the same way as we did in case
of Theorem
3.2. Then the probabilities of selecting colors again cancel. We still have the bound
## P(φ
## −1
## 2
## )
## P(φ
## 2
## )
## ≤
## 1
## 4
## .
However, we can give a better upper bound on
## P(φ
## 1
)P(f
## −1
## )
## P(φ
## −1
## 1
## P(f))
## ≤
## 1
## P(φ
## −1
## 1
## P(f))
## ≤8
## (
## |V|
## 2
## )
## .
Indeed, sinceGisk-regular and its edges are colored withkcolors, there are deficient vertices after
transformationφ
## −1
## 1
if and only if an alternating path is selected and the edges are flipped.  The
probability for that is at least
## 1
## 2
## (
## |V|
## 2
## )
## /
## 1
## 2
for choosing the option to select a path, and there are at most
## (
## |V|
## 2
## )
possible paths, since the two end vertices define the alternating path unequivocally (recall that
the two colors in the alternating path are fixed). In such a case, there are two deficient vertices, one
## 17

of them is selected uniformly and one of its edges with duplicated colors is selected uniformly, and
the color of this edge is changed in a prescribed way. Note that this change is theftransformation.
Therefore, in this case,P(f) =
## 1
## 4
. We get that
## P(φ
## −1
## 1
## P(f))≥
## 1
## 8
## (
## |V|
## 2
## )
## (4.1)
If no path is selected, then the probability for is
## 1
## 2
. Then a non-deficient vertex is selected uniformly,
its probability is
## 1
## |V|
. Then one of the edges incident to the selected vertex and having one of the two
prescribed colors is selected uniformly.  This has probability
## 1
## 2
.  The color of the selected edge is
changed in a prescribed way. Therefore, we get that
## P(φ
## −1
## 1
## P(f))≥
## 1
## 4|V|
## (4.2)
Since|V| ≥2, we have 4|V| ≤8
## (
## |V|
## 2
## )
## .
Putting the inequalities together, we obtain the claimed bound.
## 5. Conclusion
We considered the solution space of edge-colorings of any general bipartite graph and explicitly
constructed an irreducible Markov chainM(G, k) on the edgek-colorings of a bipartite graphG. We
showed that the diameter ofMis linearly bounded by the number of edges, and when we apply the
Metropolis-Hastings algorithm to it so that the modified chain,
## ̃
M(G, k), converges to the uniform
distribution, the inverse of acceptance ratio is bounded bya cubic function of the number of vertices.
A special case of our work provides a Markov chain Monte Carlomethod to sample completions of
Latin squares.
Possible further work includes investigating the speed of convergence of the Markov chain
## ̃
M(G, k),
that is, whether it is rapidly mixing or not. The natural conjecture is that
## ̃
M(G, k) is rapidly mixing,
based on the proved properties on the diameter and the bound on the inverse of the acceptance
ratio. The Markov chain
## ̃
M(G, k) is similar to the Markov chains invented by Jacobson and Matthew
## [
8] and Aksenet al.[1].  Neither of these chains are proved to be rapidly mixing, although rapid
mixing is conjectured. The fact that the rapid mixing is a 25 year old open question in case of the
Jacobson-Matthew Markov chain on Latin squares indicates that resolving these open questions might
be extremely hard. A special case of the Markov chain introduced in this paper is the Markov chain
on completions (n−3)×nLatin rectangles, or equivalently, on edge 3-colorings of 3-regular bipartite
graphs. The structure of the solution space of edge 3-colorings of 3-regular bipartite graphs might be
simpler than the structure of the Latin squares. Therefore,there is a hope that proving rapid mixing
of the Markov chain on edge 3-colorings of 3-regular bipartite graphs might be easier.
## Acknowledgement
I.M. was supported by NKFIH grants KH126853, K132696 and SNN135643.  Dr.  C.F. Bubb
is thanked for his support. The project is a continuation of the work done at the 2019 Budapest
Semesters in Mathematics. Both authors would like to thank the BSM for running the program.
## 18

## References
## References
[1] Aksen, M., Mikl ́os, I., Zhu, K. (2017) Half-regular factorizations of the complete bipartite graph.
## Discrete Applied Mathematics, 230:21–33.
[2] Burke, E.; De Werra, D.; Kingston, J. (2004), ”5.6.5 Sports Timetabling”, in J. L., Gross; Yellen,
J. (eds.), Handbook of Graph Theory, CRC Press, p. 462.
[3] Cai, J-Y., Guo, H., Williams, T. (2016) The complexity ofcounting edge colorings and a di-
chotomy for some higher domain Holant problems, Res. Math. Sci., 3:18.
[4] Cole, R., Hopcroft, J. (1982) On edge-coloring bipartite graphs, SIAM J. Comput., 11:540–546.
[5] Erlebach, Thomas; Jansen, Klaus (2001), ”The complexity of path coloring and call scheduling”,
## Theoretical Computer Science, 255 (1–2): 33–50
[6] Hastings, W.K. (1970) Monte Carlo Sampling Methods Using Markov Chains and Their Appli-
cations, Biometrika, 57(1):97–109.
[7] Holyer, I. (1981) The NP-completeness of edge-coloring. SIAM J. Comput., 10(4):718–720.
[8] Jacobson, M.T., Matthews, P. (1996) Generating uniformly distributed random latin squares,
Journal of Combinatorial Designs, 4(6):404–437.
[9] Jerrum, M. (2003) Counting, Sampling and Integrating: Algorithms and Complexity. Lectures in
Mathematics. ETH Z ̈urich. Birkh ̈auser Verlag, Basel, Switzerland.
[10] Jerrum, M., Valiant, L.G., Vazirani, V.V. (1986) Random generation of combinatorial structures
from a uniform distribution. Theoretical Computer Science, 43:169–188.
[11] Kapoor, A., Rizzi, R. (2000) Edge-Coloring Bipartite Graphs, Journal of Algorithms, 34(2)390–
## 396.
## [12] K ̈onig, D. (1916)
## ̈
Uber Graphen und ihre Anwendung auf Determinantentheorie und Mengenlehre,
## Mathematische Annalen, 77(4):453–465.
[13] Lakic, N., (2001) The application of Latin square in agronomic research, Journal of Agricultural
## Sciences, 46(1):71–77.
[14] Leven, D., Galil, Z. (1983) NP-completeness of finding the chromatic index of regular graphs.
Journal of Algorithms, 4(1):35–44.
[15] Lunter, G.A., Mikl ́os, I., Drummond, A., Jensen, J.L.,Hein, J. (2005) Bayesian Coestimation of
Phylogeny and Sequence Alignment BMC Bioinformatics, 6:83.
[16] Mikl ́os, I., M ́elyk ́uti, B., Swenson, K. (2010) The Metropolized Partial Importance Sampling
MCMC mixes slowly on minimum reversal rearrangement paths ACM/IEEE Transactions on
Computational Biology and Bioinformatics, 4(7):763-767.
## 19

[17] Metropolis, N., Rosenbluth, A.W., Rosenbluth, M.N., Teller, A.H., Teller, E.(1953) Equations of
State Calculations by Fast Computing Machines. Journal of Chemical Physics, 21(6):1087–1092.
[18] Mikl ́os, I. (2019) Computational complexity of counting and sampling. CRC Press, Boca Raton,
## USA.
[19] Robertson, N., Sanders, D.P., Seymour, P., Thomas, R. (1996) Efficiently four-coloring planar
graphs. In Proc. 28th Symposium on Theory of Computing, pages 571–575.
[20] Sanders, D.P., Zhao, Y. (2001) Planar graphs of maximumdegree 7 are class I. Journal of Com-
binatorial Theory, Series B, 83:201–212.
[21] Skiena, Steven S. (2008), ”16.8 Edge Coloring”, The Algorithm Design Manual (2nd ed.),
Springer-Verlag, pp. 548–550.
[22] Tait, P.G. (1878) On the coloring of maps. Proc. Royal Soc. Edinburgh Sect. A, 10:501–503.
[23] Vizing, V.G. (1964) On an estimate of the chromatic class of a p-graph, Diskret. Analiz., 3:25–30.
[24] Vizing, V.G. (1965) Critical graphs with given chromatic class, Metody Diskret. Analiz., 5: 9–17.
[25] Williamson, D. P.; Hall, L. A.; Hoogeveen, J. A.; Hurkens, C. A. J.; Lenstra, J. K.; Sevast’janov,
S. V.; Shmoys, D. B. (1997), ”Short shop schedules”, Operations Research, 45 (2): 288–294.
## 20