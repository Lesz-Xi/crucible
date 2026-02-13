

arXiv:2112.15081v2  [math.CO]  17 Nov 2022
## LENGTH-FOUR PATTERN AVOIDANCE IN INVERSION SEQUENCES
## LETONG HONG AND RUPERT LI
Abstract.Inversion sequences of lengthnare integer sequencese
## 1
, . . . , e
n
with 0≤e
i
< i
for alli, which are in bijection with the permutations of lengthn. In this paper, we classify all
Wilf equivalence classes of pattern-avoiding inversion sequences oflength-4 patterns except
for one case (whether 3012≡3201) and enumerate some of the length-4 pattern-avoiding
inversion sequences that are in the OEIS.
1.Introduction
Pattern avoidance for permutations is a robust and well-established branch of enumerative
combinatorics. We refer readers to Stanley [18] for an overview of this field, and to Simion
and Schmidt [16] in 1985 for the first systematic study of pattern avoidance on permutations.
Classical pattern avoidance represents permutations using one-line notationπ=π
## 1
## ···π
n
## ;
an alternative representation for permutations is usinginversion sequencese=e
## 1
## ···e
n
## ,
sequences of integers such that 0≤e
i
< ifor alli.  Inversion sequences are in natural
bijection with permutations via the well-known Lehmer code [8], an example of an inversion
table: one can biject an inversion sequenceeto a permutationπvia ensuring that for each
i, there existe
i
valuesj < isuch thatπ
j
> π
i
. Inversion sequences have been studied in
many contexts and fields, not just pattern avoidance; for example, see Savage and Schuster
## [15].
The study of pattern avoidance on inversion sequences was concurrently initiated by Man-
sour and Shattuck [12] in 2015 and Corteel, Martinez, Savage, andWeselcouch [6] in 2016.
The former obtained the explicit number and/or generating function of inversion sequences
avoiding any element ofS
## 3
; the latter further enumerated the number of pattern-avoiding
sequences for all patterns of length 3 and related these quantities to well-known combina-
torial sequences including the Bell numbers, Euler up/down numbers, Fibonacci numbers,
and Schr ̈oder numbers.  For patterns of length 4, Chern [4] proved the exact formula for
0012-avoiding inversions, answering a conjecture by Lin and Ma (see the end of [9]) in 2020.
However, the enumeration, or even the determination of the Wilf equivalence classes, for
all other patterns of length 4 remains open. For simultaneous avoidance of multiple pat-
terns, Lin and Yan [10] in 2020 studied inversion sequences avoiding certain combinations
of two length-3 patterns by establishing correspondences with objects enumerated by the
## Date: November 21, 2022.
## 1

## 2LETONG HONG AND RUPERT LI
Bell numbers, Fishburn numbers, powered Catalan numbers, semi-Baxter numbers, and 3-
noncrossing partitions. In 2018, Martinez and Savage [13] rephrased and generalized the
question, investigating the avoidance of triples of binary relations,that is, no simultaneous
appearancese
i
## R
## 1
e
j
## ,e
j
## R
## 2
e
k
, ande
i
## R
## 3
e
k
are allowed to appear withi < j  < kfor some
givenR
## 1
## , R
## 2
## , R
## 3
∈ {<, >,≤,≥,=,6=,−}. On the other hand, in 2019 Auli and Elizalde [1]
enumerated the length-3 consecutive pattern-avoiding inversionsequences as well as clas-
sified consecutive patterns up to length 4 according to the corresponding Wilf equivalence
relations. In a following 2021 paper [3], the same authors gave a complete list of generalized
Wilf equivalences between hybrid vincular patterns of length 3, completing the classification
of Wilf equivalence classes for all vincular patterns of length 3. Theyfurther built on Mar-
tinez and Savage’s framework and extended the enumeration to inversion sequences avoiding
e
i
## R
## 1
e
i+1
## R
## 2
e
i+2
configurations [2] in 2019.
Our main result classifies all Wilf equivalence classes for length-4 patterns, except one
unresolved case of 3012 possibly belonging to the last class, as demarcated below by a
question mark.  A computer search for lengthsn≤10 demonstrates that no other Wilf
equivalences are possible: in particular, 2001 agrees with the second Wilf equivalence class
2110≡2101≡2011 for all lengthsn≤9, but diverges atn= 10.
## (1)
## 1011≡1101≡1110
## 2110≡2101≡2011
## 0221≡0212
## 0312≡0321
## 1102≡1012
## 2201≡2210
## 2301≡2310
## 3201≡3210
## ?
## ≡3012.
Theorem 1.1.Length-4 patterns satisfy the Wilf equivalences listed in Eq.(1), with possible
exception as demarcated with a question mark.
The paper is organized as follows. In Section 2, we introduce necessary definitions and no-
tation. In Section 3, we establish the aforementioned equivalencesusing techniques including
double induction and direct characterization, together with explicitly constructed correspon-
dences. In Section 4, we enumerate the 0000 and 0111-avoiding inversion sequences. Aside
from 0012 as addressed by Chern [4], the only other length-4 pattern that is on the OEIS
[17] is 0021, whose enumeration we leave as an open question, which after the writing of the
original version of this paper has been resolved (see Remark 4.4).

