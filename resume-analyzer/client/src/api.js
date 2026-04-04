import axios from 'axios';

const API = axios.create({ 
  baseURL: 'https://ai-smart-resume-analyzer-so1y.vercel.app' 
});

export default API;