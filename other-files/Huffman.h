
/* http://www.mathcs.emory.edu/~cheung/Courses/255/Syllabus/1-C-intro/bit-array.html */
#define SetBit(A,k)     ( A[(k/32)] |= (1 << (k%32)) )
#define ClearBit(A,k)   ( A[(k/32)] &= ~(1 << (k%32)) )
#define TestBit(A,k)    ( A[(k/32)] & (1 << (k%32)) )

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

HuffmanNode* GenerateHuffmanTree(char *);
int* CompressString(char* string, uint length, HuffmanNode* tree, int* outputLength);

int ElemFreq_compare(const void *, const void *);
ElemFreq *get_element_frequency(char *, char *);


void print_ElemFreq(ElemFreq);
void print_HuffmanTree(HuffmanNode *);