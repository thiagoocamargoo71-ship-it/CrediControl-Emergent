import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="font-heading text-3xl font-bold text-neutral-50 tracking-tight mb-4">
          Credi<span className="text-blue-500">Control</span>
        </h1>
        <p className="text-neutral-400 mb-8">
          O registro de novos usuários está desabilitado. Entre em contato com o administrador para obter acesso ao sistema.
        </p>
        <Button
          onClick={() => navigate('/login')}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Login
        </Button>
      </div>
    </div>
  );
};

export default Register;
