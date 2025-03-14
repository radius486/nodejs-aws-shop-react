import { createMultipleProductsWithStock } from "./fill_tables";
import { products } from "../mocks";

const createProducts = async () => {
  try {
    await createMultipleProductsWithStock(products);
  } catch (error) {
    console.error("Failed to create products:", error);
  }
};

createProducts();
