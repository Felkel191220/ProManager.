import z from "zod";

// Product schemas and types
export const ProductSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.number().min(0, "Preço deve ser positivo"),
  category: z.string().min(1, "Categoria é obrigatória"),
  stock_quantity: z.number().int().min(0, "Estoque deve ser positivo"),
  sku: z.string().optional(),
  is_active: z.number().int().min(0).max(1),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.number().min(0, "Preço deve ser positivo"),
  category: z.string().min(1, "Categoria é obrigatória"),
  stock_quantity: z.number().int().min(0, "Estoque deve ser positivo"),
  sku: z.string().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export type Product = z.infer<typeof ProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;

// Customer schemas and types
export const CustomerSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().default("Brazil"),
  is_active: z.number().int().min(0).max(1),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().default("Brazil"),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export type Customer = z.infer<typeof CustomerSchema>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;

// Order schemas and types
export const OrderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),
  total_price: z.number().min(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export const OrderSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  total_amount: z.number().min(0),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  notes: z.string().optional(),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateOrderItemSchema = z.object({
  product_id: z.number(),
  quantity: z.number().int().min(1),
});

export const CreateOrderSchema = z.object({
  customer_id: z.number(),
  items: z.array(CreateOrderItemSchema).min(1, "Pelo menos um item é obrigatório"),
  notes: z.string().optional(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type CreateOrderItem = z.infer<typeof CreateOrderItemSchema>;

// Dashboard types
export interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
}

export interface CategoryData {
  category: string;
  products: number;
  revenue: number;
}
