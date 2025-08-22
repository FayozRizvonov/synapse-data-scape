import React from 'react';

const AdminCatalog: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Brands</h1>
        <p className="text-gray-600 dark:text-white/70">Manage your brands and their metadata.</p>
      </div>

      <div className="backdrop-blur-[2px] bg-white/70 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-xl p-4">
        <div className="text-sm text-gray-500 dark:text-white/60">Search</div>
        <input
          className="mt-2 w-full rounded-md border border-gray-300 dark:border-white/10 bg-white dark:bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          placeholder="Search brands..."
        />
      </div>
    </div>
  );
};

export default AdminCatalog;


