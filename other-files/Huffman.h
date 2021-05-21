

typedef unsigned short uint;


typedef struct
{
    char value;
    int freq;
} ElemFreq;

typedef struct HuffmanNode HuffmanNode;

struct HuffmanNode {
    ElemFreq elem;
    HuffmanNode *left;
    HuffmanNode *right;
};


int array_len(char *);            /*Count the length of array*/
int count_elements(char *, char); /*Count the nr of times a character occur*/
char *unique_array(char *);
HuffmanNode* huffman(char *);
int ElemFreq_compare(const void *, const void *);
ElemFreq *get_element_frequency(char *, char *);


void print_ElemFreq(ElemFreq);
void print_HuffmanTree(HuffmanNode *);