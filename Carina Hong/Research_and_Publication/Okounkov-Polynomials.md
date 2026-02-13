

arXiv:2008.10069v2  [math.CO]  21 Dec 2020
## TOWARDS HEIM AND NEUHAUSER’S UNIMODALITY CONJECTURE ON
## THE NEKRASOV-OKOUNKOV POLYNOMIALS
## LETONG HONG, SHENGTONG ZHANG
Abstract.LetQ
n
(z) be the polynomials associated with the Nekrasov-Okounkovformula
## ∑
n≥1
## Q
n
## (z)q
n
## :=
## ∞
## ∏
m=1
## (1−q
m
## )
## −z−1
## .
In this paper we partially answer a conjecture of Heim and Neuhauser, which asks ifQ
n
(z) is
unimodal, or stronger, log-concave for alln≥1. Through a new recursive formula, we show that
ifA
n,k
is the coefficient ofz
k
inQ
n
(z), thenA
n,k
is log-concave inkfork≪n
## 1/6
## /lognand
monotonically decreasing fork≫
## √
nlogn. We also propose a conjecture that can potentially close
the gap.
1.Introduction
In their groundbreaking work [8], Nekrasov and Okounkov showed the hook length formula
## 1
## (1.1)
## X
λ
q
## |λ|
## Y
h∈H(λ)
## 
## 1 +
z
h
## 2
## 
## =
## ∞
## Y
m=1
## (1−q
m
## )
## −z−1
## ,
whereλruns over all Young tableaux,|λ|denotes the size ofλ, andH(λ) denotes the multiset of
hook lengths associated toλ. We define
## (1.2)Q
n
## (z) =
## X
## |λ|=n
## Y
h∈H(λ)
## 
## 1 +
z
h
## 2
## 
## .
For example, we can calculate that
## Q
## 0
## (z) = 1,
## Q
## 1
## (z) = 1 +z,
## Q
## 2
## (z) = 2 +
## 5
## 2
z+
## 1
## 2
z
## 2
## ,
## Q
## 3
## (z) = 3 +
## 29
## 6
z+ 2z
## 2
## +
## 1
## 6
z
## 3
## .
The polynomialsQ
n
(z) are of degreenwith positive coefficients and satisfy
## (1.3)
## ∞
## X
n=0
## Q
n
## (z)q
n
## =
## ∞
## Y
m=1
## (1−q
m
## )
## −z−1
## .
The study ofQ
n
(z) was initiated by D’Arcais in [1]
## 2
.  More recently in [6] and [7], Heim and
Neuhauser have been investigating the number theoretic anddistributional properties of theQ
n
## (z).
## Date: August 2020.
## 1
This formula was also obtained concurrently by Westbury(see Proposition 6.1 and 6.2 of [11].) and Han(see [3])
## 2
D’Arcais defined the polynomialP
n
(z) =Q
n
(z−1) via the infinite product, not the hook number expression.
## 1

