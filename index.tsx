
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { getStoresData, saveStoresData, AllStoresData } from './data.ts';
import { GoogleGenAI, Chat } from '@google/genai';

// --- INTERFACES DE TIPOS (UNIFIED) ---
interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
}

interface StoreData {
    name: string;
    sectionTitle: string;
    heroBanner: {
        imageUrl: string;
        title: string;
        subtitle: string;
    };
    products: Product[];
    paymentInfo: {
        phone: string;
        name: string;
        whatsapp: string;
    };
    theme: {
        [key: string]: string;
    };
    chatInstruction: string;
}

// ========================================================================
// ===                   COMPONENTES DE LA TIENDA                       ===
// ========================================================================

const HeroBanner: React.FC<{ banner: StoreData['heroBanner'] }> = ({ banner }) => (
    <div className="hero-banner" style={{ backgroundImage: `url(${banner.imageUrl})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
            <h1>{banner.title}</h1>
            <p>{banner.subtitle}</p>
        </div>
    </div>
);

const ProductCard: React.FC<{ product: Product; onAddToCart: (product: Product) => void }> = ({ product, onAddToCart }) => (
    <div className="product-card">
        <img src={product.image} alt={product.name} className="product-image" />
        <div className="product-info">
            <h3>{product.name}</h3>
            <p className="product-description">{product.description}</p>
            <div className="product-footer">
                <span className="product-price">S/ {product.price.toFixed(2)}</span>
                <button className="add-to-cart-btn" onClick={() => onAddToCart(product)}>
                    Añadir
                </button>
            </div>
        </div>
    </div>
);

const Cart: React.FC<{ 
    cartItems: (Product & { quantity: number })[]; 
    onClose: () => void; 
    paymentInfo: StoreData['paymentInfo']; 
    storeName: string;
}> = ({ cartItems, onClose, paymentInfo, storeName }) => {
    
    const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const generateWhatsAppMessage = () => {
        let message = `¡Hola ${storeName}! 👋 Quisiera hacer el siguiente pedido:\n\n`;
        cartItems.forEach(item => {
            message += `- ${item.name} (x${item.quantity}) - S/ ${(item.price * item.quantity).toFixed(2)}\n`;
        });
        message += `\n*Total a pagar: S/ ${total.toFixed(2)}*`;
        message += `\n\nEl pago lo realizaré a nombre de *${paymentInfo.name}* al Yape/Plin: *${paymentInfo.phone}*.`;
        message += `\n\n¡Muchas gracias! 😊`;
        return encodeURIComponent(message);
    };

    const whatsappLink = `https://wa.me/${paymentInfo.whatsapp}?text=${generateWhatsAppMessage()}`;

    return (
        <div className="cart-modal-overlay" onClick={onClose}>
            <div className="cart-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="cart-header">
                    <h2>Tu Pedido</h2>
                    <button onClick={onClose} className="close-cart-btn">&times;</button>
                </div>
                {cartItems.length === 0 ? (
                    <p className="cart-empty">Tu carrito está vacío.</p>
                ) : (
                    <>
                        <div className="cart-items">
                            {cartItems.map(item => (
                                <div key={item.id} className="cart-item">
                                    <span>{item.name} (x{item.quantity})</span>
                                    <span>S/ {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="cart-total">
                            <strong>Total:</strong>
                            <strong>S/ {total.toFixed(2)}</strong>
                        </div>
                        <div className="cart-payment-info">
                            <p>Para completar tu pedido, realiza el pago a través de Yape o Plin al número <strong>{paymentInfo.phone}</strong> a nombre de <strong>{paymentInfo.name}</strong>.</p>
                            <a href={whatsappLink} className="whatsapp-btn" target="_blank" rel="noopener noreferrer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.885-.002 2.024.63 3.891 1.697 5.661l-1.191 4.353 4.463-1.165z"/></svg>
                                Completar Pedido por WhatsApp
                            </a>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const ChatWidget: React.FC<{ instruction: string; themeColor: string }> = ({ instruction, themeColor }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ author: 'user' | 'model'; content: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !chat) {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                const newChat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { systemInstruction: instruction },
                });
                setChat(newChat);
            } catch (error) {
                console.error("Error initializing Gemini:", error);
                setMessages([{ author: 'model', content: "Lo siento, no puedo conectarme con el asistente en este momento." }]);
            }
        }
    }, [isOpen, chat, instruction]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;

        const userMessage = { author: 'user' as const, content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await chat.sendMessageStream({ message: input });
            let modelResponse = '';
            setMessages(prev => [...prev, { author: 'model', content: '' }]);
            for await (const chunk of result) {
                modelResponse += String(chunk.text ?? "");
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = modelResponse;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error sending message to Gemini:", error);
            setMessages(prev => [...prev, { author: 'model', content: "¡Uy! Algo salió mal. Por favor, intenta de nuevo." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <>
            <button className="chat-fab" style={{ backgroundColor: themeColor }} onClick={() => setIsOpen(!isOpen)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.65-3.8a9 9 0 1 1 3.4 2.9l-5.05.9"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1zm-2 2a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1zm4 0a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1zm2-2a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1zm-4 0a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1z"/></svg>
            </button>
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header" style={{ backgroundColor: themeColor }}>
                        <h3>Asistente Virtual</h3>
                        <button onClick={() => setIsOpen(false)}>&times;</button>
                    </div>
                    <div className="chat-messages">
                        {messages.length === 0 && <div className="chat-welcome">¡Hola! ¿En qué puedo ayudarte hoy?</div>}
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.author}`}>
                                {msg.content}
                            </div>
                        ))}
                        {isLoading && <div className="message model typing">...</div>}
                        <div ref={messagesEndRef} />
                    </div>
                    <form className="chat-input-form" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Escribe tu pregunta..."
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading} style={{ backgroundColor: themeColor }}>
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

const StorePage: React.FC<{ storeData: StoreData }> = ({ storeData }) => {
    const [cartItems, setCartItems] = useState<(Product & { quantity: number })[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        const root = document.documentElement;
        Object.entries(storeData.theme).forEach(([key, value]) => {
            root.style.setProperty(`--theme-${key}`, value as string);
        });
        document.title = storeData.name;
    }, [storeData]);

    const handleAddToCart = (product: Product) => {
        setCartItems(prevItems => {
            const itemInCart = prevItems.find(item => item.id === product.id);
            if (itemInCart) {
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });
    };

    const totalItemsInCart = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="store-container">
            <header className="store-header">
                <div className="store-name">{storeData.name}</div>
                <button className="cart-button" onClick={() => setIsCartOpen(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    {totalItemsInCart > 0 && <span className="cart-badge">{totalItemsInCart}</span>}
                </button>
            </header>
            <main>
                <HeroBanner banner={storeData.heroBanner} />
                <section className="products-section">
                    <h2>{storeData.sectionTitle}</h2>
                    <div className="products-grid">
                        {storeData.products.map(product => (
                            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                        ))}
                    </div>
                </section>
            </main>
            <ChatWidget instruction={storeData.chatInstruction} themeColor={storeData.theme.primary} />
            {isCartOpen && <Cart cartItems={cartItems} onClose={() => setIsCartOpen(false)} paymentInfo={storeData.paymentInfo} storeName={storeData.name}/>}
        </div>
    );
};

const NotFoundPage = () => (
    <div style={{ textAlign: 'center', padding: '5rem 1rem', fontFamily: 'sans-serif' }}>
        <h1>404 - Tienda no encontrada</h1>
        <p>Lo sentimos, la tienda que buscas no existe.</p>
        <a href="/admin">Ir al panel de administración</a>
    </div>
);

const App = () => {
    const [storeData, setStoreData] = useState<StoreData | null | undefined>(undefined);

    useEffect(() => {
        const path = window.location.pathname;
        const allStores = getStoresData();
        let storeId = path.substring(1).split('/')[0];
        
        if (storeId === '' || storeId === 'index.html') {
             storeId = 'sachacacao'; 
             window.history.replaceState({}, '', `/${storeId}`);
        }

        if (allStores[storeId]) {
            setStoreData(allStores[storeId]);
        } else {
            setStoreData(null); 
        }
    }, []);

    if (storeData === undefined) {
        return <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>Cargando tienda...</div>;
    }

    if (storeData === null) {
        return <NotFoundPage />;
    }

    return <StorePage storeData={storeData} />;
};


// ========================================================================
// ===                 COMPONENTES DEL PANEL DE ADMIN                   ===
// ========================================================================

interface ProductEditModalProps { 
    product: Partial<Product> | null; 
    onSave: (product: Partial<Product>) => void; 
    onDelete: (productId: number) => void; 
    onClose: () => void; 
}

const ProductEditModal: React.FC<ProductEditModalProps> = ({ product: initialProduct, onSave, onDelete, onClose }) => {
    const [product, setProduct] = useState(initialProduct);
    const isNew = !product?.id;

    useEffect(() => { setProduct(initialProduct); }, [initialProduct]);
    
    if (!product) return null;

    const handleChange = (field: keyof Product, value: string | number) => {
        setProduct(p => p ? { ...p, [field]: value } : null);
    };

    const handleSave = () => {
        if(product) onSave(product);
    };

    const handleDelete = () => {
        if (product.id && window.confirm(`¿Estás seguro de que quieres eliminar "${product.name}"?`)) {
            onDelete(product.id);
        }
    };

    return (
        <div className="product-edit-modal-overlay" onClick={onClose}>
            <div className="product-edit-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="product-edit-modal-header">
                    <h3>{isNew ? 'Añadir Nuevo Producto' : 'Editar Producto'}</h3>
                    <button onClick={onClose} className="close-modal-btn">&times;</button>
                </div>
                <div className="product-edit-modal-body">
                    <div className="form-group">
                        <label>Nombre del Producto</label>
                        <input type="text" value={product.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea value={product.description || ''} onChange={(e) => handleChange('description', e.target.value)} rows={4}></textarea>
                    </div>
                     <div className="form-grid">
                        <div className="form-group">
                            <label>Precio (S/)</label>
                            <input type="number" value={product.price || 0} onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                     <div className="form-group">
                        <label>URL de la Imagen</label>
                        <input type="text" value={product.image || ''} onChange={(e) => handleChange('image', e.target.value)} />
                    </div>
                    {product.image && (
                      <div className="image-preview-container">
                          <img src={product.image} alt="Vista previa" className="image-preview"/>
                      </div>
                    )}
                </div>
                <div className="product-edit-modal-footer">
                    {!isNew && (
                        <button className="delete-product-btn-modal" onClick={handleDelete}>
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Eliminar
                        </button>
                    )}
                    <button className="save-product-btn-modal" onClick={handleSave}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        {isNew ? 'Crear Producto' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminPanel: React.FC = () => {
    const [allStoresData, setAllStoresData] = useState<AllStoresData>(() => getStoresData());
    const [selectedStoreId, setSelectedStoreId] = useState<string>('sachacacao');
    const [notification, setNotification] = useState('');
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

    useEffect(() => {
        document.title = 'Panel de Administración';
    }, []);

    const formData = allStoresData[selectedStoreId];

    const handleFormChange = (path: (string | number)[], value: any) => {
        setAllStoresData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            let current: any = newData;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newData;
        });
    };
    
    const handleSaveProduct = (productToSave: Partial<Product>) => {
        const currentProducts = formData?.products ?? [];
        if (productToSave.id) { // Es un producto existente
            const productIndex = currentProducts.findIndex(p => p.id === productToSave.id);
            if (productIndex > -1) {
                handleFormChange([selectedStoreId, 'products', productIndex], productToSave);
            }
        } else { // Es un nuevo producto
            const newProductWithId = { ...productToSave, id: Date.now() };
            handleFormChange([selectedStoreId, 'products'], [...currentProducts, newProductWithId]);
        }
        setEditingProduct(null); // Cierra el modal al guardar
    };

    const handleDeleteProduct = (productId: number) => {
        const updatedProducts = (formData?.products ?? []).filter(p => p.id !== productId);
        handleFormChange([selectedStoreId, 'products'], updatedProducts);
        setEditingProduct(null); // Cierra el modal si estaba abierto
    };

    const handleSave = () => {
        saveStoresData(allStoresData);
        setNotification(`Cambios para "${formData.name}" guardados correctamente.`);
        setTimeout(() => setNotification(''), 3000);
    };
    
    const openNewProductModal = () => {
      setEditingProduct({
        name: 'Nuevo Producto',
        description: 'Descripción increíble...',
        price: 0,
        image: 'https://via.placeholder.com/300x220.png?text=Imagen'
      });
    };

    if (!formData) {
        return <div className="admin-loading">Cargando panel de administración...</div>;
    }

    return (
        <div className="admin-panel-wrapper">
            {notification && <div className="notification">{notification}</div>}
            
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                    <span>Panel de Tiendas</span>
                </div>
                <nav className="store-nav">
                    <p className="nav-title">Tus Tiendas</p>
                    <ul>
                        {Object.keys(allStoresData).map(storeId => (
                            <li key={storeId}>
                                <button
                                    className={`nav-button ${selectedStoreId === storeId ? 'active' : ''}`}
                                    onClick={() => setSelectedStoreId(storeId)}
                                >
                                    {allStoresData[storeId].name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            <div className="admin-main-content">
                <header className="admin-header">
                    <div className="admin-header-info">
                        <h1>Editando: <span className="highlight">{formData.name}</span></h1>
                        <div className="admin-store-url">
                            <span>URL Pública: </span>
                            <a href={`/${selectedStoreId}`} target="_blank" rel="noopener noreferrer">
                                {`${window.location.origin}/${selectedStoreId}`}
                            </a>
                        </div>
                    </div>
                    <div className="admin-header-actions">
                         <a href={`/${selectedStoreId}`} target="_blank" rel="noopener noreferrer" className="visit-store-button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            Visitar Tienda
                        </a>
                        <button className="save-button" onClick={handleSave}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                            Guardar Cambios
                        </button>
                    </div>
                </header>

                <main className="admin-main">
                    <div className="form-section">
                        <h2><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"/><path d="M9 22V12h6v10M2 10.6L12 2l10 8.6"/></svg>Datos Generales</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nombre de la Tienda</label>
                                <input type="text" value={formData?.name ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'name'], e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Título de la Sección de Productos</label>
                                <input type="text" value={formData?.sectionTitle ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'sectionTitle'], e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M20.4 14.5L16 10 4 20"/></svg>Banner Principal</h2>
                        <div className="form-group">
                            <label>URL de la Imagen de Fondo</label>
                            <input type="text" value={formData?.heroBanner?.imageUrl ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'heroBanner', 'imageUrl'], e.target.value)} />
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Título del Banner</label>
                                <input type="text" value={formData?.heroBanner?.title ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'heroBanner', 'title'], e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Subtítulo del Banner</label>
                                <input type="text" value={formData?.heroBanner?.subtitle ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'heroBanner', 'subtitle'], e.target.value)} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="form-section">
                        <h2><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>Información de Pago y Contacto</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Número de Yape/Plin</label>
                                <input type="text" value={formData?.paymentInfo?.phone ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'paymentInfo', 'phone'], e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Nombre del Titular</label>
                                <input type="text" value={formData?.paymentInfo?.name ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'paymentInfo', 'name'], e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Número de WhatsApp (con cód. país)</label>
                                <input type="text" value={formData?.paymentInfo?.whatsapp ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'paymentInfo', 'whatsapp'], e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>Paleta de Colores</h2>
                        <div className="color-grid">
                        {Object.entries(formData?.theme ?? {}).map(([key, value]) => (
                            <div key={key} className="form-group color-group">
                                <label>{key}</label>
                                <div className="color-input-wrapper">
                                    <div className="color-picker-container">
                                        <input type="color" value={value as string} onChange={(e) => handleFormChange([selectedStoreId, 'theme', key], e.target.value)} />
                                    </div>
                                    <input type="text" className="color-hex-input" value={value as string} onChange={(e) => handleFormChange([selectedStoreId, 'theme', key], e.target.value)} />
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    
                    <div className="form-section product-management-section">
                        <div className="section-header">
                            <h2><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>Gestión de Productos</h2>
                        </div>
                         <div className="product-list-mobile">
                            {(formData?.products ?? []).map((product) => (
                                <button key={product.id} className="product-list-item" onClick={() => setEditingProduct(product)}>
                                    <img src={product.image} alt={product.name} className="product-list-item-img" />
                                    <div className="product-list-item-info">
                                        <h4>{product.name}</h4>
                                        <p>S/ {Number(product.price).toFixed(2)}</p>
                                    </div>
                                    <svg className="product-list-item-chevron" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            ))}
                        </div>
                        <button className="add-product-fab" onClick={openNewProductModal} aria-label="Añadir nuevo producto">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                    </div>

                     <div className="form-section">
                        <h2><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.65-3.8a9 9 0 1 1 3.4 2.9l-5.05.9"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1zm-2 2a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1zm4 0a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1zm2-2a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1zm-4 0a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1z"/></svg>Instrucción para el Asistente de IA</h2>
                         <div className="form-group">
                            <label>Personalidad y contexto del Chatbot</label>
                            <textarea value={formData?.chatInstruction ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'chatInstruction'], e.target.value)} rows={6} placeholder="Ej: Eres un asistente amigable de [Nombre de la tienda], experto en..."></textarea>
                        </div>
                    </div>
                </main>
            </div>
            {editingProduct && (
                <ProductEditModal 
                    product={editingProduct}
                    onSave={handleSaveProduct}
                    onDelete={handleDeleteProduct}
                    onClose={() => setEditingProduct(null)}
                />
            )}
        </div>
    );
};


// ========================================================================
// ===                 ROUTER PRINCIPAL DE LA APLICACIÓN                ===
// ========================================================================

const MainRouter = () => {
    if (window.location.pathname.startsWith('/admin')) {
        return <AdminPanel />;
    }
    return <App />;
};


const rootEl = document.getElementById('root');
if (rootEl) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(<MainRouter />);
}
