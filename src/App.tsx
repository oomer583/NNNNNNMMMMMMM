/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import LinkBoard from './components/LinkBoard';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import NewProjectModal from './components/NewProjectModal';
import { useAuth } from './contexts/AuthContext';
import { useProjects } from './hooks/useProjects';

export default function App() {
  const { user, loading } = useAuth();
  const { createProject } = useProjects();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <>
      {!activeProjectId ? (
        <Dashboard 
          onSelectProject={(id) => setActiveProjectId(id)} 
          onCreateProject={() => setIsModalOpen(true)}
        />
      ) : (
        <ReactFlowProvider>
          <div className="w-full h-screen">
            <LinkBoard 
              projectId={activeProjectId} 
              onBack={() => setActiveProjectId(null)} 
              onProjectSwitch={(id) => setActiveProjectId(id)}
              onCreateProject={() => setIsModalOpen(true)}
            />
          </div>
        </ReactFlowProvider>
      )}

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (name, category) => {
          const id = await createProject(name, category);
          if (id) {
            setActiveProjectId(id);
          }
        }}
      />
    </>
  );
}
