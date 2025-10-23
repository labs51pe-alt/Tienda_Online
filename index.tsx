
import React, { useState, useEffect, useRef, FormEvent } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams, Link, Navigate } from 'react-router-dom';
// Fix: Import GoogleGenAI and Chat for AI assistant functionality
import { GoogleGenAI, Chat } from '@google/genai';
import { getStoresData, StoreData, Product, AllStoresData } from './data';

// --- SVG Icons ---
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 21 1.65-3.8a9 9 0 1 1 3.4 2.9l-5.05.9" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1zm-2 2a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1zm4 0a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1zm2-2a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1zm-4 0a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1z" />
    </svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

// --- Interfaces ---
interface Message {
    role: 'user' | 'model';
    text: string;
}

// --- Chat Widget Component ---
const ChatWidget: React.FC<{ chatInstruction: string; storeName: string; }> = ({ chatInstruction, storeName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatInstruction) {
            // Fix: Initialize GoogleGenAI client according to guidelines
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            // Fix: Create a chat session with the specified model and system instruction
            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: chatInstruction,
                },
            });
            chatRef.current = chat;
            setMessages([
                { role: 'model', text: `¡Hola! Soy el asistente de ${storeName}. ¿En qué puedo ayudarte hoy?` }
            ]);
        }
    }, [chatInstruction, storeName]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !chatRef.current) return;

        const text = userInput;
        setMessages(prev => [...prev, { role: 'user', text }]);
        setUserInput('');
        setIsLoading(true);

        try {
            // Fix: Use sendMessageStream for a streaming response
            const result = await chatRef.current.sendMessageStream({ message: text });
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of result) {
                // Fix: Access the text from the response chunk
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text: modelResponse };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'model') {
                    lastMessage.text = 'Lo siento, ha ocurrido un error. Intenta de nuevo.';
                } else {
                    newMessages.push({ role: 'model', text: 'Lo siento, ha ocurrido un error. Intenta de nuevo.' });
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button className="chat-fab" onClick={() => setIsOpen(true)} aria-label="Abrir chat">
                <ChatIcon />
            </button>
            {isOpen && (
                <div className="chat-widget-container">
                    <div className="chat-header">
                        <h3>Asistente de {storeName}</h3>
                        <button onClick={() => setIsOpen(false)} aria-label="Cerrar chat"><CloseIcon /></button>
                    </div>
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.role}`}>
                                <p>{msg.text}{isLoading && msg.role === 'model' && index === messages.length -1 && '...'}</p>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <form className="chat-input" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Escribe tu pregunta..."
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading} aria-label="Enviar mensaje">
                            <SendIcon />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};


// --- Store Components ---
const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <div className="product-card">
        <img src={product.image} alt={product.name} className="product-image" />
        <div className="product-info">
            <h3 className="product-name">{product.name}</h3>
            <p className="product-description">{product.description}</p>
            <p className="product-price">S/ {Number(product.price).toFixed(2)}</p>
        </div>
    </div>
);

const StoreFooter: React.FC<{ paymentInfo: StoreData['paymentInfo'], storeName: string }> = ({ paymentInfo, storeName }) => (
    <footer className="store-footer">
        <div className="footer-content">
            <div className="payment-info">
                <h4>Información de Pago y Contacto</h4>
                <p><strong>Yape/Plin:</strong> {paymentInfo.phone}</p>
                <p><strong>A nombre de:</strong> {paymentInfo.name}</p>
                <a href={`https://wa.me/${paymentInfo.whatsapp}`} target="_blank" rel="noopener noreferrer" className="whatsapp-link">
                    Contactar por WhatsApp
                </a>
            </div>
            <div className="footer-credits">
                <p>&copy; {new Date().getFullYear()} {storeName}.</p>
                <p>Creado con Tienditas.pe</p>
            </div>
        </div>
    </footer>
);

// --- Page Components ---
const StorePage: React.FC = () => {
    const { storeId } = useParams<{ storeId: string }>();
    const [storeData, setStoreData] = useState<StoreData | null | undefined>(undefined);

    useEffect(() => {
        const allStores = getStoresData();
        setStoreData(storeId ? allStores[storeId] : null);
    }, [storeId]);

    useEffect(() => {
        if (storeData) {
            document.title = storeData.name;
            const root = document.documentElement;
            Object.entries(storeData.theme).forEach(([key, value]) => {
                const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
                root.style.setProperty(cssVarName, value);
            });
        } else if (storeData === null) {
            document.title = "Tienda no encontrada";
        }
    }, [storeData]);

    if (storeData === undefined) {
        return <div className="loading-screen">Cargando tienda...</div>;
    }

    if (storeData === null) {
        return <Navigate to="/not-found" replace />;
    }

    return (
        <div className="store-wrapper">
            <header className="hero-banner" style={{ backgroundImage: `url(${storeData.heroBanner.imageUrl})` }}>
                <div className="hero-overlay">
                    <h1>{storeData.heroBanner.title}</h1>
                    <p>{storeData.heroBanner.subtitle}</p>
                </div>
            </header>
            <main className="store-main">
                <section className="products-section">
                    <h2>{storeData.sectionTitle}</h2>
                    <div className="products-grid">
                        {storeData.products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            </main>
            <StoreFooter paymentInfo={storeData.paymentInfo} storeName={storeData.name}/>
            <ChatWidget chatInstruction={storeData.chatInstruction} storeName={storeData.name} />
        </div>
    );
};

const HomePage: React.FC = () => {
    const [stores, setStores] = useState<AllStoresData>({});
    useEffect(() => {
        setStores(getStoresData());
        document.title = "Tienditas.pe - Elige tu tienda";
    }, []);

    return (
        <div className="homepage-container">
            <h1>Bienvenido a Tienditas.pe</h1>
            <p>Selecciona una tienda para visitar:</p>
            <div className="store-list">
                {Object.entries(stores).map(([id, store]) => (
                    <Link key={id} to={`/${id}`} className="store-link-card">
                        <h2>{store.name}</h2>
                        <p>{store.heroBanner.subtitle}</p>
                    </Link>
                ))}
                 <Link to="/admin" className="store-link-card admin-link">
                    <h2>Panel de Admin</h2>
                    <p>Gestiona tus tiendas</p>
                </Link>
            </div>
        </div>
    );
};

const NotFoundPage: React.FC = () => (
    <div className="not-found-page">
        <h1>404</h1>
        <h2>Tienda no encontrada</h2>
        <p>La tienda que buscas no existe o ha sido movida.</p>
        <Link to="/">Volver al inicio</Link>
    </div>
);

// --- App ---
const App: React.FC = () => {
    return (
    <>
    <style>{`
        :root {
            --color-primary: #5D4037;
            --color-secondary: #D7CCC8;
            --color-background: #F5F5F5;
            --color-text: #4E342E;
            --color-card-background: #FFFFFF;
            --color-button-text: #FFFFFF;
            --font-family: 'Inter', sans-serif;
        }
        body { margin: 0; font-family: var(--font-family); background-color: var(--color-background); color: var(--color-text); line-height: 1.6; }
        * { box-sizing: border-box; }
        h1, h2, h3 { color: var(--color-primary); }
        a { color: var(--color-primary); text-decoration: none; }
        .loading-screen, .not-found-page, .homepage-container { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; text-align: center; padding: 20px;}
        .homepage-container h1 { font-size: 2.5rem; }
        .store-list { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-top: 30px; }
        .store-link-card { background: var(--color-card-background); border-radius: 8px; padding: 20px 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: all 0.2s ease-in-out; width: 300px; }
        .store-link-card:hover { transform: translateY(-5px); box-shadow: 0 6px 16px rgba(0,0,0,0.12); }
        .admin-link { border: 2px dashed var(--color-primary); }
        .hero-banner { background-size: cover; background-position: center; height: 50vh; display: flex; align-items: center; justify-content: center; text-align: center; color: white; position: relative; }
        .hero-overlay { background: rgba(0,0,0,0.5); padding: 40px; border-radius: 8px; max-width: 80%; }
        .hero-overlay h1 { font-size: 3rem; margin: 0; color: white; }
        .hero-overlay p { font-size: 1.25rem; margin-top: 10px; color: #f0f0f0; }
        .store-main { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        .products-section h2 { text-align: center; font-size: 2.5rem; margin-bottom: 40px; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
        .product-card { background: var(--color-card-background); border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: transform 0.2s; }
        .product-card:hover { transform: translateY(-5px); }
        .product-image { width: 100%; height: 220px; object-fit: cover; }
        .product-info { padding: 20px; }
        .product-name { margin-top: 0; font-size: 1.25rem; }
        .product-price { font-weight: bold; font-size: 1.2rem; color: var(--color-primary); }
        .store-footer { background-color: var(--color-secondary); color: var(--color-text); padding: 40px 20px; margin-top: 60px; }
        .footer-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
        .whatsapp-link { display: inline-block; margin-top: 10px; background-color: var(--color-primary); color: var(--color-button-text); padding: 10px 15px; border-radius: 5px; font-weight: bold; }
        .chat-fab { position: fixed; bottom: 20px; right: 20px; background-color: var(--color-primary); color: var(--color-button-text); border: none; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); cursor: pointer; z-index: 1000; }
        .chat-widget-container { position: fixed; bottom: 20px; right: 20px; width: 350px; height: 500px; background: var(--color-card-background); border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); display: flex; flex-direction: column; z-index: 1001; }
        .chat-header { background: var(--color-primary); color: var(--color-button-text); padding: 10px 15px; border-top-left-radius: 10px; border-top-right-radius: 10px; display: flex; justify-content: space-between; align-items: center; }
        .chat-header h3 { margin: 0; font-size: 1rem; }
        .chat-header button { background: none; border: none; color: white; cursor: pointer; }
        .chat-messages { flex-grow: 1; overflow-y: auto; padding: 15px; }
        .message { margin-bottom: 10px; max-width: 85%; }
        .message p { margin: 0; padding: 10px 15px; border-radius: 18px; display: inline-block; white-space: pre-wrap; }
        .message.user { align-self: flex-end; margin-left: auto; }
        .message.user p { background-color: var(--color-primary); color: var(--color-button-text); }
        .message.model { align-self: flex-start; }
        .message.model p { background-color: var(--color-secondary); color: var(--color-text); }
        .chat-input { display: flex; border-top: 1px solid var(--color-secondary); padding: 10px; }
        .chat-input input { flex-grow: 1; border: 1px solid #ccc; border-radius: 20px; padding: 8px 15px; outline: none; }
        .chat-input button { background: none; border: none; cursor: pointer; color: var(--color-primary); padding: 5px; }
    `}</style>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:storeId" element={<StorePage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/not-found" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

// --- Render ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
