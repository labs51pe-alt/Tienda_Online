import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Chat } from "@google/genai";
import { marked } from 'marked';
import { getStoresData, saveStoresData } from './data.ts';

const storesData = getStoresData();

const getStoreConfig = () => {
    const path = window.location.pathname;
    // Extrae el ID de la tienda de la ruta. Ej: "/sachacacao" -> "sachacacao"
    const storeIdFromPath = path.split('/')[1];
    
    // Si hay un ID en la ruta y existe en los datos, úsalo. Si no, usa el predeterminado.
    const storeId = storeIdFromPath && storesData[storeIdFromPath] ? storeIdFromPath : 'sachacacao';
    
    // Maneja el caso en que la ruta sea /admin para no romper la carga de la tienda por defecto
    if (storeId === 'admin') {
        return storesData['sachacacao'];
    }

    return storesData[storeId];
};

// --- INTERFACES DE TIPOS ---
interface Product {
  id: number; name: string; description: string; price: number; image: string;
}
interface CartItem extends Product { quantity: number; }
interface ProductCardProps { product: Product; onAddToCart: (product: Product) => void; }
interface CartModalProps { cart: CartItem[]; isOpen: boolean; onClose: () => void; onUpdateQuantity: (productId: number, newQuantity: number) => void; onRemoveItem: (productId: number) => void; onClearCart: () => void; onProceedToPayment: () => void; }
interface PaymentModalProps { isOpen: boolean; onClose: () => void; onBackToCart: () => void; total: number; cart: CartItem[]; }
interface ChatWidgetProps { isChatOpen: boolean; toggleChat: () => void; }
interface ProductEditModalProps { product: Partial<Product> | null; onSave: (product: Partial<Product>) => void; onDelete: (productId: number) => void; onClose: () => void; }


// ========================================================================
// ===                   COMPONENTES DE LA TIENDA                       ===
// ========================================================================

const StoreLogo: React.FC<{name: string}> = ({ name }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--dark-text)' }}>
         <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.39 5.16C15.45 3.58 12.55 3.58 10.61 5.16C8.67 6.74 8.05 9.61 9.22 11.89L3.5 17.61C3.11 18 3.11 18.63 3.5 19C3.89 19.39 4.52 19.39 4.91 19L10.63 13.28C12.91 14.45 15.78 13.83 17.36 11.89C19.3 9.95 19.3 6.95 17.39 5.16ZM12.31 11.18C11.53 11.57 10.59 11.39 10 10.8C9.41 10.21 9.23 9.27 9.62 8.49C10.01 7.71 10.95 7.53 11.54 8.12C12.13 8.71 12.31 9.65 11.92 10.43L12.31 11.18Z" />
            <path d="M14.5 9.5C13.67 9.5 13 8.83 13 8C13 7.17 13.67 6.5 14.5 6.5C15.33 6.5 16 7.17 16 8C16 8.83 15.33 9.5 14.5 9.5Z" />
        </svg>
        <span style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'Inter, sans-serif' }}>
            {name}
        </span>
    </div>
);


const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div className="product-card">
      <div className="product-image">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">S/ {Number(product.price).toFixed(2)}</span>
          <button className="add-to-cart-btn" onClick={() => onAddToCart(product)}>
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
};

