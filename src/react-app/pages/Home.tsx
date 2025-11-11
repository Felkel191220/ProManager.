import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { 
  Building2, 
  BarChart3, 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Shield,
  Zap,
  Globe,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const { user, redirectToLogin, isPending } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Package,
      title: 'Gestão de Produtos',
      description: 'Controle completo do seu inventário com categorização e controle de estoque.'
    },
    {
      icon: Users,
      title: 'Cadastro de Clientes',
      description: 'Mantenha todos os dados dos seus clientes organizados e acessíveis.'
    },
    {
      icon: ShoppingCart,
      title: 'Controle de Pedidos',
      description: 'Gerencie vendas e acompanhe o status de cada pedido em tempo real.'
    },
    {
      icon: BarChart3,
      title: 'Dashboard Analítico',
      description: 'Relatórios e métricas para tomada de decisões estratégicas.'
    },
    {
      icon: Shield,
      title: 'Segurança Garantida',
      description: 'Autenticação OAuth e dados protegidos na nuvem.'
    },
    {
      icon: Zap,
      title: 'Interface Moderna',
      description: 'Design responsivo e experiência de usuário otimizada.'
    }
  ];

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl"></div>
          <div className="h-4 bg-slate-300 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl shadow-blue-600/25">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ProManager
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Sistema completo de gestão empresarial. Gerencie produtos, clientes e pedidos 
              de forma profissional e eficiente.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={redirectToLogin}
                className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/40 transition-all duration-300 transform hover:-translate-y-1"
              >
                <Globe className="w-5 h-5" />
                Entrar com Google
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Shield className="w-4 h-4" />
                Acesso seguro e gratuito
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Funcionalidades Completas
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tudo que você precisa para gerenciar seu negócio de forma profissional
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-white/20 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {feature.title}
              </h3>
              
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 shadow-2xl shadow-blue-600/25 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Cloud-Based</div>
            </div>
            <div>
              <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold mb-2">Seguro</div>
              <div className="text-blue-100">OAuth 2.0</div>
            </div>
            <div>
              <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold mb-2">Rápido</div>
              <div className="text-blue-100">Interface Moderna</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 bg-white/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Building2 className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold text-slate-900">ProManager</span>
            </div>
            <p className="text-slate-500 text-sm">
              Sistema de gestão empresarial moderno e profissional
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
