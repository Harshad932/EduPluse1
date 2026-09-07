/**
 * Seeds a few sample team members through the running API.
 * Usage: npm run seed   (make sure `npm run dev` is running in another terminal first)
 */
require('dotenv').config();
const http = require('http');

const PORT = process.env.PORT || 5000;
const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || 'admin-secret-token';

const sampleMembers = [
  {
    name: 'Alex Rivera',
    role: 'Lead Full Stack Developer',
    category: 'team',
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    description: 'Architected the dynamic MCQ evaluation engine and real-time state management for interactive classroom sessions.',
    github_url: 'https://github.com',
    linkedin_url: 'https://linkedin.com'
  },
  {
    name: 'Sarah Chen',
    role: 'Frontend & UI/UX Engineer',
    category: 'team',
    image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    description: 'Designed the modern glassmorphism aesthetic, responsive dashboards, and camera preview interface components.',
    github_url: 'https://github.com',
    linkedin_url: 'https://linkedin.com'
  },
  {
    name: 'David Miller',
    role: 'System Architect & DevOps',
    category: 'team',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    description: 'Specialized in performance optimization, modular component architecture, and future backend integration readiness.',
    github_url: 'https://github.com',
    linkedin_url: 'https://linkedin.com'
  },
  {
    name: 'Prof. Mayur Raut',
    role: 'Academic Advisor & Mentor',
    category: 'mentor',
    image_url: 'https://ik.imagekit.io/anteshwar27/learning-platform/team/1661493985532.jpg',
    description: 'Guided by industry leaders and educators committed to elevating classroom interactive standards.',
    github_url: '',
    linkedin_url: 'https://www.linkedin.com/in/prof-mayur-raut-6241b324a/'
  }
];

function postMember(member) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(member);
    const req = http.request(
      {
        host: 'localhost',
        port: PORT,
        path: '/api/team',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY,
          'Content-Length': Buffer.byteLength(postData)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
      }
    );
    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

async function seed() {
  console.log(`Seeding initial team members via http://localhost:${PORT}/api/team ...`);
  for (const m of sampleMembers) {
    try {
      const res = await postMember(m);
      console.log(res.success ? `Created: ${m.name}` : `Failed: ${m.name} - ${res.message}`);
    } catch (err) {
      console.error(`Error seeding ${m.name}:`, err.message);
      console.error('Is the server running? Start it with `npm run dev` in another terminal.');
      process.exit(1);
    }
  }
  console.log('Seeding complete.');
}

seed();
