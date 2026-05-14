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
import Templates from './components/Templates/Templates';
import CreateTemplatePage from './components/Templates/CreateTemplatePage';
import AddCampaign from './components/AddCampaign/AddCampaign';

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
            <Route path='/campaigns/add' element={<AddCampaign />} />
            <Route path='/filter' element={<FilterDrawer />} />
            <Route path='/templates' element={<Templates />} />
            <Route path='/templates/create' element={<CreateTemplatePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
