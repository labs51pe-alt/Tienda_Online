import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Chat } from "@google/genai";
import { marked } from 'marked';
import { getStoresData } from './data.ts';

const storesData = getStoresData();

const getStoreConfig = () => {
    const path = window.location.pathname;
    // Extrae el ID de la tienda de la ruta. Ej: "/sachacacao" -> "sachacacao"
    const storeIdFromPath = path.split('/')[1];
    
    // Si hay un ID en la ruta y existe en los datos, úsalo. Si no, usa el predeterminado.
    const storeId = storeIdFromPath && storesData[storeIdFromPath] ? storeIdFromPath : 'sachacacao';
    
    // Maneja el caso en que la ruta sea /admin o esté vacía para la tienda por defecto
    if (storeId === 'admin' || storeId === '') {
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
// ===                   PUNTO DE ENTRADA PRINCIPAL                     ===
// ========================================================================

const Main = () => {
    // La lógica de enrutamiento para /admin se maneja ahora con la estructura 
    // de archivos separados y la configuración de Vercel.
    // Este punto de entrada es solo para la tienda del cliente.
    return <App />;
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Main />);