## 2LETONG HONG, SHENGTONG ZHANG
They proved the identity ([6], Conjecture 1)
## (1.4)Q
n
## (z) =
## X
## |λ|=n
## Y
h∈H(λ)
## ⋄
## 
## 1 +
z
h
## 
whereH(λ)
## ⋄
denotes the multiset of hook lengths associated toλwith trivial legs.
In [6], Heim and Neuhauser conjectured that the polynomialsQ
n
(z) areunimodal. In other words,
let the coefficient ofz
k
inQ
n
(z) asA
n,k
; then there exists some integerk
## 1
∈[0, n] such that
## A
n,i
## ≤A
n,i+1
when 0≤i < k
## 1
andA
n,i
## ≥A
n,i+1
whenk
## 1
≤i < n. They verified via computation
that up ton≤1000, the polynomialsQ
n
(z) are in factlog-concave, which means thatA
## 2
n,k
## ≥
## A
n,k−1
## A
n,k+1
for all 1≤k≤n−1. In this paper we make partial progress towards Heim and
Neuhauser’s conjecture.  We show that the polynomialQ
n
(z) is log-concave at the start, and
monotone decreasing at the tail. Throughout the rest of the paper, the constants inO,≫and≪
are absolute unless otherwise stated.
Theorem 1.1.Fornsufficiently large, we have
## (1) Fork≪
n
## 1/6
logn
, we haveA
## 2
n,k
## ≥A
n,k−1
## A
n,k+1
## .
## (2) Fork≫
## √
nlogn, we haveA
n,k
## ≥A
n,k+1
## .
Remark.By “Fork≪
n
## 1/6
logn
, we have···”, we mean that there exists an absolute constantκ >0
such that the statement holds fork < κ
n
## 1/6
logn
. We will use this notation throughout the rest of the
paper. All the constants could be explicitly computed if onecarefully traces the proof.
We also reduce Heim and Neuhauser’s conjecture to a more “explicit” conjecture.  For positive
integersn, define
σ
## −1
## (n) =
## X
d|n
d
## −1
## ,
and definef(q) to be its generating function
## (1.5)f(q) =
## X
n≥1
σ
## −1
## (n)q
n
## .
We are interested in the behavior ofc
n,k
, the coefficient ofq
n
inf
k
## (q).
## 3
Conjecture 1.2.There exists a constantC >1such that for allk≥2andn≤C
k
, we have
c
## 2
n,k
## ≥c
n−1,k
c
n+1,k
## .
Remark.In the last section we offer some numerical computations with regard to this conjecture.
We believe thatC= 2 is a viable value in the Conjecture.
We show that Conjecture 1.2 implies Heim and Neuhauser’s conjecture fornsufficiently large.
Theorem 1.3.If Conjecture 1.2 is true, then for alln≫log
## −7
C+ 1, the polynomialQ
n
## (z)is
unimodal.
Remark.We believe that Conjecture 1.2 may imply that for all sufficiently largen, the polynomial
## Q
n
(z) is log-concave.
## 3
Using the notationc
n,k
instead ofc
k,n
is more convenient for our purposes.

## THE HEIM AND NEUHAUSER CONJECTURE3
## Acknowledgements
We would like to thank Professor Ken Ono for the proposal of the project and his guidance. We
thank Professor Bernhard Heim and Professor Markus Neuhauser for carefully reviewing the tran-
script and providing helpful feedbacks. We also thank JonasIskander for many helpful discussions.
The research was supported by the generosity of the NationalScience Foundation under grant
DMS-2002265, the National Security Agency under grant H98230-20-1-0012, the Templeton World
Charity Foundation, and the Thomas Jefferson Fund at the University of Virginia.
2.Proof of Theorem 1.1(1)
In this section we show Theorem 1.1(1), which establishes the log-concavity ofA
n,k
whenk≪
n
## 1/6
/logn. Our proof is organized as follows. In Lemma 2.1, we establish a key recursive formula
forA
n,k
which relates it toc
n,k
.  This allows us to translate log-concavity into an asymptotic
estimate forA
n,k
. In Lemma 2.2, we prove an explicit estimate forc
n,k
. This estimate allows us
to show, in Lemma 2.3, thatA
n,k
is close to a log-concave sequence inn, which is enough to show
the desired log-concavity fork.
2.1.A recursive formula forA
n,k
.Our proof is centered around the following observation.
Lemma 2.1.For any non-negative integersa < b, and anyn≥b, we have
## A
n,b
## =
a!
b!
n
## X
i=0
## A
n−i,a
c
i,b−a
## .
Proof.We first note thatf(q) is equal to the log derivative of
## ∞
## Y
m=1
## (1−q
m
## )
## −1
## .
Letkbe any non-negative integer. In (1.3), taking derivative with respect tozforktimes, then
settingz= 0, we get
## 4
## (2.1)
## ∞
## X
n=0
## A
n,k
q
n
## =
## 1
k!
f
k
## (q)
## ∞
## Y
m=1
## (1−q
m
## )
## −1
## .
Applying the above fork=aandk=b, we obtain
## (2.2)
## ∞
## X
n=0
## A
n,b
q
n
## =
a!
b!
f
b−a
## (q)
## ∞
## X
n=0
## A
n,a
q
n
## .
The lemma then follows from the definition ofc
n,k
## .
## 4
Throughout this paper, we defineA
n,k
orc
n,k
to be 0 for all undefined subscripts.

