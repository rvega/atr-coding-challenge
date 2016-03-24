(function(){
  "use strict" 

  // These modules should actually be defined somewhere else. The ones we 
  // are loading here are empty modules. I'm doing this because we can't 
  // mock non-existent modules in the test code.
  var cache_retreive = require('./cache_retreive');
  var cache_store = require('./cache_store');

  // memoize returns a function that calls your slow function and 
  // stores it's returned value in memory so that subsequent calls 
  // are faster. 
  // We call both the slow function and the cache query and return 
  // the value that arrives first.
  // The values returned from slow_function are cached every time, no
  // matter if the cache has not expired.
  module.exports = function(slow_function){

    var fast_function = function(callback, input){
      var key = slow_function.name;
      var returned = false;

      // If neither cache_retrieve or slow_function return before
      // a timeout, bail out.
      var timeout = setTimeout(function(){
        returned = true; 
        callback(new Error('Could not run '+slow_function.name+' successfully'), null);
      }, 5000);
      
      // Try to get value from cache.
      cache_retreive(function(error, value){
        if(!returned && !error){
          callback(null, value);
          clearTimeout(timeout);
          returned = true;
        }
      }, key);

      // Run the slow function and cache the results
      slow_function(function(error, output){
        if(!returned && !error){
          callback(null, output);
          clearTimeout(timeout);
          returned = true;
        }

        if(!error){
          cache_store(function(err){
            if(err){
              console.log('Could not store in cache '+key+' : '+value);
            }
          }, key, output);
        }
      }, input);
    }

    return fast_function;
  }
})();