## LENGTH-FOUR PATTERN AVOIDANCE IN INVERSION SEQUENCES3
2.Preliminaries
For a positive integern, let [n] denote the set{1,2, . . . , n}.  An inversion sequence of
lengthnis a sequencee=e
## 1
## ···e
n
of integers such that 0≤e
i
< ifor alli∈[n]. We denote
the length ofeby|e|=n. The set of inversion sequences of lengthnis denoted byI
n
, where
we use the convention thatI
## 0
contains exactly one sequence, the empty sequence.
Two sequences of integersπ=π
## 1
## ···π
k
andσ=σ
## 1
## ···σ
k
of the same length are said
to beorder isomorphic, denotedπ∼σ, if bothπ
i
## Rπ
j
andσ
i
## Rσ
j
have the same relation
R∈ {<,=, >}, for all 1≤i, j≤n. For example, 0212∼5969. Apatternrefers to such a
sequence of integersπ=π
## 1
## ···π
k
## .
For an inversion sequencee∈I
n
and a patternπ=π
## 1
## ···π
k
fork≤n, we sayecontains
πas a pattern if there is a not necessarily consecutive subsequencee
## ′
ofewith|e
## ′
## |=ksuch
thate
## ′
∼π. ForS⊆[n], we lete
## S
denote the subsequence ofeconsisting of the elements
e
i
fori∈S, sorted in ascending order ofi. Using this notation,econtainsπif there exists
S⊆[n] with|S|=ksuch thate
## S
∼π. Ifedoes not containπ, it is said toavoidπ. In
particular, if|e|<|π|, we also sayeavoidsπ. The same definition can be used to define
pattern avoidance on permutations.
Theavoidance classofπis
## I
n
(π) ={e∈I
n
## |eavoidsπ}.
We say two patternsπandσareWilf equivalent, denotedπ≡σ, if for alln≥1, we have
## |I
n
(π)|=|I
n
## (σ)|.
We now define the following generalization of an inversion sequence, as originally intro-
duced by Savage and Schuster [15].
Definition 2.1.For a finite set of positive integersS⊂Z
## +
enumerated in increasing order
s
## 1
<···< s
n
, anS-inversion sequenceis a sequencee=e
## 1
## ···e
n
of lengthnsuch that
## 0≤e
i
< s
i
for alli∈[n]. The set ofS-inversion sequences is denoted byI
## S
## .
Notice that forS= [n], we recover the original definition of an inversion sequence of
lengthn, i.e.,I
## [n]
## =I
n
. We continue to use the same notation for pattern avoidance on
S-inversion sequences as on inversion sequences:I
## S
(π) is the set ofS-inversion sequences
that avoidπ. We note that we defineI
## ∅
to contain the empty sequence, which avoids all
patterns, consistent with the previous observation thatI
## [n]
## =I
n
whenn= 0.
Finally, definee·fas the concatenation of sequenceseandf. For example,e·f= 142857
fore= 14 andf= 2857.
3.Wilf equivalences of length-4 patterns
Before we prove the Wilf equivalences of length-4 patterns, we present the following useful
result.

## 4LETONG HONG AND RUPERT LI
Theorem 3.1.For anyn≥1and a patternπ=π
## 1
## ···π
k
whereπ
## 1
## = 0andπ
i
>0for all
i >1,
## |I
n
## (π)|=
## ∑
## S⊆[n−1]
## |I
## S
## (π
## 2
## ···π
k
## )|.
Proof.Defineπ
## ′
## =π
## 2
## ···π
k
. Notice that all elements ofπ
## ′
are positive. Considere∈I
n
## ,
and letSbe the set of indicesi∈[2, n] such thate
i
>0. We claim thate
## S
avoidsπ
## ′
if and
only ifeavoidsπ. Ife
## S
containsπ
## ′
, then supposee
i
## 1
## ···e
i
k−1
## ∼π
## ′
fori
## 1
, . . . , i
k−1
∈S. By
definition ofS, we havee
i
## 1
, . . . , e
i
k−1
>0, and thus adding ine
## 1
= 0 yieldse
## 1
e
i
## 1
## ···e
i
k−1
## ∼π.
Conversely, ifecontainsπ, supposee
i
## 0
## ···e
i
k−1
## ∼πfor 1≤i
## 0
< i
## 1
<···< e
i
k−1
## ≤n.
Then as all elements ofπare positive except forπ
## 1
= 0, we havee
i
## 1
, . . . , e
i
k−1
> e
i
## 0
≥0, so
e
i
## 1
## ···e
i
k−1
## ∼π
## ′
is a subsequence ofe
## S
, which thus containsπ
## ′
## .
LetS
## −
={s−1|s∈S}. Notice thate
## −
## S
is aS
## −
-inversion sequence, and there is a natural
bijection betweenI
## S
## −
and the elements ofI
n
withe
i
>0 if and only ifi∈S. Thus, for a
fixed subsetS⊆[2, n], the number of elements ofI
n
(π) withe
i
>0 if and only ifi∈Sis
equal to|I
## S
## −
## (π
## ′
)|. Summing over all such subsetsSand re-indexing overS
## −
instead yields
the result.
The following result was initially stated for inversion sequences rather thanS-inversion
sequences, but we note that the same proof works to obtain the following stronger result.
Theorem 3.2([6, Theorem 5]).For any finite setSof positive integers,
## |I
## S
## (210)|=|I
## S
## (201)|.
This allows us to prove that 0312 and 0321 are Wilf equivalent.
Theorem 3.3.Forn≥1,
## |I
n
## (0312)|=|I
n
## (0321)|=
## ∑
## S⊆[n−1]
## |I
## S
## (210)|.
Proof.The result follows from applying Theorem 3.2 to Theorem 3.1.
3.1.Wilf equivalences by double induction.The following lemma is useful for many of
our later results. Abinary wordof lengthnis an element of{0,1}
n
, i.e., a string ofnzeros
and ones. Pattern avoidance on binary words is defined analogously.
Lemma 3.4.Letπ=π
## 1
## ···π
## ℓ
be a pattern of lengthℓ≥2such thatπ
i
∈{0,1}for alli, and
there exists exactly onejsuch thatπ
j
= 0. Then for any two integersj, k≥0, the number
of binary words of lengthj+kwithjzeros andkones that avoidπis
## (
j+min{k,ℓ−2}
j
## )
## .
Proof.There are
## (
j+k
k
## )
binary words of lengthj+kwithjzeros andkones, corresponding to
choosing the positions of the ones. Ifk≤ℓ−2, asπhasℓ−1 ones, all of these binary words
avoidπ, so there are
## (
j+k
k
## )
## =
## (
j+min{k,ℓ−2}
j
## )
valid binary words. Ifk≥ℓ−1, supposeπ
j
for

