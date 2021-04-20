#include <stdio.h>
#include <math.h>
#include <stdlib.h>

typedef struct
{
    char value;
    int freq;
} ElemFreq;

typedef struct
{
    ElemFreq elem;
    HuffmanNode *left;
    HuffmanNode *right;
} HuffmanNode;

int array_len(char *);            /*Count the length of array*/
int count_elements(char *, char); /*Count the nr of times a character occur*/
char *unique_array(char *);
void huffman(char *);
int ElemFreq_compare(const void *, const void *);

ElemFreq *get_element_frequency(char *, char *);

void print_ElemFreq(ElemFreq);

int main(void)
{
    char array[] = "aaawqqscaafaqzjktpo";
    printf("%d\n", array_len(array));
    printf("%d\n", count_elements(array, 'a'));
    printf("%s\n", unique_array(array));
    huffman(array);
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

    char *unique_elements = (char *)malloc(n * sizeof(char));

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
    int i = 0;
    char *unique_chars = unique_array(string);
    ElemFreq *element_frequencies = get_element_frequency(string, unique_chars);
    qsort(element_frequencies, array_len(unique_chars), sizeof(ElemFreq), ElemFreq_compare);
}

void print_ElemFreq(ElemFreq elem)
{
    printf("[%c, %d]\n", elem.value, elem.freq);
}