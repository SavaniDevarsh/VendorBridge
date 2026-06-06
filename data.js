/* ============================================
   VendorBridge — Mock Data Store
   ============================================ */

const AppData = {
  currentUser: null,

  vendors: [
    { id: 'V-001', name: 'Apex Industrial Supplies', contact: 'Rajesh Kumar', email: 'rajesh@apexindustrial.com', phone: '+91 98765 43210', gst: '29AABCU9603R1ZM', category: 'Raw Materials', status: 'active', address: '45 Industrial Area Phase II, Bangalore', rating: 4.5, totalOrders: 34 },
    { id: 'V-002', name: 'TechVista Components', contact: 'Priya Sharma', email: 'priya@techvista.in', phone: '+91 87654 32109', gst: '27AADCT3518J1ZS', category: 'Electronics', status: 'active', address: '12 Tech Park, Hyderabad', rating: 4.8, totalOrders: 22 },
    { id: 'V-003', name: 'GreenField Packaging', contact: 'Amit Patel', email: 'amit@greenfieldpkg.com', phone: '+91 76543 21098', gst: '24AABCG7891K1ZL', category: 'Packaging', status: 'active', address: '78 GIDC Estate, Ahmedabad', rating: 4.2, totalOrders: 18 },
    { id: 'V-004', name: 'SteelCraft Industries', contact: 'Deepak Joshi', email: 'deepak@steelcraft.co', phone: '+91 65432 10987', gst: '33AABCS4521P1ZK', category: 'Raw Materials', status: 'inactive', address: '56 Steel Complex, Chennai', rating: 3.9, totalOrders: 12 },
    { id: 'V-005', name: 'Bharat Logistics Corp', contact: 'Sunita Verma', email: 'sunita@bharatlog.in', phone: '+91 54321 09876', gst: '06AABCB6723M1ZN', category: 'Logistics', status: 'active', address: '23 Cargo Hub, Gurgaon', rating: 4.6, totalOrders: 45 },
    { id: 'V-006', name: 'Quantum Chemicals Ltd', contact: 'Vikram Singh', email: 'vikram@quantumchem.com', phone: '+91 43210 98765', gst: '19AABCQ2345N1ZP', category: 'Chemicals', status: 'active', address: '89 Chemical Zone, Kolkata', rating: 4.0, totalOrders: 15 },
    { id: 'V-007', name: 'Pacific Tools & Hardware', contact: 'Meena Reddy', email: 'meena@pacifictools.in', phone: '+91 32109 87654', gst: '36AABCP7890Q1ZR', category: 'Tools & Equipment', status: 'pending', address: '34 Tool Street, Pune', rating: 4.3, totalOrders: 8 },
  ],

  rfqs: [
    { id: 'RFQ-2026-001', title: 'Q3 Steel Bar Procurement', products: [{ name: 'TMT Steel Bar 12mm', qty: 500, unit: 'Tons' }, { name: 'MS Flat Bar 25mm', qty: 200, unit: 'Tons' }], deadline: '2026-06-20', status: 'active', vendors: ['V-001', 'V-004'], createdAt: '2026-06-01', createdBy: 'Procurement Officer' },
    { id: 'RFQ-2026-002', title: 'Office Electronics Refresh', products: [{ name: 'Industrial Monitor 24"', qty: 50, unit: 'Units' }, { name: 'USB-C Docking Station', qty: 50, unit: 'Units' }], deadline: '2026-06-15', status: 'active', vendors: ['V-002'], createdAt: '2026-06-02', createdBy: 'Procurement Officer' },
    { id: 'RFQ-2026-003', title: 'Packaging Material Q3', products: [{ name: 'Corrugated Box 18x12x8', qty: 10000, unit: 'Units' }, { name: 'Bubble Wrap Roll 500m', qty: 100, unit: 'Rolls' }], deadline: '2026-06-25', status: 'draft', vendors: ['V-003'], createdAt: '2026-06-03', createdBy: 'Procurement Officer' },
    { id: 'RFQ-2026-004', title: 'Chemical Solvents Replenishment', products: [{ name: 'Acetone Industrial Grade', qty: 200, unit: 'Liters' }, { name: 'Isopropyl Alcohol 99%', qty: 500, unit: 'Liters' }], deadline: '2026-07-01', status: 'sent', vendors: ['V-006'], createdAt: '2026-06-04', createdBy: 'Admin' },
  ],

  quotations: [
    {
      rfqId: 'RFQ-2026-001',
      rfqTitle: 'Q3 Steel Bar Procurement',
      quotes: [
        { vendorId: 'V-001', vendorName: 'Apex Industrial Supplies', unitPrice: 48500, deliveryDays: 14, warranty: '12 months', paymentTerms: 'Net 30', totalAmount: 33950000, submittedAt: '2026-06-05' },
        { vendorId: 'V-004', vendorName: 'SteelCraft Industries', unitPrice: 46200, deliveryDays: 21, warranty: '6 months', paymentTerms: 'Net 45', totalAmount: 32340000, submittedAt: '2026-06-06' },
      ]
    },
    {
      rfqId: 'RFQ-2026-002',
      rfqTitle: 'Office Electronics Refresh',
      quotes: [
        { vendorId: 'V-002', vendorName: 'TechVista Components', unitPrice: 18900, deliveryDays: 7, warranty: '24 months', paymentTerms: 'Net 15', totalAmount: 945000, submittedAt: '2026-06-04' },
      ]
    }
  ],

  approvals: [
    { id: 'APR-001', type: 'Purchase Order', reference: 'PO-2026-001', title: 'Steel Bar Order — Apex Industrial', amount: 33950000, requestedBy: 'Rajesh Kumar', requestedAt: '2026-06-04', status: 'pending', remarks: '' },
    { id: 'APR-002', type: 'RFQ', reference: 'RFQ-2026-003', title: 'Packaging Material Q3 — Draft Review', amount: null, requestedBy: 'Priya Sharma', requestedAt: '2026-06-03', status: 'pending', remarks: '' },
    { id: 'APR-003', type: 'Vendor Registration', reference: 'V-007', title: 'Pacific Tools & Hardware — New Vendor', amount: null, requestedBy: 'Amit Patel', requestedAt: '2026-06-02', status: 'pending', remarks: '' },
    { id: 'APR-004', type: 'Purchase Order', reference: 'PO-2026-002', title: 'Electronics Refresh — TechVista', amount: 945000, requestedBy: 'Sunita Verma', requestedAt: '2026-06-01', status: 'approved', remarks: 'Approved for Q3 budget allocation.' },
    { id: 'APR-005', type: 'Invoice', reference: 'INV-2026-001', title: 'Q2 Steel Delivery — SteelCraft', amount: 1850000, requestedBy: 'Deepak Joshi', requestedAt: '2026-05-28', status: 'rejected', remarks: 'Invoice amount does not match PO. Please revise.' },
  ],

  purchaseOrders: [
    { id: 'PO-2026-001', vendor: 'Apex Industrial Supplies', vendorId: 'V-001', date: '2026-06-05', status: 'pending', items: [{ name: 'TMT Steel Bar 12mm', qty: 500, unit: 'Tons', rate: 48500, amount: 24250000 }, { name: 'MS Flat Bar 25mm', qty: 200, unit: 'Tons', rate: 48500, amount: 9700000 }], subtotal: 33950000, tax: 6111000, total: 40061000 },
    { id: 'PO-2026-002', vendor: 'TechVista Components', vendorId: 'V-002', date: '2026-06-04', status: 'approved', items: [{ name: 'Industrial Monitor 24"', qty: 50, unit: 'Units', rate: 12500, amount: 625000 }, { name: 'USB-C Docking Station', qty: 50, unit: 'Units', rate: 6400, amount: 320000 }], subtotal: 945000, tax: 170100, total: 1115100 },
    { id: 'PO-2026-003', vendor: 'GreenField Packaging', vendorId: 'V-003', date: '2026-06-01', status: 'approved', items: [{ name: 'Corrugated Box 18x12x8', qty: 10000, unit: 'Units', rate: 35, amount: 350000 }, { name: 'Bubble Wrap Roll 500m', qty: 100, unit: 'Rolls', rate: 1200, amount: 120000 }], subtotal: 470000, tax: 84600, total: 554600 },
  ],

  invoices: [
    { id: 'INV-2026-001', poId: 'PO-2026-002', vendor: 'TechVista Components', vendorId: 'V-002', date: '2026-06-06', dueDate: '2026-06-21', status: 'paid', items: [{ name: 'Industrial Monitor 24"', qty: 50, unit: 'Units', rate: 12500, amount: 625000 }, { name: 'USB-C Docking Station', qty: 50, unit: 'Units', rate: 6400, amount: 320000 }], subtotal: 945000, tax: 170100, total: 1115100 },
    { id: 'INV-2026-002', poId: 'PO-2026-003', vendor: 'GreenField Packaging', vendorId: 'V-003', date: '2026-06-05', dueDate: '2026-06-20', status: 'pending', items: [{ name: 'Corrugated Box 18x12x8', qty: 10000, unit: 'Units', rate: 35, amount: 350000 }, { name: 'Bubble Wrap Roll 500m', qty: 100, unit: 'Rolls', rate: 1200, amount: 120000 }], subtotal: 470000, tax: 84600, total: 554600 },
    { id: 'INV-2026-003', poId: 'PO-2026-001', vendor: 'Apex Industrial Supplies', vendorId: 'V-001', date: '2026-06-04', dueDate: '2026-07-04', status: 'overdue', items: [{ name: 'TMT Steel Bar 12mm', qty: 500, unit: 'Tons', rate: 48500, amount: 24250000 }], subtotal: 24250000, tax: 4365000, total: 28615000 },
  ],

  activityLog: [
    { id: 1, type: 'create', icon: 'add_circle', user: 'Priya Sharma', action: 'created RFQ', target: 'RFQ-2026-004 — Chemical Solvents Replenishment', time: '2026-06-06 09:15' },
    { id: 2, type: 'approve', icon: 'check_circle', user: 'Manager', action: 'approved Purchase Order', target: 'PO-2026-002 — TechVista Components', time: '2026-06-06 08:45' },
    { id: 3, type: 'create', icon: 'add_circle', user: 'Rajesh Kumar', action: 'generated Invoice', target: 'INV-2026-001 from PO-2026-002', time: '2026-06-06 08:30' },
    { id: 4, type: 'update', icon: 'edit', user: 'Amit Patel', action: 'submitted quotation for', target: 'RFQ-2026-001 — Q3 Steel Bar Procurement', time: '2026-06-05 17:20' },
    { id: 5, type: 'reject', icon: 'cancel', user: 'Manager', action: 'rejected Invoice', target: 'INV-2026-001 — Q2 Steel Delivery (amount mismatch)', time: '2026-06-05 16:00' },
    { id: 6, type: 'create', icon: 'add_circle', user: 'Sunita Verma', action: 'registered new vendor', target: 'Pacific Tools & Hardware (V-007)', time: '2026-06-05 14:30' },
    { id: 7, type: 'email', icon: 'email', user: 'System', action: 'sent RFQ notification to', target: 'Quantum Chemicals Ltd for RFQ-2026-004', time: '2026-06-05 14:00' },
    { id: 8, type: 'approve', icon: 'check_circle', user: 'Admin', action: 'approved vendor registration for', target: 'GreenField Packaging (V-003)', time: '2026-06-04 11:00' },
    { id: 9, type: 'create', icon: 'add_circle', user: 'Rajesh Kumar', action: 'created Purchase Order', target: 'PO-2026-001 — Apex Industrial Supplies', time: '2026-06-04 10:30' },
    { id: 10, type: 'update', icon: 'edit', user: 'Deepak Joshi', action: 'updated vendor profile for', target: 'SteelCraft Industries — status changed to Inactive', time: '2026-06-03 16:45' },
    { id: 11, type: 'create', icon: 'add_circle', user: 'Priya Sharma', action: 'created RFQ', target: 'RFQ-2026-003 — Packaging Material Q3', time: '2026-06-03 09:00' },
    { id: 12, type: 'email', icon: 'email', user: 'System', action: 'sent payment reminder for', target: 'INV-2026-003 — Apex Industrial Supplies (overdue)', time: '2026-06-02 08:00' },
  ],

  // Dashboard chart data
  chartData: {
    monthlySpend: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        { label: 'Purchase Orders', data: [12.5, 18.2, 15.8, 22.1, 19.6, 25.4] },
        { label: 'Invoices Paid', data: [10.1, 16.5, 13.2, 19.8, 17.3, 21.7] }
      ]
    },
    categoryBreakdown: {
      labels: ['Raw Materials', 'Electronics', 'Packaging', 'Chemicals', 'Logistics', 'Tools'],
      data: [38, 22, 15, 10, 10, 5]
    }
  }
};

