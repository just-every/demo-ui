import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/index.js',
            format: 'cjs',
            sourcemap: true,
        },
        {
            file: 'dist/index.esm.js',
            format: 'esm',
            sourcemap: true,
        },
    ],
    external: ['react', 'react-dom', 'marked', 'dompurify', 'isomorphic-dompurify'],
    plugins: [
        nodeResolve({
            preferBuiltins: false,
            browser: true,
        }),
        commonjs(),
        json(),
        typescript({
            tsconfig: './tsconfig.json',
            clean: true,
        }),
        postcss({
            extensions: ['.css', '.scss'],
            extract: 'styles.css',
            minimize: true,
            use: ['sass'],
        }),
    ],
};