## 4LETONG HONG, SHENGTONG ZHANG
2.2.An asymptotic forc
n,k
andA
n,k
.We now apply Lemma 2.1 on (a, b) = (0, k), giving
## (2.3)A
n,k
## =
## 1
k!
n
## X
i=0
## A
n−i,0
c
i,k
## .
We observe thatA
n−i,0
=p(n−i), wherep(n) is the partition function, which satisfies a well-known
asymptotic obtained by Hardy and Ramanujan that we shall usebelow. Thus, to understand the
behavior ofA
n,k
, it suffices to estimatec
i,k
. However, we are only able to obtain a very crude
estimate.
Lemma 2.2.For any positive integersn≥2, kwithn≥k
## 2
, we have
## X
m≤n
c
m,k
## =
## 
π
## 2
## 6
## 
k
## 
n
k
## 
## 1 +O
## 
k
## 2
logn
n
## 
## .
Proof.We first note that
## X
m≤n
c
m,k
## =
## X
a
## 1
## +···+a
k
## ≤n
σ
## −1
## (a
## 1
## )···σ
## −1
## (a
k
## )
## =
## X
a
## 1
## +···+a
k
## ≤n
## X
d
## 1
## |a
## 1
## ,d
## 2
## |a
## 2
## ,···,d
k
## |a
k
## 1
d
## 1
d
## 2
## ···d
k
## =
n
## X
d
## 1
## ,···,d
k
## =1
## 1
d
## 1
d
## 2
## ···d
k
## #{(x
## 1
,···, x
k
## )∈Z
k
## >0
## :d
## 1
x
## 1
## +···d
k
x
k
## ≤n}.
## (2.4)
We now show that
## (2.5)




## #{(x
## 1
,···, x
k
## )∈Z
k
## >0
## :d
## 1
x
## 1
## +···d
k
x
k
## ≤n}−
n
k
k!d
## 1
## ···d
k




## ≤
n
k−1
## (d
## 1
## +···d
k
## )
## (k−1)!d
## 1
## ···d
k
## .
For each (x
## 1
,···, x
k
## )∈Z
k
## >0
that satisfiesd
## 1
x
## 1
## +···d
k
x
k
≤n, we place a unit cube with the
uppermost vertex at (x
## 1
,···, x
k
). The union of the cubes are contained in the region
## S
## U
## ={(x
## 1
,···, x
k
## )∈R
k
## +
## :d
## 1
x
## 1
## +···d
k
x
k
## ≤n}
and contain the region
## S
## L
## ={(x
## 1
,···, x
k
## )∈R
k
## +
## :d
## 1
x
## 1
## +···d
k
x
k
## ≤n−d
## 1
## −···−d
k
## }.
If we denoteVas volume, then we have
## V(S
## U
## ) =
n
k
k!d
## 1
## ···d
k
## ,
and
## V(S
## L
## ) =
## (n−d
## 1
## −···−d
k
## )
k
k!d
## 1
## ···d
k
## ≥
n
k
## −k(d
## 1
## +···+d
k
## )n
k−1
k!d
## 1
## ···d
k
by Bernoulli inequality. Thus we get (2.5).
Plugging (2.5) to (2.4), we conclude that
## X
m≤n
c
m,k
## =R+
n
## X
d
## 1
## ,···,d
k
## =1
## 1
d
## 1
d
## 2
## ···d
k
n
k
k!d
## 1
## ···d
k
## =R+
## 
π
## 2
## 6
## 
k
## 
n
k
## 
## 1 +O
## 
k
## 2
n
## 

## THE HEIM AND NEUHAUSER CONJECTURE5
where the error termRis controlled by
## |R|≤
n
## X
d
## 1
## ,···,d
k
## =1
## 1
d
## 1
d
## 2
## ···d
k
n
k−1
## (d
## 1
## +···d
k
## )
## (k−1)!d
## 1
## ···d
k
## =k
n
k−1
## (k−1)!
n
## X
d
## 1
## ,···,d
k
## =1
## 1
d
## 1
d
## 2
## 2
d
## 2
## 3
## ···d
## 2
k
## ≪
n
k−1
## (k−1)!
## ·k
## 
π
## 2
## 6
## 
k−1
logn.
Combining the error terms, we conclude the lemma.
With this lemma we can get an asymptotic estimate forA
n,k
whennis much larger thank.
Lemma 2.3.For any positive integersn≥2, kwithn≥k
## 4
log
## 4
k, we have
## A
n,k
## =
## 
## 1 +O
## 
(2 logn)
## −k
## +
k
## 2
log
## 2
n
## √
n
## 
## 1
k!
## 
π
## 2
## 6
## 
k
n
## X
i=0
p(n−i)
## 
i−1
k−1
## 
## .
Proof.We recall the Hardy-Ramanujan formula forp(n) in [5],
## (2.6)p(n)∼
e
π
## √
## 2/3
## √
n
## 4
## √
## 3n
## .
By partial summing the recursive formula (2.3), we obtain
## A
n,k
## =
## 1
k!
n
## X
i=0
## (p(n−i)−p(n−i−1))
## X
j≤i
c
j,k
where we letp(−1) = 0.
## 5
Notice that the terms with smallicould be upper bounded, as we have
## X
i≤
## √
n/logn
## (p(n−i)−p(n−i−1))
## X
j≤i
c
j,k
## ≤p(n)
## X
j≤
## √
n/logn
c
j,k
## ,
while we also have
## X
i∈[2
## √
n,3
## √
n]
## (p(n−i)−p(n−i−1))
## X
j≤i
c
j,k
## ≥(p(n−⌈2
## √
n⌉)−p(n−⌊3
## √
n⌋))
## X
j≤2
## √
n
c
j,k
## .
By the asymptotic formula for the partition number (2.6), weobtain
p(n)≍p(n−⌈2
## √
n⌉)−p(n−⌊3
## √
n⌋),
while by Lemma 2.2, we have, form=⌊
## √
n/logn⌋andm=⌊2
## √
n⌋,
## X
j≤m
c
j,k
## =
## 
## 1 +O
## 
k
## 2
logm
m
## 
π
## 2
## 6
## 
k
## 
m
k
## 
## .
## Whenn≥k
## 4
log
## 4
k, the big-O term is small, and we get
## X
j≤
## √
n/logn
c
j,k
≪(2 logn)
## −k
## X
j≤2
## √
n
c
j,k
## .
## 5
Note thatp(n) is monotone increasing, thus all the terms are positive.

