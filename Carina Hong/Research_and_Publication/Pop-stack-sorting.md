

Advances in Applied Mathematics 139 (2022) 102362
Contents lists available atScienceDirect
Advances in Applied Mathematics
www.elsevier.com/locate/yaama
The pop-stack-sorting operator on Tamari lattices
## Letong Hong
Department of Mathematics, Massachusetts Institute of Technology, Cambridge,
MA, 02139, United States of America
a r t i c l e i n f oa b s t r a c t
Article history:
## Received 29 January 2022
Received in revised form 16 April
## 2022
## Accepted 25 April 2022
Available online 26 May 2022
## MSC:
## 05A15
## 06A12
## 06B10
## 05A05
Motivated by the pop-stack-sorting map on the symmetric
groups, Defant defined an operator Pop
## M
:M→Mfor each
complete meet-semilattice Mby
## Pop
## M
## (x)=
## ∧
({y∈M:yx}∪{x}).
This paper concerns the dynamics of Pop
## Tam
n
, where Ta m
n
is the n-th Ta m a r i lattice.
We say an element x ∈Ta m
n
is t-Pop-sortable if Pop
t
## M
## (x)is
the minimal element and we let h
t
(n)denote the number of
t-Pop-sortable elements in Ta m
n
. We find an explicit formula
for the generating function
## ∑
n≥1
h
t
## (n)z
n
and verify Defant’s
conjecture that it is rational. We furthermore prove that the
size of the image of Pop
## Tam
n
is the Motzkin number M
n
## ,
settling a conjecture of Defant and Williams.
© 2022 Elsevier Inc. All rights reserved.
## 1. Introduction
Building on Knuth’s stack-sorting algorithm [15], West’s ground-breaking work on the
stack-sorting map on symmetric groups [23] inspired subsequent studies, including the
reverse-stack-sorting map [12]and the pop-stack-sorting map [3]. Recently, there has been
E-mail address:clhong@mit.edu.
https://doi.org/10.1016/j.aam.2022.102362
0196-8858/© 2022 Elsevier Inc. All rights reserved.

