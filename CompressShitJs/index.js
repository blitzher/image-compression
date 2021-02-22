let { readFileSync } = require("fs");

const table = ( arr ) =>
      Array.from( new Set( arr ) )
      .map( x => arr.map( y => ( y == x ) ? 1 : 0 ) );

function encode(arr) {
    return [ arr.length + 1, ...table( arr )
        .flatMap( ( x, i ) =>
                  [ Array.from( new Set(arr) )[i], x ] ).flat(2) ];
}


const decode = arr => {
    let str = arr.slice( 1 );

    let [ newArr, out ] = [ [], [].fill( 0, 0, arr[1] ) ];

    for ( i = 0; i < str.length; i += arr[0] ) {
        newArr.push( str.slice( i, i + arr[0] ) );
    }


    newArr.map( xs => [ xs[0], xs.slice( 1 ) ] )
        .forEach( x =>
                  x[1].forEach( ( y, i ) =>
                                { if ( y == 1 ) { out[i] = x[0]; } } ) );

    return out.join("");
}


let src = Array.from( "Hello, World! Hello, World! Hello, World!");
let encoded = encode( src );
let decoded = decode( encoded );

console.log( src, "\n" );
console.log( encoded, "\n" );
console.log( decoded);
