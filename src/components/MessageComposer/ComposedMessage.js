import { FileText, Smartphone, Upload, X, MapPinned } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import debounce from 'lodash/debounce';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const MediaUpload = ({ type, uploadedMedia, setUploadedMedia, onFileSelect }) => {
    const typeLabels = {
        image: "Header Image",
        video: "Header Video",
        document: "Header Document",
    };

    const acceptTypes = {
        image: "image/*",
        video: "video/*",
        document: "application/*, .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt",
    };

    const handleFileUpload = (file) => {
        if (!file) return;

        // Revoke previous object URL if any
        if (uploadedMedia?.dataUrl && !uploadedMedia.isDefault) {
            URL.revokeObjectURL(uploadedMedia.dataUrl);
        }

        const objectUrl = URL.createObjectURL(file);
        const fileData = {
            file: file,
            dataUrl: objectUrl,
            name: file.name,
            type: file.type,
            size: file.size,
            isDefault: false
        };

        console.log("TCL: handleFileUpload -> fileData", fileData)
        setUploadedMedia(fileData);

        // Update the template data with the new media
        if (onFileSelect) {
            onFileSelect(fileData);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        handleFileUpload(file);
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        if (setUploadedMedia) {
            setUploadedMedia(null);
        }
        if (onFileSelect) {
            onFileSelect(null);
        }
    };

    return (
        <div className="flex flex-col bg-gray-100 p-3 text-center rounded-lg">
            {uploadedMedia ? (
                <div className="relative">
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-600 truncate max-w-[80%]">
                            {uploadedMedia.name || 'Selected file'}
                        </span>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="text-red-500 hover:text-red-700 text-sm flex items-center"
                            title="Remove file"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors w-full">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 text-center">
                        Click to upload {typeLabels[type] || 'file'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                        {type === 'image' && 'JPG, PNG up to 5MB'}
                        {type === 'video' && 'MP4 up to 16MB'}
                        {type === 'document' && 'PDF, DOC, XLS up to 10MB'}
                    </p>
                    <input
                        type="file"
                        accept={acceptTypes[type]}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
            )}
        </div>
    );
};

const ComposedMessage = ({
    message,
    uploadedDefaultMedia,
    setUploadedDefaultMedia,
    onSave,
    onMessageChange,
    templateData
}) => {
    console.log("TCL: templateData", templateData)
    // Track if the media is a default image from a template
    const [isDefaultMedia, setIsDefaultMedia] = useState(false);

    // Update isDefaultMedia when uploadedMedia changes
    useEffect(() => {
        setIsDefaultMedia(!!uploadedDefaultMedia);
    }, [uploadedDefaultMedia]);

    const [buttons, setButtons] = useState([]);
    const quillInstance = useRef(null);
    const quillRef = useRef(null);
    const isInitialized = useRef(false);

    // Initialize Quill editor
    useEffect(() => {
        if (quillRef.current && !isInitialized.current) {
            const options = {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ header: [1, 2, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ color: [] }, { background: [] }],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'image', 'video'],
                        ['clean'],
                    ],
                },
            };

            const editor = new Quill(quillRef.current, options);
            quillInstance.current = editor;
            isInitialized.current = true;

            // Set initial content
            if (message) {
                editor.clipboard.dangerouslyPasteHTML(message);
            }

            // Set up editor styles
            const editorElement = quillRef.current.querySelector('.ql-editor');
            if (editorElement) {
                editorElement.style.minHeight = '200px';
            }

            // Handle changes from the editor
            const handleTextChange = debounce(() => {
                if (!editor || !editor.root) return;

                const html = editor.root.innerHTML;
                const cleanHtml = html === '<p><br></p>' ? '' : html;

                if (onMessageChange) {
                    onMessageChange({
                        ...prepareTemplateData(formData),
                        message: cleanHtml
                    });
                }
            }, 300);

            editor.on('text-change', handleTextChange);

            // Cleanup
            return () => {
                if (editor) {
                    editor.off('text-change', handleTextChange);
                }
            };
        }
    }, []);

    // Update Quill content when message prop changes (template selection)
    useEffect(() => {
        if (quillInstance.current && message !== undefined && isInitialized.current) {
            const currentContent = quillInstance.current.root.innerHTML;
            if (currentContent !== message) {
                quillInstance.current.clipboard.dangerouslyPasteHTML(message || '');
            }
        }
    }, [message]);

    const [formData, setFormData] = useState({
        campaignName: "",
        templateName: "",
        templateLanguage: "",
        templateCategory: "",
        headerFormat: "",
        headerText: "",
        templateFooter: "",
        message: "",
        buttons: []
    });

    const [headerForSelect, setHeaderSelect] = useState('');
    const [headerTextData, setHeaderTextData] = useState('');

    const [carouselItems, setCarouselItems] = useState([{ id: 1, file: null }]);
    const [location, setLocation] = useState({ latitude: '', longitude: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Update form data
        const updatedFormData = {
            ...formData,
            [name]: value
        };
        setFormData(updatedFormData);

        // Save headerText separately if the input name matches
        if (name === 'headerText') {
            setHeaderTextData(value);
        }

        // Get current message from Quill if available
        let currentMessage = message;
        if (quillInstance.current) {
            const html = quillInstance.current.root.innerHTML;
            currentMessage = html === '<p><br></p>' ? '' : html;
        }

        // Call onMessageChange with the updated form data and current message
        const templateData = prepareTemplateData({
            ...updatedFormData,
            message: currentMessage
        });
        onMessageChange(templateData);
    };

    const prepareTemplateData = (formData) => {
        // Create a clean, flat object with only the data we want to include
        const templateData = {
            // Basic template info
            templateName: formData.templateName || '',
            templateLanguage: formData.templateLanguage || '',
            templateCategory: formData.templateCategory || '',

            // Header data
            headerFormat: formData.headerFormat || '',
            headerText: formData.headerFormat === 'text' ? (formData.headerText || '') : '',

            // Message content
            message: message || '',

            // Footer
            templateFooter: formData.templateFooter || '',

            // Media will be computed below based on header format

            // Buttons - ensure we always return an array
            buttons: Array.isArray(buttons) ? buttons.map(btn => ({
                type: btn.type || 'quick_reply', // default to quick_reply if not specified
                text: btn.text || '',
                ...(btn.type === 'url' && { url: btn.url || '' }),
                ...(btn.type === 'phone' && {
                    phoneNumber: btn.text || '',
                    buttonText: btn.buttonText || ''
                })
            })) : []
        };

        // Media normalization by header format
        if (['image', 'video', 'document'].includes(headerForSelect)) {
            // If we have uploaded media, use it, otherwise check for default media
            if (uploadedDefaultMedia) {
                templateData.media = uploadedDefaultMedia;
                templateData.mediaType = headerForSelect;
            } else if (isDefaultMedia) {
                // Handle default media from template
                templateData.media = {
                    dataUrl: uploadedDefaultMedia,
                    name: 'template-image.jpg',
                    type: 'image/jpeg',
                    isDefault: true
                };
                templateData.mediaType = 'image';
            }
        } else if (headerForSelect === 'image-carousel' || headerForSelect === 'video-carousel') {
            const itemType = headerForSelect === 'image-carousel' ? 'image' : 'video';
            const normalizedItems = Array.isArray(carouselItems) ? carouselItems
                .filter(item => !!item.file)
                .map(item => ({
                    media: item.file,
                    caption: item.caption || '',
                    buttons: Array.isArray(item.buttons) ? item.buttons.map(btn => ({
                        type: btn.type || 'quick_reply',
                        text: btn.text || '',
                        ...(btn.type === 'url' && { url: btn.url || '' }),
                        ...(btn.type === 'phone' && {
                            phoneNumber: btn.text || '',
                            buttonText: btn.buttonText || ''
                        })
                    })) : []
                })) : [];
            templateData.media = normalizedItems; // array of items
            templateData.mediaType = headerForSelect; // 'image-carousel' | 'video-carousel'
        } else {
            templateData.media = null;
            templateData.mediaType = '';
        }

        // Ensure we don't have any undefined or null values that could cause nesting
        return Object.fromEntries(
            Object.entries(templateData)
                .filter(([_, v]) => v !== undefined && v !== null)
        );
    };

    const handleSave = () => {
        const templateData = prepareTemplateData(formData);

        // Call the parent's onMessageChange with all template data
        onMessageChange(templateData);

        // If there's a save handler, call it too
        if (onSave) {
            onSave(templateData);
        }
    };

    const handleAddCarouselItem = () => {
        if (carouselItems.length < 10) {
            setCarouselItems([...carouselItems, {
                id: Date.now(),
                file: null,
                caption: '',
                buttons: []
            }]);
        }
    };

    const handleRemoveCarouselItem = (id) => {
        if (carouselItems.length > 1) {
            setCarouselItems(carouselItems.filter(item => item.id !== id));
        }
    };

    const handleCarouselFileUpload = (id, file) => {
        setCarouselItems(carouselItems.map(item =>
            item.id === id ? { ...item, file } : item
        ));
    };

    const handleAddButtonToCarousel = (itemId) => {
        setCarouselItems(carouselItems.map(item =>
            item.id === itemId
                ? {
                    ...item,
                    buttons: [
                        ...(item.buttons || []),
                        {
                            id: Date.now(),
                            type: 'quick_reply',
                            text: '',
                            url: '',
                            buttonText: ''
                        }
                    ]
                }
                : item
        ));
    };

    const handleRemoveButtonFromCarousel = (itemId, buttonId) => {
        setCarouselItems(carouselItems.map(item =>
            item.id === itemId
                ? {
                    ...item,
                    buttons: (item.buttons || []).filter(btn => btn.id !== buttonId)
                }
                : item
        ));
    };

    const handleButtonTypeChange = (itemId, buttonId, newType) => {
        setCarouselItems(carouselItems.map(item =>
            item.id === itemId
                ? {
                    ...item,
                    buttons: (item.buttons || []).map(btn =>
                        btn.id === buttonId
                            ? { ...btn, type: newType, url: '', buttonText: '' }
                            : btn
                    )
                }
                : item
        ));
    };

    const handleButtonTextChange = (itemId, buttonId, text) => {
        setCarouselItems(carouselItems.map(item =>
            item.id === itemId
                ? {
                    ...item,
                    buttons: (item.buttons || []).map(btn =>
                        btn.id === buttonId ? { ...btn, text } : btn
                    )
                }
                : item
        ));
    };

    const handleButtonUrlChange = (itemId, buttonId, url) => {
        setCarouselItems(carouselItems.map(item =>
            item.id === itemId
                ? {
                    ...item,
                    buttons: (item.buttons || []).map(btn =>
                        btn.id === buttonId ? { ...btn, url } : btn
                    )
                }
                : item
        ));
    };

    const handleButtonDisplayTextChange = (itemId, buttonId, buttonText) => {
        setCarouselItems(carouselItems.map(item =>
            item.id === itemId
                ? {
                    ...item,
                    buttons: (item.buttons || []).map(btn =>
                        btn.id === buttonId ? { ...btn, buttonText } : btn
                    )
                }
                : item
        ));
    };

    const renderStepContent = () => {
        if (headerForSelect === "no-header") return;

        switch (headerForSelect) {
            case "text":
                return (
                    <div className="flex flex-col bg-gray-100 p-3 rounded-lg">
                        <label className="text-sm font-medium mb-1">Header Text</label>
                        <input
                            type="text"
                            name="headerText"
                            value={formData.headerText || ''}
                            onChange={handleInputChange}
                            className="border border-gray-300 rounded-lg p-2 text-sm"
                            placeholder="Enter header text..."
                            maxLength={60}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Max 60 characters</p>
                    </div>
                );

            case "location":
                return (
                    <div className="flex flex-col bg-gray-100 p-3 rounded-lg space-y-2">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Latitude</label>
                            <input
                                type="text"
                                value={location.latitude}
                                onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                                className="border border-gray-300 rounded-lg p-2 text-sm w-full"
                                placeholder="e.g., 40.7128"
                                pattern="-?\d*\.?\d*"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Longitude</label>
                            <input
                                type="text"
                                value={location.longitude}
                                onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
                                className="border border-gray-300 rounded-lg p-2 text-sm w-full"
                                placeholder="e.g., -74.0060"
                                pattern="-?\d*\.?\d*"
                                required
                            />
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-2">
                            <span className="mr-2">📍</span>
                            <span>Or</span>
                            <button
                                type="button"
                                onClick={() => {
                                    // This would trigger browser's geolocation API in a real app
                                    if (navigator.geolocation) {
                                        navigator.geolocation.getCurrentPosition((position) => {
                                            setLocation({
                                                latitude: position.coords.latitude.toFixed(6),
                                                longitude: position.coords.longitude.toFixed(6)
                                            });
                                        });
                                    }
                                }}
                                className="ml-2 text-blue-600 hover:underline"
                            >
                                Use current location
                            </button>
                        </div>
                    </div>
                );

            case "image-carousel":
            case "video-carousel":
                const isImageCarousel = headerForSelect === 'image-carousel';
                const maxItems = 10;
                const itemType = isImageCarousel ? 'image' : 'video';

                return (
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium">{isImageCarousel ? 'Image' : 'Video'} Carousel</h4>
                            <button
                                type="button"
                                onClick={handleAddCarouselItem}
                                disabled={carouselItems.length >= maxItems}
                                className={`text-xs px-3 py-1 rounded ${carouselItems.length >= maxItems
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                + Add {itemType} ({carouselItems.length}/{maxItems})
                            </button>
                        </div>

                        <div className="space-y-3">
                            {carouselItems.map((item, index) => (
                                <div key={item.id} className="border rounded p-3 bg-white relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium">
                                            {itemType.charAt(0).toUpperCase() + itemType.slice(1)} {index + 1}
                                        </span>
                                        {carouselItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCarouselItem(item.id)}
                                                className="text-red-500 hover:text-red-700 text-lg"
                                                title={`Remove ${itemType}`}
                                            >
                                                <X />
                                            </button>
                                        )}
                                    </div>

                                    {/* Media Upload Section */}
                                    <MediaUpload
                                        type={itemType}
                                        uploadedMedia={item.file}
                                        setUploadedMedia={(file) => handleCarouselFileUpload(item.id, file)}
                                        onFileSelect={(fileData) => {
                                            handleCarouselFileUpload(item.id, fileData);
                                            setCarouselItems(carouselItems.map(cItem =>
                                                cItem.id === item.id
                                                    ? {
                                                        ...cItem,
                                                        file: fileData,
                                                        fileInfo: {
                                                            name: fileData?.name,
                                                            type: fileData?.type,
                                                            size: fileData?.size
                                                        }
                                                    }
                                                    : cItem
                                            ));
                                        }}
                                    />

                                    {/* Caption Input */}
                                    <div className="mt-3">
                                        <label className="text-xs text-gray-600 block mb-1">Caption (Optional)</label>
                                        <input
                                            type="text"
                                            value={item.caption || ''}
                                            onChange={(e) => {
                                                const newItems = [...carouselItems];
                                                const itemIndex = newItems.findIndex(i => i.id === item.id);
                                                newItems[itemIndex].caption = e.target.value;
                                                setCarouselItems(newItems);
                                            }}
                                            className="w-full p-2 border rounded text-sm"
                                            placeholder="Add a caption..."
                                            maxLength={1024}
                                        />
                                    </div>

                                    {/* Button Actions Section */}
                                    <div className="mt-4 border-t pt-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <h5 className="text-sm font-medium">Button Actions</h5>
                                            <button
                                                type="button"
                                                onClick={() => handleAddButtonToCarousel(item.id)}
                                                disabled={(item.buttons?.length || 0) >= 3}
                                                className={`text-xs px-2 py-1 rounded ${(item.buttons?.length || 0) >= 3
                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    : 'bg-green-600 text-white hover:bg-green-700'
                                                    }`}
                                            >
                                                + Add Button ({(item.buttons?.length || 0)}/3)
                                            </button>
                                        </div>

                                        {/* Buttons List */}
                                        <div className="space-y-3">
                                            {item.buttons?.map((btn, btnIndex) => (
                                                <div key={btn.id} className="border rounded p-3 bg-gray-50">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium">Button {btnIndex + 1}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveButtonFromCarousel(item.id, btn.id)}
                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div>
                                                            <label className="text-xs text-gray-600 block mb-1">Button Type</label>
                                                            <select
                                                                value={btn.type}
                                                                onChange={(e) => handleButtonTypeChange(item.id, btn.id, e.target.value)}
                                                                className="w-full p-2 border rounded text-sm"
                                                            >
                                                                <option value="quick_reply">Quick Reply</option>
                                                                <option value="url">URL</option>
                                                                <option value="phone">Phone Number</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="text-xs text-gray-600 block mb-1">
                                                                {btn.type === 'quick_reply' ? 'Button Text' :
                                                                    btn.type === 'url' ? 'Button Text' : 'Phone Number'}
                                                            </label>
                                                            <input
                                                                type={btn.type === 'phone' ? 'tel' : 'text'}
                                                                value={btn.text || ''}
                                                                onChange={(e) => handleButtonTextChange(item.id, btn.id, e.target.value)}
                                                                className="w-full p-2 border rounded text-sm"
                                                                placeholder={
                                                                    btn.type === 'quick_reply' ? 'Button text...' :
                                                                        btn.type === 'url' ? 'e.g., Learn More' :
                                                                            'e.g., +1234567890'
                                                                }
                                                                maxLength={btn.type === 'url' ? 20 : 25}
                                                            />
                                                        </div>

                                                        {btn.type === 'url' && (
                                                            <div>
                                                                <label className="text-xs text-gray-600 block mb-1">URL</label>
                                                                <input
                                                                    type="url"
                                                                    value={btn.url || ''}
                                                                    onChange={(e) => handleButtonUrlChange(item.id, btn.id, e.target.value)}
                                                                    className="w-full p-2 border rounded text-sm"
                                                                    placeholder="https://example.com"
                                                                    required
                                                                />
                                                            </div>
                                                        )}

                                                        {btn.type === 'phone' && (
                                                            <div>
                                                                <label className="text-xs text-gray-600 block mb-1">Button Text (Optional)</label>
                                                                <input
                                                                    type="text"
                                                                    value={btn.buttonText || ''}
                                                                    onChange={(e) => handleButtonDisplayTextChange(item.id, btn.id, e.target.value)}
                                                                    className="w-full p-2 border rounded text-sm"
                                                                    placeholder="e.g., Call Us"
                                                                    maxLength={20}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            // For single image, video, document
            case "image":
            case "video":
            case "document":
                return (
                    <MediaUpload
                        type={headerForSelect}
                        uploadedMedia={uploadedDefaultMedia}
                        setUploadedMedia={setUploadedDefaultMedia}
                        onFileSelect={(fileData) => {
                            setUploadedDefaultMedia(fileData);
                            setFormData({
                                ...formData,
                                media: fileData,
                                mediaType: headerForSelect,
                                file: fileData,
                                fileInfo: { name: fileData?.name || '', type: fileData?.type || '', size: fileData?.size || 0 }
                            });
                        }}
                    />
                );

            default:
                return null;
        }
    };

    // Preview helpers
    const renderHeaderPreview = () => {
        if (headerForSelect === 'text' && headerTextData !== "") {
            return (
                <div className="mt-2 rounded-lg overflow-hidden">
                    <h4 className="font-bold text-base">{formData?.headerText}</h4>
                </div>
            );
        }
        if (headerForSelect === 'image' && (uploadedDefaultMedia || uploadedDefaultMedia?.dataUrl)) {
            const mediaUrl = uploadedDefaultMedia?.dataUrl || uploadedDefaultMedia;
            return (
                <div className="mt-2 rounded-lg overflow-hidden">
                    <img src={mediaUrl} alt={uploadedDefaultMedia?.name || 'Image'} className="w-full h-auto rounded" />
                </div>
            );
        }
        if (headerForSelect === 'video' && (uploadedDefaultMedia || uploadedDefaultMedia?.dataUrl)) {
            const mediaUrl = uploadedDefaultMedia?.dataUrl || uploadedDefaultMedia;
            return (
                <div className="mt-2 rounded-lg overflow-hidden">
                    <video className="w-full h-auto rounded" controls src={mediaUrl} />
                </div>
            );
        }
        if (headerForSelect === 'document' && uploadedDefaultMedia) {
            return (
                <div className="mt-2 rounded-lg overflow-hidden border bg-white p-3 flex items-center space-x-3">
                    <FileText className="w-10 h-10 text-gray-600" />
                    <div className="text-sm">
                        <div className="font-medium truncate max-w-[220px]">{uploadedDefaultMedia.name || 'Document'}</div>
                        <div className="text-xs text-gray-500">
                            {uploadedDefaultMedia.type || 'application/*'} •
                            {uploadedDefaultMedia.size ? Math.ceil(uploadedDefaultMedia.size / 1024) + ' KB' : ''}
                        </div>
                    </div>
                </div>
            );
        }
        if (headerForSelect === 'location' && (location.latitude || location.longitude)) {
            const lat = location.latitude || '—';
            const lng = location.longitude || '—';
            const mapsUrl = (location.latitude && location.longitude)
                ? `https://www.google.com/maps?q=${encodeURIComponent(location.latitude)},${encodeURIComponent(location.longitude)}`
                : null;
            return (
                <div className="mt-2 rounded-lg overflow-hidden border bg-white p-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <div className="font-medium">Location</div>
                            <div className="text-xs text-gray-600">Lat: {lat} · Lng: {lng}</div>
                        </div>
                        <div className="text-2xl ml-3"><MapPinned className="w-8 h-8" /></div>
                    </div>
                    {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-xs text-blue-600 hover:underline">
                            View on Maps
                        </a>
                    )}
                </div>
            );
        }
        if ((headerForSelect === 'image-carousel' || headerForSelect === 'video-carousel') && Array.isArray(carouselItems) && carouselItems.some(i => i.file)) {
            return (
                <div className="mt-2 -mx-2">
                    <div className="flex space-x-3 overflow-x-auto px-2 py-1">
                        {carouselItems.filter(i => !!i.file).map(item => (
                            <div key={item.id} className="min-w-[220px] max-w-[240px] bg-white rounded-lg border overflow-hidden">
                                <div className="bg-black/5">
                                    {headerForSelect === 'image-carousel' && item.file?.dataUrl && (
                                        <img src={item.file.dataUrl} alt={item.file.name || 'Image'} className="w-full h-36 object-cover" />
                                    )}
                                    {headerForSelect === 'video-carousel' && item.file?.dataUrl && (
                                        <video src={item.file.dataUrl} className="w-full h-36 object-cover" controls />
                                    )}
                                </div>
                                {(item.caption || (item.buttons && item.buttons.length > 0)) && (
                                    <div className="p-2">
                                        {item.caption && (
                                            <div className="text-xs text-gray-800 mb-2 break-words whitespace-pre-wrap">{item.caption}</div>
                                        )}
                                        {Array.isArray(item.buttons) && item.buttons.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {item.buttons.map(btn => (
                                                    <span key={btn.id} className="text-xs px-2 py-1 rounded-full border bg-gray-50 text-gray-700">
                                                        {btn.type === 'phone' && btn.buttonText ? btn.buttonText : btn.text || (btn.type === 'url' ? 'Open' : 'Reply')}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderMainButtonsPreview = () => {
        if (!Array.isArray(buttons) || buttons.length === 0) return null;
        return (
            <div className="mt-2 flex flex-col items-start space-y-2">
                {buttons.map((btn) => (
                    <button key={btn.id} className="text-sm px-3 py-1 rounded border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50">
                        {btn.type === 'call' && btn.text ? btn.text : btn.text || 'Button'}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Compose Message</h3>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full">
                {/* Left Column - Chat Composer */}
                <div className="w-full lg:w-1/2 flex flex-col space-y-4">

                    <div className="space-y-4">

                        <div className="flex flex-col">
                            <label htmlFor="campaignName">Campaign Name</label>
                            <input
                                type="text"
                                name="campaignName"
                                value={formData.campaignName}
                                onChange={handleInputChange}
                                className="border border-gray-300 rounded-lg p-2 text-sm"
                                placeholder='Enter Campaign Name...'
                                required
                            />
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="message">Template Name</label>
                            <input
                                type="text"
                                name="templateName"
                                value={formData.templateName}
                                onChange={handleInputChange}
                                className="border border-gray-300 rounded-lg p-2 text-sm"
                                placeholder='Enter Template Name...'
                                required
                            />
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="language">Template Language</label>
                            <select
                                name="templateLanguage"
                                value={formData.templateLanguage}
                                onChange={handleInputChange}
                                className="border border-gray-300 rounded text-sm p-1"
                                required
                            >
                                <option value="" disabled>Select Language</option>
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="hi">Hindi</option>
                                <option value="ja">Japanese</option>
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="category">Template Category</label>
                            <select
                                name="templateCategory"
                                value={formData.templateCategory}
                                onChange={handleInputChange}
                                className="border border-gray-300 rounded text-sm p-1"
                                required
                            >
                                <option value="" disabled>Select Category</option>
                                <option value="marketing">Marketing</option>
                                <option value="utility">Utility</option>
                                <option value="authentication">Authentication</option>
                                <option value="service">Customer Service</option>
                                <option value="alert">Alert</option>
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="headerFormat">Header Format</label>
                            <select
                                name="headerFormat"
                                value={headerForSelect}
                                onChange={(e) => { setHeaderSelect(e.target.value); handleInputChange(e) }}
                                className="border border-gray-300 rounded text-sm p-1 w-full"
                                required
                            >
                                <option value="" disabled>Select Header Format</option>
                                <option value="no-header">No Header</option>
                                <option value="text">Text</option>
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                                <option value="document">Document</option>
                                <option value="location">Location</option>
                                <option value="image-carousel">Image Carousel</option>
                                <option value="video-carousel">Video Carousel</option>
                            </select>

                            <div className="mt-3">
                                {renderStepContent()}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="message">Template Format</label>
                            <div className="flex-1 border rounded-lg overflow-hidden">
                                <div ref={quillRef} className="bg-white h-60" />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="message">Template Footer(Optional)</label>
                            <input
                                type="text"
                                name="templateFooter"
                                value={formData.templateFooter}
                                onChange={handleInputChange}
                                className="border border-gray-300 rounded-lg p-2 text-sm"
                                placeholder='Enter Template Footer...'
                            />
                        </div>

                        <div className="flex flex-col space-y-4">
                            <div className="flex justify-between items-center">
                                <label>Interactive Buttons</label>
                                <button
                                    onClick={() => {
                                        if (buttons.length < 3) {
                                            setButtons([...buttons, {
                                                id: Date.now(),
                                                type: 'quick_reply',
                                                text: '',
                                                action: ''
                                            }]);
                                        }
                                    }}
                                    disabled={buttons.length >= 3}
                                    className={`px-3 py-1 text-sm rounded ${buttons.length >= 3 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                >
                                    + Add Button
                                </button>
                            </div>

                            <div className="space-y-3">
                                {buttons.map((button, index) => (
                                    <div key={button.id} className="border rounded-lg p-3 relative">
                                        {/* Header: Label + Type selector + Remove */}
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium">Button {index + 1}</span>
                                            <div className="flex items-center space-x-2">
                                                <select
                                                    className="border border-gray-300 rounded text-sm p-1"
                                                    value={button.type}
                                                    onChange={(e) => {
                                                        const newButtons = [...buttons];
                                                        newButtons[index].type = e.target.value;
                                                        newButtons[index].action = ""; // Reset action when type changes
                                                        setButtons(newButtons);
                                                    }}
                                                >
                                                    <option value="quick_reply">Quick Reply</option>
                                                    <option value="url">Call To Actions - Url</option>
                                                    <option value="call">Call To Actions - Phone Number</option>
                                                    <option value="code">OTP - Copy Code</option>
                                                    <option value="autofill">OTP - Autofill</option>
                                                    <option value="flow">Flow</option>
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        const newButtons = [...buttons];
                                                        newButtons.splice(index, 1);
                                                        setButtons(newButtons);
                                                    }}
                                                    className="text-red-500 hover:text-red-700"
                                                    title="Remove button"
                                                >
                                                    <X />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Button Text */}
                                        <input
                                            type="text"
                                            value={button.text}
                                            onChange={(e) => {
                                                const newButtons = [...buttons];
                                                newButtons[index].text = e.target.value;
                                                setButtons(newButtons);
                                            }}
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2"
                                            placeholder={
                                                button.type === "quick_reply"
                                                    ? "Button text (max 20 chars)"
                                                    : "Button text (max 25 chars)"
                                            }
                                            maxLength={button.type === "quick_reply" ? 20 : 25}
                                        />

                                        {/* Actions depending on button type */}
                                        {button.type === "url" && (
                                            <input
                                                type="url"
                                                value={button.action}
                                                onChange={(e) => {
                                                    const newButtons = [...buttons];
                                                    newButtons[index].action = e.target.value;
                                                    setButtons(newButtons);
                                                }}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                                placeholder="Enter URL (e.g., https://example.com)"
                                                pattern="https?://.+"
                                            />
                                        )}

                                        {button.type === "call" && (
                                            <input
                                                type="tel"
                                                value={button.action}
                                                onChange={(e) => {
                                                    const newButtons = [...buttons];
                                                    newButtons[index].action = e.target.value;
                                                    setButtons(newButtons);
                                                }}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                                placeholder="Enter phone number (e.g., +1234567890)"
                                                pattern="\+[0-9\s-]{10,20}"
                                            />
                                        )}

                                        {button.type === "code" && (
                                            <input
                                                type="text"
                                                value={button.action}
                                                onChange={(e) => {
                                                    const newButtons = [...buttons];
                                                    newButtons[index].action = e.target.value;
                                                    setButtons(newButtons);
                                                }}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                                placeholder="Enter OTP placeholder (e.g., {{1}})"
                                            />
                                        )}

                                        {button.type === "autofill" && (
                                            <select
                                                value={button.action}
                                                onChange={(e) => {
                                                    const newButtons = [...buttons];
                                                    newButtons[index].action = e.target.value;
                                                    setButtons(newButtons);
                                                }}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                            >
                                                <option value="">Select Autofill Type</option>
                                                <option value="sms_otp">SMS OTP</option>
                                                <option value="email_otp">Email OTP</option>
                                                <option value="wa_otp">WhatsApp OTP</option>
                                            </select>
                                        )}

                                        {button.type === "flow" && (
                                            <input
                                                type="text"
                                                value={button.action}
                                                onChange={(e) => {
                                                    const newButtons = [...buttons];
                                                    newButtons[index].action = e.target.value;
                                                    setButtons(newButtons);
                                                }}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                                placeholder="Enter Flow ID (from WhatsApp Business)"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-gray-500">
                                {buttons.length === 0 ? 'No buttons added yet. Click "Add Button" to create one.' :
                                    `You've added ${buttons.length}/3 buttons. ${buttons.length === 3 ? 'Maximum buttons reached.' : ''}`}
                            </p>
                        </div>
                    </div>

                </div>
                {/* Right Column - Business Chat */}
                <div className="w-full lg:w-1/2 flex flex-col items-center justify-start border rounded-lg p-6 space-y-4 bg-gray-50">
                    <div className="flex flex-col min-h-[70%] w-full  border rounded-lg overflow-hidden bg-gray-50">
                        <div className="p-3 bg-emerald-600 text-white flex items-center">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-2">
                                <Smartphone className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="font-medium">
                                    {formData.templateName || "Business Name"}
                                </div>
                                <div className="text-xs opacity-80">online</div>
                            </div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-2">
                            {(headerTextData || message || uploadedDefaultMedia || (Array.isArray(carouselItems) && carouselItems.some(i => i.file)) || (headerForSelect === 'location' && (location.latitude || location.longitude))) ? (
                                <div>
                                    <div className="flex justify-end">
                                        <div className="bg-emerald-100 text-gray-800 rounded-lg p-3 max-w-[80%] text-sm break-words whitespace-pre-wrap">
                                            {/* Thanks for your message! We'll get back to you soon. */}
                                            Hello Optigo !!
                                            <div className="text-right mt-1 text-xs text-gray-500">
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-start mt-5">
                                        <div className="bg-white text-gray-800 rounded-lg p-3 max-w-[80%] text-sm">
                                            <div className="text-xs text-gray-500 mt-1">
                                                {renderHeaderPreview()}
                                                <div dangerouslySetInnerHTML={{ __html: message }} />
                                                {renderMainButtonsPreview()}
                                                <div className="text-left mt-2 text-xs text-gray-500">
                                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                    Your message preview will appear here
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end items-center mt-4">
                <button
                    onClick={handleSave}
                    className="
            bg-blue-600 text-white px-4 py-2 rounded-lg 
            hover:bg-blue-700 transition-colors 
            disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed
    "
                    disabled={!formData.templateName || !formData.templateLanguage || !formData.templateCategory || !formData.headerFormat}
                >
                    Save & Register Template
                </button>
            </div>

        </div>
    )
}

export default ComposedMessage;


// For Furture Use

/*
      <div className="flex flex-col bg-gray-100 p-3 text-center">
            {uploadedMedia ? (
                <>
                    <Image className="w-16 h-16 mx-auto text-green-500" />
                    <p className="text-sm text-gray-600 mt-2">Media uploaded successfully</p>
                    <button
                        onClick={() => setUploadedMedia(null)}
                        className="mt-2 text-red-600 hover:text-red-700 text-sm"
                    >
                        Remove
                    </button>
                </>
            ) : (
                <>
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">{typeLabels[type]}</h4>
                    <p className="text-sm text-gray-600 mb-4">
                        Upload a {type} for your message header
                    </p>
                    <label className="inline-flex w-36 mx-auto justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                        <FileText className="w-4 h-4 mr-2" />
                        Choose File
                        <input
                            type="file"
                            accept={acceptTypes[type]}
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                </>
            )}
        </div>
*/