#include<stdio.h>

int main(void) {
	for (int i = 0; i < 256;)
		printf("%c", i++);
	printf("\n");
}