2L. Hong / Advances in Applied Mathematics 139 (2022) 102362
considerable attention by combinatorialists on the pop-stack-sorting map [1,2,7,13,19].
For each complete meet-semilattice M, Defant defined an operator Pop
## M
that agrees
with the pop-stack-sorting map when Mis the weak order on S
n
[8]. It is defined so that
## Pop
## M
sends an element to the meet of itself and all elements that it covers. By definition,
M’s minimal element
## ˆ
0stays the same when Pop
## M
is applied. We say an element xis
t-Pop-sortableif Pop
t
## M
## (x) =
## ˆ
## 0.
Pudwell and Smith [19]enumerated the number of 2-Pop-sortable elements in S
n
under
the weak order. Claesson and Guðmundsson [7] proved that for each fixed nonnegative
integer t, the generating function that counts t-Pop-sortable elements in S
n
is rational.
Defant [9]  established the analogous rationality result for the generating functions of
t-Pop-sortable elements of type Band type
## ̃
## Aweak
orders.
Introduced in 1962, the n-th Tamari lattice Tam
n
consists of semilength-nDyck paths
(lattice paths from (0, 0) to (n, n)above the diagonal y=x) [22]; its partial order will
be defined in Section2. There are generalizations of the definition, most notably the m-
Tamari lattices by Bergeron and Préville-Ratelle [4]and the ν-Tamari lattices introduced
by Préville-Ratelle and Viennot [18]. Fundamental in algebraic combinatorics [16], the
n-th Tamari lattice Tam
n
is also isomorphic to Av
n
(312), the lattice of 312-pattern-
avoiding permutations under the weak order of S
n
## [5].
In this paper, we study the Popoperator on Tamari lattices. Let h
t
(n)be the number
of t-Pop-sortable elements in Tam
n
. A part of a conjecture by Defant [8]is that for every
fixed t, the generating function
## ∑
n≥1
h
t
## (n)z
n
is rational. We confirm this statement by
giving the exact formula of the generating function:
Theorem 1.1. Let h
t
(n)denote the number of t-Pop-sortable Dyck paths in the n-th
Tamari lattice Tam
n
## . Then
## ∑
n≥1
h
t
## (n)z
n
## =
z
## 1−2z−
## ∑
t
j=2
## C
j−1
z
j
## ,
where C
j
## =
## 1
j+1
## (
## 2j
j
## )
is the j-th Catalan number.
Moreover, settling a conjecture in Defant and Williams’s paper (Conjecture 11.2 (2)
in [11]), we have the following theorem:
Theorem 1.2. Define Pop(L; q) =
## ∑
b∈Pop
## L
## (L)
q
## |U
## L
## (b)|
, where U
## L
(b)is the set of elements
of Lthat cover b. Then we have
Pop(Tam
n+1
## ;q)=
n
## ∑
k=0
## 1
k+1
## (
## 2k
k
## )(
n
## 2k
## )
q
n−k
## ,
where the coefficients form OEIS sequence [21] A055151. In particular, when q=1, we
have that
|Pop
## Tam
n
(Tam
n
## )|=M
n−1
## ,

L. Hong / Advances in Applied Mathematics 139 (2022) 1023623
where M
n
is the n-th Motzkin number (OEIS sequence [21] A001006).
In the proof of this theorem we also give an exact description of the image of Pop
## Tam
n
in terms of 312-avoiding permutations. Additional motivation for studying the size of this
image comes from a theorem by Defant and Williams (Theorem 9.13 in [11]). In that
theorem, they proved that |Pop
## Tam
n
(Tam
n
)| ={y∈Tam
n
|Row(y) ≤y}, where Row
is the rowmotion operator on Tam
n
(which is equivalent to the Kreweras complement
operator on noncrossing partitions [10]). They also showed that |Pop
## Tam
n
(Tam
n
)|is the
number of independent dominating sets in a certain graph associated with Tam
n
called
its Galois graph.
The paper is organized as follows. In Section2we give the necessary definitions. In
Section3and Section4we prove Theorem1.1and Theorem1.2.
## Acknowledgments
The research was conducted at the 2021 University of Minnesota Duluth REU (NSF–
DMS Grant 1949884 and NSA Grant H98230-20-1-0009) and fully supported by the
generosity of the CYAN Mathematics Undergraduate Activities Fund. The author is
deeply thankful to Professor Joseph Gallian for his long-lasting efforts and care in run-
ning the wonderful program and to Colin Defant for proposing the project and his
dedicated mentorship. The author is also grateful to Qiuyu Ren and Daniel Zhu for
discussions/editing comments and to Kenny Lau and Alec Sun for programming assis-
tance.
## 2. Definitions
2.1. Lattice basics and the Popoperator
Definition 2.1. A meet-semilatticeis a poset Msuch that any two elements x, y∈M
have a greatest lower bound (which is called their meet, denoted by x ∧y). A latticeL
is
a meet-semilattice such that any two elements x, y∈Lalso have a least upper bound
(which is called their join, denoted by x ∨y). A meet-semilattice is completeif every
nonempty subset A ⊂Mhas a meet.
Given x, y∈M, we say that yis coveredby x(denoted yx) if y<xand no z∈M
satisfies y<z<x.
In this paper we only consider finite meet-semilattices, each of which has a unique
minimal element
## ˆ
- They are automatically complete.
Definition 2.2 ([8]). Let Mbe a complete meet-semilattice. Define the semilattice pop-
stack-sorting operatorPop
## M
:M→Mby
## Pop
## M
## (x)=
## ∧
({y∈M:yx}∪{x}).

4L. Hong / Advances in Applied Mathematics 139 (2022) 102362
Definition 2.3. We say an element xof a complete meet-semilattice Mis t-Pop-sortable
if Pop
t
## (x) =
## ˆ
## 0.
2.2. Generalized Tamari lattices
In this paper, a lattice path is a finite planar path that starts from the origin and at
each step travels either up/N : (0, 1) or right/E : (1, 0).
Definition 2.4. The horizontal distanceof a point pwith respect to a lattice path νis
the maximum number of east steps one can take starting from pbefore being strictly to
the right of ν.
Definition 2.5 ([18]). Let νbe a lattice path from (0, 0) to ( −n, n). The generalized ν-
Tamari latticeTam (ν)is defined as follows:
(1)  elements of Tam (ν)are lattice paths μfrom (0, 0)  to ( −n, n)that are weakly
aboveν;
(2)  the partial order of Tam(ν)is given by the covering relation: μ μ
## 
if μ
## 
is obtained
by shifting a subpath Dof μby 1 unit to the left, where Dsatisfies (i) it is preceded
by E; (ii) its first step is N; (iii) its endpoints p, p
## 
are of the same horizontal distance
to νand there is no point between them with the same horizontal distance to νas
p. In other words, μ μ
## 
if for such subpath D, μ =XEDYand μ
## 
## =XDEY.
## [8]
Fig. 1.Lattice path μ = NENENEEENE is in Tam(ν)where ν= ENNEEEENNE. Each point on μis labeled
with its horizontal distance.
Definition 2.6. When ν=(NE)
n
, the lattice Tam (ν)is the n-th Tamari latticeTam
n
consisting of the Dyck paths. It is well-known that |Tam
n
|is the n-th Catalan numberC
n
## .
- Proof of Theorem1.1
3.1. Preliminaries: the ν-bracket vector
Definition 3.1. Let b(ν) =(b
## 0
(ν), b
## 1
(ν), ..., b
## 
(ν)) be the vector denoting the heights at
each step of the lattice path ν. Let the fixed positionf
k
denote the largest index such

L. Hong / Advances in Applied Mathematics 139 (2022) 1023625
that b
f
k
(ν) =k. We say that an integer vector
## 
b=(b
## 0
, b
## 1
, ..., b
## 
)is a ν-bracket vector,
denoted as
## 
b∈Vec(ν),
if
## (1)b
f
k
=kfor all k=0, ..., n.
## (2)b
i
## (ν) ≤b
i
≤nfor all 0 ≤i ≤.
(3)  If b
i
=k, then b
j
≤kfor all i +1 ≤j≤f
k
## .
The partial order of Vec(ν)is defined as follows: we say (b
## 0
, b
## 1
, ..., b
## 
## ) ≤(b
## 
## 0
, b
## 
## 1
, ..., b
## 
## 
## )
if
b
i
## ≤b
## 
i
for all i.
Remark. An equivalent interpretation of (3) is that
## 
bis 121-pattern-avoiding. These
conditions also imply the sequence {b
i
## }
f
k
f
k−1
## +1
is non-increasing for all k=0, ..., n.
Definition 3.2. Let μ ∈Tam (ν)be a path from (0, 0) to ( −n, n). We define b(μ) =
## (b
## 0
(μ), b
## 1
(μ), ..., b
## 
(μ)) its associated vectoras follows: make ( +1) empty slots; traverse
μ, and when arriving at a new grid point, write its height kat the rightmost available
slot among those that are weakly to the left of index f
k
## .
Remark. We alert the readers that the notation of the vector b(μ)does not reflect its
dependence on the fixed lattice path ν.
Example 3.3. We use μ = NENENEEENE and ν= ENNEEEENNE as in Fig.1. The
fixed positions are f
## 0
=1, f
## 1
=2, f
## 2
=7, f
## 3
=8, and f
## 4
= 10. Then we create 11 empty
slots and construct the associated vector b(μ)as follows:
## (,0,,,,,,,,,)→(1,0,1,,,,,,,,)
## →(1
## ,0,1,,,,2,2,,,)→(1,0,1,3,3,3,2,2,3,,)
## →(1,0,1,3,3,3,2,2,3,4,4).
Theorem 3.4 ([6]). The map b :Tam(ν) →Vec(ν)is an order-preserving bijection.
Furthermore, for any paths μ, μ
## 
∈Tam (ν), we have b(μ ∧μ
## 
) =min(b(μ), b(μ
## 
## ))the
term-wise minimum vector.
Notation 3.5. We define the followings.
## (1)  Δ(μ) :={i |i <andb
i
## (μ) >b
i+1
## (μ)}.
## (2)η
i
## (μ) :=
## {
max{x∈[b
i
## (ν),b
i
## (μ)−1]|b
j
## (μ)≤x,∀j∈[i+1,f
x
]}ifi∈Δ(μ),
b
i
(μ)ifi/∈Δ(μ).
## (3)b
i
## ↓
## (μ) := (b
## 0
(μ), ..., b
i−1
(μ), η
i
(μ), ..., b
## 
## (μ)).
Example 3.6. Again we use μ = NENENEEENE as in Fig.1and by Example3.3we have
that b(μ) =(1, 0, 1, 3, 3, 3, 2, 2, 3, 4, 4). Hence, Δ(μ) ={0, 5}, η
## 0
(μ) =0, and η
## 5
## (μ) =2.

6L. Hong / Advances in Applied Mathematics 139 (2022) 102362
Proposition 3.7 ([8]). We have that
b(Pop
## Tam(ν)
## (μ)) = (η
## 0
## (μ),η
## 1
## (μ),...,η
## 
## (μ)).
Corollary 3.8 ([8]). Suppose μ ∈Tam (ν)and f
k−1
## <i <f
k
## (0 ≤k≤n). Then
b
i
(Pop
## Tam(ν)
## (μ)) ≥b
i+1
## (μ).
We use the assumptions for a lattice path νfrom above. Let ν
## #
be the path obtained
from νby deleting its first f
## 0
+ 1 steps. Let b
## #
be the vector obtained from bby deleting
its first f
## 0
+1 entries and subtracting 1from all remaining entries. We call this action
the hashmap. Let μ
## #
be the unique element in Tam (ν
## #
)whose associated vector is
b(μ)
## #
## .
Corollary 3.9. If μ ∈Tam (ν)is t-Pop-sortable, then so is μ
## #
∈Tam (ν
## #
## ).
Proof.This directly follows from the fact that η
i
(μ)is determined only by b
j
## (μ)for
j≥i.
3.2. Proof of the result
Definition 3.10. We say
## 
b=(b
## 0
, b
## 1
, ..., b
## 
) ∈Vec(ν)for some fixed νis irreducibleif
b
## 0
## =b
## 
## .
## Let H
t
## (z) =
## ∑
n≥1
h
t
## (n)z
n
, the generating function in Theorem1.1. Let
## ̃
## H
t
(z)be the
truncated polynomial
## ∑
t−1
n=1
h
t
## (n)z
n
## . Let G
t
## (z) =
## ∑
n≥1
g
t
## (n)z
n
, where g
t
(n) denotes
the t-Pop-sortable irreducible elements in Vec(ν)for ν= E(NE)
n−1
. In this case, using
the notations from Definition3.1, we have f
k
=2k+1, and b
i
(ν) =i/2. Therefore,
the restrictions are b
## 2k+1
=k, b
## 2k
∈{k, k+1, ..., n}, and that if b
i
=k, then b
j
## ≤k
for all j=i +1, ..., 2k+1, i.e., no 121-pattern can appear. Finally, we note that
Vec(E(NE)
n−1
## )
## ∼
## =
Vec((NE)
n
## )
## ∼
## =
## Tam
n
## .
Lemma 3.11. Every ν-bracket vector can be decomposed into irreducible ν
i
-bracket vec-
tors, where νand each ν
i
are of the form E(NE)
k−1
. A vector is t-Pop-sortable if and
only if all its irreducible components are.
Proof.We first define the addition of two irreducible vectors
## 
b∈Vec(E(NE)
n
## 1
## −1
## )and
## 
b
## 
∈Vec(E(NE)
n
## 2
## −1
)as follows:
## 
b+
## 
b
## 
## := (b
## 0
## ,b
## 1
## ,...,b
## 2n
## 1
## −1
## ,b
## 
## 0
## +n
## 1
## ,b
## 
## 1
## +n
## 1
## ,...,b
## 
## 2n
## 2
## −1
## +n
## 1
)∈Vec(E(NE)
n
## 1
## +n
## 2
## −1
## ).
To prove the first claim we induct on the length of the vector and note that it suffices to
show that every bracket vector can be decomposed as the sum of an irreducible vector

L. Hong / Advances in Applied Mathematics 139 (2022) 1023627
## 
b
irr
and a shorter vector. Simply take
## 
b
irr
## :=  (b
## 0
, b
## 1
, ..., b
f
b
## 0
). The second claim is
clear.
Lemma 3.12. Assume the notations above. Then we have
## 1+H
t
## (z)=
## 1
## 1−G
t
## (z)
## .
Proof.The formula is a direct corollary of Lemma3.11.
Lemma 3.13. The hash map is a one-to-one correspondence between irreducible vectors in
Vec(E(NE)
n−1
)and bracket vectors in Vec(E(NE)
n−2
). An irreducible vector
## 
bis
t-Pop-
sortable
if and only if
## 
b
## #
is t-Pop-sortable and t ≥n −x
r
+1, where 2x
r
is the length
of the last irreducible vector component of
## 
b
## #
## .
Proof.Let the irreducible vector
## 
b∈Vec(E(NE)
n−1
)be (n, 0, u
## 0
, u
## 1
, ..., u
## 2n−3
## )and
## 
b
## #
## =(u
## 0
−1, u
## 1
−1, ..., u
## 2n−3
−1) ∈Vec(E(NE)
n−2
). First, it is clear that from
## 
b
## #
we
can recover
## 
b,
so the hash map is a bijection. Next, if we decompose
## 
b
## #
as the sum of
some (say r) irreducible vectors of lengths 2x
## 1
## , ..., 2x
r
, respectively (corresponding to
elements in Vec(ν)for ν= (E(NE)
x
i
## −1
), 1 ≤i ≤r), then we can write
## 
b=(n,0,u
## 0
## ,u
## 1
## ,...,u
## 2n−3
## )=(n,0,u
## 0
## ,...,u
## 0
## ,...,n−x
r
## ,...,n−x
r
## ,n,...,n).
The irreducible vector
## 
bbeing t-Pop-sortable is equivalent to
## 
b
## #
being t-Pop-sortable
and the first entry of
## 
bturning
0after tPop’s. Applying Pop
Vec(E(NE)
n−1
## )
once changes
the first entry from nto n −x
r
, and each subsequent Pop
Vec(E(NE)
n−1
## )
decreases it by 1,
hence this is then equivalent to t ≥n −x
r
## +1.
Lemma 3.14. Assume the notations above. Then we have
## G
t
## (z)=z
## (
## (1 +
## ̃
## H
t
(z))G
t
## (z)+1
## )
## .
Proof.This is a corollary of Lemma3.13. Since the hash map’s image of the middle
sub-vector (u
## 0
−1, ..., u
## 0
−1, ..., n −x
r
−1, ..., n −x
r
−1) ∈Vec(E(NE)
n−x
r
## −1
## )is
t-Pop-sortable when n −x
r
≤t −1and the last irreducible component starts and ends
with nas well, we have justified the desired expression (adding 1to
## ̃
## H
t
(z)is to account
for the r=0case).
Lemma 3.15. When n ≤t, every path in Tam
n
is t-Pop-sortable.
Proof.Consider the path’s associated vector
## 
b∈Vec(E(NE)
n−1
). For each 0 ≤i ≤n −1,
b
## 2i
decreases by at least 1each time unless b
## 2i
## =b
## 2i+1
. Since n ≤t, during the t
applications of Pop
Vec(E(NE)
n−1
## )
this equality will be reached. This applies to all i, so we
obtain the minimum element’s associated vector.

8L. Hong / Advances in Applied Mathematics 139 (2022) 102362
We are now ready to prove our first main result.
Proof of Theorem1.1.By Lemma3.15,
## ̃
## H
t
## (z) =
## ∑
t−1
n=1
## C
n
z
n
. By Lemma3.14, we have
that
## G
t
## (z)=
z
## 1−
## ∑
t
n=1
## C
n−1
z
n
## ,
and substituting this into Lemma3.12, we obtain that
## H
t
## (z)=
## G
t
## (z)
## 1−G
t
## (z)
## =
z
## 1−
## ∑
t
n=1
## C
n−1
z
n
## 1−
z
## 1−
## ∑
t
n=1
## C
n−1
z
n
## =
z
## 1−2z−
## ∑
t
j=2
## C
j−1
z
j
## ,
as desired.
- Proof of Theorem1.2
4.1. Preliminaries: congruence and Popon subsemilattices
Definition 4.1. A lattice congruenceon a lattice Lis an equivalence relation ≡on Lsuch
that if x
## 1
## ≡x
## 2
and y
## 1
## ≡y
## 2
, then x
## 1
## ∧y
## 1
## ≡x
## 2
## ∧y
## 2
and x
## 1
## ∨y
## 1
## ≡x
## 2
## ∨y
## 2
## .
For each x ∈L, we denote by π
## ↓
(x)the minimal element of the congruence class of x.
Note that this π
## ↓
map is well-defined, as every congruence class of a finite lattice has
a unique minimal element.
Definition 4.2. A subsemilatticeof a lattice Lis a subset M⊂Lsuch that x ∧y∈M
for all x, y∈M.
Theorem 4.3 ([8]). Let Lbe a finite lattice. Let ≡be a lattice congruence on Lsuch that
the set M={π
## ↓
(x) |x ∈L}is a subsemilattice of L. Then for all x ∈M,
## Pop
## M
## (x)=π
## ↓
(Pop
## L
## (x)).
We now provide an example that shows how the Tamari lattice can be realized as a
sublattice of S
n
## .
Definition 4.4. A descentof a permutation x =x
## 1
## ···x
n
is a pair of adjacent entries
x
i
## >x
i+1
. A descending runis a maximal decreasing subsequence of x. The pop-stack-
sorting mapis the operator on S
n
that reverses each descending run.
Definition 4.5. The partial order of S
n
defined by the following covering relation is the
right weak order: a permutation yis covered by permutation xif yis obtained by swap-
ping
the two entries that form one of x’s descents, i.e. e
## 1
e
## 2
## ···e
i+1
e
i
## ···e
n
is covered by
e
## 1
e
## 2
## ···e
i
e
i+1
## ···e
n
whenever e
i
## >e
i+1
## .

L. Hong / Advances in Applied Mathematics 139 (2022) 1023629
Definition 4.6 ([14]). Two words u, vare sylvester-adjacentif there exist a <b <cand
words X, Y, Zsuch that u =XacY bZand v=XcaY bZ. We write u v.
Two words u, vare sylvester-congruentif there is a chain of words u =w
## 0
, w
## 1
, ..., w
m
## =v
such that w
i
and w
i+1
are sylvester-adjacent for all i(w
i
## w
i+1
or w
i
## w
i+1
## ).
Let L =S
n
, and let M=Av
n
(312) be the set of 312-avoiding permutations, both
under the right weak order. It is established by Björner and Wachs [5]in their Theorem
9.6 (i) that Av
n
(312) is a sublattice of S
n
and is isomorphic to the Tamari lattice Tam
n
## .
Reading [20]observes that the sylvester-congruence is a lattice congruence for S
n
under
the right weak order (note that u valso implies u v), and, furthermore, if we divide
## S
n
into sylvester-congruence classes, then each class has a unique 312-avoiding element.
More precisely, Av
n
## (312) ={π
## ↓
(x) |x ∈S
n
## }.
A concrete description of π
## ↓
is that we can compute a chain x =y
## 0
## y
## 1
## ···y
m
## =
π
## ↓
(x)until we must stop (one can easily show that no XcaY bZpattern implies no 312-
pattern),
and we remark that the exact construction of the chain does not matter, that
is, regardless of the order of swapping one obtains the same eventual outcome. Therefore,
Theorem4.3tells us that
## Pop
## Av
n
## (312)
## (x)=π
## ↓
(Pop
## S
n
## (x)).
This is especially helpful, given that Pop
## S
n
on the right hand side is equal to the easily
characterized pop-stack-sorting map.
4.2. Proof of the result
Theorem 4.7. We have that x ∈{Pop
## Av
n
## (312)
(Av
n
(312))}if and only if x =x
## 1
x
## 2
## ···x
n
has no double descents and ends with n.
Proof.In this proof we interpret Popas reversing all descending runs of a string (not
required to be a permutation of 1to m), e.g., Pop(74513) = 47153, though we specify by
using a subscript when it is indeed Pop
## S
m
. We also recall the identity Pop
## Av
n
## (312)
## (y) =
π
## ↓
(Pop
## S
n
(y)) which will be used extensively.
For the “only if” direction, we first suppose that x =π
## ↓
(Pop
## S
n
(y)) and we want to
show that xends with nand has no double descents.
It is known that every permutation in the image of π
## ↓
must be 312-avoiding. We first
prove that the last entry must be n. Wherever nis located for a permutation y, in order
for it to be 312-avoiding we must have that the segment after nis decreasing. Then after
the effect of Pop
## S
n
, nis put at the end of the permutation and continues to stay there
when we apply π
## ↓
because it is never involved as a, b, orcin any XcaY bZpattern.
Next we prove that there are no double descents. We use induction on the permutation
length, and, with the base case being clear, we assume this claim holds for length n −1.
Write y=y
## 1
y
## 2
## ···y
n
and let y
r
## =n.

10L. Hong / Advances in Applied Mathematics 139 (2022) 102362
Suppose y
n
=n. We thus know that Pop
## S
n
(y) ends with nand it stays at the same
place under the effect of π
## ↓
. Using the induction hypothesis, we have that π
## ↓
(Pop
## S
n
## (y))
will end with (n −1)nwith no double descents.
Suppose y
n−1
=n. Let y
n
## =k. Let Pop
## S
n
## (y) =z
## 1
## ···z
n
## . Then (z
n−1
, z
n
) =(k, n)
and nstays at the same place throughout. We prove the following two claims: there is
no 312-pattern involving kafter Pop
## S
n
, and there is no 312-pattern involving kat any
stage in the chain of pairwise sylvester-adjacent permutations that we use to compute
π
## ↓
. For the first claim, if there is a 312-pattern then there must be some z
i
, z
j
such that
z
i
## >k>z
j
and i <j<n −1. Since Pop
## S
n
does not change the relative position of
entries in different descending runs, it must be that z
i
is before z
j
in the preimage y.
However, there is no 312-pattern initially in y, which is a contradiction. For the second
claim, we know that z
## 1
## ···z
n
has no z
i
, z
j
such that z
i
## >k>z
j
and i <j<n −1, and
any swap (XcaY bZ→XacY bZ) in the chain would not create such a pair as it moves
a smaller element to the front of a larger element.
Therefore, we can delete kand nfrom yand lower the entries of values k+1, ..., n −1
by 1 respectively in y
## 1
## ···y
n−2
. We then have an element in S
n−2
, say, y
## 
## 1
## ···y
## 
n−2
, and
can apply the induction hypothesis to it. Therefore, π
## ↓
(Pop
## S
n−2
## (y
## 
## 1
## ···y
## 
n−2
)) ends with
n −2and has no double descents. Now we take this image and add 1to entries of values
k, ..., n −2and denote it as x
## 
## 1
## ···x
## 
n−2
. Because of the previous paragraph we have
shown that π
## ↓
(Pop
## S
n
## (y)) =x
## 
## 1
## ···x
## 
n−2
·kn, and the entire string has no double descents.
Now suppose r≤n −2. First we consider the case y
r−1
## <y
r+1
. We have Pop
## S
n
## (y) =
## Pop
## S
n−1
## (y
## 1
## ···y
r−1
y
r+1
## ···y
n
## )n. Therefore,
π
## ↓
(Pop
## S
n
## (y)) =π
## ↓
## (
## Pop
## S
n−1
## (y
## 1
## ···y
r−1
y
r+1
## ···y
n
## )·n
## )
## =π
## ↓
## (
## Pop
## S
n−1
## (y
## 1
## ···y
r−1
y
r+1
## ···y
n
## )
## )
## ·n,
where ·stands for concatenation. We apply the induction hypothesis to y
## 1
## ···y
r−1
y
r+1
## ···
y
n
, an element of S
n−1
, and obtain that the first n −1 places of xmust not have double
descents. Concatenating with nwill not change this statement, and we conclude this
case.
Now we suppose y
r−1
## >y
r+1
. Let y
q
y
q+1
## ···y
r−1
be the longest descending run that
ends with y
r−1
. On one hand,
## Pop
## S
n
## (y
## 1
## ···y
r−1
ny
r+1
## ···y
n
)=Pop(y
## 1
## ···y
q−1
## )·y
r−1
## ···y
q
y
n
## ···y
r+1
n,
where y
n
## <···<y
r+1
## <y
r−1
## <···<y
q
## .
Now we start applying the series of swaps to apply π
## ↓
. Notice that every swap removes
a 312 pattern and y
q
y
n
y
r+1
is one such pattern. Thus, first y
q
is swapped with y
n
## . Then,
y
q
y
n−1
y
r+1
should also be removed, so y
q
is again swapped with y
n−1
. We repeat the
process, and after n −rswaps involving y
q
as the cin XcaY bZ, the permutation becomes
## Pop(y
## 1
## ···y
q−1
## )·y
r−1
## ···y
q+1
y
n
## ···y
r+1
y
q
n.

L. Hong / Advances in Applied Mathematics 139 (2022) 10236211
Similarly, y
q+1
is moved to the end of y
n
## ···y
r+1
, right before y
q
n, and so is
y
q+2
, ..., y
r−1
. We arrive at
## Pop(y
## 1
## ···y
q−1
## )·y
n
## ···y
r+1
y
r−1
## ···y
q
n.
We should clarify that the process of swapping is not finished yet; what we claim is that
since π
## ↓
is the same for sylvester-adjacent elements, we have
π
## ↓
(Pop
## S
n
## (y)) =π
## ↓
## (
## Pop(y
## 1
## ···y
q−1
## )·y
n
## ···y
r+1
y
r−1
## ···y
q
n
## )
## .
On the other hand,
## Pop
## S
n
## (y
## 1
## ···y
r−1
y
r+1
## ···y
n
·n)=Pop(y
## 1
## ···y
q−1
## )·y
n
## ···y
r+1
y
r−1
## ···y
q
## ·n.
Combining these observations we obtain that
π
## ↓
(Pop
## S
n
## (y)) =π
## ↓
## (
## Pop
## S
n
## (y
## 1
## ···y
r−1
y
r+1
## ···y
n
## ·n)
## )
## =π
## ↓
## (
## Pop
## S
n−1
## (y
## 1
## ···y
r−1
y
r+1
## ···y
n
## )
## )
## ·n.
We apply the induction hypothesis to y
## 1
## ···y
r−1
y
r+1
## ···y
n
, an element of S
n−1
, and
obtain that the first n −1 places of xmust not have double descents. Concatenating
with nwill not change this statement, and we conclude this case as well.
For the “if” direction, we suppose that x =x
## 1
## ···x
n
## ∈S
n
with x
n
=nand xhas no
double descents. We want to show that there is some 312-avoiding permutation ysuch
that π
## ↓
(Pop
## S
n
(y)) =x. We use strong induction on x’s length.
We consider the position of 1, say x
k
=1. Then there are two immediate obser-
vations. Firstly, all entries x
## 1
, ..., x
k−1
are smaller than all of x
k+1
, ..., x
n
to avoid a
312-pattern x
j
x
k
x
## 
where j<k<. Hence, it is clear that {x
## 1
, ..., x
k−1
} ={2, ..., k}
and
## {x
k+1
, ..., x
n
} ={k+1, ..., n}. Secondly, if k≥2, then x
k−1
=k. Otherwise, if
x
j
=kfor some other j≤k−2, then x
j
x
j+1
x
j+2
forms either double descents or a
312-pattern, which is impossible.
We let x
## 
i
## =x
i
−1if 1 ≤i ≤k−1and let x
## 
i
## =x
i
−kif k+1 ≤i ≤n.
Then x
## 
## 1
x
## 
## 2
## ···x
## 
k−1
## ∈S
k−1
and x
## 
k+1
x
## 
k+2
## ···x
## 
n
## ∈S
n−k
are two strings with no double
descents, and x
## 
k−1
=k−1, x
## 
n
=n −k. Both of them satisfy the induction hypoth-
esis, so we can find z=z
## 1
## ···z
k−1
## ∈S
k−1
and w=w
## 1
## ···w
n−k
## ∈S
n−k
such that
π
## ↓
(Pop
## S
k−1
## (z)) =x
## 
## 1
x
## 
## 2
## ···x
## 
k−1
and π
## ↓
(Pop
## S
n−k
## (w)) =x
## 
k+1
x
## 
k+2
## ···x
## 
n
## .
Let z
## 
## =z
## 
## 1
## ···z
## 
k−1
where z
## 
i
## =z
i
+1. Suppose w
t
=k+1. Let w
## 
## =w
## 
## 1
## ···w
## 
t
## ·
## 1 ·w
## 
t+1
## ···w
## 
n−k
, where we let w
## 
i
## =w
i
+k. Consider y=z
## 
## ·w
## 
. It is clear that yis
312-avoiding. Indeed, z
## 
and w
## 
are both 312-avoiding, and no pattern can be formed by
entries from both segments because no entry of z
## 
can be larger than any entry of w
## 
except 1. It suffices to show that π
## ↓
(Pop
## S
n
## (y)) =x.
We carefully investigate π
## ↓
(Pop(w
## 
)) as follows. After Pop, w
t
=k+ 1 will be after 1,
and thus for π
## ↓
we can perform a series of XcaY bZ→XacY bZswaps with a =1and

12L. Hong / Advances in Applied Mathematics 139 (2022) 102362
b =k+1, until 1is perturbed to the start of this string. In other words, due to the fact
that sylvester-adjacent elements have the same π
## ↓
image,
π
## ↓
(Pop(w
## 
## )=π
## ↓
(1·Pop(w
## 
## 1
## ···w
## 
n−k
## )) = 1·π
## ↓
(Pop(w
## 
## 1
## ···w
## 
n−k
## )).
Because no 312-pattern emerges when entries from z
## 
and w
## 
are combined, we can
apply π
## ↓
(Pop)to them separately and we have that
π
## ↓
(Pop
## S
n
## (y)) =π
## ↓
(Pop(z
## 
## ))·π
## ↓
(Pop(w
## 
## ))
## =π
## ↓
(Pop(z
## 
## ))·1·π
## ↓
(Pop(w
## 
## 1
## ···w
## 
n−k
## ))
## =x
## 1
## ···x
k−1
## ·1·x
k+1
## ···x
n
## ,
which is exactly x. This concludes the proof of Theorem4.7.
The last ingredient that we will need in the proof of Theorem1.2is the following
enumerative result.
We call place ia peakin a permutation e
## 1
## ···e
n
when e
i−1
## <e
i
and e
i+1
## <e
i
## .
Theorem 4.8 ([17]). The number of 231-avoiding permutations π∈S
n+1
with exactly k
descents and kpeaks is
## 1
k+1
## (
## 2k
k
## )(
n
## 2k
## )
## .
Proof of Theorem1.2.Define the bijective map r(π) =π
## 
## =π
## 
## 1
## ···π
## 
n+1
where π
## 
i
## =
n
## +2 −π
n+2−i
. We claim that the effect of rpreserves the number of ascents (descents)
of the permutation. Indeed, place ibeing an ascent (descent) in π
## 
is equivalent to place
n +1 −ibeing an ascent (descent) in π, respectively. Furthermore, if in πthe descending
runs are of lengths 
## 1
## , ..., 
m
, then in π
## 
the descending runs are of lengths 
m
## , ..., 
## 1
## .
Recall that U
## L
(b) denotes the set of elements of lattice Lthat cover b. By Theorem4.8
it suffices for us to establish a bijection between 231-avoiding permutations π∈S
n+1
with
exactly kdescents and kpeaks and {r(π) |π∈Pop
## Av
n
## (312)
(Av
n
## (312)), U
## Av
n
## (312)
## (π) =
n −k}. On one hand, take πfrom the former set and we have U
## Av
n
## (312)
## (π
## 
) =n −k, as
having kdescents is equivalent to having n −kascents for elements in S
n+1
. Here, we
use the well-known fact that U
## Av
n
## (312)
(π)equals to the number of ascents in π.
On the other hand, we will show that if U
## Av
n
## (312)
(π) =n −k, then r(π) =π
## 
is
231-avoiding and has exactly kdescents and kpeaks. Being 231-avoiding and having
kdescents are clear. Moreover, Theorem4.7establishes that πhas no double descents
and ends with n +1. Therefore, π
## 
has no double descents either. This implies that the
number of peaks of π
## 
is either equal to or is smaller by 1than the number of its descents,
depending on whether the first index is a descent. Since π
## 
n+1
## =n +2 −π
n+1
=1, we
know that π
## 
has kpeaks. This concludes the proof.

L. Hong / Advances in Applied Mathematics 139 (2022) 10236213
## References
[1]A. Asinowski, C. Banderier, S. Billey, B. Hackl, S. Linusson, Pop-stack sorting and its image:
permutations with overlapping runs, Acta Math. Univ. Comen. 88 (2019) 395–402.
[2]A. Asinowski, C. Banderier, B. Hackl, Flip-sort and combinatorial aspects of pop-stack sorting,
## Discrete Math. Theor. Comput. Sci. 22 (2021).
[3]D.M. Av i s , M. Newborn, On pop-stacks in series, Util. Math. 19 (1981) 129–140.
[4]F. Bergeron, L.F. Préville-Ratelle, Higher trivariate diagonal harmonics via generalized Ta m a r i
posets, J. Comb. 3 (2012) 317–341.
[5]A. Björner, M. Wa ch s , Shellable nonpure complexes and posets. II, Tr a n s . Am. Math. Soc. 349
## (1997) 3945–3975.
[6]C. Ceballos, A. Padrol, C. Sarmiento, The ν-Tamari lattice via ν-trees, ν-bracket vectors, and
subword complexes, Electron. J. Comb. 27 (2020).
[7]A. Claesson, B.A. Guðmundsson, Enumerating permutations sortable by kpasses through a pop-
stack, Adv. Appl. Math. 108 (2019) 79–96.
[8]C. Defant, Meeting covered elements in ν-Tamari lattices, Adv. Appl. Math. 134 (2022).
[9] C. Defant, Pop-stack-sorting for Coxeter groups, https://arxiv .org /abs /2104 .02675.
[10]C. Defant, S. Hopkins, Symmetry of Narayana numbers and rowvacuation of root posets, Fo r u m
## Math. Sigma 9 (2021).
[11] C. Defant, N. Williams, Semidistrim lattices, https://arxiv .org /abs /2111 .08122.
[12]M. Dukes, Revstack sort, zigzag patterns, descent polynomials of t-revstack sortable permutations,
and Steingrímsson’s sorting conjecture, Electron. J. Comb. 21 (2) (2014) P2.2.
[13]M. Elder, Y.K. Goh, k-pop stack sortable permutations and 2-avoidance, Electron. J. Comb. 28
## (2021).
[14]F. Hivert, J.C. Novelli, J.Y. Thibon, The algebra of binary search trees, Theor. Comput. Sci. 339
## (2005) 129–165.
[15]D. Knuth, The Art of Computer Programming, vol. 1: Fundamental Algorithms, Addison–Wesley,
Reading, MA, 1968.
[16]F. Müller-Hoissen, J.M. Pallo, J. Stasheff, Associahedra, Ta m a r i Lattices, and Related Structures,
Progress in Mathematics, vol. 299, Birkhäuser, 2012.
[17]T.K. Petersen, Eulerian Numbers, Birkhäuser, 2015, Section 4.3.
[18]L.F. Préville-Ratelle, X. Viennot, An extension of Ta m a r i lattices, Tr a n s . Am. Math. Soc. 369 (2017)
5219–5239 (assigned the incorrect title “The enumeration of generalized Ta m a r i intervals” by the
journal).
[19]L. Pudwell, R. Smith, Two-stack-sorting with pop stacks, Australas. J. Comb. 74 (2019) 179–195.
[20]N. Reading, Cambrian lattices, Adv. Math. 205 (2006) 313–353.
[21] N.J.A. Sloane, et al., The Online Encyclopedia of Integer Sequences, published electronically at
oeis .org, 2021.
[22]D. Ta m a r i , The algebra of bracketings and their enumeration, Nieuw Arch. Wiskd. (3) 10 (1962)
## 131–146.
[23]J. We s t , Permutations with restricted subsequences and stack-sortable permutations, Ph.D. thesis,
## MIT, 1990.