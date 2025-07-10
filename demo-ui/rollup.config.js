import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
    input: 'src/index.ts',
    output: [
        {
            dir: 'dist',
            entryFileNames: '[name].js',
            format: 'cjs',
            sourcemap: true,
        },
        {
            dir: 'dist',
            entryFileNames: '[name].esm.js',
            format: 'esm',
            sourcemap: true,
        },
    ],
    external: [
        'react',
        'react-dom',
        'marked',
        'dompurify',
        'isomorphic-dompurify',
        'ws',
        'fs',
        'fs/promises',
        'path',
        'buffer',
        'events',
        'crypto',
        'child_process',
        'node:stream',
        'node:path',
        'node:crypto',
        'node:util',
        'node:child_process',
        'node:os',
        'node:events',
    ],
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