const CartModal: React.FC<CartModalProps> = ({ cart, isOpen, onClose, onUpdateQuantity, onRemoveItem, onClearCart, onProceedToPayment }) => {
  if (!isOpen) return null;
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Tu Carrito</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {cart.length === 0 ? (
            <p className="empty-cart-message">Tu carrito está vacío.</p>
          ) : (
            cart.map(item => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                  <span className="cart-item-name">{item.name}</span>
                  <div className="cart-item-quantity">
                    <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <div className="cart-item-actions">
                    <span className="cart-item-price">S/ {(item.price * item.quantity).toFixed(2)}</span>
                    <button className="cart-item-remove" onClick={() => onRemoveItem(item.id)}>Quitar</button>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="modal-footer">
            <div className="cart-total">
                <span>Total:</span>
                <span>S/ {total.toFixed(2)}</span>
            </div>
            <button className="checkout-btn" onClick={onProceedToPayment}>Finalizar Compra</button>
            <button className="clear-cart-btn" onClick={onClearCart}>Vaciar Carrito</button>
          </div>
        )}
      </div>
    </div>
  );
};

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onBackToCart, total, cart }) => {
    const [activeTab, setActiveTab] = useState<'yape' | 'plin'>('yape');
    if (!isOpen) return null;
    
    const storeConfig = getStoreConfig();
    const { phone, name, whatsapp } = storeConfig.paymentInfo;

    const generateWhatsAppMessage = () => {
        const header = `¡Hola ${storeConfig.name}! 👋 Acabo de realizar mi pedido, en breve realizo el pago y envío la captura.\n\n*Resumen del pedido:*\n`;
        const items = cart.map(item => `- ${item.name} (x${item.quantity})`).join('\n');
        const footer = `\n\n*Total a pagar:* S/ ${total.toFixed(2)}\n\n¡Gracias!`;
        return header + items + footer;
    };

    const whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(generateWhatsAppMessage())}`;
    const qrData = activeTab === 'yape' ? `YapePaymentTo${phone.replace(/\s/g, '')}` : `PlinPaymentTo${phone.replace(/\s/g, '')}`;
    
    const themeColors = storeConfig.theme;
    const qrColor = themeColors['--primary-brown'].substring(1);
    const qrBgColor = themeColors['--primary-brown-light'].substring(1);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&color=${qrColor}&bgcolor=${qrBgColor}`;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content payment-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Realizar Pago</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body payment-modal-body">
                    <p className="payment-total">Total a pagar: <strong>S/ {total.toFixed(2)}</strong></p>
                    <div className="payment-tabs">
                        <button className={`payment-tab ${activeTab === 'yape' ? 'active' : ''}`} onClick={() => setActiveTab('yape')}>Pagar con Yape</button>
                        <button className={`payment-tab ${activeTab === 'plin' ? 'active' : ''}`} onClick={() => setActiveTab('plin')}>Pagar con Plin</button>
                    </div>
                    <div className="payment-content">
                        <p className="payment-instructions">Escanea el código QR desde tu app de {activeTab === 'yape' ? 'Yape' : 'Plin'} o usa nuestro número.</p>
                        <div className="qr-code-container"><img src={qrCodeUrl} alt={`Código QR para ${activeTab}`} className="qr-code" /></div>
                        <div className="payment-details">
                            <p><strong>Número:</strong> <span>{phone}</span></p>
                            <p><strong>Nombre:</strong> <span>{name}</span></p>
                        </div>
                    </div>
                    <div className="confirmation-box">
                        <h3>¡Importante! Confirma tu pedido</h3>
                        <p>Una vez realizado el pago, envía la captura de pantalla a nuestro WhatsApp para coordinar la entrega.</p>
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="whatsapp-button">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            <span>Enviar Captura por WhatsApp</span>
                        </a>
                    </div>
                </div>
                 <div className="modal-footer"><button className="back-to-cart-btn" onClick={onBackToCart}>Volver al Carrito</button></div>
            </div>
        </div>
    );
};

