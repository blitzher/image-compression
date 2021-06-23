# JPEG FIle Encoding *(...simplified)*

## DCT-based coding

`8x8 blocks -> FDCT -> Quantizer -> Entropy encoder`

| Symbol | Description                                                  |
| ------ | ------------------------------------------------------------ |
| FDCT   | *forward* DCT. Transforms 8x8 blocks into 64 DCT coeffients. |
| DC     | DC coeffient. The first value in a block of DCT coeffients.  |
| AC     | Remaining 63 values in DCT coeffient block.                  |

### Encoding process

1. Each component the source image is split into 8x8 blocks.
2. Each block is transformed into DCT coefficients by a *forward discrete cosine transform* (FDCT).
3. DC and AC coefficients are prepared for entropy encoding. DC coeffients are encoded as the difference betweeen it and the previous DC coefficient. AC coefficients are serialized in a zig-zag pattern.
4. The coefficients are then passed on to either a Huffman encoder or an arithmetic encoder. For Huffman encoding, tables has to be provided for the encoder.

> There are four different modes of operation: sequential DCT-based, progressive DCT-based, lossless, & hierarchical. <br/>
> Sequential is the simple one in which entropy encoding can be applied directly to coefficients after preparation.

### Convert Huffman table specs to tables of codes and lengths

| Symbol     | Description                                                             |
| ---------- | ----------------------------------------------------------------------- |
| BITS       | List of bits from 1 to 16, containing the number of codes of each size. |
| HUFFVAL    | List of symbol values associated with codes.                            |
| HUFFSIZE   | A list of code lengths.                                                 |
| HUFFCODE   | Huffman code table, containing a code for each size in HUFFSIZE         |
| LASTK      | Index of the last entry in the table.                                   |
| SLL CODE 1 | Indicates a **shift-left-logical** of CODE by one bit position.         |
| EHUFCO     | Huffman code table for encoder                                          |  |
| EHUFSI     | Encoder table of Huffman code sizes.                                    |  |

*Generation of table of Huffman code sizes:*

```
Generate_size_table(K := 0, I := 1, J := 1):

    if J > BITS(I):
        I := I + 1
        J := 1

        if I > 16:
            HUFFSIZE(K) := 0
            LASTK := K
            // Done

        else:
            Generate_size_table(K, I, J)

    else:
        HUFFSIZE(K) := I

        K := K + 1
        J := J + 1

        Generate_size_table(K, I, J)
```

*Generation of table of Huffman codes:*

```
Generate_code_table(K := 0, CODE := 0, SI = HUFFSIZE(0)):
    HUFFCODE(K) := CODE
    CODE := CODE + 1
    K := K + 1

    if HUFFSIZE(K) != 0:
        loop:
            CODE := SLL CODE 1
            SI = SI + 1

            if HUFFSIZE(K) = SI:
                break

        if HUFFSIZE(K) = SI:
            Generate_code_table(K, CODE, SI)

    // Done
```

*Ordering procedure for encoding procedure code tables:*

```
Order_codes(K := 0):
    I := HUFFVAL(K)
    EHUFCO(I) := HUFFCODE(K)
    EHUFSI(I) := HUFFSIZE(K)
    K := K + 1

    if K < LASTK:
        Order_codes(K)

    // Done
```

#### Bit ordering within bytes

> The root of a Huffman code is placed toward the MSB (most-significant-bit) of the byte, and successive bits are placed inthe  direction  MSB  to  LSB  (least-significant-bit)  of  the  byte.  Remaining  bits,  if  any,  go  into  the  next  byte  following  thesame rules. <br/>
> Integers associated with Huffman codes are appended with the MSB adjacent to the LSB of the preceding Huffman code. <br/>
> <br/>
> \- C.3, p.53 of CCIT Rec. T.81 (1992 E)

### Encoder control procedures

```
Encode_image():
    Append SOI marker

    Encode_frame()

    Append EOI marker

    // Done
```

```
Encode_frame():
    [Append tables/miscellaneous]
    Append SOF_n marker and rest of frame header

    while More scans:
        Encode_scan()

        if First scan:
            [Append DNL segment]

    // Done
```

```
Encode_scan():
    [Append tables/miscellaneous]
    Append SOS marker and rest of scan header
    m := 0

    Encode_restart_interval()

    while More intervals:
        Append RST_m marker
        m := (m + 1) AND 7

        Encode_restart_interval()

    // Done
```

```
Encode_restart_interval():
    Reset_encoder()

    while More MCU:
        Encode_MCU()

    Prepare_for_marker()

    // Done
```

> Procedure **Reset_encoder**:<br/>
> set DC prediction (PRED) to zero for all components in the scan if process is DCT-based.

> Procedure **Prepare_for_marker** terminates entropy-coded segment by:
> padding a Huffman entropy-coded segment with 1-bits to complete the final byte (and stuffs a zero byte if needed).

```
Encode_MCU(N := 0):
    N := N + 1
    Encode data unit

    if N != Nb:
        Encode_MCU(N)

    // Done
```
