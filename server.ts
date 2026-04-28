import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import crypto from 'crypto';

const PORT = 3000;
const JWT_SECRET = 'your-secret-key'; // In production, use env variable
const USERS_FILE = path.join(process.cwd(), 'users.json');

// Ensure users.json exists
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // Helper to read users
  const getUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  const saveUsers = (users: any) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  // --- Auth Routes ---

  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, displayName } = req.body;
    const users = getUsers();

    if (users.find((u: any) => u.email === email)) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: crypto.randomUUID(),
      email,
      password: hashedPassword,
      displayName: displayName || email.split('@')[0],
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ user: userWithoutPassword, token });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find((u: any) => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  });

  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token' });

    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const users = getUsers();
      const user = users.find((u: any) => u.id === decoded.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (e) {
      res.status(401).json({ message: 'Invalid token' });
    }
  });

  // --- Project Routes ---
  const PROJECTS_FILE = path.join(process.cwd(), 'projects.json');
  if (!fs.existsSync(PROJECTS_FILE)) fs.writeFileSync(PROJECTS_FILE, JSON.stringify({}));

  const getProjectsData = () => JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
  const saveProjectsData = (data: any) => fs.writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2));

  // Middleware to verify JWT
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.id;
      next();
    } catch (e) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };

  app.get('/api/projects', authenticate, (req: any, res) => {
    const projectsData = getProjectsData();
    const userProjects = Object.entries(projectsData)
      .filter(([id, proj]: [string, any]) => proj.userId === req.userId)
      .map(([id, proj]: [string, any]) => ({
        id,
        name: proj.name,
        category: proj.category,
        updatedAt: proj.updatedAt
      }));
    res.json(userProjects);
  });

  app.get('/api/projects/:id', authenticate, (req: any, res) => {
    const projectsData = getProjectsData();
    const project = projectsData[req.params.id];
    if (!project || project.userId !== req.userId) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  });

  app.post('/api/projects', authenticate, (req: any, res) => {
    const { name, category, nodes, edges, background } = req.body;
    const projectsData = getProjectsData();
    const id = crypto.randomUUID();
    
    projectsData[id] = {
      name,
      category: category || 'General',
      nodes: nodes || [],
      edges: edges || [],
      background: background || { type: 'dots', color: '#F8F7F4' },
      userId: req.userId,
      updatedAt: Date.now()
    };
    
    saveProjectsData(projectsData);
    res.json({ id, ...projectsData[id] });
  });

  app.put('/api/projects/:id', authenticate, (req: any, res) => {
    const { name, category, nodes, edges, background } = req.body;
    const projectsData = getProjectsData();
    if (!projectsData[req.params.id] || projectsData[req.params.id].userId !== req.userId) {
      return res.status(404).json({ message: 'Project not found' });
    }

    projectsData[req.params.id] = {
      ...projectsData[req.params.id],
      ...(name && { name }),
      ...(category && { category }),
      ...(nodes && { nodes }),
      ...(edges && { edges }),
      ...(background && { background }),
      updatedAt: Date.now()
    };

    saveProjectsData(projectsData);
    res.json(projectsData[req.params.id]);
  });

  app.delete('/api/projects/:id', authenticate, (req: any, res) => {
    const projectsData = getProjectsData();
    if (!projectsData[req.params.id] || projectsData[req.params.id].userId !== req.userId) {
      return res.status(404).json({ message: 'Project not found' });
    }
    delete projectsData[req.params.id];
    saveProjectsData(projectsData);
    res.status(204).send();
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
