import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Menu,
    MenuItem,
    Divider,
    IconButton,
    ListItemText,
    ListItemIcon,
    Typography,
    Box,
    Avatar
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import './ProfileAvatar.scss';
import { useAuthToken } from '../../hooks/useAuthToken';
import { LogoutApi } from '../../API/Logout/Logout';
import { getWhatsAppAvatarConfig } from '../../utils/globalFunc';

const ProfileAvatar = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();
    const { userToken } = useAuthToken();

    const username = userToken?.username;

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await LogoutApi(userToken?.id);
            sessionStorage.clear();
            navigate('https://nxtwabachat.optigoapps.com/login');
            handleClose();
        } catch (error) {
            console.error('Error during logout:', error);
            navigate('https://nxtwabachat.optigoapps.com/login');
            handleClose();
        }
    };

    return (
        <div className="profile-menu">
            {username && (
                <Typography
                    variant="body1"
                    className="username-text"
                    title={`Welcome ${username}`}
                >
                    Welcome {username}
                </Typography>
            )}
            <IconButton onClick={handleClick} className="profile-avatar" size="large">
                <Avatar
                    alt={username || "User"}
                    {...getWhatsAppAvatarConfig(username, 40)}
                />
            </IconButton>


            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    className: 'profile-dropdown'
                }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >

                <MenuItem onClick={handleLogout} className="menu-item">
                    <ListItemIcon className="menu-icon" sx={{ minWidth: "30px !important" }}>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Log out"
                        primaryTypographyProps={{ className: 'menu-text' }}
                    />
                </MenuItem>
            </Menu>
        </div>
    );
};

export default ProfileAvatar;
