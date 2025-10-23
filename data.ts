// data.ts - Única fuente de verdad para los datos de la tienda.

const initialStoresData = {
    sachacacao: {
        id: 'sachacacao',
        name: 'Sacha Cacao',
        sectionTitle: 'Nuestra Cosecha',
        theme: {
            '--primary-brown': '#5D4037', '--primary-brown-light': '#efebe9', '--accent-gold': '#c59d5f',
            '--dark-text': '#3E2723', '--light-text': '#795548', '--background-color': '#FDFBF7',
            '--surface-color': '#FFFFFF', '--border-color': '#D7CCC8',
        },
        heroBanner: {
            imageUrl: 'https://images.pexels.com/photos/4099355/pexels-photo-4099355.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            title: 'Sacha Cacao',
            subtitle: 'Del grano a tu corazón. Descubre el sabor auténtico del cacao artesanal.'
        },
        paymentInfo: {
            phone: '987654321', name: 'JUAN PEREZ', whatsapp: '51987654321'
        },
        chatInstruction: "Eres un asistente virtual de Sacha Cacao, una tienda especializada en productos artesanales de cacao. Eres amable, conocedor y apasionado por el cacao. Ayuda a los clientes a conocer los productos, sus beneficios, y a realizar sus compras.",
        products: [
            { id: 1, name: 'Cacao en Polvo 100% Orgánico', description: 'Nuestro cacao en polvo puro es ideal para repostería, bebidas calientes o batidos. Sabor intenso y sin aditivos.', price: 85.00, image: 'https://images.pexels.com/photos/4109943/pexels-photo-4109943.jpeg?auto=compress&cs=tinysrgb&w=600' },
            { id: 2, name: 'Cacao Crudo Criollo x Kg', description: 'Granos de cacao criollo, la variedad más fina y aromática. Perfectos para tostar en casa o para chocolatería artesanal.', price: 50.00, image: 'https://images.pexels.com/photos/8977717/pexels-photo-8977717.jpeg?auto=compress&cs=tinysrgb&w=600' },
            { id: 3, name: 'Cacao Tostado en Grano', description: 'Granos de cacao tostados a la perfección para resaltar sus notas de sabor. Un snack energético y delicioso.', price: 70.00, image: 'https://images.pexels.com/photos/7350796/pexels-photo-7350796.jpeg?auto=compress&cs=tinysrgb&w=600' },
            { id: 4, name: 'Pasta Pura de Cacao x Kg', description: '100% cacao molido, la base para cualquier creación de chocolate. Sabor profundo y auténtico del grano.', price: 90.00, image: 'https://images.pexels.com/photos/6068997/pexels-photo-6068997.jpeg?auto=compress&cs=tinysrgb&w=600' },
            { id: 5, name: 'Nibs de Cacao Tostado', description: 'Trozos de granos de cacao tostado y pelado. Añade un toque crujiente y chocolatoso a tus desayunos y postres.', price: 90.00, image: 'https://images.pexels.com/photos/6112423/pexels-photo-6112423.jpeg?auto=compress&cs=tinysrgb&w=600' },
            { id: 6, name: 'Manjar de Cacao 150g', description: 'Deliciosa y untuosa crema de cacao artesanal, endulzada naturalmente. Perfecta para untar o disfrutar a cucharadas.', price: 15.00, image: 'https://images.pexels.com/photos/2067423/pexels-photo-2067423.jpeg?auto=compress&cs=tinysrgb&w=600' },
            { id: 7, name: 'Cascarilla de Cacao', description: 'La cáscara del grano de cacao, ideal para preparar una infusión aromática con notas a chocolate y propiedades relajantes.', price: 5.00, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Cocoa_bean_husks.jpg/640px-Cocoa_bean_husks.jpg' },
            { id: 8, name: 'Cóctel de Cacao', description: 'Exquisito licor de cacao artesanal, perfecto para disfrutar solo, en cócteles o como un toque especial en postres.', price: 50.00, image: 'https://images.pexels.com/photos/2788775/pexels-photo-2788775.jpeg?auto=compress&cs=tinysrgb&w=600' }
        ]
    },
    cafedelvalle: {
        id: 'cafedelvalle',
        name: 'Café del Valle',
        sectionTitle: 'Nuestros Orígenes',
        theme: {
            '--primary-brown': '#4E342E', '--primary-brown-light': '#D7CCC8', '--accent-gold': '#FFC107',
            '--dark-text': '#3E2723', '--light-text': '#6D4C41', '--background-color': '#FBF9F6',
            '--surface-color': '#FFFFFF', '--border-color': '#BCAAA4',
        },
        heroBanner: {
            imageUrl: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            title: 'Café del Valle',
            subtitle: 'El aroma que despierta tus sentidos.'
        },
        paymentInfo: {
            phone: '999888777', name: 'MARIA GARCIA', whatsapp: '51999888777'
        },
        chatInstruction: "Eres un barista experto de Café del Valle, una tienda de café de especialidad. Conoces todo sobre el origen, tostado y métodos de preparación. Ayuda a los clientes a elegir el café perfecto para ellos.",
        products: [
            { id: 1, name: 'Café Geisha Tostado Medio', description: 'Notas florales de jazmín, bergamota y frutos tropicales. Acidez brillante y cuerpo sedoso.', price: 95.00, image: 'https://images.pexels.com/photos/4109744/pexels-photo-4109744.jpeg?auto=compress&cs=tinysrgb&w=600' },
            { id: 2, name: 'Café Bourbon Lavado x Kg', description: 'Un clásico balanceado con notas a chocolate, caramelo y nuez. Ideal para espresso o filtrado.', price: 60.00, image: 'https://images.pexels.com/photos/3733005/pexels-photo-3733005.jpeg?auto=compress&cs=tinysrgb&w=600' },
            { id: 3, name: 'Blend de la Casa', description: 'Mezcla perfecta de granos de la región para una taza consistente y llena de sabor. Perfil achocolatado.', price: 45.00, image: 'https://images.pexels.com/photos/14831349/pexels-photo-14831349.jpeg?auto=compress&cs=tinysrgb&w=600' },
            { id: 4, name: 'Café de Origen Único (Honey)', description: 'Proceso honey que resalta el dulzor natural del grano. Notas a miel, frutos rojos y panela.', price: 75.00, image: 'https://images.pexels.com/photos/10708573/pexels-photo-10708573.jpeg?auto=compress&cs=tinysrgb&w=600' }
        ]
    }
};

const STORAGE_KEY = 'tienda_app_data';

export const getStoresData = () => {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error("Error al leer desde localStorage:", error);
    }
    // Devuelve una copia profunda para evitar mutaciones accidentales del objeto inicial
    return JSON.parse(JSON.stringify(initialStoresData));
};

export const saveStoresData = (data: any) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Error al guardar en localStorage:", error);
    }
};
