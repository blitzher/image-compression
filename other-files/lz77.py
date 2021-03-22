from bitarray import bitarray

input_file = "lipsum.txt"
output_file = "lz77.out"
window_size = 4192
lookahead = 30

DEBUG = True

def findMatch(i, read):
    match_len = -1
    match_dist = -1
    
    lookahead_size = min(i + lookahead, len(read) + 1 )

    for j in range(1, lookahead_size):
        substring = read[i:i+j]

        window_start = max(0, i - window_size)

        print(window_start, i)

        for k in range(window_start, i):
            window_sstring = read[k:k+len(substring)]
            
            print(substring, window_sstring)

            if (window_sstring == substring):
                match_len = j
                match_dist = i-k

                
    if (match_dist > 0 and match_len > 0):
        if (DEBUG):
            print("match: <%s, %d>" % (substring, match_len))
        return (match_dist, match_len)
    return (0, read[i])


def compress(inp):
    i = 0
    output_buf = ""

    while i < len(inp):

        match = findMatch(i, inp)

        if (match[0]):
            output_buf += "(%s,%s)" % (match)
            i += match[1] 
        	
        else:
            output_buf += match[1]
            i += 1

    return output_buf

if __name__ == '__main__':
    with open(input_file, 'r') as f:
        data = f.read()
    
    with open(output_file, 'w') as f:
        f.write(compress(data))