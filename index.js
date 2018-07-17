var aws = require('aws-sdk');

aws.config.update({ region: 'us-east-1' })

const ccb_dates = [
    {
        'year': 2018,
        'mth': 1,
        'day': 19
    },
    {
        'year': 2018,
        'mth': 2,
        'day': 20
    },
    {
        'year': 2018,
        'mth': 3,
        'day': 20
    },
    {
        'year': 2018,
        'mth': 4,
        'day': 20
    },
    {
        'year': 2018,
        'mth': 5,
        'day': 18
    },
    {
        'year': 2018,
        'mth': 6,
        'day': 20
    },
    {
        'year': 2018,
        'mth': 7,
        'day': 20
    },
    {
        'year': 2018,
        'mth': 8,
        'day': 20
    },
    {
        'year': 2018,
        'mth': 9,
        'day': 20
    },
    {
        'year': 2018,
        'mth': 10,
        'day': 19
    },
    {
        'year': 2018,
        'mth': 11,
        'day': 20
    },
    {
        'year': 2018,
        'mth': 12,
        'day': 13
    }

];

const TABLE_DEFINITION = {
    AttributeDefinitions: [
        {
            AttributeName: 'year',
            AttributeType: 'N'

        },
        {
            AttributeName: 'mth',
            AttributeType: 'N'

        }
    ],
    KeySchema: [
        {
            AttributeName: 'year',
            KeyType: 'HASH'

        },
        {
            AttributeName: 'mth',
            KeyType: 'RANGE'

        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
    },
    TableName: 'ccb_payment_dates'
};

const DDB_BATCH_LIMIT = 25;
const DDB_API_VERSION = '2012-08-10';
const DDB_LIST_TABLE_LIMIT = 100;

function listTables(ddb, tableName) {
    return ddb.listTables({}).promise();
}

async function ddb_table_exists(ddb, tableName) {
    var tableExists = false;
    var tableNames = await listTables(ddb, tableName);

    if (tableNames.TableNames.includes(tableName)) {
        tableExists = true;
    }

    return tableExists;
}

function deleteTable(ddb, tableName) {
    return ddb.deleteTable({ TableName: tableName }).promise();
}

async function ddb_delete_table(ddb, tableName) {
    await deleteTable(ddb, tableName);
}

function createTable(ddb, tableDefinition) {
    ddb.createTable(tableDefinition).promise();
}

async function ddb_create_table(ddb, tableDefinition) {
    await createTable(ddb, tableDefinition);
}

async function setupTable(ddb, tableDefinition) {
    // if table exists, delete it 
    // create table 
    // wait for table to have status of 'active' before writing to it 
    //console.log('Table exists: ' + await ddb_table_exists(ddb, TABLE_NAME)); 
    if (await ddb_table_exists(ddb, TABLE_DEFINITION.TableName)) {
        console.log('Delete the table ' + TABLE_DEFINITION.TableName);
        await ddb_delete_table(ddb, TABLE_DEFINITION.TableName);
        // Note: Doesn't actually await for table to be deleted 
        console.log('Table deleted');
    }
    // Note: Need to check that table actually doesn't exist 
    console.log('Creating table ' + TABLE_DEFINITION.TableName);
    await ddb_create_table(ddb, TABLE_DEFINITION);
    console.log(TABLE_DEFINITION.TableName + ' created');

    return new Promise(function (resolve, reject) {
        ddb.waitFor('tableExists', { TableName: TABLE_DEFINITION.TableName }, function (error, data) {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
}

var ddb = new aws.DynamoDB({ apiVersion: DDB_API_VERSION });
var documentClient = new aws.DynamoDB.DocumentClient();
var results = setupTable(ddb, TABLE_DEFINITION);
Promise.all([results]).then(
    function (results) {
        console.log('Table created succesfully: ' + results);

        var params = {};
        params.RequestItems = {};
        params.RequestItems[TABLE_DEFINITION.TableName] = [];



        var putRequest = {};




        for (var i in ccb_dates) {

            putRequest = {
                PutRequest: {
                    Item: {}
                }
            };

            putRequest.PutRequest.Item['year'] = ccb_dates[i]['year'];
            putRequest.PutRequest.Item['mth'] = ccb_dates[i]['mth'];
            putRequest.PutRequest.Item['day'] = ccb_dates[i]['day'];

            console.log('PutRequest');
            console.log('year: ' + ccb_dates[i]['year']);
            console.log('mth: ' + ccb_dates[i]['mth']);
            console.log('day: ' + ccb_dates[i]['day']);

            params.RequestItems[TABLE_DEFINITION.TableName].push(putRequest);



        }

        console.log('params: ' + params);

        documentClient.batchWrite(params, function (error, data) {
            if (error) {
                console.log('Batch write failed: ' + error);
            }
        });
    },
    function (error) {
        console.log('Error: ' + error);
    }
);














