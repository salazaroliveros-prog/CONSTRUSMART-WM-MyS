import React, { useState } from 'react';
import { useErp, Rol } from '../store';
import { EMPRESA } from '../utils';
import { Building2, ArrowRight, ShieldCheck } from 'lucide-react';

const ROLES: Rol[] = ['Administrador', 'Gerente', 'Residente', 'Compras', 'Bodeguero'];

const Login: React.FC = () => {
  const { signIn, signUp, authError } = useErp();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [rol, setRol] = useState<Rol>('Administrador');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === 'up') {
      await signUp(email, pass, nombre, rol);
      try {
        await fetch('https://famous.ai/api/crm/6a1cb30ef2abfd8042cf3b53/subscribe', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: nombre || undefined, source: 'erp-signup', tags: ['erp-user', rol] }),
        });
      } catch {}
    } else {
      await signIn(email, pass);
    }
    setLoading(false);
  };

  const inp = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none mb-4";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-orange-900/40" />
        <div className="relative z-10 text-white max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-black text-xl mb-6">WM</div>
          <h1 className="text-4xl font-black leading-tight">{EMPRESA.nombre}</h1>
          <p className="text-orange-300 text-lg italic mt-2">{EMPRESA.eslogan}</p>
          <p className="text-slate-300 mt-6 leading-relaxed">ERP Integral con control de acceso por roles: Administrador, Gerente, Residente, Compras y Bodeguero.</p>
          <div className="flex gap-6 mt-8">
            {['Presupuestos', 'Control', 'Finanzas'].map(t => (
              <div key={t} className="text-center"><ShieldCheck className="w-5 h-5 mx-auto text-orange-400" /><span className="text-xs text-slate-400 mt-1 block">{t}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-black text-white">WM</div>
            <div><div className="font-bold text-slate-800">{EMPRESA.nombre}</div><div className="text-xs text-orange-500 italic">{EMPRESA.eslogan}</div></div>
          </div>
          <div className="flex items-center gap-2 text-slate-800 mb-1">
            <Building2 className="w-5 h-5 text-orange-500" />
            <h2 className="text-2xl font-bold">{mode === 'in' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6">Acceso seguro con control de roles (RBAC)</p>

          {mode === 'up' && (
            <>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre completo" className={inp} />
              <select value={rol} onChange={e => setRol(e.target.value as Rol)} className={inp}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </>
          )}
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" className={inp} />
          <input type="password" required value={pass} onChange={e => setPass(e.target.value)} placeholder="Contraseña (mín. 6)" className={inp} />

          {authError && <p className="text-xs text-red-500 mb-3">{authError}</p>}

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-60">
            {loading ? 'Procesando...' : mode === 'in' ? 'Ingresar' : 'Registrarme'} <ArrowRight className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setMode(mode === 'in' ? 'up' : 'in')} className="w-full text-center text-xs text-slate-500 mt-4 hover:text-orange-500">
            {mode === 'in' ? '¿No tienes cuenta? Crear una nueva' : '¿Ya tienes cuenta? Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
