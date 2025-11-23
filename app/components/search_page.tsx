import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- 1. CONFIGURATION ---
// (Keep this standard boilerplate to connect to your specific Firebase instance)
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 2. DATA TYPES ---
// Define exactly what your data looks like here
interface Item {
  id: string;
  title: string;
  category: string;
  price: number;
  status: 'available' | 'sold';
  // Add any other fields you have in your DB here
}

// --- 3. SUB-COMPONENT: ITEM CARD ---
// This makes the main component much cleaner. Work on your card design here.
const ItemCard = ({ item }: { item: Item }) => (
  <div className="border p-4 rounded-lg shadow-sm bg-white hover:shadow-md transition">
    <div className="flex justify-between items-center mb-2">
      <span className="bg-gray-100 text-xs px-2 py-1 rounded uppercase font-bold text-gray-600">
        {item.category}
      </span>
      <span className="text-green-700 font-bold">${item.price}</span>
    </div>
    <h3 className="text-lg font-semibold">{item.title}</h3>
    <p className="text-sm text-gray-500">Status: {item.status}</p>
  </div>
);

// --- 4. MAIN PAGE COMPONENT ---
export default function MarketplaceTemplate() {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  // A. Auth Setup (Required for Firebase Security Rules)
  useEffect(() => {
    signInAnonymously(auth);
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // B. Data Fetching
  useEffect(() => {
    if (!user) return;

    const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'items');
    
    // Real-time listener for data
    const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Item[];
      
      setItems(fetchedItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // C. Search Logic (The "Brain" of the page)
  const filteredItems = items.filter((item) => {
    // 1. If search is empty, show everything
    if (!searchText) return true;

    // 2. Clean up the inputs (lowercase trim)
    const term = searchText.toLowerCase().trim();
    const category = (item.category || '').toLowerCase();

    // 3. The Match Condition: Does category contain the search term?
    // You can extend this to: return category.includes(term) || item.title.toLowerCase().includes(term);
    return category.includes(term);
  });

  // D. Render the UI
  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Marketplace</h1>
        
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search categories (e.g. Furniture)..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full p-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Content Section */}
      {loading ? (
        <p className="text-gray-500">Loading items...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500 py-10">
              No items found matching "{searchText}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}