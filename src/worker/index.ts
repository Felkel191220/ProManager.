import { Hono } from "hono";
import { cors } from "hono/cors";
import { 
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";
import { 
  ProductSchema, 
  CreateProductSchema, 
  UpdateProductSchema,
  CustomerSchema,
  CreateCustomerSchema,
  UpdateCustomerSchema,
  OrderSchema,
  CreateOrderSchema,
  type DashboardStats,
  type RevenueData,
  type CategoryData
} from "../shared/types";

interface Env {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: (origin) => origin,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Auth routes
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Dashboard routes
app.get('/api/dashboard/stats', authMiddleware, async (c) => {
  const user = c.get('user');
  
  const [
    { results: [productsCount] },
    { results: [customersCount] },
    { results: [ordersCount] },
    { results: [revenueSum] },
    { results: [pendingCount] },
    { results: [lowStockCount] }
  ] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE user_id = ? AND is_active = 1').bind(user!.id).all(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM customers WHERE user_id = ? AND is_active = 1').bind(user!.id).all(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ?').bind(user!.id).all(),
    c.env.DB.prepare('SELECT COALESCE(SUM(total_amount), 0) as sum FROM orders WHERE user_id = ?').bind(user!.id).all(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status = ?').bind(user!.id, 'pending').all(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE user_id = ? AND stock_quantity < 10 AND is_active = 1').bind(user!.id).all(),
  ]);

  const stats: DashboardStats = {
    totalProducts: (productsCount as any).count,
    totalCustomers: (customersCount as any).count,
    totalOrders: (ordersCount as any).count,
    totalRevenue: (revenueSum as any).sum,
    pendingOrders: (pendingCount as any).count,
    lowStockProducts: (lowStockCount as any).count,
  };

  return c.json(stats);
});

