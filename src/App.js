import { useLocation } from 'react-router-dom';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Inbound from './components/Inbound/Inbound';
import Outbound from './components/Outbound/Outbound';
import CampaignGrid from './components/CampaignGrid/CampaignGrid';
import { useAuthToken } from './hooks/useAuthToken';
import FilterDrawer from './components/Audience/FilterDrawer';
import Sidebar from './components/Siderbar/Sidebar';
import Header from './components/Header/Header';
import Unauthenticated from './components/Unauthenticated/Unauthenticated';

function App() {
  const { userToken } = useAuthToken();
  console.log('kjksj', userToken)
  
  if (!userToken) {
    return <Unauthenticated />;
  }
  
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
            <Route path='/campaigns' element={<CampaignGrid />} />
            <Route path='/filter' element={<FilterDrawer />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
