import './App.css';
import { Route, Routes } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './components/Home';
// import Inbound from './components/Inbound/Inbound';
// import Outbound from './components/Outbound/Outbound';
import CampaignGrid from './components/CampaignGrid/CampaignGrid';
import { useAuthToken } from './hooks/useAuthToken';
import FilterDrawer from './components/Audience/FilterDrawer';
import Sidebar from './components/Siderbar/Sidebar';
import Header from './components/Header/Header';
import Unauthenticated from './components/Unauthenticated/Unauthenticated';
import Templates from './components/Templates/Templates';
import CreateTemplatePage from './components/Templates/CreateTemplatePage';
import AddCampaign from './components/AddCampaign/AddCampaign';
import CampaignReport from './components/CampaignReport/CampaignReport';
import socket from './utils/socket';
import { WalletProvider } from './contexts/WalletContext';

function App() {
  const { userToken } = useAuthToken();
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      console.log('✅ Socket connected');
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log('❌ Socket disconnected');
    }

    function onTemplateUpdate(data) {
      console.log('📨 templateUpdate received:', data);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('templateUpdate', onTemplateUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('templateUpdate', onTemplateUpdate);
    };
  }, []);

  if (!userToken) {
    return <Unauthenticated />;
  }

  return (
    <WalletProvider>
      <div className="app-container">
        <Header />
        <div className="app-body">
          <aside className="app-sidebar">
            <Sidebar />
          </aside>
          <main className="main-content">
            <Routes>
              <Route path='/' element={<Home userToken={userToken} />} />
              {/* <Route path='/inbound' element={<Inbound />} /> */}
              {/* <Route path='/outbound' element={<Outbound />} /> */}
              <Route path='/campaigns' element={<CampaignGrid />} />
              <Route path='/campaigns/add' element={<AddCampaign />} />
              <Route path='/filter' element={<FilterDrawer />} />
              <Route path='/templates' element={<Templates />} />
              <Route path='/templates/create' element={<CreateTemplatePage />} />
              <Route path='/report/:id' element={<CampaignReport />} />
            </Routes>
          </main>
        </div>
      </div>
    </WalletProvider>
  );
}

export default App;
