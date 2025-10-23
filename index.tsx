import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { getStoresData } from './data.ts';
// Fix: Import GoogleGenAI and Chat from @google/genai
import { GoogleGenAI, Chat } from '@google/genai';

// --- INTERFACES DE TIPOS ---
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

// --- COMPONENTES DE LA TIENDA ---

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
                // Fix: Initialize GoogleGenAI with API Key from environment variable.
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                // Fix: Use create chat method with the recommended model 'gemini-2.5-flash'.
                const newChat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: instruction,
                    },
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
            // Fix: Correctly handle streaming response from sendMessageStream.
            const result = await chat.sendMessageStream({ message: input });
            let modelResponse = '';
            setMessages(prev => [...prev, { author: 'model', content: '' }]);
            for await (const chunk of result) {
                // FIX: Defensively cast the chunk text to a string to prevent potential 'unknown' type errors.
                modelResponse += String(chunk.text ?? "");
                // Update the last message (the model's response) in a streaming fashion
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
            root.style.setProperty(`--theme-${key}`, value);
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
            
            <style>{`
                :root {
                    --theme-primary: #5D4037;
                    --theme-secondary: #D7CCC8;
                    --theme-background: #F5F5F5;
                    --theme-text: #4E342E;
                    --theme-cardBackground: #FFFFFF;
                    --theme-buttonText: #FFFFFF;
                }
                body {
                    margin: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    background-color: var(--theme-background);
                    color: var(--theme-text);
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }
                * { box-sizing: border-box; }
                
                .store-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background-color: var(--theme-cardBackground);
                }

                .store-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 2rem;
                    background-color: var(--theme-cardBackground);
                    border-bottom: 1px solid #eee;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }
                .store-name { font-size: 1.5rem; font-weight: bold; color: var(--theme-primary); }
                .cart-button {
                    position: relative;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--theme-text);
                }
                .cart-badge {
                    position: absolute;
                    top: -5px;
                    right: -10px;
                    background-color: var(--theme-primary);
                    color: var(--theme-buttonText);
                    border-radius: 50%;
                    padding: 2px 6px;
                    font-size: 0.75rem;
                    font-weight: bold;
                }

                .hero-banner {
                    position: relative;
                    height: 50vh;
                    background-size: cover;
                    background-position: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    color: white;
                }
                .hero-overlay {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: rgba(0, 0, 0, 0.4);
                }
                .hero-content { position: relative; z-index: 1; }
                .hero-content h1 { font-size: 3rem; margin: 0; }
                .hero-content p { font-size: 1.25rem; }

                .products-section { padding: 2rem; text-align: center; }
                .products-section h2 { font-size: 2rem; color: var(--theme-primary); margin-bottom: 2rem; }
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 2rem;
                }

                .product-card {
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    overflow: hidden;
                    text-align: left;
                    display: flex;
                    flex-direction: column;
                }
                .product-image { width: 100%; height: 220px; object-fit: cover; }
                .product-info { padding: 1rem; flex-grow: 1; display: flex; flex-direction: column; }
                .product-info h3 { margin: 0 0 0.5rem; }
                .product-description { font-size: 0.9rem; color: #666; flex-grow: 1; margin-bottom: 1rem; }
                .product-footer { display: flex; justify-content: space-between; align-items: center; }
                .product-price { font-size: 1.2rem; font-weight: bold; color: var(--theme-primary); }
                .add-to-cart-btn {
                    background-color: var(--theme-primary);
                    color: var(--theme-buttonText);
                    border: none;
                    padding: 0.6rem 1rem;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: background-color 0.2s;
                }
                .add-to-cart-btn:hover { background-color: color-mix(in srgb, var(--theme-primary) 90%, black); }

                .cart-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 2000; }
                .cart-modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 500px; }
                .cart-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1rem; }
                .cart-header h2 { margin: 0; }
                .close-cart-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
                .cart-items { max-height: 300px; overflow-y: auto; }
                .cart-item { display: flex; justify-content: space-between; padding: 0.5rem 0; }
                .cart-total { display: flex; justify-content: space-between; padding-top: 1rem; margin-top: 1rem; border-top: 1px solid #eee; font-size: 1.2rem; }
                .cart-payment-info { margin-top: 1.5rem; background: #f9f9f9; padding: 1rem; border-radius: 5px; text-align: center; }
                .whatsapp-btn { display: inline-flex; align-items: center; gap: 0.5rem; background-color: #25D366; color: white; padding: 0.8rem 1.5rem; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 1rem; }
                
                .chat-fab {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    border: none;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                    cursor: pointer;
                    z-index: 1010;
                }
                .chat-window {
                    position: fixed;
                    bottom: 6.5rem;
                    right: 2rem;
                    width: 350px;
                    height: 500px;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    z-index: 1010;
                }
                .chat-header { color: white; padding: 1rem; border-top-left-radius: 10px; border-top-right-radius: 10px; display: flex; justify-content: space-between; align-items: center; }
                .chat-header h3 { margin: 0; font-size: 1.1rem; }
                .chat-header button { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
                .chat-messages { flex-grow: 1; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column;}
                .chat-welcome { text-align: center; color: #888; font-size: 0.9rem; padding: 2rem 0; }
                .message { max-width: 80%; padding: 0.5rem 1rem; margin-bottom: 0.5rem; border-radius: 15px; word-wrap: break-word; }
                .message.user { background: #eee; align-self: flex-end; margin-left: auto; border-bottom-right-radius: 5px; }
                .message.model { background-color: var(--theme-secondary); align-self: flex-start; border-bottom-left-radius: 5px; }
                .message.typing { color: #888; font-style: italic; }
                .chat-input-form { display: flex; padding: 0.5rem; border-top: 1px solid #eee; }
                .chat-input-form input { flex-grow: 1; border: 1px solid #ccc; border-radius: 20px; padding: 0.5rem 1rem; outline: none; }
                .chat-input-form button { background: var(--theme-primary); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-left: 0.5rem; cursor: pointer; }

                @media (max-width: 768px) {
                    .store-header { padding: 1rem; }
                    .hero-content h1 { font-size: 2rem; }
                    .products-section { padding: 1rem; }
                    .chat-window { width: calc(100vw - 2rem); right: 1rem; bottom: 5.5rem; height: 60vh; }
                    .chat-fab { right: 1rem; bottom: 1rem; }
                }
            `}</style>
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
        if (path.startsWith('/admin')) {
            return;
        }

        const allStores = getStoresData();
        const storeIdFromPath = path.substring(1).split('/')[0];
        const storeId = storeIdFromPath || 'sachacacao';
        
        if (storeIdFromPath === '' || storeIdFromPath === 'index.html') {
             window.location.pathname = '/sachacacao';
             return;
        }

        if (allStores[storeId]) {
            setStoreData(allStores[storeId]);
        } else {
            setStoreData(null); 
        }
    }, []);

    if (window.location.pathname.startsWith('/admin')) {
        return null;
    }

    if (storeData === undefined) {
        return <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>Cargando tienda...</div>;
    }

    if (storeData === null) {
        return <NotFoundPage />;
    }

    return <StorePage storeData={storeData} />;
};

const rootEl = document.getElementById('root');
if (rootEl) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(<App />);
}