/* ============================================
   Dynamic Spend & Category Chart Calculations
   ============================================ */
AppData.recalculateCharts = function() {
  const categorySpends = {
    'Raw Materials': 0,
    'Electronics': 0,
    'Packaging': 0,
    'Chemicals': 0,
    'Logistics': 0,
    'Tools': 0,
    'Tools & Equipment': 0
  };
  
  this.purchaseOrders.forEach(po => {
    const vendor = this.vendors.find(v => v.name === po.vendor || v.id === po.vendorId);
    let category = 'Raw Materials';
    if (vendor) {
      category = vendor.category;
    }
    if (category === 'Tools & Equipment' || category === 'Tools') {
      categorySpends['Tools'] += po.total;
    } else if (categorySpends[category] !== undefined) {
      categorySpends[category] += po.total;
    } else {
      categorySpends[category] = po.total;
    }
  });

  const labels = ['Raw Materials', 'Electronics', 'Packaging', 'Chemicals', 'Logistics', 'Tools'];
  const totalSpend = Object.values(categorySpends).reduce((a, b) => a + b, 0) || 1;
  const data = labels.map(label => {
    const val = label === 'Tools' ? (categorySpends['Tools'] || 0) : (categorySpends[label] || 0);
    return Math.round((val / totalSpend) * 100) || 5; 
  });
  
  const sumData = data.reduce((a, b) => a + b, 0);
  if (sumData === 30) { 
    this.chartData.categoryBreakdown.data = [38, 22, 15, 10, 10, 5];
  } else {
    this.chartData.categoryBreakdown.data = data;
  }

  const junePOsTotal = this.purchaseOrders
    .filter(po => po.date.startsWith('2026-06'))
    .reduce((sum, po) => sum + po.total, 0);
    
  const juneInvoicesTotal = this.invoices
    .filter(inv => inv.date.startsWith('2026-06') && inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);
    
  const junePOSpendLakhs = parseFloat((junePOsTotal / 100000).toFixed(1));
  const juneInvoicePaidLakhs = parseFloat((juneInvoicesTotal / 100000).toFixed(1));

  this.chartData.monthlySpend.datasets[0].data[5] = junePOSpendLakhs || 25.4;
  this.chartData.monthlySpend.datasets[1].data[5] = juneInvoicePaidLakhs || 21.7;
};