const ChatWidget: React.FC<ChatWidgetProps> = ({ isChatOpen, toggleChat }) => {
    const [messages, setMessages] = useState<{ type: 'user' | 'model'; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chat = useRef<Chat | null>(null);
    const chatBodyRef = useRef<HTMLDivElement>(null);
    const storeConfig = getStoreConfig();

    useEffect(() => {
        if (isChatOpen && !chat.current) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            chat.current = ai.chats.create({
              model: 'gemini-2.5-flash',
              config: {
                systemInstruction: storeConfig.chatInstruction,
              },
            });
        }
    }, [isChatOpen, storeConfig.chatInstruction]);
    
    useEffect(() => {
        if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }, [messages, isLoading]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !chat.current) return;
        const userMessage = { type: 'user' as const, text: input };
        setMessages(prev => [...prev, userMessage]);
        const messageToSend = input;
        setInput('');
        setIsLoading(true);
        try {
            const response = await chat.current.sendMessage({ message: messageToSend });
            const modelMessage = { type: 'model' as const, text: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Error al contactar la IA:", error);
            const errorMessage = { type: 'model' as const, text: 'Lo siento, no puedo responder en este momento.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button className="chat-fab" onClick={toggleChat} aria-label="Abrir chat">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.65-3.8a9 9 0 1 1 3.4 2.9l-5.05.9"></path><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1zm-2 2a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1zm4 0a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1zm2-2a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1zm-4 0a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1z"></path></svg>
            </button>
            {isChatOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <h3>Asistente de {storeConfig.name}</h3>
                        <p>¿Cómo puedo ayudarte hoy?</p>
                    </div>
                    <div className="chat-body" ref={chatBodyRef}>
                        {messages.map((msg, index) =>
                            msg.type === 'model' ? (
                                <div
                                    key={index}
                                    className={`chat-message ${msg.type}`}
                                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) as string }}
                                />
                            ) : (
                                <div key={index} className={`chat-message ${msg.type}`}>
                                    {msg.text}
                                </div>
                            ),
                        )}
                        {isLoading && (<div className="chat-message model"><div className="loading-dots"><span></span><span></span><span></span></div></div>)}
                    </div>
                    <div className="chat-footer">
                        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Escribe tu pregunta..." />
                        <button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

const Header: React.FC<{ onCartClick: () => void; cartCount: number }> = ({ onCartClick, cartCount }) => {
  const storeConfig = getStoreConfig();
  return (
    <header className="header">
      <div className="container">
        <StoreLogo name={storeConfig.name} />
        <div className="header-actions">
          <a href="/admin" className="admin-panel-button" aria-label="Ir al panel de administración">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
            <span>Admin</span>
          </a>
          <button className="cart-button" onClick={onCartClick} aria-label={`Ver carrito de compras con ${cartCount} artículos`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
};

const HeroBanner: React.FC = () => {
    const storeConfig = getStoreConfig();
    const { imageUrl, title, subtitle } = storeConfig.heroBanner;
    return (
        <section className="hero-banner" style={{ backgroundImage: `url(${imageUrl})` }}>
            <div className="hero-overlay">
                <div className="container">
                    <h1>{title}</h1>
                    <p>{subtitle}</p>
                </div>
            </div>
        </section>
    );
};


const ProductGrid: React.FC<{ onAddToCart: (product: Product) => void }> = ({ onAddToCart }) => {
  const storeConfig = getStoreConfig();
  return (
    <section className="product-grid-container">
        <div className="container">
            <h2 className="section-title">{storeConfig.sectionTitle}</h2>
            <div className="product-grid">
                {storeConfig.products.map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
                ))}
            </div>
        </div>
    </section>
  );
};

const Footer: React.FC = () => {
    const storeConfig = getStoreConfig();
    return (
        <footer className="footer">
            <div className="container">
                <span>© {new Date().getFullYear()} {storeConfig.name}. Todos los derechos reservados.</span>
            </div>
        </footer>
    );
};

const App = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const storeConfig = getStoreConfig();

    useEffect(() => {
        Object.entries(storeConfig.theme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value as string);
        });
        document.title = `${storeConfig.name} | Tienda Online`;
    }, [storeConfig]);

    const handleAddToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };
    
    const handleUpdateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity < 1) {
            handleRemoveItem(productId);
        } else {
            setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
        }
    };
    
    const handleRemoveItem = (productId: number) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const handleClearCart = () => { setCart([]); };
    const handleProceedToPayment = () => { setIsCartOpen(false); setIsPaymentOpen(true); };
    const handleBackToCart = () => { setIsPaymentOpen(false); setIsCartOpen(true); };

    return (
        <div>
            <Header onCartClick={() => setIsCartOpen(true)} cartCount={totalItems} />
            <HeroBanner />
            <main>
                <ProductGrid onAddToCart={handleAddToCart} />
            </main>
            <Footer />
            <CartModal 
                cart={cart}
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onProceedToPayment={handleProceedToPayment}
            />
             <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                onBackToCart={handleBackToCart}
                total={totalAmount}
                cart={cart}
            />
            <ChatWidget isChatOpen={isChatOpen} toggleChat={() => setIsChatOpen(!isChatOpen)} />
        </div>
    );
};


// ========================================================================
// ===                 COMPONENTES DEL PANEL DE ADMIN                   ===
// ========================================================================

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
    const [allStoresData, setAllStoresData] = useState(getStoresData);
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
            let current = newData;
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
                    <h1>Editando: <span className="highlight">{formData.name}</span></h1>
                    <button className="save-button" onClick={handleSave}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                        Guardar Cambios
                    </button>
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
// ===                   PUNTO DE ENTRADA PRINCIPAL                     ===
// ========================================================================

const Main = () => {
    // Si la ruta comienza con /admin, renderiza el panel de admin.
    if (window.location.pathname.startsWith('/admin')) {
        return <AdminPanel />;
    }
    // Para cualquier otra ruta, renderiza la tienda.
    return <App />;
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Main />);
