
CC = gcc
OPTS = -pedantic -Wall
COMP = $(CC) -pedantic -Wall

utilities.o : utilities.c Huffman.h
	$(COMP) utilities.c -c

all : Huffman.c Huffman.h utilities.o
	$(COMP) utilities.o Huffman.c -o Huffman.exe


run : all
	./Huffman.exe