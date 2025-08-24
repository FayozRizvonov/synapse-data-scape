import React from 'react';

const AdminPanelOverview: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Admin Panel Overview</h2>
      <div className="text-muted-foreground">
        Admin panel functionality is temporarily disabled due to database type updates.
        This will be restored once the Supabase types are regenerated.
      </div>
    </div>
  );
};

export default AdminPanelOverview;