## LENGTH-FOUR PATTERN AVOIDANCE IN INVERSION SEQUENCES5
j∈[ℓ] is the unique zero inπ. Ifj= 1 orj=ℓ, then all butℓ−2 of thekones must be at
the beginning or end of the binary word, respectively, which yields
## (
j+ℓ−2
## ℓ−2
## )
## =
## (
j+min{k,ℓ−2}
j
## )
valid binary words. Otherwise 2≤j≤ℓ−1, and then thei-th and (i+ 1)-th ones of any
valid binary word must be consecutive, for allj−1≤i≤k+j−ℓ. If this were not the case,
then suppose there exists such aniwhere thei-th and (i+ 1)-th ones are not consecutive.
Then the (i−j+ 2)-th throughi-th ones, a zero between thei-th and (i+ 1)-th ones, and
the (i+ 1)-th through (i+ℓ−j)-th ones, form aπpattern. Notice thati−j+ 2≥1 and
i+ℓ−j≤k, so the indices are valid. Note that this condition is a necessary and sufficient
condition for the binary word to avoidπ. Thus, the (j−1)-th through (k+j−ℓ+ 1)-th
ones in the binary word are consecutive; viewing this block ofk−ℓ+ 3 ones as a single
entity allows us to determine that there are
## (
j+k−(k−ℓ+2)
j
## )
## =
## (
j+min{k,ℓ−2}
j
## )
such valid binary
words.
Lemma 3.4 allows us to prove the following result.
Theorem 3.5.Letπ=π
## 1
## ···π
## ℓ
andσ=σ
## 1
## ···σ
## ℓ
be two patterns of lengthℓ≥3such that
π
i
, σ
i
∈ {0,1}for all2≤i≤ℓandπ
## 1
## =σ
## 1
= 1. If there exists exactly onejsuch that
π
j
= 0and exactly onej
## ′
such thatσ
j
## ′
= 0, then for any finite setSof positive integers,
## |I
## S
(π)|=|I
## S
## (σ)|.
Proof.Letx
## S,j,k
denote the number ofπ-avoidingS-inversion sequences withjzeros andk
ones, and similarly definey
## S,j,k
forσ-avoidance. We will prove the refinement thatx
## S,j,k
## =
y
## S,j,k
for allS,j, andkby induction on|S|.
When|S|< ℓ, the result trivially holds as allS-inversion sequences avoid all patterns of
lengthℓ. For the inductive step, assume the result holds for allSwith|S|=n−1; we
will show the result holds for allSwith|S|=nvia a second induction on minS. For the
base case minS= 1, anye∈I
## S
hase
## 1
= 0, which cannot be part of aπorσpattern,
soe=e
## 1
## ···e
n
## ∈I
## S
avoidsπif and only ife
## 2
## ···e
n
avoidsπ, and similarly forσ. Hence,
x
## S,j,k
## =x
## S\{1},j−1,k
## =y
## S\{1},j−1,k
## =y
## S,j,k
## .
Now assume the result holds for allSof sizenwith minS=m−1≥1; we will show the
result holds for allSwithS=m. Consider a givenSof sizenwith minS=m≥2, and
letS
## −
={s−1|s∈S}. Defineφ:I
## S
## →I
## S
## −
byφ(e
## 1
## ···e
n
## )
i
= max{e
i
−1,0}. Notice that
π-avoidance andσ-avoidance are both preserved underφ.
Consider aπ-avoidingS-inversion sequencee
## ′
withjzeros andkones. Thenφ(e
## ′
) hask+j
zeros. We claim that for anyd∈I
## S
## −
(π) withk+jzeros, there exist exactly
## (
j+min{k,ℓ−2}
j
## )
sequencese∈I
## S
(π) withjzeros andkones such thatφ(e) =d. This would then show that
x
## S,j,k
## =
## (
j+ min{k, ℓ−2}
j
## )
n−k−j
## ∑
i=0
x
## S
## −
## ,k+j,i
## .
Consider somed∈I
## S
## −
(π) withk+jzeros. Asφ(e) =dandehasjzeros andkones, we
findeis completely determined apart from selecting whichkof thek+jzeros indbecome

## 6LETONG HONG AND RUPERT LI
ones ine. Asdavoidsπ, we find thateavoidsπif and only if the zeros and ones ofeavoid
π. By Lemma 3.4, we find there are
## (
j+min{k,ℓ−2}
j
## )
such choices of zeros and ones ofethat
avoidπ, each yielding a distinct valide∈I
## S
## (π).
AsS
## −
satisfies the conditions of the inductive hypothesis, it now suffices to similarly show
that for anyd∈I
## S
## −
(σ) withk+jzeros, there exist exactly
## (
j+min{k,ℓ−2}
j
## )
sequencese∈I
## S
## (σ)
withjzeros andkones such thatφ(e) =d. The argument is identical to that forπ, asσ
also satisfies the conditions of Lemma 3.4. This impliesx
## S,j,k
## =y
## S,j,k
for alljandk, and by
induction, for allS. This completes the proof.
Corollary 3.6.For any finite setSof positive integers,
## |I
## S
## (1011)|=|I
## S
## (1101)|=|I
## S
## (1110)|.
This implies 1011, 1101, and 1110 are Wilf equivalent over inversion sequences.
Corollary 3.7.Forn≥1,
## |I
n
## (0221)|=|I
n
## (0212)|=
## ∑
## S⊆[n−1]
## |I
## S
## (110)|.
Proof.Theorem 3.5 implies|I
## S
## (110)|=|I
## S
(101)|for any finite setSof positive integers,
from which the result follows by applying Theorem 3.1.
The following result augments the method of Theorem 3.5 to prove thatπ·ρandσ·ρ
are Wilf equivalent overS-inversion sequences, whereπandσsatisfy the assumptions of
Theorem 3.5 andρconsists only of twos.
Theorem 3.8.Letρ=ρ
## 1
## ···ρ
h
be a pattern of lengthh≥0such thatρ
i
= 2for alli. Let
π=π
## 1
## ···π
## ℓ
andσ=σ
## 1
## ···σ
## ℓ
be two patterns of lengthℓ≥3such thatπ
i
, σ
i
∈{0,1}for all
## 2≤i≤ℓandπ
## 1
## =σ
## 1
= 1. If there exists exactly onejsuch thatπ
j
= 0and exactly onej
## ′
such thatσ
j
## ′
= 0, then for any finite setSof positive integers,|I
## S
(π·ρ)|=|I
## S
## (σ·ρ)|.
Proof.Whenh= 0, the result follows from Theorem 3.5.
For convenience, defineπ
## ′
## =π·ρandσ
## ′
=σ·ρ.  We use a similar double induction
approach as in Theorem 3.5. Let theterminalh-repeat statisticof anS-inversion sequence
ebe the largest integerrsuch that there are at leastrzeros ine, and lettingzdenote the
index of ther-th zero ine, then there exist positive integersz < i
## 1
< i
## 2
<···< i
h
## ≤ |S|
wheree
i
## 1
## =e
i
## 2
## =···=e
i
h
>0; if no suchrexists, define the terminalh-repeat statistic
to be 0. For example, the terminal 1-repeat statistic is simply the number of non-terminal
zeros, where a terminal zero only has zeros after it, if anything.
## Letx
## S,j,k,r
denote the number ofπ
## ′
-avoidingS-inversion sequences withjzeros,kones,
and terminalh-repeat statisticr, and similarly definey
## S,j,k,r
forσ
## ′
-avoidance. We will prove
the refinement thatx
## S,j,k,r
## =y
## S,j,k,r
for allS, j, k, rby induction on|S|.
When|S|< ℓ+h, the result trivially holds as allS-inversion sequences avoid all patterns
of lengthℓ+h≥3. For the inductive step, assume the result holds for allSwith|S|=n−1;

## LENGTH-FOUR PATTERN AVOIDANCE IN INVERSION SEQUENCES7
we will show the result holds for allSwith|S|=nvia a second induction on minS. For
the base case minS= 1, anye∈I
## S
hase
## 1
= 0, which cannot be part of aπ
## ′
orσ
## ′
pattern,
soe=e
## 1
## ···e
n
## ∈I
## S
avoidsπ
## ′
if and only ife
## 2
## ···e
n
avoidsπ
## ′
, and similarly forσ
## ′
## . Hence,
x
## S,j,k,r
## =y
## S,j,k,r
using the inductive hypothesis forS\{1}.
Now assume the result holds for allSof sizenwith minS=m−1≥1; we will show
the result holds for allSwithS=m. Consider a givenSof sizenwith minS=m≥2,
and letS
## −
={s−1|s∈S}. Defineφas in Theorem 3.5, and notice thatπ
## ′
-avoidance and
σ
## ′
-avoidance are both preserved underφ.
Supposed∈I
## S
## −
## (π
## ′
), and consider theS-inversion sequencese∈I
## S
such thatφ(e) =d.
Similarly, supposed
## ′
## ∈I
## S
## −
## (σ
## ′
), and consider theS-inversion sequencese
## ′
## ∈I
## S
such that
φ(e
## ′
## ) =d
## ′
## . Supposedandd
## ′
both havej+kzeros and terminalh-repeat statisticr. By the
inductive hypothesis, the number of suchdequals the number of suchd
## ′
## .
## Asdandd
## ′
both havej+kzeros,eande
## ′
must each havej+ktotal zeros and ones. Now
restrict consideration to thoseeande
## ′
that havejzeros andkones. Asdisπ
## ′
## -avoiding,e
avoidsπ
## ′
if and only if noπpattern occurs within its firstrzero and one entries. Similarly,
e
## ′
avoidsσ
## ′
if and only if noσpattern occurs within its firstrzero and one entries.
Consider some choice of zeros and ones for the lastj+k−rzeros ofdandd
## ′
, i.e., some
binary sequence in{0,1}
j+k−r
. We claim that the number ofewhose lastj+k−rzeros
and ones follow this binary sequence equals the number ofe
## ′
whose lastj+k−rzeros
and ones follow this binary sequence. Notice that all sucheande
## ′
have the same terminal
h-repeat statisticr
## ′
: if the binary sequence contains at leasthones, thenr
## ′
is the number of
zeros before theh-th-to-last one ineor respectivelye
## ′
; otherwise,r
## ′
is the number of zeros
within the firstrzeros and ones ofeor respectivelye
## ′
## . Aseande
## ′
both havekones andj
zeros, and this binary sequence fixes the terminalh-repeat statistic, this would be a stronger
refinement that impliesx
## S,j,k,r
## ′
## =y
## S,j,k,r
## ′
for allj, k, r
## ′
## .
Suppose this binary sequence hasj
## ′
zeros andk
## ′
## =j+k−r−j
## ′
ones, where we may
assumej
## ′
## ≤jandk
## ′
≤k, as otherwise no valideore
## ′
, withkones andjzeros, exist. Hence
botheande
## ′
must havej−j
## ′
zeros andk−k
## ′
ones among the positions of the firstrzeros
indandd
## ′
, respectively. These zeros and ones inemust avoidπ, and these zeros and ones
ine
## ′
must avoidσ. Then Lemma 3.4 implies that the number of sucheequals the number
of suche
## ′
, namely equaling
## (
j−j
## ′
## +min{k−k
## ′
## ,ℓ−2}
j−j
## ′
## )
## .
This impliesx
## S,j,k,r
## ′
## =y
## S,j,k,r
## ′
for allj, k, r
## ′
, and by induction, for allS, which completes
the proof.
Corollary 3.9.For any finite setSof positive integers,
## |I
## S
## (1012)|=|I
## S
## (1102)|.
This implies 1012 and 1102 are Wilf equivalent over inversion sequences.
Similar to Theorem 3.8, which appends twos toπandσthat satisfy the assumptions of
Theorem 3.5, the following result augments the method of Theorem 3.5 to prove thatρ·πand

## 8LETONG HONG AND RUPERT LI
ρ·σare Wilf equivalent overS-inversion sequences, whereπandσsatisfy the assumptions
of Lemma 3.4 andρconsists only of twos.
Theorem 3.10.Letρ=ρ
## 1
## ···ρ
h
be a pattern of lengthh≥1such thatρ
i
= 2for alli. Let
π=π
## 1
## ···π
## ℓ
andσ=σ
## 1
## ···σ
## ℓ
be two patterns of lengthℓ≥2such thatπ
i
, σ
i
∈{0,1}for all
i∈[ℓ], and there exists exactly onejsuch thatπ
j
= 0and exactly onej
## ′
such thatσ
j
## ′
## = 0.
Then for any finite setSof positive integers,|I
## S
(ρ·π)|=|I
## S
## (ρ·σ)|.
Proof.For convenience, defineπ
## ′
## =ρ·πandσ
## ′
=ρ·σ. We use an almost identical approach
as in Theorem 3.8, reversing the definition of the terminalh-repeat statistic. Let theinitial
h-repeat statisticof anS-inversion sequenceebe the largest integerrsuch that there are at
leastrzeros ine, and lettingzdenote the index of ther-th-to-last zero ine, then there exist
positive integers 1≤i
## 1
< i
## 2
<···< i
h
< zwheree
i
## 1
## =e
i
## 2
## =···=e
i
h
>0; if no suchr
exists, define the initialh-repeat statistic to be 0. For example, the initial 1-repeat statistic
is simply the number of non-initial zeros, where an initial zero only haszeros before it, if
anything.
## Letx
## S,j,k,r
denote the number ofπ
## ′
-avoidingS-inversion sequences withjzeros,kones,
and initialh-repeat statisticr, and similarly definey
## S,j,k,r
forσ
## ′
-avoidance. We will prove
the refinement thatx
## S,j,k,r
## =y
## S,j,k,r
for allS, j, k, rby induction on|S|.
The proof then follows the same reasoning as that of Theorem 3.8. For sake of brevity and
clarity, we comment on some of the minor differences between the proofs. We assumeh≥1
so that neitherπ
## ′
andσ
## ′
start with a 0, allowing the base case minS= 1 for the second
induction to hold; this in turn allows us to lift the restriction thatπ
## 1
## =σ
## 1
= 1. Using the
same notation as in the proof of Theorem 3.8, the characterizationofebecomes as follows:
eavoidsπ
## ′
if and only if noπpattern occurs within its lastrzero and one entries, and
similarly fore
## ′
avoidingσ
## ′
. We then consider some binary sequence for the firstj+k−r
zeros ofdandd
## ′
, as opposed to the last, where fixing this binary sequence fixes theinitial
h-repeat statistic ofeande
## ′
, so the proof proceeds identically.
Corollary 3.11.For any finite setSof positive integers,
## |I
## S
## (2011)|=|I
## S
## (2101)|=|I
## S
## (2110)|.
This implies 2011, 2101, and 2110 are Wilf equivalent over inversion sequences.
Corollary 3.12.For any finite setSof positive integers,
## |I
## S
## (2201)|=|I
## S
## (2210)|.
This implies 2201 and 2210 are Wilf equivalent over inversion sequences.
Theorem 3.13.Letπ=π
## 1
## ···π
## ℓ
andσ=σ
## 1
## ···σ
## ℓ
be two patterns of lengthℓ≥2such that
π
i
, σ
i
∈{0,1}for alli∈[ℓ], and there exists exactly onejsuch thatπ
j
= 0and exactly one
j
## ′
such thatσ
j
## ′
= 0. Then for any finite setSof positive integers,|I
## S
(23·π)|=|I
## S
## (23·σ)|.

## LENGTH-FOUR PATTERN AVOIDANCE IN INVERSION SEQUENCES9
Proof.For convenience, defineπ
## ′
## = 23·πandσ
## ′
= 23·σ. We use a similar double induction
approach as in Theorem 3.10.
Let theinitial non-inversion statisticof anS-inversion sequenceebe the largest integerz
such that there are at leastzzeros ine, and there does not exist two elements 0< e
i
## 1
< e
i
## 2
ofewherei
## 1
< i
## 2
and both come before thez-th zero ine; this statistic can equal zero.
Furthermore, let theinitial positive setof anS-inversion sequenceebe the setPof integers
ifor 0≤i < z, wherezis the initial non-inversion statistic ofe, such that there exists a
positive element between thei-th and (i+ 1)-th zeros ofe, where “between the zeroth and
first zeros ofe” is interpreted to mean before the first zero ofe.
## Letx
S,j,k,z,P
denote the number ofπ
## ′
-avoidingS-inversion sequences withjzeros,kones,
initial non-inversion statisticz, and initial positive setP, and similarly definey
S,j,k,z,P
for
σ
## ′
-avoidance. We will prove the refinement thatx
S,j,k,z,P
## =y
S,j,k,z,P
for allS, j, k, z, Pby
induction on|S|.
The initial argument, from the base cases of|S|<  ℓ+ 2 up to the beginning of the
second inductive step usingφ, follow the same reasoning as in Theorem 3.10. We use the
same definitions forS
## −
andφ, where we note thatπ
## ′
-avoidance andσ
## ′
-avoidance are both
preserved underφ.
Supposed∈I
## S
## −
## (π
## ′
), and consider theS-inversion sequencese∈I
## S
such thatφ(e) =d.
Similarly, supposed
## ′
## ∈I
## S
## −
## (σ
## ′
), and consider theS-inversion sequencese
## ′
## ∈I
## S
such that
φ(e
## ′
## ) =d
## ′
## . Supposedandd
## ′
both havej+kzeros, initial non-inversion statisticz, and
initial positive setP. By the inductive hypothesis, the number of suchdequals the number
of suchd
## ′
## .
## Asdandd
## ′
both havej+kzeros,eande
## ′
must each havej+ktotal zeros and ones. Now
restrict consideration to thoseeande
## ′
that havejzeros andkones. Asdisπ
## ′
## -avoiding,e
avoidsπ
## ′
if and only if noπpattern occurs within its lastj+k−zzero and one entries.
## Similarly,e
## ′
avoidsσ
## ′
if and only if noσpattern occurs within its lastj+k−zzero and
one entries.
Consider some choice of zeros and ones for the firstzzeros ofdandd
## ′
, i.e., some binary
sequence in{0,1}
z
.  We claim that the number ofewhose firstzzeros and ones follow
this binary sequence equals the number ofe
## ′
whose firstzzeros and ones follow this binary
sequence. However, we first show that all sucheande
## ′
have the same initial non-inversion
statisticz
## ′
and initial positive setP
## ′
, as then the claim yields a stronger refinement that
impliesx
## S,j,k,z
## ′
## ,P
## ′
## =y
## S,j,k,z
## ′
## ,P
## ′
for allj, k, z
## ′
## , P
## ′
## .
If the binary sequence contains no ones, thenz
## ′
=zandP
## ′
=P. Otherwise, the ones
in this binary sequence will causez
## ′
< zand may causeP
## ′
to change. IfPis empty, then
noticez
## ′
is simply the number of zeros in this binary sequence, andP
## ′
is defined according to
which zeros in the binary sequence have ones in between them. IfPis non-empty, suppose
i
## 1
is the index of the first one in the binary sequence; and leti
## 2
be the minimum element of
(P∪{z})∩[i
## 1
## ,∞). Thenz
## ′
is the number of zeros within the firsti
## 2
elements of the binary

## 10LETONG HONG AND RUPERT LI
sequence, andP
## ′
is uniquely determined fromPand the binary sequence. Hence, givenz,
P, and the binary sequence,z
## ′
andP
## ′
are uniquely determined, as desired.
We conclude the proof by proving our claim that the number of sucheequals the number
of suche
## ′
. Suppose this binary sequence hasj
## ′
≤jzeros andk
## ′
## =z−j
## ′
## ≤kones. Then
botheande
## ′
havej−j
## ′
zeros andk−k
## ′
ones among the positions of the lastj+k−zzeros
indandd
## ′
, respectively. These zeros and ones inemust avoidπ, and these zeros and ones
ine
## ′
must avoidσ. Lemma 3.4 implies that the number of sucheequals the number of such
e
## ′
, namely equaling
## (
j−j
## ′
## +min{k−k
## ′
## ,ℓ−2}
j−j
## ′
## )
## .
This impliesx
## S,j,k,z
## ′
## ,P
## ′
## =y
## S,j,k,z
## ′
## ,P
## ′
for allj, k, z
## ′
## , P
## ′
, and by induction, for allS, which
completes the proof.
Corollary 3.14.For any finite setSof positive integers,
## |I
## S
## (2301)|=|I
## S
## (2310)|.
This implies 2301 and 2310 are Wilf equivalent over inversion sequences.
3.2.Wilf equivalences by characterization.For a sequencee
## 1
## ···e
n
of nonnegative in-
tegers, a positionj∈[n] is aweak left-to-right maximumife
i
## ≤e
j
for alli < j.  We
use this definition to characterize 3210 and 3201-avoiding inversionsequences, allowing us
to construct an explicit bijection betweenI
n
(3210) andI
n
(3201).  First, we characterize
3210-avoiding inversion sequences.
Lemma 3.15.The 3210-avoiding inversion sequences are precisely thosethat can be parti-
tioned into three weakly increasing subsequences.
Proof.Supposee∈I
n
has such a partitione
x
## 1
## ≤e
x
## 2
## ≤ ··· ≤e
x
t
## ,e
y
## 1
## ≤e
y
## 2
## ≤ ··· ≤e
y
r
## ,
ande
z
## 1
## ≤e
z
## 2
## ≤ ··· ≤e
z
n−t−r
. If there existi < j < k < ℓsuch thate
i
> e
j
> e
k
> e
## ℓ
## ,
then no two ofi, j, k, ℓcan both be in any of the three sets{x
## 1
, . . . , x
t
## },{y
## 1
, . . . , y
r
}, and
## {z
## 1
, . . . , z
n−t−r
}, but this is impossible due to the Pigeonhole principle. Therefore,eavoids
- Conversely, ifeis 3210-avoiding, letx= (x
## 1
, . . . , x
t
) be the sequence of weak left-
to-right maxima ofe.  Thene
x
## 1
## ≤e
x
## 2
## ≤ ··· ≤e
x
t
.  We then lety= (y
## 1
, . . . , y
r
) be
the sequence of weak left-to-right maxima of the sequence obtained by deleting positions
## {x
## 1
, . . . , x
t
}frome, and in general we call these positionsweak 2nd left-to-right maxima.
## Similarlye
y
## 1
## ≤e
y
## 2
## ≤···≤e
y
r
. We then consider the remaining terms of the sequence, and
takei, j6∈({x
## 1
, . . . , x
t
## })∪({y
## 1
, . . . , y
r
}) wherei < j. The fact thatiis not included in
## {y
## 1
, . . . , y
r
}implies there exists somev∈{y
## 1
, . . . , y
r
}such thatv < iande
v
> e
i
. The fact
thatvis not a weak left-to-right maxima implies there exists someusuch thatu < vand
e
u
> e
v
. Now we havee
u
> e
v
> e
i
withu < v < i < j. Thus, to avoid 3210, we must have
e
i
## ≤e
j
. Both directions are thus concluded.
Now, we characterize 3201-avoiding inversion sequences.
Lemma 3.16.Let(e
## 1
, e
## 2
, . . . , e
n
## )∈I
n
. For anyi∈[n], letM
## 1
i
andM
## 2
i
be the largest and
second largest value among{e
## 1
, e
## 2
, . . . , e
i−1
}, respectively. Thene∈I
n
(3201)if and only if

## LENGTH-FOUR PATTERN AVOIDANCE IN INVERSION SEQUENCES11
for everyi∈[n], the entrye
i
is either a weak left-to-right maximum, a weak 2nd left-to-right
maximum, or for everyj > i, we havee
j
## ≤e
i
ore
j
## ≥M
## 2
i
## .
Proof.Lete∈I
n
satisfy the conditions of Lemma 3.16 and, for the sake of contradiction,
assume that there existsi < j < k < ℓsuch thate
k
< e
## ℓ
< e
j
< e
i
. Notice that we have
## M
## 1
k
## ≥e
i
and thusM
## 2
k
## ≥e
j
## . Thene
k
< e
## ℓ
< e
j
## ≤M
## 2
k
, a contradiction to our assumption.
Conversely, supposeeis 3201-avoiding. Ife
i
is neither a weak left-to-right maximum nor a
weak 2nd left-to-right maximum, then there exists some 2nd maximum valueM
## 2
i
such that
## M
## 2
i
## =e
v
> e
i
for somev < i. By definition of 2nd maximum, there is some maximum value
## M
## 1
v
## =e
u
> e
v
for someu < v. To avoid 3201, we must have that for allj > i,e
j
## ≤e
i
or
e
j
## ≥e
v
## =M
## 2
i
## .
Combining these two results allows us to prove 3210≡3201.
Theorem 3.17.Forn≥1,
## |I
n
## (3210)|=|I
n
## (3201)|.
Proof.We exhibit a bijection based on the characterizations in Lemma 3.15 and Lemma 3.16.
Givene∈I
n
(3210), we definef∈I
n
(3201) as follows. Lete
x
## 1
## ≤e
x
## 2
## ≤ ··· ≤e
x
t
and
e
y
## 1
## ≤e
y
## 2
## ≤ ··· ≤e
y
r
be the subsequences of weak left-to-right maxima and weak 2nd
left-to-right maxima ofe, respectively, and lete
z
## 1
## ≤e
z
## 2
## ≤ ··· ≤e
z
n−t−r
be the remaining
entries.
Fori∈[t], we setf
x
i
## =e
x
i
and fori∈[r], we setf
y
i
## =e
y
i
. For eachj∈[n−t−r], we extract
an element of the multisetZ={e
z
## 1
, e
z
## 2
, . . . , e
z
n−t−r
}and assign it tof
z
## 1
, f
z
## 2
, . . . , f
z
n−t−r
, one
at a time in order, as follows:
f
z
j
:= max{k|k∈Z−{f
z
## 1
, f
z
## 2
, . . . , f
z
j−1
## }andk < M
## 2
z
j
## }.
By definition,fwill satisfy the characterization property in Lemma 3.16 ofI
n
## (3201). One
can see that this is invertible, hence a bijection.
A computer search proves no other length-4 patterns are Wilf equivalent, except possibly
3012 and the aforementioned Wilf equivalence class 3210≡3201. We leave this last case as
an open question.
Conjecture 3.18.Forn≥1,
## |I
n
## (3201)|=|I
n
## (3012)|.
This has been verified for alln≤12.
4.Enumeration of inversion sequences avoiding patterns of length 4
Define alabel-increasing treeonnvertices to be a rooted unordered tree in which each
vertex is labeled with a distinct label from the set{0, . . . , n−1}and labels increase along
any path from the root to a leaf. Then define alabel-increasing tree with branching bounded

## 12LETONG HONG AND RUPERT LI
bykto be a label-increasing tree such that each vertex has at mostkchildren. LetL
n,k
denote the set ofn-vertex label-increasing trees with branching bounded byk.
Kuznetsov, Pak, and Postnikov [7] showed thatL
n,2
is in bijection with theup/down
permutations, that is, the permutationsπof [n] such thatπ
## 1
< π
## 2
> π
## 3
< π
## 4
>···; the
number of up/down permutations is the Euler numberE
n
, whose exponential generating
function is well-known, namely
## ∑
n≥0
## E
n
x
n
n!
= tan(x) + sec(x).
Corteel, Martinez, Savage, and Weselcouch [6] proved that|I
n
## (000)|=E
n+1
via a bijection
betweenI
n
(000) andL
n+1,2
. We generalize their result to patterns 00···0 of any lengthk.
Theorem 4.1.Fork≥1, letπ= 00···0be the pattern consisting ofkzeros. Then for all
n≥1,
## |I
n
(π)|=|L
n+1,k−1
## |.
Proof.Notice thatI
n
(π) is the set of inversion sequences of lengthnwhere each entry occurs
at mostk−1 times, andL
n+1,k−1
is the set of label-increasing trees ofn+ 1 vertices labeled
0, . . . , n, with branching bounded byk. Then it is easy to see that the mapping sending
## T∈L
n+1,k−1
toe∈I
n
(π), wheree
i
is the parent ofiinT, is a bijection betweenL
n+1,k−1
andI
n
## (π).
Theorem 4.1 impliesI
n
(0000) is in bijection with the label-increasing trees with branch-
ing bounded by 3, which is OEIS sequence A297196 [17]. Theorem 4.1 also enables us to
determine the exponential generating function for|I
n
(00···0)|, as Riordan [14] showed the
exponential generating function
## T
k
## (x) =
## ∑
n≥0
## |L
n,k
## |
x
n
n!
## (2)
satisfies the differential equation
## T
## ′
k
## (x) =
k
## ∑
i=0
## (T
k
## (x)−1)
i
i!
## .
In other words,T
k
(x) satisfiesT
k
(0) = 1 and
k!T
## ′
k
(x) = (T
k
## (x))
k
## +
k−2
## ∑
m=0
c
m,k
## (T
k
## (x))
m
## ,
where
c
m,k
## =
## 1
m!
## (
k−m
## ∑
j=0
## (−1)
j
k(k−1)···(j+ 1)
## )
## .

## LENGTH-FOUR PATTERN AVOIDANCE IN INVERSION SEQUENCES13
These are the same coefficients satisfying
k!
k
## ∑
j=0
x
j
j!
## = (x+ 1)
k
## +
k−2
## ∑
m=0
c
m,k
## (x+ 1)
m
coming from the differential equation.
LetL
## ′
n,k
denote the set ofn-vertex label-increasing trees with unbounded root degree
and branching bounded bykat all other nodes. An alternative way to think about these
combinatorial objects is to consider the possible ways hownsufficiently large boxes can
contain each other under the condition that each box may contain at mostk(themselves
possibly nested) boxes. Similar to Theorem 4.1, we have the following result for patterns of
the form 011···1.
Theorem 4.2.Fork≥1, letπ= 011···1be the pattern consisting of a zero andkones.
Then for alln≥1,
## |I
n
(π)|=|L
## ′
n+1,k−1
## |.
Proof.Notice thatI
n
(π) is the set of inversion sequences of lengthnwhere each entry except
0 occurs at mostk−1 times, andL
## ′
n+1,k−1
is the set of label-increasing trees ofn+1 vertices
labeled 0,1, . . . , n, with branching bounded bykexcept at the root. Then it is easy to see
that the mapping sendingT∈L
## ′
n+1,k−1
toe∈I
n
(π), wheree
i
is the parent ofiinT, is a
bijection betweenL
## ′
n+1,k−1
andI
n
## (π).
Theorem 4.2 impliesI
n
(0111) is in bijection with the label-increasing trees (of unbounded
root degree) with branching bounded by 2, which is OEIS sequence A000772 [17].
More generally, it is well-established that|L
## ′
n,k
|equalsD
n
(exp(x)) evaluated atx= 0,
where the operatorDis defined by
## D=
## (
k
## ∑
j=0
x
j
j!
## )
d
dx
## .
Therefore, we have the general formulae of exponential generating function
## R
k
## (x) :=
## ∑
n≥0
## |L
## ′
n,k
## |
x
n
n!
= exp
## (
## T
k
## (x)−1
## )
## ,
whereT
k
(x) is defined above in Eq. (2). Whenk= 1, the exponential generating function is
## R
## 1
(x) = exp(exp(x)−1), whose coefficients yield OEIS sequence A000110 [17]. Whenk= 2,
the exponential generating function is
## R
## 2
(x) = exp
## (
tan(x) + sec(x)−1
## )
## .
It is hard to explicitly write downR
## 3
(x), whose coefficients form OEIS sequence A094198.
Next, we present the following conjecture.

## 14LETONG HONG AND RUPERT LI
Conjecture 4.3.LetA
n
## =|I
n
(0021)|. We have thatA(x) =
## ∑
n≥1
## A
n
x
n
satisfies
## 1
## (
1−A(x)
## )(
1 +A(x)
## )
## 2
## = 1−x.
In other words,|I
n
(0021)|corresponds to the OEIS sequence A218225 [17]. This has been
verified for alln≤11.
Remark4.4.Since the writing of the original version of this paper, Conjecture 4.3 has been
simultaneously proven by Chern, Fu, and Lin [5] and Mansour [11].
## Acknowledgments
The research was conducted at the 2021 University of Minnesota Duluth REU (NSF–DMS
Grant 1949884 and NSA Grant H98230-20-1-0009) and fully supported by the generosity of
the CYAN Mathematics Undergraduate Activities Fund. The authors are deeply thankful to
Professor Joseph Gallian for his long-lasting dedication in running thewonderful program.
The authors are also grateful to Amanda Burcroff for her editing feedback. Lastly, we thank
the anonymous referees who made many suggestions improving thisarticle.
## References
[1] Juan S. Auli and Sergi Elizalde. Consecutive patterns in inversionsequences.Discrete Math. Theor.
## Comput. Sci., 21(2):6, 2019.
[2] Juan S. Auli and Sergi Elizalde. Consecutive patterns in inversionsequences II: Avoiding patterns of
relations.J. Integer Seq., 22(7):19.7.5, 2019.
[3] Juan S. Auli and Sergi Elizalde. Wilf equivalences between vincular patterns in inversion sequences.
Appl. Math. Comput., 388(C):125514, 2021.
[4] Shane Chern. On 0012-avoiding inversion sequences and a conjecture of Lin and Ma.Quaest. Math.,
pages 1–14, 2022.
[5] Shane Chern, Shishuo Fu, and Zhicong Lin. Burstein’s permutation conjecture, Hong and Li’s inversion
sequence conjecture, and restricted Eulerian distributions.arXiv:2209.12137 [math.CO], 2022.
[6] Sylvie Corteel, Megan A. Martinez, Carla D. Savage, and Michael Weselcouch. Patterns in inversion
sequences I.Discrete Math. Theor. Comput. Sci., 18(2):2, 2016.
[7] Alexander G. Kuznetsov, Igor M. Pak, and Alexander E. Postnikov. Increasing trees and alternating
permutations.Russ. Math. Surv., 49(6):79, 1994.
[8] Derrick H. Lehmer. Teaching combinatorial tricks to a computer. InCombinatorial  Analysis,  Proc.
Sympos. Appl. Math., volume 10, pages 179–193, 1960.
[9] Zhicong Lin and Chunyan Yan. Inversion sequences avoiding pairsof patterns.Discrete Math. Theor.
## Comput. Sci., 22(1):23, 2020.
[10] Zhicong Lin and Sherry H. F. Yan. Vincular patterns in inversion sequences.Appl. Math. Comput., 364:
## 124672, 2020.
[11] Toufik Mansour. Generating trees, 0021-avoiding inversion sequences, and a conjecture of Hong and Li.
## 2022.
[12] Toufik Mansour and Mark Shattuck. Pattern avoidance in inversion sequences.Pure  Math.  Appl.,
## 25:157–176, 2015.

## LENGTH-FOUR PATTERN AVOIDANCE IN INVERSION SEQUENCES15
[13] Megan A. Martinez and Carla D. Savage. Patterns in inversion sequences II: Inversion sequences avoiding
triples of relations.J. Integer Seq., 21(2):18.2.2, 2018.
[14] John Riordan. Forests of label-increasing trees.J. Graph Theory, 3(2):127–133, 1979.
[15] Carla D. Savage and Michael J. Schuster. Ehrhart series of lecture hall polytopes and Eulerian polyno-
mials for inversion sequences.J. Combin. Theory Ser. A, 119(4):850–870, 2012.
[16] Rodica Simion and Frank W. Schmidt. Restricted permutations.European J. Combin., 6(4):383–406,
## 1985.
[17] Neil J. A. Sloane et al. The On-line Encyclopedia of Integer Sequences.published  electronically  at
oeis.org, 2021.
[18] Richard P. Stanley. A survey of alternating permutations.Contemp. Math., 531:165–196, 2010.