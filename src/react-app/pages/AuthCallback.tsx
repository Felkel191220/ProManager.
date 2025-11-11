import { useEffect } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import { Loader2, CheckCircle } from 'lucide-react';

export default function AuthCallback() {
  const { exchangeCodeForSessionToken, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        // Wait a moment for the user state to update
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 text-center">
        <div className="flex flex-col items-center gap-6">
          {user ? (
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Login realizado!</h2>
                <p className="text-slate-600">Redirecionando para o dashboard...</p>
              </div>
            </>
          ) : (
            <>
              <div className="animate-spin">
                <Loader2 className="w-12 h-12 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Processando login</h2>
                <p className="text-slate-600">Aguarde enquanto configuramos sua conta...</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
