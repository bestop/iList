function formatDate(date) {
  if (!date) return '';
  var d = new Date(date);
  var y = d.getFullYear();
  var m = (d.getMonth() + 1).toString().padStart(2, '0');
  var day = d.getDate().toString().padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function todayStr() {
  var d = new Date();
  var y = d.getFullYear();
  var m = (d.getMonth() + 1).toString().padStart(2, '0');
  var day = d.getDate().toString().padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function normalizeItem(item) {
  return {
    id: item.id,
    name: item.name || '',
    category: item.category || '其他',
    status: item.status || '待发货',
    price: parseFloat(item.price) || 0,
    qty: parseInt(item.qty, 10) || 1,
    date: item.date ? String(item.date).slice(0, 10) : '',
    shop: item.shop || '',
    note: item.note || '',
    images: Array.isArray(item.images) ? item.images : [],
    createdAt: item.created_at || item.createdAt || Date.now()
  };
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

var MOCK_ITEMS = [
  { id: 'mock1', name: '无线蓝牙耳机', category: '数码', status: '待发货', price: 299, qty: 1, date: '2026-06-18', shop: '京东', note: '降噪款', images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop&q=80', 'https://images.unsplash.com/photo-1598331668826-20cecc596b86?w=600&h=400&fit=crop&q=80'], createdAt: Date.now() },
  { id: 'mock2', name: '机械键盘', category: '数码', status: '已发货', price: 459, qty: 1, date: '2026-06-17', shop: '淘宝', note: '红轴', images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=400&fit=crop&q=80', 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&h=400&fit=crop&q=80', 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&h=400&fit=crop&q=80'], createdAt: Date.now() - 1000 },
  { id: 'mock3', name: '显示器支架', category: '家具', status: '已收货', price: 128, qty: 2, date: '2026-06-16', shop: '拼多多', note: '', images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=400&fit=crop&q=80', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&h=400&fit=crop&q=80'], createdAt: Date.now() - 2000 },
  { id: 'mock4', name: 'USB-C 扩展坞', category: '数码', status: '已完成', price: 189, qty: 1, date: '2026-06-15', shop: '京东', note: '7合1', images: ['https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&h=400&fit=crop&q=80'], createdAt: Date.now() - 3000 },
  { id: 'mock5', name: '台灯', category: '家具', status: '待发货', price: 79, qty: 1, date: '2026-06-14', shop: '', note: '护眼款', images: ['https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=400&fit=crop&q=80'], createdAt: Date.now() - 4000 }
];

function getMockItems() {
  return MOCK_ITEMS.map(normalizeItem);
}

module.exports = {
  formatDate: formatDate,
  todayStr: todayStr,
  normalizeItem: normalizeItem,
  generateId: generateId,
  getMockItems: getMockItems
};