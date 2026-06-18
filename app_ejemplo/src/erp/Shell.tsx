import React, { useState } from 'react';
import { useErp } from './store';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Proyectos from './screens/Proyectos';
import Presupuestos from './screens/Presupuestos';
import Seguimiento from './screens/Seguimiento';
import Financiero from './screens/Financiero';
import RRHH from './screens/RRHH';
import Bodega from './screens/Bodega';

const Shell: React.FC = () => {
  const { view } = useErp();
  const [menuOpen, setMenuOpen] = useState(false);

  if (view === 'login') return <Login />;

  const screen = {
    dashboard: <Dashboard />,
    proyectos: <Proyectos />,
    presupuestos: <Presupuestos />,
    seguimiento: <Seguimiento />,
    financiero: <Financiero />,
    rrhh: <RRHH />,
    bodega: <Bodega />,
  }[view];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onMenu={() => setMenuOpen(true)} />
      <div className="flex">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 min-w-0">
          <div key={view} className="animate-[fadeIn_0.3s_ease]">{screen}</div>
        </main>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
};

export default Shell;
