# Compiling

## Emscripten

*WebAssembly compilation tools.*

Setup Emscripten: [How to install and setup.](https://emscripten.org/docs/getting_started/downloads.html)

Compile:
```sh
emcc Huffman.cpp -o function.html -s EXPORTED_FUNCTIONS='["_ext_huffman"]' -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]'
```

More info: https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html#interacting-with-code-ccall-cwrap