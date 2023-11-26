import React from 'react';

const AdminPage: React.FC = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="flex text-5xl font-bold">
        ADMIN PAGE
      </div>
      <div className="mt-4 text-lg">
        You will find settings for the administrator here.
        Probably some information about how people use the tool.
      </div>
    </div>
  );
};

export default AdminPage;
