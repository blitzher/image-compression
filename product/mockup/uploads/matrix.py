
class Matrix:                       #Definer for python hvad en matrix er,                                  lister af lister
    """docstring for Matrix."""
    def __init__(self, matrix):
        self.matrix = [Vector(row) if type(row) != Vector else row for row in matrix]
        self.m = len(matrix)        #m til at vaere antallet af raekker

        self.n = len(matrix[0])     #Antallet af indgange i den foorste raekke
        for row in self.matrix:          #kigger igennem alle raekkerne
            if len(row) != self.n:

                raise "Invalid matrix input!"

        self.rows = self.matrix          #raekkerne er defineret godt ved brug af listerne
        self.columns = []           #soejler skal defineres

        # Inefficiently map out the columns of the matrix
        for i in range(self.n):     #for alle rækker læg den i´te indgang til kolonnen
            column = []
            for row in self.rows:   #en ny matrix der består af dens transponerede
                column.append(row[i])
            self.columns.append(Vector(column))

    def __iter__(self):             #itererer over
        """ Iterate over the rows by default """
        for row in self.matrix:
            yield row           #giv resultat og vente, spytter listerne ud, foorst foorste raekke osv.

    def __getitem__(self, key):
        return self.rows[key]

    def __len__(self):
        return len(self.rows)

    def __repr__(self):             #når der skrives print M kan man printe en class, så det er laeseligt
        out = "<Matrix with %g columns and %g rows: \n" % (self.n, self.m)
        for row in self.rows:       #hvor mange raekker og soojler er der og se den.
            out += str(row)
            out += '\n' if row != self.rows[-1] else ''  #lave det til en string
        out += '>'
        return out

    def __mul__(self, number):      #definere hvordan det kan ganges sammen
        if type(number) == type(self): #sammenlign de to, hvis begge er matrixer gaaes til matrixprodukt
            return self.matrixProduct(number)

        out = []
        for n in range(self.n):     #definere hvordan matricer og numre ganges sammen
            row = []
            for m in range(self.m):
                row.append(self.matrix[n][m] * number)
            out.append(row)
        return Matrix(out)

    def __rmul__(self, number):     #definer at 3*M er det samme som M*3
        return self.__mul__(number)

    def __add__(self, other):       #laegger til matrixen
        if type(other)!= Matrix:    #begge skal vaere matricer for det duer
            print("Cannot implicity add/subtract matrix and non-matrix!")
            return False

        if (self.m, self.n) != (other.m, other.n):  #de skal have samme dimention
            print("Cannot add matrices of different sizes!")
            return False

        out = []
        for n in range(self.n):
            row = []
            for m in range(self.m):
                row.append(self.matrix[n][m] + other.matrix[n][m])  # TODO: round andet sted
            out.append(row)
        return Matrix(out)

    def __sub__(self,other):        # shortcut: ganger med -1
        return self.__add__(-1*other)

    def stitch_matrix_right(self, other_matrix): #saette to matricer sammen til hoojre for f eks naar A og I_s skal saettes sammen :)

        mat = []    # ny matrix hvor de er sat sammen

        for own_row, other_row in zip(self.rows, other_matrix.rows):

            mat.append( own_row % other_row )

        return Matrix(mat)

    def stitch_vector_right(self, vector):

        mat = []    # ny matrix hvor de er sat sammen

        for own_row, value in zip(self.rows, vector):

            own_row.append(value)
            mat.append( own_row)

        return Matrix(mat)

    def add_row(self, vector):
        """takes a vector and returns a new Matrix object
        of the self with added vector. Raises ValueError
        if the length of the vector is different from n"""

        while len(vector) < self.n:
            vector.append(0)


        if len(vector) != self.n:
            raise ValueError("Can't add vector, dimension are off.")

        rows = self.rows
        rows.append(vector)

        return Matrix(rows)

    def transpose(self):
        """returns a Matrix of the transposed"""

        return Matrix(self.columns)

    def set_row(self, row_number, incoming_vector):
        """
        row_number:      index 0 <= row < n
        incoming_vector: vector to change to

        Set the row at row number to incoming vector
        does not return a new Matrix object.

        Raises TypeError if row number isnt an int
        and if incoming vector isn't a vector
        """

        if type(row_number) != int or type(incoming_vector) != Vector:
            raise TypeError("Input %s, %s can't be row-set" % (row_number, incoming_vector))

        row0 = self.rows[row_number]
        if len(row0) != len(incoming_vector):
            print("Can't change dimensions of row")
            return False
        # ------------------------ #

        self.rows[row_number] = incoming_vector

    def elementary_operation(self, emo):
        """ perform the elementary operation
        by row0 = row0 + row1 * mult
        EMO = (index row0, index row1, mult)

        raises TypeError if emo isnt class EMO
        """
        if type(emo) != EMO:
            raise TypeError("Can't perform elementary row operation with non emo")
        row0 = self.rows[emo.row0]
        row1 = self.rows[emo.row1]


        self.set_row(emo.row0, row0 + row1 * emo.mult)
        return True

    def column_pivot(self, row, column):
        """performs a column pivot on the matrix

        takes a (row, column), reduces the value to 1
        and reduces all other entrances in the row
        to 0 and returns self.

        raises TypeError if row or column isnt int.
        raises KeyError if row > n or column > m.
        """

        if type(row) != int or type(column) != int:
            raise TypeError("Can't find index (%s,%s)" % (row, column))

        if column > self.n or row > self.m:
            raise KeyError("Index out of range")

        # Make sure, the pivot row has leading digit 1
        pivot_row = self.rows[row]
        pivot_entrance = self.rows[row][column]

        if pivot_entrance != 0:
            emo = EMO(row, row, mult = 1 / pivot_entrance - 1)
            self.elementary_operation(emo)

        pivot_row = self.rows[row]
        # Reduce all other entrances in column to 0
        for c, row in enumerate(self.rows):
            if row == pivot_row: continue
            self.rows[c] = self.rows[c] - pivot_row * row[column]

        return self

    def VectorProduct(self, Vector):
        """compute the vector product of self * vector"""

        if len(Vector) != self.n:
            return False

        out = []
        for row in self.rows:
            out.append(round(row * Vector,1))
        return out

    def matrixProduct(self, other):
        if type(other) != Matrix:
            print("use <A * B> to multiply a matrix by a number")
            return False

        if self.n != other.m:
            print("To multiply matrices, they need form m x n and n x p")
            return False

        out = []

        for column in other.columns:
            out.append(self.VectorProduct(column))

        return Matrix(out)

    def mvp(self, Vector):
        return self.VectorProduct(Vector)

    def mmp(self, other):
        return self.matrixProduct(other)

    def smr(self, other):
        return self.stitch_matrix_right(other)

    def svr(self, other):
        return self.stitch_vector_right(other)


