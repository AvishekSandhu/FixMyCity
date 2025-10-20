
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import Home from './pages/Home.jsx'
import Navbar from './pages/Navbar.jsx';


function Allroutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <Allroutes />
    </Router>
  );
}
export default App
