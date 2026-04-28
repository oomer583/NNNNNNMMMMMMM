import { useState, useEffect, useCallback } from 'react';
import { ProjectMetadata, BoardState } from '../types';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
});

export function useProjects() {
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.sort((a: any, b: any) => b.updatedAt - a.updatedAt));
      }
    } catch (e) {
      console.error('Failed to fetch projects', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const saveProject = useCallback(async (id: string, name: string, state: BoardState) => {
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ ...state, name })
      });
      fetchProjects();
    } catch (error) {
      console.error('Failed to save project', error);
    }
  }, [fetchProjects]);

  const createProject = useCallback(async (name: string, category: string = 'General') => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, category })
      });
      if (res.ok) {
        const data = await res.json();
        fetchProjects();
        return data.id;
      }
    } catch (error) {
      console.error('Failed to create project', error);
    }
  }, [fetchProjects]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      fetchProjects();
    } catch (error) {
      console.error('Failed to delete project', error);
    }
  }, [fetchProjects]);

  const getProject = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { headers: getHeaders() });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to get project', error);
      return null;
    }
  }, []);

  return { projects, loading, saveProject, createProject, deleteProject, getProject };
}
