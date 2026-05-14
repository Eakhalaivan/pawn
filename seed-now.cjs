// Quick script to seed the database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rieyzldbygsgfiwhfdmo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZXl6bGRieWdzZ2Zpd2hmZG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjc1MjYsImV4cCI6MjA4Mjc0MzUyNn0.Tr8GnAYZxjiqO_SJqpMKDOWswMFEt4ksc24ujgbrcpg';

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleJewelryItems = [
  {
    name: "Diamond Engagement Ring",
    description: "Stunning 1.5 carat diamond ring set in 18k white gold",
    price: 8500.00,
    category: "rings",
    image_url: "https://images.unsplash.com/photo-1596944924619-5e4835177b6c?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Gold Tennis Bracelet",
    description: "Elegant 14k gold bracelet with perfect round diamonds",
    price: 4200.00,
    category: "bracelets",
    image_url: "https://images.unsplash.com/photo-1608701195398-4adbb5a0c6c2?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Pearl Necklace",
    description: "Classic strand of genuine South Sea pearls",
    price: 3200.00,
    category: "necklaces",
    image_url: "https://images.unsplash.com/photo-1596944924619-5e4835177b6c?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Sapphire Earrings",
    description: "Royal blue sapphires surrounded by diamonds in 18k gold",
    price: 2800.00,
    category: "earrings",
    image_url: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Rose Gold Watch",
    description: "Luxury timepiece with leather strap and mother-of-pearl dial",
    price: 5500.00,
    category: "watches",
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Platinum Wedding Band",
    description: "Simple and elegant platinum band for timeless commitment",
    price: 1800.00,
    category: "rings",
    image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Emerald Pendant",
    description: "Vibrant Colombian emerald in diamond halo setting",
    price: 3900.00,
    category: "pendants",
    image_url: "https://images.unsplash.com/photo-1596944924619-5e4835177b6c?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Silver Chain",
    description: "Sterling silver chain with contemporary design",
    price: 450.00,
    category: "chains",
    image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80"
  }
];

async function seedDatabase() {
  console.log('Adding sample jewelry items...');

  for (const item of sampleJewelryItems) {
    try {
      const { error } = await supabase
        .from('jewelry_items')
        .insert(item);

      if (error) {
        console.error('Error inserting item:', error);
      } else {
        console.log(`✅ Added: ${item.name}`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  console.log('🎉 Seeding completed! Refresh your browser to see the jewelry items.');
}

seedDatabase();
