// var memoize = require('../memoize');
var assert = require('assert');
var async = require('async');
var proxyquire = require('proxyquire');

//////////////////////////////////////////////////////////////////////////
// Here are mock versions of the slow_function, cache_store and 
// cache_retrieve functions. They should be defined in the application 
// code and/or in a caching library and should handle other stuff like 
// invalidating old caches, etc.
 
// Slow function will take 50 to 700 milliseconds to execute. This mock
// never produces an error.
function slow_function(callback, input){
  var output = input;

  var time = Math.random() * (700 - 50) + 50;
  setTimeout(function(){
    callback(null, output); 
  }, time);
}

function another_slow_function(callback, input){
  slow_function(callback, input);
}

// An object where cached values will be stored during these tests.
var cache = {};

// Store something in the cache. Will call back immediately.
function cache_store(callback, key, value){
  cache[key] = value;
  callback(null);
}

// Retrieve a value from the cache, usually takes less time than 
// slow_function (5 to 100 milliseconds)
function cache_retreive(callback, key){
  var value = cache[key];

  var time = Math.random() * (100 - 5) + 5;
  setTimeout(function(){
    if(!value){
      callback(new Error("No cached value for that key"), null); 
    }
    else{
      callback(null, value); 
    }
  }, time);
}

// Replace the modules loaded in the tested code with these mocks
var memoize = proxyquire('../memoize', {
  './cache_retreive': cache_retreive,
  './cache_store': cache_store
});


//////////////////////////////////////////////////////////////////////////
// Now, the actual tests.

describe('memoize', function(){
  this.timeout(10000);

  beforeEach(function(){
    cache = {};
  });

  it('should return a function', function(){
    var fast_function = memoize(slow_function);
    assert.equal(typeof(fast_function), 'function');
  });

  it('should return the correct value with or without cache', function(done){
    var input = {'hi':'there'};
    var input2 = {'ho':'hey'};
    var fast_function = memoize(slow_function);
    var fast_function_2 = memoize(another_slow_function);

    var test_input_1 = function(callback){
      async.timesSeries(2, function(n, next){ 
        fast_function(function(error, output){
          assert.equal(output.hi, 'there');
          next();
        }, input);
      }, callback);
    }

    var test_input_2 = function(callback){
      async.timesSeries(2, function(n, next){ 
        fast_function_2(function(error, output){
          assert.equal(output.ho, 'hey');
          next();
        }, input2);
      }, callback);
    }

    async.parallel([test_input_1, test_input_2], done);
  });

  it('should perform much better than the original function', function(done){
    var input = {'hi':'there'};
    var fast_function = memoize(slow_function);

    var start_time, end_time_slow, end_time_fast;

    var run_slow_function = function(){
      start_time = process.hrtime();
      async.timesLimit(100, 10, function(n, next){ // Run 100 times, concurrent 10
        slow_function(next, input);
      }, function run_slow_function_done(err){
        end_time_slow = process.hrtime(start_time);
        run_fast_function();
      });
    }

    var run_fast_function = function(){
      start_time = process.hrtime();
      async.timesLimit(100, 10, function(n, next){
        fast_function(next, input);
      }, function run_fast_function_done(err){
        end_time_fast = process.hrtime(start_time);
        finish();
      });
    }

    var finish = function(){
      var ts = end_time_slow[0]*1e9 + end_time_slow[1];
      var tf = end_time_fast[0]*1e9 + end_time_fast[1];
      console.log('      Slow time: ' + ts / 1e9 + ' sec');
      console.log('      Fast time: ' + tf / 1e9 + ' sec');
      assert(3*tf < ts);
      done();
    };

    run_slow_function();
  });
});
