

import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { getStoresData, saveStoresData } from './data.ts';

const AdminPanel: React.FC = () => {
    const [allStoresData, setAllStoresData] = useState(getStoresData);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('sachacacao');
    const [notification, setNotification] = useState('');

    const formData = allStoresData[selectedStoreId];

    const handleStoreSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedStoreId(e.target.value);
    };

    const handleFormChange = (path: (string | number)[], value: any) => {
        setAllStoresData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData)); // Deep copy
            let current = newData;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newData;
        });
    };
    
    const handleAddProduct = () => {
        const newProduct = {
            id: Date.now(),
            name: 'Nuevo Producto',
            description: 'Descripción del producto...',
            price: 0.00,
            image: 'https://via.placeholder.com/300x220.png?text=Imagen'
        };
        const currentProducts = formData?.products ?? [];
        handleFormChange([selectedStoreId, 'products'], [...currentProducts, newProduct]);
    };

    const handleDeleteProduct = (productId: number) => {
        const updatedProducts = (formData?.products ?? []).filter(p => p.id !== productId);
        handleFormChange([selectedStoreId, 'products'], updatedProducts);
    };

    const handleSave = () => {
        saveStoresData(allStoresData);
        setNotification(`Cambios para "${formData.name}" guardados correctamente.`);
        setTimeout(() => setNotification(''), 3000);
    };

    if (!formData) {
        return <div>Cargando datos de la tienda...</div>;
    }

    return (
        <div className="admin-container">
            {notification && <div className="notification">{notification}</div>}
            <header className="admin-header">
                <h1>Panel de Administración</h1>
                <div className="store-selector">
                    <label htmlFor="store-select">Seleccionar Tienda:</label>
                    <select id="store-select" value={selectedStoreId} onChange={handleStoreSelectionChange}>
                        {Object.keys(allStoresData).map(storeId => (
                            <option key={storeId} value={storeId}>
                                {allStoresData[storeId].name}
                            </option>
                        ))}
                    </select>
                </div>
            </header>
            <main className="admin-main">
                <div className="form-section">
                    <h2>Datos Generales</h2>
                    <div className="form-group">
                        <label>Nombre de la Tienda</label>
                        <input type="text" value={formData?.name ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'name'], e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Título de la Sección de Productos</label>
                        <input type="text" value={formData?.sectionTitle ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'sectionTitle'], e.target.value)} />
                    </div>
                </div>

                <div className="form-section">
                    <h2>Banner Principal</h2>
                    <div className="form-group">
                        <label>URL de la Imagen</label>
                        <input type="text" value={formData?.heroBanner?.imageUrl ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'heroBanner', 'imageUrl'], e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Título del Banner</label>
                        <input type="text" value={formData?.heroBanner?.title ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'heroBanner', 'title'], e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Subtítulo del Banner</label>
                        <input type="text" value={formData?.heroBanner?.subtitle ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'heroBanner', 'subtitle'], e.target.value)} />
                    </div>
                </div>
                
                <div className="form-section">
                    <h2>Información de Pago y Contacto</h2>
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

                <div className="form-section">
                    <h2>Paleta de Colores</h2>
                    <div className="color-grid">
                    {Object.entries(formData?.theme ?? {}).map(([key, value]) => (
                        <div key={key} className="form-group color-group">
                            <label>{key}</label>
                            <div className="color-input-wrapper">
                                <input type="color" value={value as string} onChange={(e) => handleFormChange([selectedStoreId, 'theme', key], e.target.value)} />
                                <span>{value as string}</span>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>

                <div className="form-section">
                    <div className="section-header">
                        <h2>Gestión de Productos</h2>
                        <button className="add-product-btn" onClick={handleAddProduct}>+ Añadir Producto</button>
                    </div>
                    {(formData?.products ?? []).map((product, index) => (
                        <div key={product.id} className="product-editor">
                            <img src={product.image} alt={product.name} />
                            <div className="product-fields">
                                <input type="text" value={product.name} onChange={(e) => handleFormChange([selectedStoreId, 'products', index, 'name'], e.target.value)} placeholder="Nombre"/>
                                <textarea value={product.description} onChange={(e) => handleFormChange([selectedStoreId, 'products', index, 'description'], e.target.value)} placeholder="Descripción"></textarea>
                                <input type="number" value={product.price} onChange={(e) => handleFormChange([selectedStoreId, 'products', index, 'price'], parseFloat(e.target.value) || 0)} placeholder="Precio" />
                                <input type="text" value={product.image} onChange={(e) => handleFormChange([selectedStoreId, 'products', index, 'image'], e.target.value)} placeholder="URL de imagen"/>
                            </div>
                            <button className="delete-product-btn" onClick={() => handleDeleteProduct(product.id)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                    ))}
                </div>
                 <div className="form-section">
                    <h2>Instrucción para el Asistente de IA</h2>
                     <div className="form-group">
                        <label>Personalidad y contexto del Chatbot</label>
                        <textarea value={formData?.chatInstruction ?? ''} onChange={(e) => handleFormChange([selectedStoreId, 'chatInstruction'], e.target.value)} rows={5}></textarea>
                    </div>
                </div>

                <button className="save-button" onClick={handleSave}>Guardar Cambios</button>
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<AdminPanel />);