class Vector:
    """docstring for Vector."""
    def __init__(self, vector):
        if type(vector) != tuple and type(vector) != list:

            raise "Can not interpret this as a vector!"
        self.values = vector

    def __iter__(self):
        for value in self.values:
            yield value

    def __getitem__(self, key):
        return self.values[key]

    def __repr__(self):

        return str([round(elem, 2) for elem in self])

    def __len__(self):
        return len(self.values)

    def __add__(self, other):

        if type(other) != type(self): return False
        if len(other) != len(self): return False

        values = [v1 + v2 for v1, v2 in zip(self, other)]
        return Vector(values)

    def __mod__(self, other):
        return Vector(self.values + other.values)

    def __eq__(self, other):
        if type(other) != type (self): return False
        return self.values == other.values

    def __mul__(self, number):
        if type(number) == type(self):
            if not len(number) == len(self):
                print("Can't multiply Vectors of different length")
                return False

            return sum([v1 * v2 for v1, v2 in zip(self, number)])

        return Vector([ v * number for v in self ])

    def __rmul__(self, number):
        return self.__mul__(number)

    def __sub__(self, other):
        return self.__add__(-1*other)

    def __rsub__(self,other):
        return self.__sub__(other)

    def append(self, val):
        self.values.append(val)
        return Vector(self.values)


class EMO:
    """ docstring for EMO """
    def __init__(self, row0, row1, mult=1):
        self.row0, self.row1, self.mult = row0, row1, mult
        self.emo = (row0, row1, mult)

    def __repr__(self):
        return "<Elementary operation: row0:{}, row1:{}, mult:{}>".format(self.row0, self.row1, self.mult)

    def __getitem__(self, key):
        return self.emo[key]






# Find lowest argument in list, and return the index of said argument
def argmin(v, greaterthan = False):
    index = False
    if greaterthan is False:
        hold = max(v)
        for c, val in enumerate(v):
            if val <= hold:
                hold = val
                index = c

    else:
        hold = max(v)
        for c, val in enumerate(v):
            if val <= hold and val >= greaterthan:
                hold = val
                index = c
    if index is False:
        print("Can't find argmin of ", Vector(v), "greater than", greaterthan, hold, max(v))
        exit()

    return index



#a = [[ 2.1 ,  3.2 ,  6.1 , -2.3],
#     [ 1.3 , -2.5 , -1.7 ,  1.5],
#     [-1.2 ,  1.5 ,  4.3 ,  2.4],
#     [ 4.1 ,  2.0 ,  5.1 ,  4.2],
#     [ 6.1 , -1.4 ,  3.0 , -1.3]]



def main():
    ...

import os
if __name__ == '__main__':
    main()
else:
    eps = 1E-14
