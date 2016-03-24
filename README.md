## The challenge

AllTheRooms accesses several slow APIs, and caching is critical. Assume the following functions exist:

    cache_store(callback,key,value);
    cache_retrieve(callback,key); 
    slow_function(callback,input);

The callbacks in the functions above will be called like `callback(error[, result])`. The functions don't actually return values.

Your job is to speed up slow_function by writing a memoize function. Speed is absolutely critical and therefore callbacks need to be called as soon as information is ready.

The input of memoize is slow_function and the output is a faster function that uses the above two caching functions.

    fast_function = memoize(slow_function); // runs faster than slow_function by using cache functions

The memoized function caches stored results using the above functions. The input parameter can be the cache key. The faster version returns cached results (via callback) if they exist, or else it returns the normal slow result (via callback). Please write the memoize function.

Now, sometimes the cache function can be slower than the slow_function. Please write a version of memoize that does the following:

1. Returns the faster of the cached result or the fresh result (via callback). This means if the cache request completes first, then that result should be returned via fast_function's callback, and if the slow_function completes first, then that result should be returned via fast_function's callback. This will result in the fastest possible version of fast_function.

2. Since we are always calling slow_function, we should always update the cache in either scenario. Of course this can happen after the appropriate callback was called

Bonus question:

If cached values have an accuracy half-life of 1000 seconds, what is the TTL to achieve 95% accuracy?

## The Solution

The memoize function is implemented in memoize.js as a nodejs module. The code was tested on Arch Linux running Node 4.4.0. There are tests in tests/memoize_tests.js

If you want to run the tests, do `npm install` and then `npm test`.

Explanations are given in the comments in both the implementation and test files. Please read.

## Answer to bonus question.