## 6LETONG HONG, SHENGTONG ZHANG
Therefore, the terms with smalliis small compared with the termsi∈[2
## √
n,3
## √
n], and we obtain
## A
n,k
## =
## 
1 +O((2 logn)
## −k
## )
## 
## 1
k!
## X
i∈[
## √
n/logn,n]
## (p(n−i)−p(n−i−1))
## X
j≤i
c
j,k
## .
We apply Lemma 2.2, and obtain
## X
j≤i
c
j,k
## =
## 
## 1 +O
## 
k
## 2
logi
i
## 
π
## 2
## 6
## 
k
## 
i
k
## 
## .
Since in the summation we havei≥
## √
n/logn, we conclude that
## A
n,k
## =
## 
## 1 +O
## 
(2 logn)
## −k
## +
k
## 2
log
## 2
n
## √
n
## 
## 1
k!
## X
i∈[
## √
n/logn,n]
## (p(n−i)−p(n−i−1))
## 
π
## 2
## 6
## 
k
## 
i
k
## 
## .
We could go through the above argument again to sum starting from 1 instead of
## √
n/lognwith
a negligible error (dominated again by the termsi∈[2
## √
n,3
## √
n]). Simplifying, we get the desired
conclusion
## A
n,k
## =
## 
## 1 +O
## 
(2 logn)
## −k
## +
k
## 2
log
## 2
n
## √
n
## 
## 1
k!
## 
π
## 2
## 6
## 
k
n
## X
i=1
p(n−i)
## 
i−1
k−1
## 
## .
Remark.From this lemma it is easy to derive an explicit asymptotic forA
n,k
asn→∞by simply
plugging in the asymptotic forp(n).  However, for our application it is simpler to leaveA
n,k
unsimplified in the current form.
2.3.Proof of Theorem 1.1(1).We now note that Lemma 2.3 essentially tells us thatA
n,k
is
close to a log-concave sequence inn. This, together with an application of Lemma 2.1, directly
implies the desired result.
Lemma 2.4.Forn≥k
## 4
log
## 4
k, we have
## A
n,k
## =
## 
## 1 +O
## 
(2 logn)
## −k
## +
k
## 2
log
## 2
n
## √
n
## 
## ̃
## A
n,k
## ,
where
## ̃
## A
n,k
is a log-concave sequence inn.
Proof.Lemma 2.3 says that
## A
n,k
## =
## 
## 1 +O
## 
(2 logn)
## −k
## +
k
## 2
log
## 2
n
## √
n
## 
## 1
k!
## 
π
## 2
## 6
## 
k
n
## X
i=1
p(n−i)
## 
i−1
k−1
## 
## .
By (2.6), we havep(⌈
## √
n⌉)≫e
n
## 1/5
p(25), while
##  
n−1
k−1
## 
## ≍
##  
n−⌈
## √
n⌉−1
k−1
## 
. Thus the summation term
withi=n−⌈
## √
n⌉dominate the tail termsi∈[n−25, n], and it follows that
## A
n,k
## =
## 
## 1 +O
## 
(2 logn)
## −k
## +
k
## 2
log
## 2
n
## √
n
## 
## 1
k!
## 
π
## 2
## 6
## 
k
n−26
## X
i=1
p(n−i)
## 
i−1
k−1
## 
## .
By [2], the sequencep(n)
## (n≥25)
is log-concave, and the binomial polynomial
##  
n
k−1
## 
is log-concave in
n. Therefore, the series
e
## A
n,k
## =
## 1
k!
## 
π
## 2
## 6
## 
k
n−26
## X
i=1
p(n−i)
## 
i−1
k−1
## 

## THE HEIM AND NEUHAUSER CONJECTURE7
is the convolution of two log-concave series, and is therefore log-concave by Hoggar’s Theorem([4]).
We thus obtain the lemma.
Remark.Numerical evidence suggests that for allk≥2, the sequenceA
n,k
is log-concave inn.
Unfortunately, this statement seems to be even harder than Heim and Neuhauser’s conjecture.
Proof of Theorem 1.1(1).For convenience, we replacekwithk+ 1. We use Lemma 2.1 for (a, b) =
(k, k+ 1) and (a, b) = (k, k+ 2), and get
## (2.7)A
n,k+1
## =
## 1
k
n
## X
i=0
## A
n−i,k
σ
## −1
## (i)
and
## (2.8)A
n,k+2
## =
## 1
k(k+ 1)
## X
i,j≥0,i+j≤n
## A
n−i−j,k
σ
## −1
## (i)σ
## −1
## (j).
By (2.6), for any 0≤x≤n/2, we have
p(⌊n/2⌋+x)≫e
## 0.5
## √
n
p(x).
Thus, comparing (2.3) term by term, for alli≤n/2, we have
## A
n−1,k
## ≫e
## 0.5
## √
n
## A
i,k
## .
## Sinceσ
## −1
(i)∈[1,2 + logi], we conclude that the terms in (2.7) withi≥
n
## 2
are all negligible
compared to the termi= 1. Absorbing them into the error term, we get
## A
n,k+1
## =
## 
## 1 +O
## 
e
## −0.4
## √
n
## 
## 1
k
## ⌊n/2⌋
## X
i=0
## A
n−i,k
σ
## −1
## (i).
Applying Lemma 2.4, we get
## A
n,k+1
## =
## 
## 1 +O
## 
(2 logn/2)
## −k
## +
k
## 2
log
## 2
n
## √
n
## 
## 1
k
## ⌊n/2⌋
## X
i=0
## ̃
## A
n−i,k
σ
## −1
## (i).
Similarly, from (2.8) and Lemma 2.4 we get
## A
n,k
## =
## 
## 1 +O
## 
(2 logn/2)
## −k
## +
k
## 2
log
## 2
n
## √
n
## 
## ̃
## A
n,k
## ,
and
## A
n,k+2
## =
## 
## 1 +O
## 
(2 logn/2)
## −k
## +
k
## 2
log
## 2
n
## √
n
## 
## 1
k(k+ 1)
## ⌊n/2⌋
## X
i,j=0
## ̃
## A
n−i−j,k
σ
## −1
## (i)σ
## −1
## (j).
We note that by the log-concavity of
## ̃
## A
n,k
, we have
## ̃
## A
n,k
## ⌊n/2⌋
## X
i,j=0
## ̃
## A
n−i−j,k
σ
## −1
## (i)σ
## −1
## (j)≤
## ⌊n/2⌋
## X
i,j=0
## ̃
## A
n−i,k
## ̃
## A
n−j,k
σ
## −1
## (i)σ
## −1
## (j) =
## 
## 
## ⌊n/2⌋
## X
i=0
## ̃
## A
n−i,k
σ
## −1
## (i)
## 
## 
## 2
## .
Thus, it follows that
## A
n,k
## A
n,k+2
## A
## 2
n,k+1
## ≤
k
k+ 1
## 
## 1 +O
## 
(2 logn/2)
## −k
## +
k
## 2
log
## 2
n
## √
n
## 
## .

## 8LETONG HONG, SHENGTONG ZHANG
Since we assume thatn≫k
## 6
log
## 6
k, with the implicit constant sufficiently large, the big-O term is
at most
## 1
k
. In this case, we getA
n,k
## A
n,k+2
## ≤A
## 2
n,k+1
as desired.
3.Proof of Theorem 1.1(2)
3.1.Unsigned Stirling numbers of the first kind.Let
## 
n
m
## 
denote the absolute values of the
Stirling numbers of the first kind, i.e. they satisfy
## X
m
h
n
m
i
t
m
## =t(t+ 1)···(t+n−1),
and letH
n
denote then-th harmonic number. Sibuya [9] proved the following inequality:
## 
n
m
## 
## 
n
m−1
## 
## ≤
n−m+ 1
## (n−1)(m−1)
## H
n−1
## ≤
## H
n−1
m−1
## ,
which gives us, form≥2H
n
+ 1, that
## 
n+1
m+t+1
## 
## 
n+1
m+1
## ≤
## 
## H
n
m
## 
t
## ≤2
## −t
## .
The following lemma is useful to our proof.
Lemma 3.1.Letr=⌈log
## 2
n⌉, and we are given a sequence{k
j
## }. Defines
j
## = 2⌈H
k
j
## ⌉+r+ 1for
k
j
6= 0and0otherwise, and take their sums=
## P
j
s
j
. We have
## (3.1)
## X
l
## 1
## +···+l
n
## =s,
l
j
## ≤k
j
## .
## Y
j
## 
k
j
## + 1
l
j
## + 1
## 
## ≤
## X
l
## 1
## +···+l
n
## =s−r,
l
j
## ≤k
j
## .
## Y
j
## 
k
j
## + 1
l
j
## + 1
## 
## .
Proof.Letpbe the index of the first term satisfyingl
p
## ≥s
p
. We writel
## ′
j
## =l
j
forj6=pand
l
## ′
p
## =l
p
−r. Recall that
## 
n+ 1
m+t+ 1
## 
## ≤2
## −t
## 
n+ 1
m+ 1
## 
## ,
whenm≥2H
n
+ 1. We note that
l
## ′
p
## =l
p
## −r≥s
p
−r= 2⌈H
k
p
## ⌉+ 1,
and so we obtain
## (3.2)
## Y
j
## 
k
j
## + 1
l
j
## + 1
## 
## ≤2
## −⌈log
## 2
n⌉
## Y
j
## "
k
j
## + 1
l
## ′
j
## + 1
## #
## ≤
## 1
n
## Y
j
## "
k
j
## + 1
l
## ′
j
## + 1
## #
## .
For each tuple (l
## 1
, l
## 2
, . . . , l
n
) such that
## P
j
l
j
## =sandl
j
## ≤k
j
, we leti
## 0
be the firstisuch that
l
i
## ≥s
i
, and send it to (l
## 1
,···, l
i
## 0
## −1
, l
i
## 0
−r, l
i
## 0
## +1
,···, l
n
). Combining (3.2) and this correspondence
and noting that each term of the right hand side’s summation of (3.1) has at mostnpreimages,
we obtain our result.

## THE HEIM AND NEUHAUSER CONJECTURE9
Proof of Theorem 1.1(2).We letk
j
## := #{i|λ
i
=j}. By Corollary 2 of [6], we have
n
## X
k=0
## A
n,k
z
k
## =
## X
## |λ|=n
n
## Y
j=1
## 
k
j
## +z
k
j
## 
## .
Since all the roots of the polynomial
## (3.3)
n
## Y
j=1
## 
k
j
## +z
k
j
## 
## =
## X
k
q
k
z
k
are real, the coefficients{q
k
}form a log-concave thus unimodal sequence [10]. We next prove that
the mode is at mostO(
## √
nlogn) for thesek
j
satisfying the obvious identityk
## 1
## +2k
## 2
## +···+nk
n
## =n.
Using (3.3), we directly calculate
q
k
## =C
## 0
## X
l
## 1
## +···+l
n
## =k,
l
j
## ≤k
j
## .
## Y
j
## 
k
j
## + 1
l
j
## + 1
## 
## ,
where the constantC
## 0
## =
## Q
j
## 1
k
j
## !
. By Lemma 3.1, we can compare that
q
s
## ≤q
s−r
## .
## Since
## P
jk
j
=n, the sums=
## P
s
j
## =
## P
k
j
## 6=0
O(logn) is of the asymptoticO(
## √
nlogn).  The
unimodality of{q
k
}implies thatk≫
## √
nlognexceeds the mode.  Therefore, the coefficients
## {A
n,k
}are monotonically decreasing inkas we desire.
4.On Conjecture 1.2 and Theorem 1.3
4.1.Proof of Theorem 1.3.As we have seen in Section 2, the main setback in our method is that
we are unable to derive a good asymptotic forc
n,k
. Conjecture 1.2 is based on numerical compu-
tation, and its truth represents the obstruction for establishing Heim and Neuhauser’s Conjecture
for largen. In particular, its truth leads to a vastly improved form of Lemma 2.4.
Lemma 4.1.Assume Conjecture 1.2. Then for allk≥2andk
## 3/2
≤n≤C
k
, we have
## (4.1)A
n,k
## =
## 
## 1 +O
## 
e
## −n
## 0.1
## 
b
## A
n,k
where
b
## A
n,k
is a log-concave sequence inn.
Proof.Recall that
## A
n,k
## =
## 1
k!
n
## X
i=0
p(n−i)c
i,k
## .
The sequence is thus almost the convolution of two log-concave sequences. It suffices to trim away
the termsi≥n−25. We first recall from the proof of Lemma 2.2 that
c
n,k
## ≤
n
k
k!
## 
π
## 2
## 6
## 
k
## .

