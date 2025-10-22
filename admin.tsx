import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { getStoresData, saveStoresData } from './data.ts';

// --- INTERFACES DE TIPOS ---
interface Product {
  id: number; name: string; description: string; price: number; image: string;
}

// --- COMPONENTES DEL PANEL DE ADMINISTRACIÓN ---

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
        onSave(product);
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
                        <input type="text" value={product.name} onChange={(e) => handleChange('name', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea value={product.description} onChange={(e) => handleChange('description', e.target.value)} rows={4}></textarea>
                    </div>
                     <div className="form-grid">
                        <div className="form-group">
                            <label>Precio (S/)</label>
                            <input type="number" value={product.price} onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                     <div className="form-group">
                        <label>URL de la Imagen</label>
                        <input type="text" value={product.image} onChange={(e) => handleChange('image', e.target.value)} />
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


const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<AdminPanel />);
