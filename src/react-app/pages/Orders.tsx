import { useState, useEffect } from 'react';
import { Plus, Eye, ShoppingCart } from 'lucide-react';
import type { Product, Customer, CreateOrder } from '@/shared/types';

interface OrderWithDetails {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  items?: Array<{
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export default function Orders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<OrderWithDetails | null>(null);
  const [formData, setFormData] = useState<CreateOrder>({
    customer_id: 0,
    items: [{ product_id: 0, quantity: 1 }],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        fetch('/api/orders', { credentials: 'include' }),
        fetch('/api/products', { credentials: 'include' }),
        fetch('/api/customers', { credentials: 'include' })
      ]);

      const [ordersData, productsData, customersData] = await Promise.all([
        ordersRes.json(),
        productsRes.json(),
        customersRes.json()
      ]);

      setOrders(ordersData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        await fetchData();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const viewOrderDetails = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, { credentials: 'include' });
      const orderData = await response.json();
      setViewingOrder(orderData);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        await fetchData();
        if (viewingOrder) {
          setViewingOrder({ ...viewingOrder, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: 0,
      items: [{ product_id: 0, quantity: 1 }],
      notes: ''
    });
    setShowForm(false);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: 0, quantity: 1 }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: 'product_id' | 'quantity', value: number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmado';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-slate-300 rounded-full"></div>
          <div className="h-4 bg-slate-300 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Pedidos</h1>
          <p className="text-slate-600">Gerencie suas vendas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          Novo Pedido
        </button>
      </div>

      {/* Order Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Novo Pedido</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cliente *</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({...formData, customer_id: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                  required
                >
                  <option value={0}>Selecione um cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-slate-700">Itens do Pedido *</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    Adicionar Item
                  </button>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-3 mb-3 items-end">
                    <div className="flex-1">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                        required
                      >
                        <option value={0}>Selecione um produto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {formatCurrency(product.price)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                        required
                      />
                    </div>
                    
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Criar Pedido
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Pedido #{viewingOrder.id}</h2>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-slate-500 hover:text-slate-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Cliente</label>
                  <p className="text-lg text-slate-900">{viewingOrder.customer_name}</p>
                  <p className="text-sm text-slate-600">{viewingOrder.customer_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Data</label>
                  <p className="text-lg text-slate-900">{formatDate(viewingOrder.created_at)}</p>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-slate-500 mb-2 block">Status</label>
                <select
                  value={viewingOrder.status}
                  onChange={(e) => updateOrderStatus(viewingOrder.id, e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {/* Items */}
              <div>
                <label className="text-sm font-medium text-slate-500 mb-3 block">Itens do Pedido</label>
                <div className="space-y-2">
                  {viewingOrder.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{item.product_name}</p>
                        <p className="text-sm text-slate-600">
                          {item.quantity}x {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900">{formatCurrency(item.total_price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(viewingOrder.total_amount)}</span>
                </div>
              </div>

              {/* Notes */}
              {viewingOrder.notes && (
                <div>
                  <label className="text-sm font-medium text-slate-500 mb-2 block">Observações</label>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{viewingOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Pedido</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Cliente</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Data</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Total</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                        <ShoppingCart className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-slate-900">#{order.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{order.customer_name}</p>
                      <p className="text-sm text-slate-500">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-green-600">{formatCurrency(order.total_amount)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => viewOrderDetails(order.id)}
                      className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-20">
          <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum pedido encontrado</h3>
          <p className="text-slate-600 mb-6">Comece criando seu primeiro pedido</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Criar Pedido
          </button>
        </div>
      )}
    </div>
  );
}
