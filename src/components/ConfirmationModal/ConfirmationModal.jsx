import ReactDOM from 'react-dom';
import { ExternalLink, X } from 'lucide-react';
import './ConfimationModal.scss';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, description, icon: Icon }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="confirmation-modal-overlay" onClick={onClose}>
            <div className="confirmation-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-icon-wrapper">
                    {Icon || <ExternalLink />}
                </div>

                <h2>{title}</h2>
                <p>{description}</p>

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn-confirm" onClick={onConfirm}>
                        Continue <ExternalLink size={16} />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmationModal;
