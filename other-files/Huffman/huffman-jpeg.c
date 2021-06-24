#include <stdlib.h>
#include <stdint.h>

typedef uint8_t BITS[16]; /* array of code lengths matching index */

typedef uint16_t *HUFFSIZE; /* code lengths */
typedef uint16_t *HUFFCODE; /* Huffman codes */
typedef uint8_t *HUFFVAL; /* values corresponding to codes */
typedef uint16_t *EHUFCO; /* reordering of HUFFCODE */
typedef uint16_t *EHUFSI; /* reordering of HUFFSIZE */

int Generate_Size_table(int, int, int, BITS, HUFFSIZE); /* returns LASTK */
void Generate_Code_table(int, uint16_t, uint16_t, HUFFSIZE, HUFFCODE);
void Order_codes(int, int, HUFFVAL, HUFFCODE, HUFFSIZE, EHUFCO, EHUFSI);


int main() {

  return 0;
}


int Generate_Size_table(int k, int i, int j, BITS bits, HUFFSIZE huffsize) {
  int last_k;

  if (j > bits[i]) {
    if (i > 16) {
      huffsize[k] = 0;
      last_k = k;
      /* Done */

    } else last_k = Generate_Size_table(k, i, j, bits, huffsize);

  } else {
    huffsize[k] = i;

    k++;
    j++;

    last_k = Generate_Size_table(k, i, j, bits, huffsize);
  }

  return last_k;
}

/*
 * Generate_Code_table - Generates HUFFCODE
 * Init params: K = 0, Code = 0 si = huffsize[0]
 */
void Generate_Code_table(int K, uint16_t Code, uint16_t si, HUFFSIZE huffsize, HUFFCODE huffcode) {
  uint16_t code = Code;
  int k = K;

  huffcode[k] = code;
  code++;
  k++;

  if (huffsize[k] != 0) {
    do {
      code = code << 1;
    } while (huffsize[k] != si);

    if (huffsize[k] == si)
      Generate_Code_table(k, code, si, huffsize, huffcode);
  }

  return;
}

/*
 * Order_codes - Sort huffman codes by their associated values.
 * Init params: K = 0
 */
void Order_codes(int K, int last_k, HUFFVAL huffval, HUFFCODE huffcode, HUFFSIZE huffsize, EHUFCO ehufco, EHUFSI ehufsi) {
  int k = K;

  int i = huffcode[k];
  ehufco[i] = huffcode[k];
  ehufsi[i] = huffsize[k];
  k++;

  if (k < last_k)
    Order_codes(k, last_k, huffval, huffcode, huffsize, ehufco, ehufsi);

  return;
}
