import React, { useMemo, useState } from 'react';
import { UserPlus, Mail, Tags, ShieldCheck, ChevronDown } from 'lucide-react';

type FeatureId =
  | 'pharma_sm'
  | 'channel_impact_model'
  | 'performance_stats'
  | 'sales_forecast'
  | 'dynamic_strategy_simulator'
  | 'diminishing_return_curves'
  | 'campaign_management'
  | 'omnichannel_cjf';

type UserAccess = {
  id: string;
  name: string;
  email: string;
  brands: string[];
  features: Record<FeatureId, boolean>;
};

const availableBrands = ['Claire', 'Nexium', 'Voltaren', 'Panadol', 'Maalox', 'Berocca'];

const allFeatures: { id: FeatureId; label: string }[] = [
  { id: 'pharma_sm', label: 'Pharma S&M Augmented Analytics' },
  { id: 'channel_impact_model', label: 'Channel Impact Model' },
  { id: 'performance_stats', label: 'Performance Stats' },
  { id: 'sales_forecast', label: 'Sales Forecast' },
  { id: 'dynamic_strategy_simulator', label: 'Dynamic Strategy Simulator' },
  { id: 'diminishing_return_curves', label: 'Diminishing Return Curves' },
  { id: 'campaign_management', label: 'Campaign Management' },
  { id: 'omnichannel_cjf', label: 'Omnichannel Customer Journey Framework' },
];

const createEmptyFeatures = (): Record<FeatureId, boolean> =>
  allFeatures.reduce((acc, f) => ({ ...acc, [f.id]: false }), {} as Record<FeatureId, boolean>);

