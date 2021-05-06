/**
 * huffman_lib.c based on Huffman.c
 */

#include <stdio.h>
#include <math.h>
#include <stdlib.h>
#include <stdint.h>

#include "huffman_lib.h"

/*
int main(void)
{
    char array[] = "aaawwqqqsscaaffaqzzjjjktpo";
    printf("%d\n", array_len(array));
    printf("%d\n", count_elements(array, 'a'));
    printf("%s\n", unique_array(array));
    huffman(array);
    return 0;
}
*/

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

void huffman(char *string)
{
    uint16_t i;
    HuffmanNode *currentNode;
    char *unique_chars = unique_array(string);
    uint16_t unique_len = array_len(unique_chars);
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

    uint16_t j, k;

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

/*         printf("__________________\n");
        printf("i = %d, j = %d\n", i, j); */


        /* Move all elements which have lower frequency one space right */
        for (k = unique_len-1; k >= j; k--) {
            /* printf("k = %d ", k); */
            tree[k+1] = tree[k];
			if (k == 0) break;
        }
        /* printf("\n\n"); */

        /* Insert the internal node into tree */
        tree[j] = internal;

        /*
        DEBUGGING


        printf("\n");
        printf("i = %d\n", i);
        print_ElemFreq(internal->elem);
        printf("left:\n    ");
        print_ElemFreq(internal->left->elem);
        printf("right:\n    ");
        print_ElemFreq(internal->right->elem);
        printf("\n");

         for (l = 0; l < i; l++)
        {

            currentNode = tree[l];

            if (currentNode->elem.value > 0) {
                print_ElemFreq(currentNode->elem); }
            else
                print_HuffmanTree(currentNode);
        }

        getchar();
        */

    }
    print_HuffmanTree(tree[0]);
}
void print_ElemFreq(ElemFreq elem)
{
    printf("[%c, %d]\n", elem.value, elem.freq);
}


void print_HuffmanTree_internal(HuffmanNode *root, uint16_t prefixWidth) {
    uint16_t i;
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

extern "C" {
    void ext_huffman(char* string) {
        huffman(string);
    }
}