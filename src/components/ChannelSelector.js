import { Mail, Smartphone, Check } from 'lucide-react';
import { Whatsapp } from '../utils/svg';
import './style.scss';

const ChannelSelector = () => {
  const channels = [
    // {
    //   id: 'sms',
    //   name: 'SMS',
    //   description: 'Reach audience via SMS',
    //   icon: Smartphone,
    //   color: 'gray',
    // },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Send message via Template notification',
      icon: Whatsapp,
      color: 'green',
    },
    // {
    //   id: 'email',
    //   name: 'Email',
    //   description: 'Reach audience via email client',
    //   icon: Mail,
    //   color: 'blue',
    // },
  ];

  const selectedChannel = 'whatsapp'; // ✅ fixed selection

  return (
    <div className="channel-selector">
      {channels.map((channel) => {
        const Icon = channel.icon;
        const isSelected = channel.id === 'whatsapp';

        return (
          <div
            key={channel.id}
            className={`channel-card ${channel.color} ${isSelected ? 'selected' : ''}`}
          >
            {isSelected && (
              <div className="check-badge">
                <Check className="check-icon" />
              </div>
            )}

            <div className="card-content">
              <div className={`icon-wrapper ${isSelected ? 'active' : ''}`}>
                <Icon className={`icon ${isSelected ? 'active' : ''}`} />
              </div>

              <div>
                <h3 className={`title ${isSelected ? 'active' : ''}`}>{channel.name}</h3>
                <p className={`description ${isSelected ? 'active' : ''}`}>
                  {channel.description}
                </p>
              </div>
            </div>

            {channel.id === 'whatsapp' && (
              <div className="status">
                <span>Currently working</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ChannelSelector;
