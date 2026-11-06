const productDefinitions = [
  {
    id: 'aloe', number: '01', name: 'Aloe Vera', botanical: 'Aloe vera',
    line: 'A little green.\nA little stillness.',
    description: 'The soft ivory bar. A botanical moment in shades of green.',
    color: '#47765b', light: '#dbe9dd', dark: '#183c2c',
    bar: 'Extract_oval_soap_bar_b753645c.jpg',
    photo: 'image.png_d137a370.jpg',
    box: 'Extract_square_packaging_white_b…_0621040c.jpg',
    material: 'ivory cream oval soap with rounded edges and a natural matte surface',
    setting: 'deep sage-green studio, softly blurred aloe leaves at the distant edges, soft rays of morning sunlight, satin green floor'
  },
  {
    id: 'avaram', number: '02', name: 'Avarampoo', botanical: 'Avaram flowers',
    line: 'Rooted in earth.\nTouched by gold.',
    description: 'An earthy brown bar, framed by the golden color of avaram flowers.',
    color: '#b68a2e', light: '#f1e8cb', dark: '#59421b',
    bar: 'Extracting_oval_soap_bar_eb628062.jpg',
    photo: 'image.png_87e8008f.jpg', box: 'Extract_square_packaging_47dd3ac5.jpg',
    material: 'warm earthy brown oval soap with visible dark herbal speckles and a handmade matte texture',
    setting: 'muted golden-yellow and warm-cream studio, softly blurred yellow avaram blossoms at distant edges, gentle morning sunlight, satin ochre floor'
  },
  {
    id: 'kuppaimeni', number: '03', name: 'Kuppaimeni', botanical: 'Kuppaimeni',
    line: 'A quieter kind\nof green.',
    description: 'Olive tones and visible herbal flecks. Simple, tactile, handmade.',
    color: '#62794b', light: '#e3e8d8', dark: '#293a23',
    bar: 'Extract_soap_bar_from_photo_9abdd6b3.jpg',
    photo: 'image.png_19468111.jpg', box: 'Extract_square_packaging_white_b…_ea441a22.jpg',
    material: 'muted olive-green and beige oval soap with small dark herbal flecks and a substantial handmade matte surface',
    setting: 'deep forest-green studio, softly blurred green foliage at distant edges, muted moss highlights, gentle sunlight from upper right, satin stone-green floor'
  },
  {
    id: 'orange', number: '04', name: 'Orange', botanical: 'Orange',
    line: 'A little sunshine\nin your hands.',
    description: 'A bright orange bar with a warm, sunlit character.',
    color: '#d77c32', light: '#f5dfcc', dark: '#6d371b',
    bar: 'Extracting_soap_bar_from_photo_97a20c76.jpg',
    photo: 'image.png_8b96d489.jpg', box: 'Extract_square_packaging_white_b…_83ba24c8.jpg',
    material: 'rich orange-gold oval soap with smooth natural texture, rounded edges, and substantial thickness',
    setting: 'burnt-orange to peach studio, a softly blurred orange slice and small orange-peel curl at distant edges, warm directional sunlight, satin amber floor'
  },
  {
    id: 'sandal', number: '05', name: 'Sandal', botanical: 'Sandalwood',
    line: 'Warmth,\nbeautifully simple.',
    description: 'A golden bar in an atmosphere of amber, cream, and sandalwood.',
    color: '#b47b3d', light: '#eee0cc', dark: '#654121',
    bar: 'Extracting_oval_soap_bar_27a96a0a.jpg',
    photo: 'image.png_920b76d5.jpg', box: 'Extract_square_packaging_white_b…_b8924c71.jpg',
    material: 'golden-yellow oval soap with rounded edges, substantial thickness, and a natural matte surface',
    setting: 'warm sandalwood-beige and muted amber studio, a few small pale sandalwood chips at distant lower edges, warm afternoon sunlight, satin sandstone floor'
  },
  {
    id: 'charcoal', number: '06', name: 'Charcoal', botanical: 'Charcoal',
    line: 'A deeper shade\nof everyday.',
    description: 'Charcoal gray, a matte surface, and the beauty of handmade texture.',
    color: '#5f6c63', light: '#dce2dc', dark: '#1c2924',
    bar: 'Extract_soap_bar_white_background_a8fe1fc5.jpg',
    photo: 'image.png_8bdbb59b.jpg', box: 'Charcoal_soap_packaging_box_e3acf5ef.jpg',
    material: 'charcoal-gray oval soap with fine pores, rounded edges, substantial thickness, and a handmade matte texture',
    setting: 'deep graphite studio with forest-green undertones, a few small charcoal fragments resting at distant lower edges, soft silver rim light, satin dark-stone floor'
  }
];

const chapterOrder = ['orange', 'avaram', 'charcoal', 'sandal', 'aloe', 'kuppaimeni'];
export const products = chapterOrder.map((id, index) => ({
  ...productDefinitions.find(product => product.id === id),
  number: String(index + 1).padStart(2, '0'),
  ...(id === 'sandal' ? { name: 'Sandalwood' } : {})
}));

export function videoPrompt(product) {
  return `Create an 8-second photorealistic luxury product film for Sri Kumaran Herbals ${product.name} Herbal Soap. Use the supplied individual soap photograph as the exact product reference. Preserve the product's silhouette, proportions, color and texture: ${product.material}. The scene is a ${product.setting}. One continuous studio shot. 0–2 seconds: one bar floats above the floor, diagonally tilted by 20 degrees, broad face visible, with a soft shadow below. 2–5 seconds: slowly push the camera closer while the bar turns gently through 20 degrees, revealing its thickness and natural texture. 5–7 seconds: ease the camera backward as the bar settles into a balanced nearly upright floating pose. 7–8 seconds: hold the final composition. Smooth acceleration and deceleration, restrained highlights, realistic matte material. Keep the complete bar within the central 28 percent of the landscape frame and at most 62 percent of frame height so the shot can also be cropped to portrait. Keep the upper third uncluttered for a website headline. The reference photograph guides the object only; replace its white background with the described studio. No lettering, added logos, packaging, people, hands, extra bars, shape changes, melting, sudden cuts, or fast spinning. No speech or music.`;
}