const AdminPanelOverview: React.FC = () => {
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(true);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserBrands, setNewUserBrands] = useState<string[]>([]);
  const [newUserFeatures, setNewUserFeatures] = useState<Record<FeatureId, boolean>>(createEmptyFeatures());

  const stats = useMemo(() => ({
    users: users.length,
    brands: new Set(users.flatMap(u => u.brands)).size,
    featuresEnabled: users.reduce((sum, u) => sum + Object.values(u.features).filter(Boolean).length, 0),
  }), [users]);

  const toggleBrand = (brand: string) => {
    setNewUserBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  const toggleFeature = (featureId: FeatureId) => {
    setNewUserFeatures(prev => ({ ...prev, [featureId]: !prev[featureId] }));
  };

  const addUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    const newUser: UserAccess = {
      id: `${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      brands: [...newUserBrands],
      features: { ...newUserFeatures },
    };
    setUsers(prev => [newUser, ...prev]);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserBrands([]);
    setNewUserFeatures(createEmptyFeatures());
  };

  const toggleUserFeature = (userId: string, featureId: FeatureId) => {
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      features: { ...u.features, [featureId]: !u.features[featureId] }
    } : u));
  };

  const toggleUserBrand = (userId: string, brand: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      brands: u.brands.includes(brand) ? u.brands.filter(b => b !== brand) : [...u.brands, brand]
    } : u));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
        <p className="text-gray-600 dark:text-white/70">Overview, users and quick access control.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="backdrop-blur-[2px] bg-white/70 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-xl p-4">
          <div className="text-sm text-gray-500 dark:text-white/60">Users</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.users}</div>
        </div>
        <div className="backdrop-blur-[2px] bg-white/70 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-xl p-4">
          <div className="text-sm text-gray-500 dark:text-white/60">Brands Used</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.brands}</div>
        </div>
        <div className="backdrop-blur-[2px] bg-white/70 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-xl p-4">
          <div className="text-sm text-gray-500 dark:text-white/60">Enabled Features</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.featuresEnabled}</div>
        </div>
      </div>

      {/* Add User Form */}
      <div className="mb-6 rounded-2xl border border-gray-200/60 dark:border-white/10 bg-gradient-to-br from-white/80 to-white/50 dark:from-white/[0.06] dark:to-white/[0.03] backdrop-blur-xl shadow-blue-sm">
        <button
          onClick={() => setIsFormOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <UserPlus className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-base font-semibold text-gray-900 dark:text-white">Add User</div>
              <div className="text-xs text-gray-500 dark:text-white/60">Create a user, assign brands and feature access</div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-white/60 transition-transform ${isFormOpen ? 'rotate-180' : ''}`} />
        </button>
        {isFormOpen && (
          <div className="px-5 pb-5 grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70"><Mail className="w-4 h-4" /> Email</span>
                <input
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  type="email"
                  placeholder="user@company.com"
                  className="rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </label>
              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70"><UserPlus className="w-4 h-4" /> Name</span>
                <input
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  type="text"
                  placeholder="Jane Doe"
                  className="rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </label>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70"><Tags className="w-4 h-4" /> Brands</div>
              <div className="flex flex-wrap gap-2">
                {availableBrands.map(b => (
                  <button
                    key={b}
                    onClick={() => toggleBrand(b)}
                    className={`px-3 py-1.5 rounded-full text-xs border backdrop-blur-[2px] transition-colors ${
                      newUserBrands.includes(b)
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300 border-blue-200/60 dark:border-cyan-500/30'
                        : 'text-gray-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/10 border-gray-300/60 dark:border-white/10'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70"><ShieldCheck className="w-4 h-4" /> Feature Access</div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {allFeatures.map(f => (
                  <button
                    key={f.id}
                    onClick={() => toggleFeature(f.id)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors ${
                      newUserFeatures[f.id]
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-blue-700 dark:text-cyan-300'
                        : 'bg-white/70 dark:bg-white/5 border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                    }`}
                    title={f.label}
                  >
                    <span className="truncate pr-3 text-left">{f.label}</span>
                    <span className={`ml-3 inline-flex h-5 w-10 items-center rounded-full transition-colors ${newUserFeatures[f.id] ? 'bg-cyan-500/60' : 'bg-gray-300/60 dark:bg-white/10'}`}>
                      <span className={`h-4 w-4 rounded-full bg-white dark:bg-white/80 shadow-sm transform transition-transform ${newUserFeatures[f.id] ? 'translate-x-5' : 'translate-x-1'}`} />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={addUser}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-500 hover:to-blue-500 border border-cyan-500/40 shadow-blue-md transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Add user
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 gap-4">
        {users.map(user => (
          <div key={user.id} className="rounded-2xl border border-gray-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">{user.name}</div>
                <div className="text-sm text-gray-600 dark:text-white/70">{user.email}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {availableBrands.map(b => (
                    <button
                      key={b}
                      onClick={() => toggleUserBrand(user.id, b)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        user.brands.includes(b)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-300 border-blue-200/60 dark:border-cyan-500/30'
                          : 'text-gray-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/10 border-gray-300/60 dark:border-white/10'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 flex-1">
                {allFeatures.map(f => (
                  <button
                    key={f.id}
                    onClick={() => toggleUserFeature(user.id, f.id)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors ${
                      user.features[f.id]
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-blue-700 dark:text-cyan-300'
                        : 'bg-white/70 dark:bg-white/5 border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                    }`}
                    title={f.label}
                  >
                    <span className="truncate pr-3 text-left">{f.label}</span>
                    <span className={`ml-3 inline-flex h-5 w-10 items-center rounded-full transition-colors ${user.features[f.id] ? 'bg-cyan-500/60' : 'bg-gray-300/60 dark:bg-white/10'}`}>
                      <span className={`h-4 w-4 rounded-full bg-white dark:bg-white/80 shadow-sm transform transition-transform ${user.features[f.id] ? 'translate-x-5' : 'translate-x-1'}`} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300/60 dark:border-white/10 p-8 text-center text-sm text-gray-500 dark:text-white/60">
            No users yet. Add the first user to start assigning access.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanelOverview;


