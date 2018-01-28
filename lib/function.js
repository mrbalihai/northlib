const curry = (fn, ...args1) => (...args2) => fn(...args1, ...args2);
const pipe = (...args) => args.reduce((prev, curr) => curr(prev));
const compose = (...args) => args.reduceRight((prev, curr) => curr(prev));
const memoize = (fn) => {
    const cache = new WeakMap()
    return (arg) => {
        if (cache.has(arg))
            return cache.get(arg)
        const result = fn(arg)
        cache.set(arg, result)
        return result
    }
};

module.exports = {
    curry,
    pipe,
    compose,
    memoize
};
