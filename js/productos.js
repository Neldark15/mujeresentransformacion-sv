// ====================================================
// Catálogo de productos MET
// Estructura lista para que el cliente reemplace con sus
// productos reales (imágenes, precios, descripciones).
//
// Cada producto soporta:
//  - múltiples imágenes (galería)
//  - variantes (color, tamaño, edición)
//  - categoría, etiquetas, badge ("NUEVO", "OFERTA")
//  - relacionados (ids)
// ====================================================

export const CATEGORIAS = [
  { slug: 'cuadernos',  label: 'Cuadernos' },
  { slug: 'papeleria',  label: 'Papelería' },
  { slug: 'apparel',    label: 'Apparel' },
  { slug: 'accesorios', label: 'Accesorios' },
  { slug: 'digital',    label: 'Digital' }
];

// Helper para generar imágenes placeholder con la portada
const cuadernoPortada = 'images/cuaderno-portada.png';
const cuadernoWebp    = 'images/cuaderno-portada.webp';

export const PRODUCTOS = [
  {
    id: 'cuaderno-suenos',
    sku: 'CMS-MET-001',
    nombre: 'Cuaderno de mis Sueños',
    categoria: 'cuadernos',
    precio: 25.00,
    precioAntes: null,
    badge: 'MÁS VENDIDO',
    descripcionCorta: 'Tu herramienta para organizar metas, dones y agradecimiento con propósito.',
    descripcion: `El Cuaderno de mis Sueños es un espacio sagrado diseñado para acompañarte en tu camino de transformación. Con más de 50 páginas guiadas, te ayuda a definir tus metas espirituales, profesionales y financieras, reconocer tus dones, cultivar la gratitud y dar pasos concretos hacia la vida que Dios diseñó para ti.

Incluye carta de decreto, ejercicios de visualización, sección de dones y talentos, diario de agradecimiento y páginas para trabajar tus sueños cada día.`,
    caracteristicas: [
      'Más de 50 páginas de contenido guiado',
      'Carta de decreto personal',
      'Sección de dones y talentos',
      'Ejercicios de visualización',
      'Diario de agradecimiento',
      'Tapa dura, encuadernación premium'
    ],
    imagenes: [
      { src: cuadernoPortada, webp: cuadernoWebp, alt: 'Cuaderno de mis Sueños - Portada' },
      { src: 'images/cuaderno-pagina-1.png', webp: 'images/cuaderno-pagina-1.webp', alt: 'Página de Trabajo Diario' },
      { src: 'images/cuaderno-pagina-2.png', webp: 'images/cuaderno-pagina-2.webp', alt: 'Página de Agradecimiento' },
      { src: 'images/cuaderno-pagina-3.png', webp: 'images/cuaderno-pagina-3.webp', alt: 'Página de Dones y Talentos' }
    ],
    variantes: null,
    stock: 50,
    etiquetas: ['fe', 'metas', 'visualización'],
    relacionados: ['cuaderno-mini', 'set-plumas', 'devocional-pdf']
  },
  {
    id: 'cuaderno-mini',
    sku: 'CMM-MET-002',
    nombre: 'Cuaderno Mini de Bolsillo',
    categoria: 'cuadernos',
    precio: 12.00,
    precioAntes: null,
    badge: 'NUEVO',
    descripcionCorta: 'Versión compacta para llevar tus sueños a todas partes.',
    descripcion: `Una versión de bolsillo de nuestro Cuaderno de mis Sueños, diseñada para acompañarte en cualquier momento del día. Perfecto para anotar inspiraciones, oraciones espontáneas y notas de agradecimiento sobre la marcha.

[Pendiente confirmar dimensiones y contenido específico con el cliente.]`,
    caracteristicas: [
      'Formato bolsillo (10 × 14 cm aprox.)',
      'Tapa flexible resistente',
      'Espiral metálico',
      'Páginas con líneas y de agradecimiento'
    ],
    imagenes: [
      { src: cuadernoPortada, webp: cuadernoWebp, alt: 'Cuaderno Mini' }
    ],
    variantes: {
      tipo: 'color',
      label: 'Color',
      opciones: [
        { id: 'morado', label: 'Morado', color: '#6b3fa0' },
        { id: 'rosa',   label: 'Rosa',   color: '#e89aae' },
        { id: 'menta',  label: 'Menta',  color: '#9fcdb8' }
      ]
    },
    stock: 30,
    etiquetas: ['portable', 'regalo'],
    relacionados: ['cuaderno-suenos', 'set-plumas', 'sticker-pack']
  },
  {
    id: 'set-plumas',
    sku: 'PLM-MET-003',
    nombre: 'Set de Plumas Pasteles',
    categoria: 'papeleria',
    precio: 8.50,
    precioAntes: 10.00,
    badge: 'OFERTA',
    descripcionCorta: 'Set de 6 plumas en tonos pasteles para escribir tus sueños con color.',
    descripcion: 'Set de 6 plumas en colores pasteles cuidadosamente seleccionados para hacer que cada página de tu cuaderno cobre vida. Tinta de secado rápido y trazo suave. [Especificaciones técnicas a confirmar con el cliente.]',
    caracteristicas: [
      '6 colores pasteles',
      'Tinta de secado rápido',
      'Punta de 0.7 mm',
      'Diseño ergonómico'
    ],
    imagenes: [
      { src: cuadernoPortada, webp: cuadernoWebp, alt: 'Set de Plumas' }
    ],
    variantes: null,
    stock: 80,
    etiquetas: ['papelería', 'color', 'regalo'],
    relacionados: ['cuaderno-suenos', 'cuaderno-mini', 'sticker-pack']
  },
  {
    id: 'sticker-pack',
    sku: 'STK-MET-004',
    nombre: 'Sticker Pack Mariposa MET',
    categoria: 'papeleria',
    precio: 5.00,
    precioAntes: null,
    badge: null,
    descripcionCorta: '12 stickers con el símbolo mariposa de MET y frases de transformación.',
    descripcion: 'Pack de 12 stickers vinilos resistentes al agua con la mariposa MET y frases inspiradoras. Perfectos para personalizar tu cuaderno, laptop, agenda o botella de agua.',
    caracteristicas: [
      '12 stickers vinilo',
      'Resistentes al agua',
      'Frases inspiradoras',
      'Diseños exclusivos MET'
    ],
    imagenes: [
      { src: 'images/icono-blanco.png', webp: 'images/icono-blanco.webp', alt: 'Sticker Pack' }
    ],
    variantes: null,
    stock: 100,
    etiquetas: ['regalo', 'mariposa'],
    relacionados: ['cuaderno-mini', 'set-plumas', 'taza-met']
  },
  {
    id: 'taza-met',
    sku: 'TAZ-MET-005',
    nombre: 'Taza MET "Soy Grandiosa"',
    categoria: 'accesorios',
    precio: 14.00,
    precioAntes: null,
    badge: null,
    descripcionCorta: 'Empieza el día con una declaración. Taza cerámica de 11 oz.',
    descripcion: 'Taza de cerámica blanca de 11 oz con el diseño exclusivo "Soy Grandiosa" de MET. El recordatorio diario para empezar tu mañana decretando quién eres. [Color y diseño a confirmar con el cliente.]',
    caracteristicas: [
      'Cerámica de alta calidad',
      'Capacidad 11 oz / 325 ml',
      'Diseño en ambos lados',
      'Apta para microondas y lavavajillas'
    ],
    imagenes: [
      { src: cuadernoPortada, webp: cuadernoWebp, alt: 'Taza MET' }
    ],
    variantes: {
      tipo: 'color',
      label: 'Color',
      opciones: [
        { id: 'blanco', label: 'Blanco', color: '#f8f5f1' },
        { id: 'morado', label: 'Morado', color: '#6b3fa0' }
      ]
    },
    stock: 40,
    etiquetas: ['regalo', 'cocina', 'morning'],
    relacionados: ['camiseta-met', 'bolsa-tote', 'cuaderno-suenos']
  },
  {
    id: 'camiseta-met',
    sku: 'CAM-MET-006',
    nombre: 'Camiseta "Mujer en Transformación"',
    categoria: 'apparel',
    precio: 22.00,
    precioAntes: null,
    badge: 'NUEVO',
    descripcionCorta: 'Camiseta unisex 100% algodón con la mariposa MET bordada.',
    descripcion: 'Camiseta unisex de algodón premium con la mariposa MET bordada al frente. Diseño limpio y cómodo para usar todos los días. [Material y tallas a confirmar con el cliente.]',
    caracteristicas: [
      '100% algodón peinado',
      'Mariposa MET bordada',
      'Corte unisex relajado',
      'Lavable a máquina'
    ],
    imagenes: [
      { src: 'images/logo-morado.png', webp: 'images/logo-morado.webp', alt: 'Camiseta MET' }
    ],
    variantes: {
      tipo: 'talla',
      label: 'Talla',
      opciones: [
        { id: 'XS', label: 'XS' },
        { id: 'S',  label: 'S'  },
        { id: 'M',  label: 'M'  },
        { id: 'L',  label: 'L'  },
        { id: 'XL', label: 'XL' }
      ]
    },
    stock: 25,
    etiquetas: ['apparel', 'mariposa', 'lifestyle'],
    relacionados: ['bolsa-tote', 'taza-met', 'sticker-pack']
  },
  {
    id: 'bolsa-tote',
    sku: 'BLS-MET-007',
    nombre: 'Tote Bag Mariposa MET',
    categoria: 'accesorios',
    precio: 16.00,
    precioAntes: null,
    badge: null,
    descripcionCorta: 'Bolsa tote de lona orgánica con estampado mariposa MET.',
    descripcion: 'Tote bag de lona orgánica estampada con la mariposa MET. Espaciosa, resistente y perfecta para llevar tu cuaderno, libros o lo que necesites en tu día. [Dimensiones a confirmar.]',
    caracteristicas: [
      'Lona orgánica gruesa',
      'Asas reforzadas',
      'Bolsillo interior',
      'Capacidad amplia'
    ],
    imagenes: [
      { src: 'images/logo-morado.png', webp: 'images/logo-morado.webp', alt: 'Tote Bag MET' }
    ],
    variantes: null,
    stock: 35,
    etiquetas: ['eco', 'lifestyle'],
    relacionados: ['camiseta-met', 'taza-met', 'cuaderno-suenos']
  },
  {
    id: 'devocional-pdf',
    sku: 'DEV-MET-008',
    nombre: 'Devocional Digital "30 días con Fe"',
    categoria: 'digital',
    precio: 7.00,
    precioAntes: null,
    badge: 'DIGITAL',
    descripcionCorta: '30 días de reflexiones, oraciones y ejercicios prácticos en PDF.',
    descripcion: '30 días de reflexiones diarias acompañadas de un versículo bíblico, una oración y un ejercicio práctico para profundizar tu camino de fe y transformación. Descarga inmediata después del pago. [Contenido a confirmar con el cliente.]',
    caracteristicas: [
      '30 reflexiones diarias',
      'Versículos bíblicos seleccionados',
      'Ejercicios prácticos',
      'PDF imprimible, alta resolución',
      'Acceso inmediato tras el pago'
    ],
    imagenes: [
      { src: 'images/icono-blanco.png', webp: 'images/icono-blanco.webp', alt: 'Devocional Digital' }
    ],
    variantes: null,
    stock: 9999,
    digital: true,
    etiquetas: ['fe', 'devocional', 'digital', 'descarga'],
    relacionados: ['cuaderno-suenos', 'cuaderno-mini', 'sticker-pack']
  }
];

// Helpers
export function getProductoById(id) {
  return PRODUCTOS.find(p => p.id === id);
}
export function getRelacionados(producto, limit = 3) {
  if (!producto?.relacionados) return [];
  return producto.relacionados
    .map(id => getProductoById(id))
    .filter(Boolean)
    .slice(0, limit);
}
export function getPorCategoria(slug) {
  if (!slug || slug === 'todos') return PRODUCTOS;
  return PRODUCTOS.filter(p => p.categoria === slug);
}
