import React from 'react';

const AdminCommunity: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Community Moderation</h1>
        <p className="text-gray-600 dark:text-white/70">Review reports, manage posts and comments.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="backdrop-blur-[2px] bg-white/70 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-xl p-4">
          <div className="text-sm text-gray-500 dark:text-white/60">Pending Reports</div>
          <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">12</div>
        </div>
        <div className="backdrop-blur-[2px] bg-white/70 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-xl p-4">
          <div className="text-sm text-gray-500 dark:text-white/60">Flagged Posts</div>
          <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">5</div>
        </div>
      </div>
    </div>
  );
};

export default AdminCommunity;


