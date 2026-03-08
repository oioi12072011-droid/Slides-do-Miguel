import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BarChart2 } from 'lucide-react';

export function AdminLogin() {
  const [identifier, setIdentifier] = useState('admin@slides.com');
  const [password, setPassword] = useState('admin123');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { login, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (isSignUp) {
        await signUp(identifier, password);
        setMessage('Cadastro realizado com sucesso! Se necessário, verifique seu email.');
        setIsSignUp(false); // Switch to login
      } else {
        await login(identifier, password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de autenticação.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="max-w-md w-full p-8 bg-bg-secondary border border-border-color rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30 mb-4">
            <BarChart2 className="text-accent" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">{isSignUp ? 'Criar Conta' : 'Acesso ao Painel'}</h2>
          <p className="text-text-secondary text-sm mt-2">
            {isSignUp ? 'Cadastre seu Email e Senha' : 'Entre com seu Email e Senha'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-sm p-3 rounded-lg mb-6 text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
            <input
              type="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ex: admin@slides.com"
              className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-color rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-accent text-bg-primary font-bold py-3 rounded-lg hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
          >
            {isSignUp ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-accent text-sm hover:underline"
          >
            {isSignUp ? 'Já tem uma conta? Faça Login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}
