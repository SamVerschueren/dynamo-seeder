'use strict';

/**
 * DynamoDB seeder.
 *
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  15 Sep. 2015
 */

// module dependencies
var vm = require('vm'),
    path = require('path'),
    Promise = require('pinkie-promise'),
    db = require('dynongo'),
    objectAssign = require('object-assign'),
    _ = require('lodash'),
    chalk = require('chalk'),
    moment = require('moment');

// export
module.exports = (function() {

    // The default options
    var DEFAULT_OPTIONS = {
        dropTables: false
    };

    var _this = {
        options: {},
        sandbox: {},
        seed: function(data) {
            try {
                // Iterate over all the dependencies
                Object.keys(data._dependencies || {}).forEach(function(key) {
                    if(this.sandbox[key] !== undefined) {
                        // Do nothing if the dependency is already defined globally
                        return;
                    }

                    // Load the dependency
                    this.sandbox[key] = module.parent.require(data._dependencies[key]);
                }.bind(this));

                // Remove the dependencies
                delete data._dependencies;

                return Object.keys(data).reduce(function (promise, groupKey) {
                    var group = data[groupKey],
                        schema = require(path.join(process.cwd(), group._schema)),
                        tableName = schema.TableName,
                        Table = db.table(schema.TableName);

                    // Delete the schema property
                    delete group._schema;

                    if (this.options.dropTables === true) {
                        // If dropTables is set to true, drop the table
                        promise = promise.then(function () {
                            // Log event
                            _this.log(chalk.green.bold('Drop table: ') + tableName);

                            // Create the table
                            return db.dropTable(tableName).await().exec();
                        });
                    }

                    // Allways create the table
                    promise = promise.then(function () {
                        // Log event
                        _this.log(chalk.green.bold('Create table: ') + tableName);

                        // Create the table
                        return db.createTable(schema).await().exec();
                    }).then(function () {
                        // Unwind the group
                        var unwinded = _this.unwind(group);

                        // Create an array of insert promises
                        var inserts = Object.keys(unwinded).map(function (key) {
                            // Extract the key and the data object
                            var item = _this.split(unwinded[key], schema);

                            // Create an insert promise
                            return Table.insert(item.key, item.data).exec();
                        });

                        // Log the event
                        _this.log(chalk.green.bold('Insert ' + inserts.length + ' items: ') + tableName);

                        // Execute all the promises
                        return Promise.all(inserts);
                    });

                    return promise;
                }.bind(this), Promise.resolve());
            }
            catch(err) {
                // Reject the method if something went wrong
                return Promise.reject(err);
            }
        },
        split: function (data, schema) {
            // Retrieve the key properties
            var keyProps = _.pluck(schema.KeySchema, 'AttributeName');

            // Return the key and data
            return {
                key: _.pick(data, keyProps),
                data: _.omit(data, keyProps)
            };
        },
        /**
         * This method unwinds an object and iterates over every property in the object.
         * It will then parse the value of the property in order to search for references
         * and make a reference to the correct object.
         *
         * @param  {Object} obj The object to parse.
         * @return {Object}     The object with the correct references.
         */
        unwind: function(obj) {
            return _.mapValues(obj, function(value) {
                return _this.parseValue(obj, value);
            });
        },
        /**
         * This method parses every value. If the value is an object it will unwind
         * that object as well. If the value is a reference (value starting with ->),
         * then it will find the reference to that object.
         *
         * @param  {Object} parent  The object for which the value should be parsed.
         * @param  {*}      value   The value that should be parsed.
         * @return {*}              The parsed value.
         */
        parseValue: function(parent, value) {
            if(_.isPlainObject(value)) {
                // Unwind the object
                return _this.unwind(value);
            }
            else if(_.isArray(value)) {
                // Iterate over the array
                return _.map(value, function(val) {
                    return _this.parseValue(parent, val);
                });
            }
            else if(_.isString(value) && value.indexOf('=') === 0) {
                // Evaluate the expression
                try {
                    // Assign the object to the _this property
                    var base = {
                       '_this': parent
                    };

                    // Create a new combined context
                    var ctx = vm.createContext(objectAssign(base, _this.sandbox));

                    // Run in the new context
                    return vm.runInContext(value.substr(1).replace(/this\./g, '_this.'), ctx);
                }
                catch(e) {
                    return value;
                }
            }
            else if(_.isString(value) && value.indexOf('->') === 0) {
                // Find the reference to the object
                return _this.findReference(value.substr(2));
            }

            return value;
        },
        /**
         * This method searches for the _id associated with the object represented
         * by the reference provided.
         *
         * @param  {String} ref The string representation of the reference.
         * @return {String}     The reference to the object.
         */
        findReference: function(ref) {
            var keys = ref.split('.'),
                key = keys.shift(),
                result = _this.result[key];

            if(!result) {
                // If the result does not exist, return an empty
                throw new TypeError('Could not read property \'' + key + '\' from undefined');
            }

            // Iterate over all the keys and find the property
            while((key = keys.shift())) {
                result = result[key];
            }

            return result;
        },
        /**
         * This method logs an event to the screen and prepends the arguments with the current time.
         */
        log: function (args) {
            console.log(chalk.cyan(moment().format('HH:mm:ss')), args);
        }
    };

    return {
        seed: function(data, options) {
            // Create the options object
            _this.options = objectAssign(DEFAULT_OPTIONS, options);
            _this.sandbox = {};

            // Start seeding
            return _this.seed(data);
        },
        connect: function(options) {
            // Connect with the dynamodb database
            db.connect(options);
        }
    };
})();