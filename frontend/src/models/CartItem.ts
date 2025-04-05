import { Product } from "~/models/Product";

export type CartItem = {
  product: Product;
  product_id?: string;
  cart_id?: string;
  count: number;
};