app.get('/api/dashboard/revenue', authMiddleware, async (c) => {
  const user = c.get('user');
  
  const { results } = await c.env.DB.prepare(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      SUM(total_amount) as revenue
    FROM orders 
    WHERE user_id = ? 
      AND created_at >= datetime('now', '-12 months')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
    LIMIT 12
  `).bind(user!.id).all();

  return c.json(results as unknown as RevenueData[]);
});

app.get('/api/dashboard/categories', authMiddleware, async (c) => {
  const user = c.get('user');
  
  const { results } = await c.env.DB.prepare(`
    SELECT 
      p.category,
      COUNT(*) as products,
      COALESCE(SUM(oi.total_price), 0) as revenue
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id
    WHERE p.user_id = ? AND p.is_active = 1
      AND (o.user_id = ? OR o.user_id IS NULL)
    GROUP BY p.category
    ORDER BY revenue DESC
    LIMIT 10
  `).bind(user!.id, user!.id).all();

  return c.json(results as unknown as CategoryData[]);
});

// Product routes
app.get('/api/products', authMiddleware, async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user!.id).all();
  
  return c.json(results.map(product => ProductSchema.parse(product)));
});

app.get('/api/products/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM products WHERE id = ? AND user_id = ?'
  ).bind(id, user!.id).all();
  
  if (results.length === 0) {
    return c.json({ error: 'Product not found' }, 404);
  }
  
  return c.json(ProductSchema.parse(results[0]));
});

app.post('/api/products', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const validation = CreateProductSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: validation.error.issues }, 400);
  }
  
  const product = validation.data;
  const { results } = await c.env.DB.prepare(`
    INSERT INTO products (name, description, price, category, stock_quantity, sku, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    RETURNING *
  `).bind(
    product.name,
    product.description || null,
    product.price,
    product.category,
    product.stock_quantity,
    product.sku || null,
    user!.id
  ).all();
  
  return c.json(ProductSchema.parse(results[0]), 201);
});

app.put('/api/products/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const validation = UpdateProductSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: validation.error.issues }, 400);
  }
  
  const updates = validation.data;
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  
  const { results } = await c.env.DB.prepare(`
    UPDATE products 
    SET ${fields}, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
    RETURNING *
  `).bind(...values, id, user!.id).all();
  
  if (results.length === 0) {
    return c.json({ error: 'Product not found' }, 404);
  }
  
  return c.json(ProductSchema.parse(results[0]));
});

app.delete('/api/products/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const result = await c.env.DB.prepare(
    'DELETE FROM products WHERE id = ? AND user_id = ?'
  ).bind(id, user!.id).run();
  
  if (!result.success) {
    return c.json({ error: 'Product not found' }, 404);
  }
  
  return c.json({ success: true });
});

// Customer routes
app.get('/api/customers', authMiddleware, async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM customers WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user!.id).all();
  
  return c.json(results.map(customer => CustomerSchema.parse(customer)));
});

app.get('/api/customers/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM customers WHERE id = ? AND user_id = ?'
  ).bind(id, user!.id).all();
  
  if (results.length === 0) {
    return c.json({ error: 'Customer not found' }, 404);
  }
  
  return c.json(CustomerSchema.parse(results[0]));
});

app.post('/api/customers', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const validation = CreateCustomerSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: validation.error.issues }, 400);
  }
  
  const customer = validation.data;
  const { results } = await c.env.DB.prepare(`
    INSERT INTO customers (name, email, phone, address, city, state, postal_code, country, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    RETURNING *
  `).bind(
    customer.name,
    customer.email,
    customer.phone || null,
    customer.address || null,
    customer.city || null,
    customer.state || null,
    customer.postal_code || null,
    customer.country || 'Brazil',
    user!.id
  ).all();
  
  return c.json(CustomerSchema.parse(results[0]), 201);
});

app.put('/api/customers/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const validation = UpdateCustomerSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: validation.error.issues }, 400);
  }
  
  const updates = validation.data;
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  
  const { results } = await c.env.DB.prepare(`
    UPDATE customers 
    SET ${fields}, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
    RETURNING *
  `).bind(...values, id, user!.id).all();
  
  if (results.length === 0) {
    return c.json({ error: 'Customer not found' }, 404);
  }
  
  return c.json(CustomerSchema.parse(results[0]));
});

app.delete('/api/customers/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const result = await c.env.DB.prepare(
    'DELETE FROM customers WHERE id = ? AND user_id = ?'
  ).bind(id, user!.id).run();
  
  if (!result.success) {
    return c.json({ error: 'Customer not found' }, 404);
  }
  
  return c.json({ success: true });
});

// Order routes
app.get('/api/orders', authMiddleware, async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(`
    SELECT o.*, c.name as customer_name, c.email as customer_email
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `).bind(user!.id).all();
  
  return c.json(results);
});

app.get('/api/orders/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const { results: orderResults } = await c.env.DB.prepare(`
    SELECT o.*, c.name as customer_name, c.email as customer_email
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ? AND o.user_id = ?
  `).bind(id, user!.id).all();
  
  if (orderResults.length === 0) {
    return c.json({ error: 'Order not found' }, 404);
  }
  
  const { results: itemResults } = await c.env.DB.prepare(`
    SELECT oi.*, p.name as product_name, p.sku as product_sku
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).bind(id).all();
  
  return c.json({
    ...orderResults[0],
    items: itemResults
  });
});

app.post('/api/orders', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const validation = CreateOrderSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: validation.error.issues }, 400);
  }
  
  const order = validation.data;
  
  // Calculate total amount
  let totalAmount = 0;
  const orderItems = [];
  
  for (const item of order.items) {
    const { results } = await c.env.DB.prepare(
      'SELECT price FROM products WHERE id = ? AND user_id = ?'
    ).bind(item.product_id, user!.id).all();
    
    if (results.length === 0) {
      return c.json({ error: `Product ${item.product_id} not found` }, 400);
    }
    
    const product = results[0] as any;
    const totalPrice = product.price * item.quantity;
    totalAmount += totalPrice;
    
    orderItems.push({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: product.price,
      total_price: totalPrice
    });
  }
  
  // Create order
  const { results: orderResults } = await c.env.DB.prepare(`
    INSERT INTO orders (customer_id, total_amount, notes, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    RETURNING *
  `).bind(order.customer_id, totalAmount, order.notes || null, user!.id).all();
  
  const createdOrder = orderResults[0] as any;
  
  // Create order items
  for (const item of orderItems) {
    await c.env.DB.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      createdOrder.id,
      item.product_id,
      item.quantity,
      item.unit_price,
      item.total_price
    ).run();
  }
  
  return c.json(OrderSchema.parse(createdOrder), 201);
});

app.put('/api/orders/:id/status', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  
  if (!body.status || !['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(body.status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }
  
  const { results } = await c.env.DB.prepare(`
    UPDATE orders 
    SET status = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
    RETURNING *
  `).bind(body.status, id, user!.id).all();
  
  if (results.length === 0) {
    return c.json({ error: 'Order not found' }, 404);
  }
  
  return c.json(OrderSchema.parse(results[0]));
});

export default app;
