import React, { useState } from 'react';
import { Cloud, CloudLightning, CloudSun, Cloudy, Plug } from 'lucide-react';

type Provider = {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const providers: Provider[] = [
  { id: 'aws', name: 'AWS', description: 'Amazon Web Services', icon: CloudLightning },
  { id: 'azure', name: 'Azure', description: 'Microsoft Azure', icon: CloudSun },
  { id: 'gcp', name: 'GCP', description: 'Google Cloud Platform', icon: Cloud },
  { id: 'supabase', name: 'Supabase', description: 'Postgres + Auth + Storage', icon: Cloudy },
];

const AdminClouds: React.FC = () => {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (id: string) => {
    setConnecting(id);
    // Placeholder for future integration flow
    await new Promise((r) => setTimeout(r, 800));
    setConnecting(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Clouds</h1>
        <p className="text-gray-600 dark:text-white/70">Connect your cloud backends to process and store data.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((p) => (
          <div key={p.id} className="backdrop-blur-[2px] bg-white/70 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-xl p-4 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <p.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-base font-medium text-gray-900 dark:text-white">{p.name}</div>
                <div className="text-sm text-gray-500 dark:text-white/60">{p.description}</div>
              </div>
            </div>
            <button
              disabled={connecting === p.id}
              onClick={() => handleConnect(p.id)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors border
                ${connecting === p.id
                  ? 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/70 border-gray-300 dark:border-white/10'
                  : 'bg-white dark:bg-transparent text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/10 border-gray-300 dark:border-white/10'}
              `}
              title={`Connect ${p.name}`}
            >
              <Plug className="w-4 h-4" />
              {connecting === p.id ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminClouds;


