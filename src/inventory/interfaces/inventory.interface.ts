export interface InventoryCheckItem {
  productId: string;
  quantity: number;
}

export interface InventoryCheckRequest {
  items: InventoryCheckItem[];
}

export interface InventoryCheckResponse {
  available: boolean;
  unavailableItems?: string[]; // Products that don't have enough stock
}

export interface SingleStockCheckResponse {
  product_id: string;
  requested_quantity: number;
  available_quantity: number;
  available: boolean;  // Changed from is_available to available
  message?: string;
}

export interface StockDeductRequest {
  quantity: number;
}

export interface StockDeductResponse {
  product_id: string;
  new_quantity: number;
  message: string;
}
