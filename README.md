# dynamo-seeder

> Seed your DynamoDB database easily

## Installation

```bash
$ npm install --save dynamo-seeder
```

## How to use

```javascript
// module dependencies
var seeder = require('dynamo-seeder'),
    data = require('./fixtures/data.json');

// Connect with the database
seeder.connect({prefix: 'pridiktiv.test'});

// Seed the data
seeder.seed(data)
    .then(function() {
        // The database is successfully seeded
    }).catch(function(err) {
        // handle error
    });
```

First of all, we should make sure the database is connected with the correct tables. It uses [dynongo](https://github.com/samverschueren/dynongo) in the back.

After the database is connected, we can start seeding the data in the correct tables.

### Behaviour

You can also provide extra options that will indicate the drop strategy. By default, tables are not dropped and the data that is seeded in that table is just added
as new data. If you want to drop and create the table every time the seeder runs, you can add an extra option in the seed function.

#### Drop table

By setting this option to true, it will drop the tables that are being seeded. If you have two tables for example, but only one table is seeded,
only that table will be dropped and recreated.

```javascript
// Seed the data
seeder.seed(data, {dropTables: true})
    .then(function() {
        // The database is successfully seeded
    }).catch(function(err) {
        // handle error
    });
```

### API

#### connect(options)

See [dynongo](https://github.com/samverschueren/dynongo#connect).

#### seed(data [, options])

##### data

*Required*
Type: `object`

The JSON seeding data.

##### options

Type: `object`

Extra options for the seeder. The only option for now is `dropTables`. If set to `true`, every table will be dropped
and recreated before it is reseeded again. This option is set to `false` by default.

## Contributors

- Sam Verschueren (Author) [<sam.verschueren@gmail.com>]

## License

MIT © Sam Verschueren