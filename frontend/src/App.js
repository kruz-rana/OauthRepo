import './App.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate
} from 'react-router-dom';
import AuthSuccess from './AuthSuccess';

function Home() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (token) fetchPosts();
  }, [token]);

  const fetchPosts = async () => {
    const res = await axios.get('http://localhost:5000/api/posts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setPosts(res.data);
  };

  const addPost = async () => {
    await axios.post('http://localhost:5000/api/posts', { title, content }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchPosts();
  };

  if (!token) return <a href="http://localhost:5000/auth/google">Login with Google</a>;

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">My Posts</h1>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" />
      <button onClick={addPost}>Add Post</button>
      <ul>
        {posts.map((p) => (
          <li key={p._id}>{p.title} - {p.content}</li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
