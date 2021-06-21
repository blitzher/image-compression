
#include "Huffman.h"

void print_ElemFreq(ElemFreq elem){
    printf("[%c, %d]\n", elem.value, elem.freq);
}

void print_HuffmanTree_internal(HuffmanNode *root, uint prefixWidth){
    uint i;
    char* prefix = (char*)calloc(prefixWidth, sizeof(char));

    for (i = 0 ; i < prefixWidth; i++){
        prefix[i] = '-';
    }

    if (root->elem.value > 0){
        printf("%s '%c'|%2d\n", prefix, root->elem.value, root->elem.freq);
    }else{
        printf("%s|%2d\n", prefix, root->elem.freq);
    }

    HuffmanNode *left, *right;
    left = root->left;
    right = root->right;

    if (left->elem.freq > 0){
        print_HuffmanTree_internal(root->left, prefixWidth + 1);
    }

    if (right->elem.freq > 0){
        print_HuffmanTree_internal(root->right, prefixWidth + 1);
    }

    free(prefix);
}

void print_HuffmanTree(HuffmanNode *root){
    if (root->elem.value > 0){
        printf("'%c'|%2d\n", root->elem.value, root->elem.freq);
    }else{
        printf("|%d\n", root->elem.freq);
    }

    print_HuffmanTree_internal(root->left, 1);
    print_HuffmanTree_internal(root->right, 1);
}