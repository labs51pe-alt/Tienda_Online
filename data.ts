// Fix: Added full implementation for the data layer, which was previously missing.

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

export interface AllStoresData {
  [storeId: string]: StoreData;
}

const defaultStoresData: AllStoresData = {
  sachacacao: {
    name: 'Sacha Cacao',
    sectionTitle: 'Nuestros Chocolates Artesanales',
    heroBanner: {
      imageUrl: 'https://images.unsplash.com/photo-1578781429972-6f29a27b7b3b?q=80&w=2070&auto=format&fit=crop',
      title: 'El Sabor Auténtico de la Amazonía',
      subtitle: 'Chocolates hechos con los mejores granos de cacao de origen único.'
    },
    products: [
      { id: 1, name: 'Tableta de Chocolate 70%', description: 'Intenso y con notas frutales, ideal para paladares exigentes.', price: 15.00, image: 'https://images.unsplash.com/photo-1558501970-24a7a4358826?q=80&w=1974&auto=format&fit=crop' },
      { id: 2, name: 'Chocotejas de Pecanas', description: 'El dulce tradicional peruano con el mejor chocolate y pecanas seleccionadas.', price: 2.50, image: 'https://images.unsplash.com/photo-1610452391694-95a4993f4129?q=80&w=1931&auto=format&fit=crop' },
      { id: 3, name: 'Bombones Rellenos', description: 'Caja de 12 bombones con rellenos surtidos de frutos de la selva.', price: 30.00, image: 'https://images.unsplash.com/photo-1582298242510-b34f7b3117b3?q=80&w=1935&auto=format&fit=crop' }
    ],
    paymentInfo: {
      phone: '987 654 321',
      name: 'Juanita Pérez',
      whatsapp: '51987654321'
    },
    theme: {
      primary: '#5D4037',
      secondary: '#D7CCC8',
      background: '#F5F5F5',
      text: '#4E342E',
      cardBackground: '#FFFFFF',
      buttonText: '#FFFFFF'
    },
    chatInstruction: 'Eres "CacaoBot", un asistente virtual amigable y experto en los chocolates de Sacha Cacao. Tu misión es ayudar a los clientes con sus preguntas sobre los productos, precios, ingredientes y el proceso artesanal. Eres entusiasta, conocedor y siempre usas un lenguaje cálido. La tienda se llama Sacha Cacao.'
  },
};

const STORES_DATA_KEY = 'tienditas_stores_data';

// Fix: Exported getStoresData and saveStoresData to make this file a module, fixing the import error in admin.tsx.
export const getStoresData = (): AllStoresData => {
  try {
    const data = localStorage.getItem(STORES_DATA_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error al leer los datos de localStorage:", error);
  }
  // If no data in localStorage, initialize with default data
  saveStoresData(defaultStoresData);
  return JSON.parse(JSON.stringify(defaultStoresData));
};

export const saveStoresData = (data: AllStoresData): void => {
  try {
    localStorage.setItem(STORES_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error al guardar los datos en localStorage:", error);
  }
};