## 10LETONG HONG, SHENGTONG ZHANG
## Since{c
i,k
## }
i≤n
is log-concave by the assumed Conjecture 1.2, for any 0≤l≤n−kwe have
c
n,k
c
n−l,k
## ≤
## 
c
n,k
c
k,k
## 
l
n−k
## .
While by (2.6),
p(l)≫e
## 0.5
## √
l
## .
## Takingl=⌈n
## 1/3
⌉, we conclude that
p(l)c
n−l,k
## ≫e
n
## 0.1
c
n,k
## .
Sincel >25 forn >25
## 3
, it follows that
## A
n,k
## =
## 
## 1 +O
## 
e
## −n
## 0.1
## 
## 1
k!
n−26
## X
i=0
p(n−i)c
i,k
## .
Since both{c
i,k
## }
## (i≤n)
and{p(n)}
## (n≥26)
are log-concave sequences(again see [2]), the sequence
b
## A
n,k
## =
## 1
k!
n−26
## X
i=0
p(n−i)c
i,k
is the convolution of two log-concave sequences, thus is log-concave by Hoggar’s Theorem([4]). So
we have shown the lemma.
Proof of Theorem 1.3.By Theorem 1.1, it suffices to show, for all sufficiently largenand
n
## 1/6
logn
## ≪
k≪
## √
nlogn, that
## A
## 2
n,k+1
## ≥A
n,k
## A
n,k+2
## .
## Sincen≫log
## −7
C+ 1, for allkin this range we have 2k
## 3/2
≤n≤C
k
. By the proof of Theorem
1.1, we get
## A
n,k+1
## =
## 
## 1 +O
## 
e
## −0.4
## √
n
## 
## 1
k
## ⌊n/2⌋
## X
i=0
## A
n−i,k
σ
## −1
## (i).
By Lemma 4.1, we conclude that
## A
n,k+1
## =
## 
## 1 +O
## 
e
## −n
## 0.1
## 
## 1
k
## ⌊n/2⌋
## X
i=0
## ˆ
## A
n−i,k
σ
## −1
## (i).
Similarly, we have
## A
n,k
## =
## 
## 1 +O
## 
e
## −n
## 0.1
## 
## ˆ
## A
n,k
and
## A
n,k+2
## =
## 
## 1 +O
## 
e
## −n
## 0.1
## 
## 1
k(k+ 1)
## ⌊n/2⌋
## X
i,j=0
## ˆ
## A
n−i−j,k
σ
## −1
## (i)σ
## −1
## (j).
We note that by the log-concavity of
## ˆ
## A
n,k
fork
## 3/2
≤n≤C
k
, we have
## ˆ
## A
n,k
## ⌊n/2⌋
## X
i,j=0
## ˆ
## A
n−i−j,k
σ
## −1
## (i)σ
## −1
## (j)≤
## 
## 
## ⌊n/2⌋
## X
i=0
## ˆ
## A
n−i,k
σ
## −1
## (i)
## 
## 
## 2
## .
Thus, we obtain the desired conclusion. Namely, we have that
## A
n,k
## A
n,k+2
## ≤
k
k+ 1
## 
## 1 +O
## 
e
## −n
## 0.1
## 
## A
## 2
n,k+1
## .

## THE HEIM AND NEUHAUSER CONJECTURE11
4.2.Numerical Evidence for Conjecture 1.2.We are unable to show Conjecture 1.2.  Nu-
merical evidence does suggest that Conjecture 1.2 is likelyto hold forC= 2. Letn
## 0
(k) denote
the smallestnsuch thatc
## 2
n,k
< c
n−1,k
c
n+1,k
.  The following table shows the value ofn
## 0
(k) for
## 2≤k≤13.
k2345678910111213
n
## 0
## (k)621397313525147591718013595725914787
Remark.We also note that Conjecture 1.2 seems to generalize to otherseries whose terms display
a similar behavior, such as
f(z) =
z
## 1−z
## +
z
## 2
## 2(1−z
## 2
## )
## .
Investigating this phenomenon might be interesting on its own.
## References
[1] F. D’Arcais,D ́eveloppement en s ́eries, Interm ́ediaire Math. 20 (1913), 233–234.
[2] S. DeSalvo and I. Pak,Log-concavity  of  the  partition  function, Ramanujan J. 38 (2015), no. 1, 61–73,
https://doi.org/10.1007/s11139-014-9599-y.
[3] G.-N. Han,Discovering new hook length formulas by expansion technique, Electron. J. Combin. 15 (1) (2008),
## R133.https://doi.org/10.37236/857.
[4] S. G. Hoggar.Chromatic polynomials and logarithmic concavity, J. Combinatorial Theory Ser. B, 16:248–254,
## 1974.https://doi.org/10.1016/0095-8956(74)90071-9
[5] G. H. Hardy and S. Ramanujan,Asymptotic formula in combinatory analysis, Proceedings of the London Math-
ematical Society, 2-17 (1), 75–115 (1918).https://doi.org/10.1112/plms/s2-17.1.75.
[6] B. Heim and M. Neuhauser,On conjectures regarding the Nekrasov-Okounkov hook length formula, Arch. Math.
(Basel) 113 (2019), no. 4, 355–366,https://doi.org/10.1007/s00013-019-01335-4.
[7] B. Heim and M. Neuhauser,The Dedekind eta function and D’Arcais-type polynomials, Res Math Sci 7, 3 (2020),
https://doi.org/10.1007/s40687-019-0201-5.
[8] N. Nekrasov and A. Okounkov,Seiberg–Witten theory and random partitions, The unity of mathematics, Progr.
Math. 244 Birkh ̈auser Boston, 525–596 (2006),https://doi.org/10.1007/0-8176-4467-9_15.
[9] M. Sibuya,Log-Concavity of Stirling Numbers and Unimodality of Stirling Distributions, Ann Inst Stat Math 40,
693–714 (1988).https://doi.org/10.1007/BF00049427.
[10] R. Stanley,Log-concave  and unimodal sequences  in algebra,  combinatorics,  and geometry, Annals of the New
York Academy of Sciences 576(1): 500 - 535 (2006).
[11] B.  Westbury,Universal   characters   from   the   Macdonald   identities,  Adv.  Math.  202  (2006),  50-63,
https://doi.org/10.1111/j.1749-6632.1989.tb16434.x.
Department of Mathematics, Massachusetts Institute of Technology, Cambridge, MA 02139
Email address:clhong@mit.edu, stzh1555@mit.edu