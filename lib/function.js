const curry = (fn) => { 
    return function recurse(setArgs = []) {
        return (...args) => {
            setArgs = setArgs.concat(args);
            return setArgs.length < fn.length ? recurse(setArgs) : fn.apply(fn, setArgs);
        };
    }();
};

const pipe = (...args) => args.reduce((prev, curr) => curr(prev));
const compose = (...args) => args.reduceRight((prev, curr) => curr(prev));

// memoize :: (a -> b) -> b
const memoize = (fn) => {
    const cache = new WeakMap();
    return (arg) => {
        if (cache.has(arg))
            return cache.get(arg);
        const result = fn(arg);
        cache.set(arg, result);
        return result;
    };
};

module.exports = {
    curry,
    pipe,
    compose,
    memoize
};
