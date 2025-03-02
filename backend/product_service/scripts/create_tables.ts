import { DynamoDBClient, CreateTableCommand, CreateTableCommandInput } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

const createProductsTable = async () => {
  const params: CreateTableCommandInput = {
    TableName: "products",
    AttributeDefinitions: [
      {
        AttributeName: "id",
        AttributeType: "S",
      },
    ],
    KeySchema: [
      {
        AttributeName: "id",
        KeyType: "HASH",
      },
    ],
    BillingMode: "PAY_PER_REQUEST"
  };

  try {
    const command = new CreateTableCommand(params);
    const response = await client.send(command);
    console.log("Products table created successfully:", response);
  } catch (error) {
    console.error("Error creating products table:", error);
    throw error;
  }
};

const createStocksTable = async () => {
  const params: CreateTableCommandInput = {
    TableName: "stocks",
    AttributeDefinitions: [
      {
        AttributeName: "product_id",
        AttributeType: "S",
      },
    ],
    KeySchema: [
      {
        AttributeName: "product_id",
        KeyType: "HASH",
      },
    ],
    BillingMode: "PAY_PER_REQUEST"
  };

  try {
    const command = new CreateTableCommand(params);
    const response = await client.send(command);
    console.log("Stocks table created successfully:", response);
  } catch (error) {
    console.error("Error creating stocks table:", error);
    throw error;
  }
};

const createTables = async () => {
  try {
    await createProductsTable();
    await createStocksTable();
    console.log("All tables created successfully");
  } catch (error) {
    console.error("Error in table creation:", error);
  }
};

createTables();
