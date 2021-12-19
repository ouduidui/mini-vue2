import babel from "rollup-plugin-babel";
import {uglify} from "rollup-plugin-uglify";

export default {
    input: "src/index.js",
    output: {
        file: "dist/vue.min.js",
        format: "esm"
    },
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        uglify()
    ]
}