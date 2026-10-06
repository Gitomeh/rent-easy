export type Property = {
  id: string
  name: string
  location: string
  county: string
  rent: number
  deposit: number
  bedrooms: number
  bathrooms: number
  type: string
  availability: string
  description: string
  image: string
  amenities: string[]
  size: string
}

// Illustrative listings for the frontend preview only. Availability is not confirmed.
export const properties: Property[] = [
  { id: "nakuru-courtyard-2b", name: "The Courtyard Residence", location: "Milimani, Nakuru", county: "Nakuru", rent: 25000, deposit: 25000, bedrooms: 2, bathrooms: 2, type: "Apartment", availability: "Available now", description: "A bright, well-planned home with generous natural light, a private balcony and convenient access to Nakuru town.", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85", amenities: ["Secure parking", "Reliable water", "Balcony", "Perimeter security"], size: "2 bedroom" },
  { id: "naivasha-garden-1b", name: "Garden Court Apartment", location: "Kenyatta Avenue, Naivasha", county: "Nakuru", rent: 15000, deposit: 15000, bedrooms: 1, bathrooms: 1, type: "Apartment", availability: "Available now", description: "A comfortable one-bedroom apartment in a quiet, landscaped compound with easy access to local shops and transport.", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85", amenities: ["Shared garden", "Water storage", "Security", "Laundry area"], size: "1 bedroom" },
  { id: "nakuru-sunrise-studio", name: "Sunrise Studio Homes", location: "Section 58, Nakuru", county: "Nakuru", rent: 9000, deposit: 9000, bedrooms: 0, bathrooms: 1, type: "Bedsitter", availability: "Available now", description: "An efficient studio layout designed for easy living, with a practical kitchenette and secure access.", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=85", amenities: ["Water storage", "Secure access", "Kitchenette", "Parking available"], size: "Bedsitter" },
  { id: "nairobi-kilimani-2b", name: "Acacia House", location: "Kilimani, Nairobi", county: "Nairobi", rent: 48000, deposit: 48000, bedrooms: 2, bathrooms: 2, type: "Apartment", availability: "Available now", description: "A contemporary apartment with a considered open-plan living space and quick connections to everyday city conveniences.", image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85", amenities: ["Lift access", "Parking", "Balcony", "CCTV"], size: "2 bedroom" },
  { id: "nyandarua-olkalou-home", name: "Pineview Family Home", location: "Ol Kalou, Nyandarua", county: "Nyandarua", rent: 32000, deposit: 32000, bedrooms: 3, bathrooms: 2, type: "House", availability: "Available now", description: "A welcoming family home with outdoor space, a practical kitchen and room to settle in comfortably.", image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85", amenities: ["Garden", "Parking", "Water storage", "Laundry area"], size: "3 bedroom" },
  { id: "eldoret-riverside-1b", name: "Riverside One", location: "Elgon View, Eldoret", county: "Uasin Gishu", rent: 18000, deposit: 18000, bedrooms: 1, bathrooms: 1, type: "Apartment", availability: "Coming soon", description: "A fresh and functional one-bedroom home in a calm residential neighbourhood near everyday services.", image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85", amenities: ["Secure entry", "Water storage", "Parking", "Internet ready"], size: "1 bedroom" },
]

export function formatKES(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE")}`
}

export function getProperty(id: string) {
  return properties.find((property) => property.id === id) ?? properties[0]
}

export const propertyGallery = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=90",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=85",
]

export const faqs = [
  ["What is Rent Easy?", "Rent Easy is a rental and property management platform designed to connect tenants with available properties and help property owners manage rentals."],
  ["How do I find a house?", "Use the property search to browse illustrative listings and view their details. Confirm actual availability with Rent Easy before making a decision."],
  ["How much is the tenancy agreement fee?", "The tenancy agreement fee is KSh 1,000."],
  ["Can landlords list their properties?", "Yes. Property owners can submit their properties for review and listing."],
  ["Can I apply online?", "The platform is designed to support online rental applications. Application forms in this preview are not submitted to a live service."],
  ["Can I pay rent online?", "Online and M-Pesa payment functionality will be integrated into the full platform."],
  ["Can tenants report maintenance problems?", "The planned tenant portal will allow tenants to submit and track maintenance requests."],
  ["Can landlords view rental income?", "The planned landlord portal will provide rental income, expenses, statements and property information."],
] as const
export const navLinks = [
  ["Home", "/"], ["Find a House", "/properties"], ["List Your Property", "/list-property"], ["How It Works", "/#how-it-works"], ["About Us", "/#about"], ["Contact", "/contact"],
] as const
export const imageAlt = "Illustrative residential property image for Rent Easy's frontend preview"
