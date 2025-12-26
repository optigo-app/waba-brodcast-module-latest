import React, { useEffect, useState } from 'react';
import './Sidebar.scss';
import { HomeIcon, MessageCircle, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const ICON_PROPS = { size: 20, strokeWidth: 2 };

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activePath, setActivePath] = useState(location.pathname);

    const menuItems = [
        { path: '/inbound', icon: <HomeIcon {...ICON_PROPS} />, label: 'Inbound' },
        { path: '/outbound', icon: <Users {...ICON_PROPS} />, label: 'Outbound' },
    ];

    useEffect(() => {
        setActivePath(location.pathname);
    }, [location.pathname]);

    return (
        <div className="sidebar_mainDiv">
            <div className="sidebar-content">
                <div className="sidebar-sections">
                    {/* Header / brand */}
                    <div className="agentic-chat-header" onClick={() => navigate('/')}> 
                        <div className="agentic-chat-header__icon">
                            <div className="icon-bg">
                                <MessageCircle className="icon" {...ICON_PROPS} />
                            </div>
                            <h1 className="title">CRM Broadcast</h1>
                        </div>
                    </div>

                    {/* Main navigation */}
                    <div className="sidebar_main">
                        <ul>
                            {menuItems.map((item) => {
                                const isActive = activePath === item.path;

                                return (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            onClick={() => setActivePath(item.path)}
                                            className={isActive ? 'active' : ''}
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                {/* Powered by section at the bottom */}
                <div className="powered-by">
                    <span>Powered by </span>
                    <div className="optigo-logo">
                        <img src="/logo1.png" alt="Optigo logo" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;





