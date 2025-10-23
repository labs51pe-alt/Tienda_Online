// Fix: Added full implementation for the data layer, which was previously missing.

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface StoreData {
  name: string;
  templateId: 'classic' | 'modern';
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
    templateId: 'classic',
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
  cafedelvalle: {
      name: 'Café del Valle',
      templateId: 'modern',
      sectionTitle: 'Café de Especialidad',
      heroBanner: {
          imageUrl: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?q=80&w=1974&auto=format&fit=crop',
          title: 'El Aroma que Despierta tus Sentidos',
          subtitle: 'Granos seleccionados y tostados a la perfección.'
      },
      products: [
          { id: 1, name: 'Café Geisha Tostado Medio', description: 'Notas florales y cítricas, una experiencia única.', price: 55.00, image: 'https://images.unsplash.com/photo-1511920183353-3c7c4217a2b5?q=80&w=1974&auto=format&fit=crop'},
          { id: 2, name: 'Café Orgánico de la Selva', description: 'Cuerpo completo con notas a chocolate y nueces.', price: 35.00, image: 'https://images.unsplash.com/photo-1599160533833-8a3c89220054?q=80&w=1974&auto=format&fit=crop'}
      ],
      paymentInfo: { phone: '912 345 678', name: 'Carlos Gomez', whatsapp: '51912345678' },
      theme: {
        primary: '#1a4a3c',
        secondary: '#e4d8c7',
        background: '#f8f5f0',
        text: '#2c1e15',
        cardBackground: '#FFFFFF',
        buttonText: '#FFFFFF'
      },
      chatInstruction: 'Eres "CaféBot", un barista virtual experto en café de especialidad de Café del Valle. Tu tono es sofisticado pero accesible. Asesora a los clientes sobre perfiles de sabor, métodos de preparación y orígenes del café.'
  }
};

const STORES_DATA_KEY = 'tienditas_stores_data_v2';

export const getStoresData = (): AllStoresData => {
  try {
    const data = localStorage.getItem(STORES_DATA_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error al leer los datos de localStorage:", error);
  }
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
