import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ProjectMetadata, BoardState } from '../types';
import { useAuth } from '../contexts/AuthContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs: ProjectMetadata[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        projs.push({
          id: doc.id,
          name: data.name,
          userId: data.userId,
          category: data.category || 'General',
          updatedAt: data.updatedAt?.toMillis?.() || Date.now()
        });
      });
      setProjects(projs.sort((a, b) => b.updatedAt - a.updatedAt));
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const saveProject = useCallback(async (id: string, name: string, state: BoardState) => {
    if (!user) return;
    
    const projectRef = doc(db, 'projects', id);
    try {
      await setDoc(projectRef, {
        ...state,
        name,
        userId: user.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
    }
  }, [user]);

  const createProject = useCallback(async (name: string, category: string = 'General') => {
    if (!user) return;
    const projectRef = doc(collection(db, 'projects'));
    try {
      await setDoc(projectRef, {
        name,
        category,
        userId: user.uid,
        nodes: [],
        edges: [],
        background: { type: 'dots', color: '#D1D5DB' },
        updatedAt: serverTimestamp()
      });
      return projectRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    }
  }, [user]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
    }
  }, []);

  const getProject = useCallback(async (id: string) => {
    try {
      const docSnap = await getDoc(doc(db, 'projects', id));
      if (docSnap.exists()) {
        return docSnap.data() as BoardState & { name: string };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `projects/${id}`);
    }
  }, []);

  return { projects, loading, saveProject, createProject, deleteProject, getProject };
}
