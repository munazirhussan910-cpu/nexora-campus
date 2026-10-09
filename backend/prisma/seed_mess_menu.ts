import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const weeklyMenuTemplate = [
  {
    day: 'MONDAY',
    meals: [
      {
        meal: 'BREAKFAST',
        timings: '07:30 AM – 09:30 AM',
        items: 'Steamed Idli, Medu Vada, Vegetable Sambar, Fresh Coconut Chutney, Tea & Coffee',
        specialNotes: 'Fresh fruit (Banana) available on request',
      },
      {
        meal: 'LUNCH',
        timings: '12:30 PM – 02:30 PM',
        items: 'Basmati Rice, Yellow Dal Tadka, Aloo Gobhi Matar, Mixed Sprout Salad, Roasted Papad, Sweet Curd',
        specialNotes: 'Low-oil preparation for lentils and vegetable curry',
      },
      {
        meal: 'DINNER',
        timings: '07:30 PM – 09:30 PM',
        items: 'Butter Phulka Roti, Paneer Butter Masala, Fragrant Jeera Rice, Dal Fry, Fresh Onion Rings, Hot Gulab Jamun',
        specialNotes: 'Sweet dish served with dinner',
      },
    ],
  },
  {
    day: 'TUESDAY',
    meals: [
      {
        meal: 'BREAKFAST',
        timings: '07:30 AM – 09:30 AM',
        items: 'Stuffed Aloo Paratha, Fresh Curd, Mixed Pickle, Homemade Mint Chutney, Butter, Ginger Tea & Coffee',
        specialNotes: 'Boiled egg or extra curd available',
      },
      {
        meal: 'LUNCH',
        timings: '12:30 PM – 02:30 PM',
        items: 'Steamed Rice, Punjabi Rajma Masala, Crispy Bhindi Do Pyaza, Boondi Raita, Green Salad, Lemon Wedge',
        specialNotes: 'North Indian special menu',
      },
      {
        meal: 'DINNER',
        timings: '07:30 PM – 09:30 PM',
        items: 'Tandoori Roti, Kadai Paneer, Kashmiri Pulao, Moong Dal Tadka, Cucumber Tomato Salad, Vanilla Ice Cream',
        specialNotes: 'Ice cream cup with dinner',
      },
    ],
  },
  {
    day: 'WEDNESDAY',
    meals: [
      {
        meal: 'BREAKFAST',
        timings: '07:30 AM – 09:30 AM',
        items: 'Indori Poha with Roasted Peanuts & Sev, Crispy Jalebi, Boiled Moong Sprouts, Masala Chai & Filter Coffee',
        specialNotes: 'Warm jalebi freshly served',
      },
      {
        meal: 'LUNCH',
        timings: '12:30 PM – 02:30 PM',
        items: 'Jeera Rice, Amritsari Chana Masala, Aloo Jeera Roast, Mix Vegetable Raita, Mango Pickle, Crispy Papad',
        specialNotes: 'High-protein legume lunch',
      },
      {
        meal: 'DINNER',
        timings: '07:30 PM – 09:30 PM',
        items: 'Butter Naan & Tawa Roti, Creamy Dal Makhani, Shahi Paneer, Steamed Peas Pulao, Green Salad, Rice Kheer',
        specialNotes: 'Special festive dinner spread',
      },
    ],
  },
  {
    day: 'THURSDAY',
    meals: [
      {
        meal: 'BREAKFAST',
        timings: '07:30 AM – 09:30 AM',
        items: 'Crispy Masala Dosa with Potato Filling, Sambar, Tomato Onion Chutney, Fresh Papaya Slices, Tea & Coffee',
        specialNotes: 'Dosas made live on hot griddles',
      },
      {
        meal: 'LUNCH',
        timings: '12:30 PM – 02:30 PM',
        items: 'Steamed Rice, Chana Dal with Lauki, Smoked Baingan Bharta, Tomato Onion Raita, Roasted Papad, Seasonal Salad',
        specialNotes: 'Traditional comfort homestyle meal',
      },
      {
        meal: 'DINNER',
        timings: '07:30 PM – 09:30 PM',
        items: 'Fresh Chapati, Matar Mushroom Masala, Vegetable Dum Biryani, Mirchi Salan, Raita, Fruit Custard with Jelly',
        specialNotes: 'Paneer alternative available for mushroom',
      },
    ],
  },
  {
    day: 'FRIDAY',
    meals: [
      {
        meal: 'BREAKFAST',
        timings: '07:30 AM – 09:30 AM',
        items: 'Fluffy Puri with Bedmi Aloo Sabji, Sooji Sheera / Halwa, Mixed Pickle, Boiled Eggs / Banana, Tea & Coffee',
        specialNotes: 'Egg counter active 07:30 AM - 09:30 AM',
      },
      {
        meal: 'LUNCH',
        timings: '12:30 PM – 02:30 PM',
        items: 'Steamed Rice, Gujarati Kadhi with Pakora, Dry Aloo Methi, Beetroot Carrot Salad, Masala Papad, Plain Curd',
        specialNotes: 'Digestive hing kadhi recipe',
      },
      {
        meal: 'DINNER',
        timings: '07:30 PM – 09:30 PM',
        items: 'Tawa Paratha, Egg Curry (2 eggs) OR Paneer Lababdar, Steamed Rice, Toor Dal, Spiced Sirka Onion, Bengali Rasgulla',
        specialNotes: 'Choice of Egg Curry or Paneer Lababdar',
      },
    ],
  },
  {
    day: 'SATURDAY',
    meals: [
      {
        meal: 'BREAKFAST',
        timings: '07:30 AM – 09:30 AM',
        items: 'Rava Vegetable Upma, Coconut Peanut Chutney, Vegetable Stew, Seasonal Banana, Cardamom Tea & Coffee',
        specialNotes: 'South Indian morning tiffin',
      },
      {
        meal: 'LUNCH',
        timings: '12:30 PM – 02:30 PM',
        items: 'Lemon Rice & Plain Rice, Tomato Rasam, Cabbage Beans Poriyal, Curd Rice with Tadka, Potato Wafers, Lime Pickle',
        specialNotes: 'Cooling curd rice served chilled',
      },
      {
        meal: 'DINNER',
        timings: '07:30 PM – 09:30 PM',
        items: 'Tandoori Roti, Soya Chaap Tikka Masala, Vegetable Hakka Noodles / Fried Rice, Veg Manchurian, Gajar Halwa',
        specialNotes: 'Fusion weekend dinner',
      },
    ],
  },
  {
    day: 'SUNDAY',
    meals: [
      {
        meal: 'BREAKFAST',
        timings: '08:00 AM – 10:00 AM',
        items: 'Delhi Style Chole Bhature (2 pcs), Sweet Lassi in Kulhad, Pickled Green Chillies & Onions, Fresh Mint Chutney',
        specialNotes: 'Extended Sunday morning breakfast timing (08:00 AM - 10:00 AM)',
      },
      {
        meal: 'LUNCH',
        timings: '12:30 PM – 02:30 PM',
        items: 'Hyderabadi Veg Dum Biryani, Paneer Tikka / Boiled Eggs, Mirchi Ka Salan, Onion Cucumber Raita, Cold Drink / Lassi',
        specialNotes: 'Sunday Grand Feast lunch',
      },
      {
        meal: 'DINNER',
        timings: '07:30 PM – 09:30 PM',
        items: 'Butter Garlic Naan / Tawa Phulka, Malai Kofta, Yellow Dal Tadka, Steamed Jeera Rice, Fresh Salad, Warm Moong Dal Halwa',
        specialNotes: 'Weekend finale dessert served hot',
      },
    ],
  },
];

