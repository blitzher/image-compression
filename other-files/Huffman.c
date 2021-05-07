#include <stdio.h>
#include <math.h>
#include <stdlib.h>

#include "Huffman.h"

int main(void)
{
    char string[] = "aaawwqqqsscaaffaqzzjjjktpo";
    int stringLen = array_len(string), outputLength, *output, i;
    HuffmanNode* tree;
    printf("%d\n", array_len(string));
    printf("%d\n", count_elements(string, 'a'));
    printf("%s\n", unique_array(string));

    printf("Generating tree...\n");
    tree = GenerateHuffmanTree(string);
    printf("Compressing string...\n");
    output = CompressString(string, stringLen, tree, &outputLength);


    printf("Compressed bitarray:\n");
    for (i = 0; i < outputLength; i++)
    {
        printf("%d", TestBit(output, i));
    }
    


    return 0;
}
int array_len(char *string)
{
    int i = 0;

    while (string[i] != '\0')
    {
        i++;
    }

    return i;
}

int count_elements(char *string, char char_value)
{
    int i = 0; /*Array position*/
    int counter = 0;

    while (string[i] != '\0')
    {
        if (string[i] == char_value)
        {
            counter = counter + 1;
        }
        i++;
    }

    return counter;
}
char *unique_array(char *string)
{
    int i;
    int j;
    int unique = 0;
    int n = array_len(string);

    char *unique_elements = (char *)calloc(n, sizeof(char));

    for (i = 0; i < n; i++) /*Ensure that we check all elements in the array*/
    {
        for (j = 0; j < i; j++) /*Checks all elements before i*/
        {
            if (string[i] == string[j])
            {
                break; /*if they are the same the for loop will break*/
            }
        }
        if (i == j) /*checks if they are the same, if they are unique will be incremented*/
        {
            unique_elements[unique] = string[i];
            unique++;
        }
    }

    return unique_elements; /*Return unique amount of characters*/
}

ElemFreq *get_element_frequency(char *string, char *unique_array)
{
    int i = 0;
    ElemFreq *frequencies = (ElemFreq *)malloc(array_len(unique_array) * sizeof(ElemFreq));
    for (i = 0; i < array_len(unique_array); i++)
    {
        frequencies[i].value = unique_array[i];
        frequencies[i].freq = count_elements(string, unique_array[i]);
    }
    return frequencies;
}

int ElemFreq_compare(const void *a, const void *b)
{
    ElemFreq *elemA = (ElemFreq *)a;
    ElemFreq *elemB = (ElemFreq *)b;

    return (elemB->freq - elemA->freq);
}

HuffmanNode* GenerateHuffmanTree(char *string)
{
    uint i;
    HuffmanNode *currentNode;
    char *unique_chars = unique_array(string);
    uint unique_len = array_len(unique_chars);
    ElemFreq *element_frequencies = get_element_frequency(string, unique_chars);
    HuffmanNode **tree = (HuffmanNode **)calloc(unique_len, sizeof(HuffmanNode *));

    /* element_frequencies is now a sorted descending array of each element and its frequency */
    qsort(element_frequencies, unique_len, sizeof(ElemFreq), ElemFreq_compare);

	HuffmanNode nullNode;
	nullNode.elem.freq = 0;
	nullNode.elem.value = 0;

    /* Setup initial tree nodes */
    for (i = 0; i < unique_len; i++)
    {

        tree[i] = (HuffmanNode *)calloc(1, sizeof(HuffmanNode));
        currentNode = tree[i];
        currentNode->elem.value = element_frequencies[i].value;
        currentNode->elem.freq = element_frequencies[i].freq;
		currentNode->left = &nullNode;
		currentNode->right = &nullNode;
        /* print_ElemFreq(currentNode->elem); */
    }

    uint j, k;

    HuffmanNode *left, *right;
    HuffmanNode *internal;

    /* Main  */
    for (i = unique_len - 1; i > 0; i--)
    {
        left = tree[i - 1];
        right = tree[i];

        internal = (HuffmanNode *)calloc(1, sizeof(HuffmanNode));
        internal->right = right;
        internal->left = left;

        internal->elem.freq = right->elem.freq + left->elem.freq;
        /* Find where it needs to be - keep sorted by frequency */
        for (j = i-1; j > 0; j--) {
            if(tree[j]->elem.freq > internal->elem.freq) {
                j++;
                break;
            }
        }

        /* Move all elements which have lower frequency one space right */
        for (k = unique_len-1; k >= j; k--) {
            /* printf("k = %d ", k); */
            tree[k+1] = tree[k];
			if (k == 0) break;
        }
        /* printf("\n\n"); */

        /* Insert the internal node into tree */
        tree[j] = internal;
    }

    for (i = 0; i < unique_len; i++)
    {
        currentNode = tree[i];
    }

    return tree[0];
}

int _find_char_in_tree(char ch, HuffmanNode* node, int* out, int* depth) {
    printf("ch: %c, d: %d, ", node->elem.value, *depth);
    if (node->elem.value == ch) {
        return 1;
    }

    else {
        *depth = *depth + 1;
        if (node->left->elem.value != 0 && _find_char_in_tree(ch, node->left, out, depth)) {
            SetBit(out, *depth);
            return 1;
        }
        else if (node->right->elem.value != 0 && _find_char_in_tree(ch, node->right, out, depth))
        {
            ClearBit(out, *depth);
            return 1;
        }
    }
    return 0;
}

int* CompressString(char* string, uint length, HuffmanNode* tree, int* outputLength) {
    int depth, bits[1], i, j, cumDepth;
    int* output = (int*)malloc(sizeof(int) * length);

    for (i = 0; i < length; i++)
    {
        depth = 0;
        printf("\tcompressing %c...", string[i]);
        _find_char_in_tree(string[i], tree, bits, &depth);
        printf("\tinserting %c into output...", string[i]);
        for (j = 0; j < depth; j++)
        {
            TestBit(bits, j) ? SetBit(output, j+cumDepth) : ClearBit(output, j+cumDepth);
        }
        cumDepth += depth;        
    }

    *outputLength = cumDepth;
    return output;
}


void print_ElemFreq(ElemFreq elem)
{
    printf("[%c, %d]\n", elem.value, elem.freq);
}


void print_HuffmanTree_internal(HuffmanNode *root, uint prefixWidth) {
    uint i;
    char* prefix = (char*)calloc(prefixWidth, sizeof(char));
    for (i = 0 ; i < prefixWidth; i++)
        prefix[i] = '-';
    printf("%s%c|%2d\n", prefix, root->elem.value, root->elem.freq);
    HuffmanNode *left, *right;
    left = root->left;
    right = root->right;
    
    if (left->elem.freq > 0)
        print_HuffmanTree_internal(root->left, prefixWidth + 1);
    
    if (right->elem.freq > 0)
        print_HuffmanTree_internal(root->right, prefixWidth + 1);
}
void print_HuffmanTree(HuffmanNode *root) {
    printf("%c|%2d\n", root->elem.value, root->elem.freq);
    print_HuffmanTree_internal(root->left, 1);
    print_HuffmanTree_internal(root->right, 1);
}
