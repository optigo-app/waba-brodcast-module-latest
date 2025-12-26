import { useLocation } from 'react-router-dom';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Inbound from './components/Inbound/Inbound';
import Outbound from './components/Outbound/Outbound';
import { useAuthToken } from './hooks/useAuthToken';
import FilterDrawer from './components/Audience/FilterDrawer';
import Sidebar from './components/Siderbar/Sidebar';
import Header from './components/Header/Header';

function App() {
  const { userToken } = useAuthToken();
  return (
    <div className="app-container">
      <Header />
      <div className="app-body">
        <aside className="app-sidebar">
          <Sidebar />
        </aside>
        <main className="main-content">
          <Routes>
            <Route path='/' element={<Home userToken={userToken} />} />
            <Route path='/inbound' element={<Inbound />} />
            <Route path='/outbound' element={<Outbound />} />
            <Route path='/filter' element={<FilterDrawer />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