export async function seedMessMenu() {
  console.log('🍽️ Seeding Hostel Mess Menus...');

  const blocks = await prisma.hostelBlock.findMany();
  const warden = await prisma.user.findFirst({
    where: { role: { name: 'WARDEN' } },
  });

  const updaterId = warden ? warden.id : null;

  for (const block of blocks) {
    console.log(`  Populating weekly menu for ${block.name}...`);
    for (const dayEntry of weeklyMenuTemplate) {
      for (const mealEntry of dayEntry.meals) {
        await prisma.messMenu.upsert({
          where: {
            hostelBlockId_day_meal: {
              hostelBlockId: block.id,
              day: dayEntry.day,
              meal: mealEntry.meal,
            },
          },
          update: {
            items: mealEntry.items,
            timings: mealEntry.timings,
            specialNotes: mealEntry.specialNotes,
            updatedBy: updaterId,
          },
          create: {
            hostelBlockId: block.id,
            day: dayEntry.day,
            meal: mealEntry.meal,
            items: mealEntry.items,
            timings: mealEntry.timings,
            specialNotes: mealEntry.specialNotes,
            updatedBy: updaterId,
          },
        });
      }
    }
  }

  console.log('✅ Hostel Mess Menus seeded successfully.');
}

if (require.main === module) {
  seedMessMenu()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
