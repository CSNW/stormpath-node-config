'use strict';

var flat = require('flat');
var extend = require('../helpers/clone-extend').extend;

var deps_folders = [
  '../../../../service-deps/',
  '../../../../deps/',
  '../../../../../../service-deps/',
  '../../../../../../deps/'
];

var env_crypto;
for (var i = 0; i < deps_folders.length; ++i) {
  var deps_folder = deps_folders[i];
  try {
    env_crypto = require(deps_folder + 'env-crypto.js');

    // if we found the deps folder, break out of the loop
    break;
  }
  catch(err) {
    if (err.code != 'MODULE_NOT_FOUND')
      throw err;
  }
}

var decrypt = env_crypto.decrypt;

/**
 * Represents a strategy that loads configuration variables from the environment into the configuration.
 *
 * @class
 */
function LoadEnvConfigStrategy (prefix, aliases) {
  this.prefix = prefix;
  this.aliases = aliases || {};
}

LoadEnvConfigStrategy.prototype.process = function (config, callback) {
  var delimiter = '_';
  var prefix = this.prefix;
  var aliases = this.aliases;
  var flatConfig = { delimiter: delimiter };
  var flattendDefaultConfig = flat.flatten(config, flatConfig);

  var flatEnvValues = Object.keys(flattendDefaultConfig)
    .reduce(function(envVarMap, key) {
      var envKey = prefix + delimiter + key.toUpperCase();

      if (envKey in aliases) {
        envKey = aliases[envKey];
      }

      var value = process.env[envKey];
      if (envKey == 'OKTA_APITOKEN') {
        value = decrypt(value);
      }

      if(value !== undefined){
        envVarMap[key] = typeof flattendDefaultConfig[key] === 'number' ?
          parseInt(value, 10) : value;
      }

      return envVarMap;
    }, {});

  var envConfig = flat.unflatten(flatEnvValues, flatConfig);

  if (envConfig) {
    extend(config, envConfig);
  }

  callback(null, config);
};

module.exports = LoadEnvConfigStrategy;
