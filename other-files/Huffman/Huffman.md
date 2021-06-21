# Notes on the Huffman algorithm

## Huffman trees (Huffman tables)
___

### Structure:

A Huffman tree is a binary tree where each node contains the sum of frequencies found in its child nodes.
The leaf nodes at the tip of each branch, contains the encoded character as well as its frequency.

<br>

### Reading an encoded string:

To read an encoded string, the string of bits, along with the accompanying Huffman tree, is traversed until a leaf node is reached.
From this leaf node, the decoded value is obtained, the current position in the tree is reset and the steps are repeated for the length of the bit-string.

The current bit signifies going either left or right in the tree, with 0 signifying left and 1 signifying right.

Character codes can be read as the path from root to leaf.

<br>

### Constructing Huffman codes:

*Pseudocode for constructing a huffman tree from the set $C$, where $c \in C$ is a character with a value and a frequency denoted by $c.freq$ .*
```
Huffman(C):
    n := Length(C)      // let n be the number of unique characters.
    Q := C              // make a queue from the set of unique characters.

    for i := 1 to n - 1:
        allocate a new node z

        // Assign lowest members in queue to child nodes of z.
        z.left  := ExtractMin(Q)
        z.right := ExtractMin(Q)

        z.freq := z.left.freq + z.right.freq
        Insert(Q, z)

    return ExtractMin(Q)    // return the root of the tree.
```

