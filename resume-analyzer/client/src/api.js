// import axios from 'axios';

// const API = axios.create({ 
//   baseURL: 'https://ai-smart-resume-analyzer-so1y.vercel.app' 
// });

// export default API;






import axios from 'axios';

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000'
});

export default API;


