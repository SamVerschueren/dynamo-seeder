# dynamo-seeder

> Seed your DynamoDB database easily


## Installation

```
$ npm install --save dynamo-seeder
```


## How to use

```js
const seeder = require('dynamo-seeder');
const data = require('./fixtures/data.json');

seeder.connect({
	prefix: 'pridiktiv.test'
});

seeder.seed(data)
    .then(() => {
        // The database is successfully seeded
    })
    .catch(err => {
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
seeder.seed(data, {dropTables: true})
    .then(() => {
        // The database is successfully seeded
    })
    .catch(err => {
        // handle error
    });
```

### JSON file

#### Simple data

How does a json file looks like? Take a look at this simple example.

```json
{
    "users": {
        "_schema": "path/to/UserSchema.json",
        "foo": {
            "firstName": "Foo",
            "name": "Bar",
            "email": "foo@bar.com"
        }
    }
}
```

Where the schema defines the DynamoDB [createTable](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#createTable-property)
definition. An example of the `UserSchema.json` file could look like this.

```json
{
    "TableName": "User",
    "AttributeDefinitions": [
        {
            "AttributeName": "email",
            "AttributeType": "S"
        }
    ],
    "KeySchema": [
        {
            "AttributeName": "email",
            "KeyType": "HASH"
        }
    ],
    "ProvisionedThroughput": {
        "ReadCapacityUnits": 1,
        "WriteCapacityUnits": 1
    }
}
```

The path to the schema is relative from the path where the seeder calls the `seed()` method. It will throw an error if
the schema could not be found.

#### Expressions

Sometimes you will need something as an expression, for instance to set the birthday of the user.

```json
{
    "users": {
        "_schema": "path/to/UserSchema.json",
        "foo": {
            "firstName": "Foo",
            "name": "Bar",
            "email": "foo@bar.com",
            "birthday": "=new Date(1988, 08, 16).toISOString()"
        }
    }
}
```

Every statement that is preceded by an `=`-sign will be parsed.

We can also bring it a step further and reference to the object itself. For instance, if we want to store
the full name of the user aswell, instead of adding it manually, you can do something like this.

```json
{
    "users": {
        "_schema": "path/to/UserSchema.json",
        "foo": {
            "firstName": "Foo",
            "name": "Bar",
            "fullName": "=this.firstName + ' ' + this.name",
            "email": "foo@bar.com",
            "birthday": "=new Date(1988, 08, 16).toISOString()"
        }
    }
}
```

The result of the `fullName` expression will be `Foo Bar`. So every evaluation is evaluated in it's own context.

#### Dependencies

What if we don't want to make use of the plain old `Date` object, but instead use something like [moment](http://momentjs.com/).
This is possible by adding a list of dependencies.

```json
{
    "_dependencies": {
        "moment": "moment"
    },
    "users": {
        "_schema": "path/to/UserSchema.json",
        "foo": {
            "firstName": "Foo",
            "name": "Bar",
            "email": "foo@bar.com",
            "birthday": "=moment('1988-08-16').format()"
        }
    }
}
```

If you are using a dependency in your json file, be sure to install it as dependency in your project. If not,
it will stop the execution and return a `MODULE_NOT_FOUND` error.

### API

#### connect(options)

See [dynongo](https://github.com/samverschueren/dynongo#connect).

#### seed(data, [options])

##### data

Type: `object`

The JSON seeding data.

##### options

###### dropTables

Type: `boolean`<br>
Default: `false`

Drop every table and recreate before it is reseeded again.

###### cwd

Type: `string`<br>
Default: `process.cwd()`

Working directory which is used as base path for the `_schema` property.


## Related

- [mongoose-seeder](https://github.com/samverschueren/mongoose-seeder) - Seed your MongoDB database easily


## License

MIT © Sam Verschueren
