-- ============================================================
-- Atlas ERP — Seed Data
-- supabase/seed.sql
-- Mirrors all mock data. Run AFTER 001_initial_schema.sql.
-- ============================================================

-- ── Departments ───────────────────────────────────────────────
INSERT INTO departments (id, name, name_ar, parent_id, head_id, head_name, headcount, open_positions, monthly_revenue, status) VALUES
('dept-01', 'Executive',    'الإدارة التنفيذية', NULL,      'EMP-001', 'Walid Karimi',   3,  0, 0,      'active'),
('dept-02', 'Sales',        'المبيعات',          NULL,      'EMP-010', 'Ahmad Qasim',    12, 2, 185000, 'active'),
('dept-03', 'Operations',   'العمليات',          NULL,      'EMP-015', 'Mona Ibrahim',   8,  1, 0,      'active'),
('dept-04', 'Finance',      'المالية',           NULL,      'EMP-020', 'Karim Nasser',   5,  0, 0,      'active'),
('dept-05', 'HR',           'الموارد البشرية',   NULL,      'EMP-025', 'Laila Mansour',  4,  1, 0,      'active'),
('dept-06', 'IT',           'تقنية المعلومات',   NULL,      'EMP-030', 'Hana Saeed',     6,  2, 0,      'active'),
('dept-07', 'POS / Retail', 'نقاط البيع',        'dept-02', 'EMP-035', 'Omar Haddad',    10, 1, 95000,  'active'),
('dept-08', 'Warehouse',    'المستودع',          'dept-03', 'EMP-040', 'Dina Saleh',     7,  0, 0,      'active');

-- ── Suppliers ─────────────────────────────────────────────────
INSERT INTO suppliers (id, name, phone, email, notes) VALUES
('sup-001', 'Al-Zaytoun Farm',     '+970 2 298 1100', 'contact@alzaytoun.ps', 'Local olive farm — main raw material supplier'),
('sup-002', 'Glass World Ltd',     NULL,              'orders@glassworld.tr', 'Turkish glass bottle importer'),
('sup-003', 'Metal Pack Co',       '+970 2 241 3300', NULL,                   'Local tin cans and lids'),
('sup-004', 'Print Pro',           '+970 59 123 4567', 'sales@printpro.ps',  'Label printing'),
('sup-005', 'Green Valley Farms',  '+970 2 252 7700', NULL,                   'Fresh produce'),
('sup-006', 'Levant Grains',       '+970 2 233 5500', NULL,                   'Dried legumes'),
('sup-007', 'Mountain Harvest',    NULL,              NULL,                   'Specialty dried fruit'),
('sup-008', 'Poly Pack Ltd',       NULL,              'info@polypack.eg',     'Egyptian food-grade bags'),
('sup-009', 'Sudan Seeds Co',      NULL,              'export@sudanseeds.sd', 'Sesame seeds'),
('sup-010', 'Chem Direct',         NULL,              'orders@chemdirect.de', 'Specialty food additives');

-- ── Customers ────────────────────────────────────────────────
INSERT INTO customers (id, code, name, type, classification, tax_id, phone, email, city, governorate, payment_terms, currency, credit_limit, outstanding_balance, status, sales_rep, joined_at) VALUES
('c01', 'C-1001', 'شركة فلسطين للتجارة العامة',    'company',      'vip',      '562139874', '+970 2 295 1100', 'info@palestrade.ps',    'رام الله',   'رام الله والبيرة', 'net30', 'ILS', 250000, 84200,  'active',   'محمد سعيد',   '2022-01-15'),
('c02', 'C-1002', 'مؤسسة الأمل للمواد الغذائية',    'institution',  'standard', '562128841', '+970 2 240 8855', 'amal@food.ps',          'البيرة',     'رام الله والبيرة', 'net15', 'ILS', 80000,  12500,  'active',   'رنا حسين',    '2022-03-01'),
('c03', 'C-1003', 'بقالة الياسمين',                  'individual',   'standard', NULL,        '+970 59 800 1234','yasmin@shop.ps',        'بيت لحم',    'بيت لحم',          'cash',  'ILS', 5000,   0,      'active',   'خالد يوسف',   '2023-06-10'),
('c04', 'C-1004', 'شركة النور للمواصلات',             'company',      'risk',     '562133456', '+970 2 296 7788', NULL,                   'الخليل',     'الخليل',           'net60', 'ILS', 40000,  38500,  'active',   'محمد سعيد',   '2021-11-20'),
('c05', 'C-1005', 'محل أبو كرم للبقالة',              'individual',   'standard', NULL,        '+970 59 900 2233', NULL,                  'نابلس',      'نابلس',            'cash',  'ILS', 3000,   0,      'active',   'رنا حسين',    '2023-09-01'),
('c06', 'C-1006', 'مجمع الجامعة التجاري',             'institution',  'vip',      '562145789', '+970 2 298 3344', 'info@univmall.ps',     'رام الله',   'رام الله والبيرة', 'net30', 'ILS', 120000, 22000,  'active',   'محمد سعيد',   '2020-08-15'),
('c07', 'C-1007', 'سوبرماركت الفردوس',                'company',      'standard', '562127654', '+970 59 811 5566', NULL,                  'جنين',       'جنين',             'net15', 'ILS', 60000,  8200,   'active',   'خالد يوسف',   '2022-07-22'),
('c08', 'C-1008', 'مطاعم الزيتونة',                   'company',      'vip',      '562130012', '+970 2 276 9988', 'orders@zaytuna.ps',    'بيت لحم',    'بيت لحم',          'net30', 'ILS', 95000,  14600,  'active',   'رنا حسين',    '2021-04-18'),
('c09', 'C-1009', 'متجر الوفاء',                       'individual',   'standard', NULL,        '+970 59 822 3344', NULL,                  'طولكرم',     'طولكرم',           'cash',  'ILS', 2000,   0,      'inactive', 'خالد يوسف',   '2023-01-05'),
('c10', 'C-1010', 'شركة التقدم للتوزيع',               'company',      'standard', '562138820', '+970 2 243 1122', 'dist@taqadom.ps',      'الخليل',     'الخليل',           'net60', 'ILS', 75000,  31000,  'active',   'محمد سعيد',   '2021-09-30');

-- ── Invoices ─────────────────────────────────────────────────
INSERT INTO invoices (id, customer_id, amount, remaining_amount, status, date) VALUES
('INV-0001', 'c01', 84200,  84200,  'Debit',   '2026-05-10'),
('INV-0002', 'c01', 42000,  0,      'Paid',    '2026-04-15'),
('INV-0003', 'c02', 28000,  12500,  'Partial', '2026-05-01'),
('INV-0004', 'c04', 38500,  38500,  'Debit',   '2026-03-20'),
('INV-0005', 'c06', 22000,  0,      'Paid',    '2026-05-05'),
('INV-0006', 'c06', 55000,  22000,  'Partial', '2026-05-20'),
('INV-0007', 'c07', 18200,  8200,   'Partial', '2026-05-08'),
('INV-0008', 'c08', 14600,  0,      'Paid',    '2026-04-28'),
('INV-0009', 'c08', 62000,  14600,  'Partial', '2026-05-22'),
('INV-0010', 'c10', 31000,  31000,  'Pending', '2026-05-25');

-- ── Expenses ─────────────────────────────────────────────────
INSERT INTO expenses (id, date, description, category, amount, currency, vendor, payee, payment_method, status) VALUES
('EX-5001', '2026-05-01', 'Monthly office rent',         'Rent',                   5000,  'ILS', 'Al-Ameen Properties',  'Al-Ameen Properties',  'bank',   'approved'),
('EX-5002', '2026-05-03', 'Electricity & water bill',    'Utilities',               720,  'ILS', 'Palestine Electric',   'Palestine Electric',   'bank',   'approved'),
('EX-5003', '2026-05-05', 'Office stationery restock',   'Office Supplies',         340,  'ILS', 'Stationary Plus',      'Stationary Plus',      'cash',   'approved'),
('EX-5004', '2026-05-08', 'Team site visit transport',   'Travel',                 1200,  'ILS', 'Local Transport',      'Local Transport',      'cash',   'approved'),
('EX-5005', '2026-05-10', 'Digital advertising — May',   'Marketing',              3500,  'USD', 'Digital Ads Agency',   'Digital Ads Agency',   'card',   'approved'),
('EX-5006', '2026-05-12', 'Equipment repair service',    'Maintenance',             850,  'ILS', 'Fix-It Services',      'Fix-It Services',      'cash',   'approved'),
('EX-5007', '2026-05-15', 'Internet & phone lines',      'Internet & Telecom',      480,  'ILS', 'Paltel',               'Paltel',               'bank',   'approved'),
('EX-5008', '2026-05-18', 'Annual insurance renewal',    'Insurance',              2100,  'ILS', 'Al-Watania Insurance', 'Al-Watania Insurance', 'cheque', 'approved'),
('EX-5009', '2026-05-20', 'SaaS subscriptions — May',    'Software Subscriptions',  299,  'USD', 'Various SaaS',         'Various SaaS',         'card',   'approved'),
('EX-5010', '2026-05-22', 'Office cleaning services',    'Cleaning',                250,  'ILS', 'Clean Co.',            'Clean Co.',            'cash',   'approved'),
('EX-6001', '2026-06-01', 'Monthly office rent',         'Rent',                   5000,  'ILS', 'Al-Ameen Properties',  'Al-Ameen Properties',  'bank',   'approved'),
('EX-6002', '2026-06-01', 'Staff salaries — June',       'Salaries',              42000,  'ILS', 'Payroll Processing',   'Payroll Processing',   'bank',   'approved'),
('EX-6003', '2026-06-02', 'Electricity & water',         'Utilities',              3800,  'ILS', 'National Utilities',   'National Utilities',   'bank',   'approved'),
('EX-6004', '2026-06-02', 'Internet & phone lines',      'Internet & Telecom',     1200,  'ILS', 'Telecom Provider',     'Telecom Provider',     'bank',   'approved'),
('EX-6005', '2026-06-03', 'Social media ads — June',     'Marketing',              5400,  'ILS', 'Digital Agency Ltd.',  'Digital Agency Ltd.',  'card',   'approved'),
('EX-6006', '2026-06-04', 'POS terminal maintenance',    'Maintenance',             850,  'ILS', 'TechSupport Co.',      'TechSupport Co.',      'cash',   'approved'),
('EX-6007', '2026-06-05', 'Coffee & supplies restock',   'Office Supplies',        7200,  'ILS', 'Al-Baraka Suppliers',  'Al-Baraka Suppliers',  'bank',   'approved'),
('EX-6008', '2026-06-05', 'ERP software subscription',   'Software Subscriptions', 2100,  'ILS', 'Atlas Software Inc.',  'Atlas Software Inc.',  'card',   'approved'),
('EX-6009', '2026-06-07', 'Branch manager travel',       'Travel',                  620,  'ILS', 'Ahmad Qasim',          'Ahmad Qasim',          'cash',   'approved'),
('EX-6010', '2026-06-08', 'Commercial insurance prem.',  'Insurance',              3500,  'ILS', 'Gulf Insurance Group', 'Gulf Insurance Group', 'cheque', 'approved'),
('EX-6011', '2026-06-09', 'Print & outdoor advertising', 'Marketing',              2400,  'ILS', 'PrintMasters',         'PrintMasters',         'bank',   'pending'),
('EX-6012', '2026-06-10', 'Janitorial services',         'Cleaning',               1100,  'ILS', 'CleanPro Services',    'CleanPro Services',    'cash',   'approved'),
('EX-6013', '2026-06-10', 'Staff training workshop',     'Other',                  1800,  'ILS', 'HR Academy',           'HR Academy',           'bank',   'pending'),
('EX-6014', '2026-06-11', 'Packaging materials',         'Office Supplies',         940,  'ILS', 'Packs & More',         'Packs & More',         'cash',   'approved'),
('EX-6015', '2026-06-12', 'Accounting software license', 'Software Subscriptions',  780,  'ILS', 'FinanceApp Ltd.',      'FinanceApp Ltd.',      'card',   'approved'),
('EX-6016', '2026-06-13', 'HVAC repair — branch 2',      'Maintenance',            2750,  'ILS', 'CoolTech HVAC',        'CoolTech HVAC',        'bank',   'pending'),
('EX-6017', '2026-06-14', 'Loyalty program gifts',       'Marketing',              3200,  'ILS', 'Gifts & Swag Co.',     'Gifts & Swag Co.',     'card',   'approved'),
('EX-6018', '2026-06-15', 'Office furniture repl.',      'Other',                  4600,  'ILS', 'FurniturePlus',        'FurniturePlus',        'bank',   'rejected'),
('EX-6019', '2026-06-17', 'Legal consultation fees',     'Other',                  5000,  'ILS', 'Al-Noor Law Firm',     'Al-Noor Law Firm',     'cheque', 'approved'),
('EX-6020', '2026-06-19', 'Photographer product shoot',  'Marketing',              1900,  'ILS', 'Studio Click',         'Studio Click',         'cash',   'pending'),
('EX-6021', '2026-06-21', 'Security system monitoring',  'Insurance',               880,  'ILS', 'SecureGuard',          'SecureGuard',          'bank',   'approved'),
('EX-6022', '2026-06-23', 'Conference room rental',      'Rent',                   1400,  'ILS', 'Business Center Hub',  'Business Center Hub',  'bank',   'pending'),
('EX-6023', '2026-06-24', 'Staff uniforms batch 2',      'Office Supplies',        2100,  'ILS', 'Uniform Factory',      'Uniform Factory',      'bank',   'approved'),
('EX-6024', '2026-06-27', 'Trade show booth — July',     'Marketing',              8500,  'ILS', 'Expo Events Co.',      'Expo Events Co.',      'cheque', 'pending'),
('EX-6025', '2026-06-28', 'Petty cash replenishment',    'Other',                  1000,  'ILS', 'Internal',             'Internal',             'cash',   'approved');

-- ── POS Products ──────────────────────────────────────────────
INSERT INTO pos_products (id, name, category, price, stock, code) VALUES
('p-001', 'مياه معدنية 500مل',    'beverages', 2.50,  120, 'BEV-H2O-500'),
('p-002', 'عصير برتقال 1ل',       'beverages', 6.00,  44,  'BEV-OJ-1L'),
('p-003', 'كولا 330مل',           'beverages', 4.50,  88,  'BEV-COL-330'),
('p-004', 'شاي أخضر علبة',        'beverages', 12.00, 30,  'BEV-GT-BOX'),
('p-005', 'قهوة سريعة 200جم',     'beverages', 18.50, 22,  'BEV-CF-200'),
('p-006', 'مياه غازية 750مل',     'beverages', 5.00,  0,   'BEV-SPK-750'),
('p-007', 'أرز بسمتي 1كجم',       'food',      9.75,  55,  'FOOD-RIC-1K'),
('p-008', 'زيت زيتون 500مل',       'food',      22.00, 18,  'FOOD-OO-500'),
('p-009', 'معكرونة 500جم',         'food',      5.50,  70,  'FOOD-PAS-500'),
('p-010', 'سكر أبيض 1كجم',         'food',      4.00,  90,  'FOOD-SUG-1K'),
('p-011', 'طحين 2كجم',            'food',      7.25,  40,  'FOOD-FLR-2K'),
('p-012', 'صلصة طماطم 400جم',      'food',      6.00,  33,  'FOOD-TOM-400'),
('p-013', 'تونا معلبة',            'food',      8.50,  50,  'FOOD-TUN-CAN'),
('p-014', 'شيبس مشوي 50جم',        'snacks',    3.00,  200, 'SNK-CHIP-50'),
('p-015', 'شوكولاتة حليب 100جم',   'snacks',    7.50,  65,  'SNK-CHO-100'),
('p-016', 'بسكويت شاي 200جم',      'snacks',    4.50,  80,  'SNK-BSC-200'),
('p-017', 'مكسرات مشكلة 250جم',    'snacks',    14.00, 28,  'SNK-NUT-250'),
('p-018', 'حلوى جيلي',             'snacks',    2.00,  0,   'SNK-JEL-PKT'),
('p-019', 'حليب كامل الدسم 1ل',    'dairy',     5.50,  60,  'DAI-MLK-1L'),
('p-020', 'جبنة بيضاء 500جم',       'dairy',     13.00, 25,  'DAI-CHE-500'),
('p-021', 'لبن زبادي 400جم',        'dairy',     4.75,  48,  'DAI-YOG-400'),
('p-022', 'زبدة 200جم',            'dairy',     8.00,  20,  'DAI-BUT-200'),
('p-023', 'صابون يدين سائل 500مل',  'household', 7.00,  35,  'HH-SOAP-500'),
('p-024', 'مناديل ورقية علبة',      'household', 3.50,  90,  'HH-TIS-BOX');

-- ── POS Cashiers ─────────────────────────────────────────────
INSERT INTO pos_cashiers (id, name, code, shift, status, today_sales, transactions, last_active) VALUES
('CSH-01', 'Ahmad Qasim',   'CSH-01', 'morning',   'active',   120.53, 3, '2026-05-26T10:45:00Z'),
('CSH-02', 'Mona Ibrahim',  'CSH-02', 'afternoon', 'active',   100.30, 2, '2026-05-26T10:12:00Z'),
('CSH-03', 'Laila Mansour', 'CSH-03', 'morning',   'on-break', 0,      0, '2026-05-25T17:55:00Z'),
('CSH-04', 'Karim Nasser',  'CSH-04', 'evening',   'inactive', 0,      0, '2026-05-23T22:00:00Z'),
('CSH-05', 'Hana Saeed',    'CSH-05', 'evening',   'active',   0,      0, '2026-05-24T20:30:00Z'),
('CSH-06', 'Omar Haddad',   'CSH-06', 'morning',   'active',   88.40,  2, '2026-05-26T09:50:00Z'),
('CSH-07', 'Dina Saleh',    'CSH-07', 'afternoon', 'inactive', 0,      0, '2026-05-20T14:00:00Z'),
('CSH-08', 'Yusuf Barakat', 'CSH-08', 'evening',   'on-break', 0,      0, '2026-05-26T08:00:00Z');

-- ── POS Sales (first 10 receipts as representative sample) ────
INSERT INTO pos_sales (id, cashier_id, customer_id, date, subtotal, tax, discount, total, method, status) VALUES
('POS-9821', 'CSH-01', 'c01', '2026-05-26 10:45:00+00', 30.50, 4.88, 0,    35.38, 'cash',   'completed'),
('POS-9820', 'CSH-02', NULL,  '2026-05-26 10:12:00+00', 41.50, 6.64, 2.00, 46.14, 'card',   'completed'),
('POS-9819', 'CSH-01', 'c01', '2026-05-26 09:30:00+00', 36.00, 5.76, 0,    41.76, 'split',  'completed'),
('POS-9818', 'CSH-03', NULL,  '2026-05-25 17:55:00+00', 13.00, 2.08, 0,    15.08, 'cash',   'refunded'),
('POS-9817', 'CSH-02', NULL,  '2026-05-25 16:40:00+00', 51.00, 8.16, 5.00, 54.16, 'wallet', 'completed'),
('POS-9816', 'CSH-01', NULL,  '2026-05-25 14:20:00+00', 37.25, 5.96, 0,    43.21, 'cash',   'completed'),
('POS-9815', 'CSH-03', NULL,  '2026-05-25 11:05:00+00', 18.00, 2.88, 0,    20.88, 'card',   'voided'),
('POS-9814', 'CSH-02', 'c03', '2026-05-24 18:30:00+00', 24.50, 3.92, 0,    28.42, 'cash',   'completed'),
('POS-9813', 'CSH-01', NULL,  '2026-05-24 15:15:00+00', 21.50, 3.44, 1.00, 23.94, 'card',   'completed'),
('POS-9812', 'CSH-03', NULL,  '2026-05-24 09:00:00+00', 49.50, 7.92, 0,    57.42, 'split',  'completed');

-- ── POS Stock Counts ─────────────────────────────────────────
INSERT INTO pos_stock_counts (id, date, location, status, counted_by) VALUES
('SC-001', '2026-05-26', 'Main Branch',   'in-progress', 'Ahmad Qasim'),
('SC-002', '2026-05-20', 'Branch 2',      'completed',   'Mona Ibrahim'),
('SC-003', '2026-05-15', 'Main Branch',   'completed',   'Laila Mansour'),
('SC-004', '2026-05-10', 'Warehouse A',   'cancelled',   NULL),
('SC-005', '2026-06-01', 'Main Branch',   'open',        NULL);

-- ── Factory Orders ────────────────────────────────────────────
INSERT INTO factory_orders (id, product_id, quantity, start_date, due_date, status) VALUES
('MO-1001', 'FP-001', 2400, '2026-05-01', '2026-05-10', 'done'),
('MO-1002', 'FP-002', 1800, '2026-05-05', '2026-05-18', 'done'),
('MO-1003', 'FP-003', 3000, '2026-05-12', '2026-05-22', 'in-progress'),
('MO-1004', 'FP-004', 1500, '2026-05-15', '2026-05-28', 'in-progress'),
('MO-1005', 'FP-005',  900, '2026-05-20', '2026-06-03', 'planned'),
('MO-1006', 'FP-006', 1200, '2026-05-25', '2026-06-08', 'planned'),
('MO-1007', 'FP-001',  600, '2026-04-10', '2026-04-20', 'cancelled');

-- ── Factory BOMs ──────────────────────────────────────────────
INSERT INTO factory_boms (id, product_id, product_name, product_name_ar, version, effective_date) VALUES
('BOM-001', 'FP-001', 'Extra Virgin Olive Oil 500ml', 'زيت زيتون بكر ممتاز 500مل', 'v2.1', '2026-01-01'),
('BOM-002', 'FP-002', 'Extra Virgin Olive Oil 1L',    'زيت زيتون بكر ممتاز 1 لتر', 'v2.0', '2026-01-01'),
('BOM-003', 'FP-003', 'Tomato Paste 400g',             'معجون طماطم 400 جرام',        'v1.5', '2026-02-01'),
('BOM-004', 'FP-004', 'Canned Chickpeas 800g',         'حمص معلب 800 جرام',           'v1.3', '2026-02-01'),
('BOM-005', 'FP-006', 'Tahini 300g',                   'طحينة 300 جرام',              'v1.0', '2026-03-01');

-- ── Factory BOM Lines ─────────────────────────────────────────
INSERT INTO factory_bom_lines (bom_id, material_id, material_name, quantity, unit, unit_cost) VALUES
('BOM-001', 'RM-001', 'Fresh Olive Fruit',  0.5, 'kg',  12.0),
('BOM-001', 'RM-002', '500ml Glass Bottle', 1.0, 'pcs',  3.5),
('BOM-001', 'RM-005', 'Product Label',      1.0, 'pcs',  0.4),
('BOM-002', 'RM-001', 'Fresh Olive Fruit',  1.0, 'kg',  12.0),
('BOM-002', 'RM-003', '1L Glass Bottle',    1.0, 'pcs',  5.2),
('BOM-002', 'RM-005', 'Product Label',      1.0, 'pcs',  0.4),
('BOM-003', 'RM-006', 'Fresh Tomatoes',     2.0, 'kg',   2.8),
('BOM-003', 'RM-004', '400g Tin Can',       1.0, 'pcs',  1.8),
('BOM-003', 'RM-007', 'Can Lid',            1.0, 'pcs',  0.6),
('BOM-004', 'RM-008', 'Dried Chickpeas',    0.5, 'kg',   6.0),
('BOM-004', 'RM-004', '800g Tin Can',       1.0, 'pcs',  2.2),
('BOM-004', 'RM-007', 'Can Lid',            1.0, 'pcs',  0.6),
('BOM-005', 'RM-011', 'Sesame Seeds',       0.5, 'kg',  18.0),
('BOM-005', 'RM-004', '300g Jar',           1.0, 'pcs',  2.0),
('BOM-005', 'RM-005', 'Product Label',      1.0, 'pcs',  0.4);

-- ── Factory QC ────────────────────────────────────────────────
INSERT INTO factory_qc (id, production_order_id, product_id, product_name, batch_id, inspection_date, inspector, status, defect_rate, sample_size, failed_units, notes) VALUES
('QC-001', 'MO-1001', 'FP-001', 'EVOO 500ml',            'BTH-001', '2026-05-10', 'Laila Mansour', 'pass',        0.8,  200, 2,  'Minor cap seal issue on 2 units.'),
('QC-002', 'MO-1002', 'FP-002', 'EVOO 1L',               'BTH-002', '2026-05-18', 'Ahmad Qasim',   'pass',        0.0,  150, 0,  NULL),
('QC-003', 'MO-1003', 'FP-003', 'Tomato Paste 400g',      'BTH-003', '2026-05-22', 'Laila Mansour', 'pending',     0.0,  0,   0,  'Inspection scheduled after order completion.'),
('QC-004', 'MO-1004', 'FP-004', 'Canned Chickpeas 800g',  'BTH-004', '2026-05-28', 'Mona Ibrahim',  'pending',     0.0,  0,   0,  NULL),
('QC-005', 'MO-1007', 'FP-001', 'EVOO 500ml',             'BTH-005', '2026-04-21', 'Ahmad Qasim',   'fail',        12.5, 120, 15, 'Acidity exceeded standard — batch destroyed.'),
('QC-006', 'MO-1001', 'FP-001', 'EVOO 500ml',             'BTH-006', '2026-05-09', 'Mona Ibrahim',  'conditional', 3.2,  250, 8,  'Approved with rework on 8 units — relabeling required.');

-- ── Factory Batches ───────────────────────────────────────────
INSERT INTO factory_batches (id, production_order_id, product_name, quantity, produced_date, expiry_date, status, qc_status, unit_cost, total_cost, notes) VALUES
('BTH-001', 'MO-1001', 'EVOO 500ml',             2400, '2026-05-10', '2027-05-10', 'closed',     'pass',        10.1, 24240, NULL),
('BTH-002', 'MO-1002', 'EVOO 1L',                1800, '2026-05-18', '2027-05-18', 'closed',     'pass',        18.0, 32400, NULL),
('BTH-003', 'MO-1003', 'Tomato Paste 400g',         0, '2026-01-01', '2027-01-01', 'open',       'pending',     7.2,  0,     'Production in progress.'),
('BTH-004', 'MO-1004', 'Canned Chickpeas 800g',     0, '2026-01-01', '2027-01-01', 'open',       'pending',     9.4,  0,     NULL),
('BTH-005', 'MO-1007', 'EVOO 500ml',              600, '2026-04-21', '2027-04-21', 'quarantine', 'fail',        10.1, 6060,  'Batch failed acidity QC — under review.'),
('BTH-006', 'MO-1001', 'EVOO 500ml (rework)',     2392, '2026-05-10', '2027-05-10', 'closed',    'conditional', 10.3, 24638, '8 units relabeled and reapproved.');

-- ── Raw Materials ─────────────────────────────────────────────
INSERT INTO factory_raw_materials (id, name, name_ar, category, unit, on_hand, reorder_point, unit_cost, supplier, origin, last_purchase_date) VALUES
('RM-001', 'Fresh Olive Fruit',    'ثمار الزيتون الطازجة',    'oil',       'kg',  8500,  2000,  12.0, 'Al-Zaytoun Farm',   'local',    '2026-05-05'),
('RM-002', '500ml Glass Bottle',   'زجاجة زجاجية 500مل',      'packaging', 'pcs', 15000, 5000,  3.5,  'Glass World Ltd',   'imported', '2026-04-28'),
('RM-003', '1L Glass Bottle',      'زجاجة زجاجية 1 لتر',      'packaging', 'pcs', 6800,  2000,  5.2,  'Glass World Ltd',   'imported', '2026-04-28'),
('RM-004', 'Tin Can (assorted)',    'علبة معدنية (متنوعة)',     'packaging', 'pcs', 9200,  3000,  2.0,  'Metal Pack Co',     'local',    '2026-05-10'),
('RM-005', 'Product Label (roll)', 'ملصق المنتج (لفة)',        'labeling',  'pcs', 42000, 10000, 0.4,  'Print Pro',         'local',    '2026-05-01'),
('RM-006', 'Fresh Tomatoes',       'طماطم طازجة',             'oil',       'kg',  3200,  1000,  2.8,  'Green Valley Farms','local',    '2026-05-12'),
('RM-007', 'Can Lid',              'غطاء العلبة',              'packaging', 'pcs', 11000, 4000,  0.6,  'Metal Pack Co',     'local',    '2026-05-10'),
('RM-008', 'Dried Chickpeas',      'حمص مجفف',                'oil',       'kg',  1800,  500,   6.0,  'Levant Grains',     'local',    '2026-05-08'),
('RM-009', 'Dried Figs (raw)',     'تين مجفف (خام)',           'oil',       'kg',  620,   200,   22.0, 'Mountain Harvest',  'local',    '2026-05-15'),
('RM-010', 'Food-grade Bag 500g',  'كيس غذائي 500 جرام',      'packaging', 'pcs', 5400,  2000,  1.2,  'Poly Pack Ltd',     'imported', '2026-05-03'),
('RM-011', 'Sesame Seeds',         'بذور السمسم',              'oil',       'kg',  420,   150,   18.0, 'Sudan Seeds Co',    'imported', '2026-04-20'),
('RM-012', 'Citric Acid',          'حمض الستريك',              'additives', 'kg',  85,    30,    14.0, 'Chem Direct',       'imported', '2026-03-15');

-- ── Finished Goods ────────────────────────────────────────────
INSERT INTO factory_finished_goods (id, name, name_ar, sku, category, on_hand, reserved, unit_cost, selling_price, production_order_id, last_produced_date) VALUES
('FG-001', 'EVOO 500ml',           'زيت زيتون بكر ممتاز 500مل', 'EVOO-500', 'Oil',    2240, 480, 10.1, 18.5, 'MO-1001', '2026-05-10'),
('FG-002', 'EVOO 1L',              'زيت زيتون بكر ممتاز 1 لتر', 'EVOO-1L',  'Oil',    1680, 350, 18.0, 32.0, 'MO-1002', '2026-05-18'),
('FG-003', 'Tomato Paste 400g',    'معجون طماطم 400 جرام',       'TP-400',   'Paste',  0,    0,   7.2,  12.5, 'MO-1003', NULL),
('FG-004', 'Canned Chickpeas 800g','حمص معلب 800 جرام',          'CC-800',   'Canned', 0,    0,   9.4,  16.0, 'MO-1004', NULL),
('FG-005', 'Dried Figs 500g',      'تين مجفف 500 جرام',          'DF-500',   'Dried',  380,  80,  23.0, 38.0, NULL,       '2026-04-30'),
('FG-006', 'Tahini 300g',          'طحينة 300 جرام',             'TAH-300',  'Paste',  820,  200, 11.4, 19.0, NULL,       '2026-04-25');

-- ── Warehouse Locations ───────────────────────────────────────
INSERT INTO factory_warehouse (id, name, zone, capacity, used, temperature, notes) VALUES
('WL-001', 'Raw Materials Store A', 'raw',        5000, 3820, 'Ambient (18–24°C)',    'Main dry storage'),
('WL-002', 'Raw Materials Store B', 'raw',        3000, 2100, 'Refrigerated (2–6°C)', 'Cold chain produce'),
('WL-003', 'Packaging Store',       'packaging',  8000, 5900, NULL,                   'Bottles, cans, labels'),
('WL-004', 'Finished Goods A',      'finished',   6000, 5120, 'Ambient (18–22°C)',    'Main dispatch area'),
('WL-005', 'Finished Goods B',      'finished',   4000, 1380, 'Ambient (18–22°C)',    NULL),
('WL-006', 'Quarantine Bay',        'quarantine',  500,  120, NULL,                   'Failed QC + recalled batches');

-- ── Import Orders ─────────────────────────────────────────────
INSERT INTO factory_imports (id, supplier_name, origin, total_value, currency, order_date, estimated_arrival, actual_arrival, status, customs_ref, notes) VALUES
('IMP-001', 'Glass World Ltd',  'Turkey',  87860,  'USD', '2026-04-10', '2026-04-28', '2026-04-28', 'received', 'CUS-20260428-001', NULL),
('IMP-002', 'Sudan Seeds Co',   'Sudan',   7560,   'USD', '2026-04-05', '2026-04-20', '2026-04-20', 'received', 'CUS-20260420-002', NULL),
('IMP-003', 'Poly Pack Ltd',    'Egypt',   6480,   'USD', '2026-04-22', '2026-05-03', '2026-05-03', 'received', 'CUS-20260503-001', NULL),
('IMP-004', 'Chem Direct',      'Germany', 1190,   'EUR', '2026-02-28', '2026-03-15', '2026-03-15', 'received', 'CUS-20260315-003', NULL),
('IMP-005', 'Glass World Ltd',  'Turkey',  118000, 'USD', '2026-05-15', '2026-06-05', NULL,         'in-transit', NULL,             'On vessel MV Aphrodite — ETA Ashdod port Jun 3.'),
('IMP-006', 'Sudan Seeds Co',   'Sudan',   14000,  'USD', '2026-05-20', '2026-06-12', NULL,         'ordered',  NULL,              NULL),
('IMP-007', 'Poly Pack Ltd',    'Egypt',   11500,  'USD', '2026-05-22', '2026-06-01', NULL,         'customs',  'CUS-20260601-002','Held at Haifa port for document review.');

-- ── Import Lines ──────────────────────────────────────────────
INSERT INTO factory_import_lines (import_id, name, quantity, unit, unit_cost) VALUES
('IMP-001', '500ml Glass Bottle', 15000, 'pcs', 3.5),
('IMP-001', '1L Glass Bottle',    6800,  'pcs', 5.2),
('IMP-002', 'Sesame Seeds',       420,   'kg',  18.0),
('IMP-003', 'Food-grade Bag 500g',5400,  'pcs', 1.2),
('IMP-004', 'Citric Acid',        85,    'kg',  14.0),
('IMP-005', '500ml Glass Bottle', 20000, 'pcs', 3.4),
('IMP-005', '1L Glass Bottle',    10000, 'pcs', 5.0),
('IMP-006', 'Sesame Seeds',       800,   'kg',  17.5),
('IMP-007', 'Food-grade Bag 500g',10000, 'pcs', 1.15);

-- ── Costing Entries ───────────────────────────────────────────
INSERT INTO factory_costing (id, production_order_id, product_name, period, raw_material_cost, labor_cost, overhead_cost, total_cost, units_produced, cost_per_unit, variance) VALUES
('CST-001', 'MO-1001', 'EVOO 500ml',            '2026-05', 16800, 3200, 4240, 24240, 2400, 10.1, -360),
('CST-002', 'MO-1002', 'EVOO 1L',               '2026-05', 22600, 4800, 5000, 32400, 1800, 18.0,  200),
('CST-003', 'MO-1003', 'Tomato Paste 400g',      '2026-05', 0,     0,    0,    0,     0,    0,     0),
('CST-004', 'MO-1004', 'Canned Chickpeas 800g',  '2026-05', 0,     0,    0,    0,     0,    0,     0),
('CST-005', 'MO-1007', 'EVOO 500ml',             '2026-04', 4200,  1200, 660,  6060,  600,  10.1,  560);

-- ── Role Permissions ──────────────────────────────────────────
-- Admin: full access
INSERT INTO role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_export) VALUES
('Admin',   'customers',   TRUE, TRUE, TRUE, TRUE, TRUE),
('Admin',   'invoices',    TRUE, TRUE, TRUE, TRUE, TRUE),
('Admin',   'payments',    TRUE, TRUE, TRUE, TRUE, TRUE),
('Admin',   'suppliers',   TRUE, TRUE, TRUE, TRUE, TRUE),
('Admin',   'employees',   TRUE, TRUE, TRUE, TRUE, TRUE),
('Admin',   'departments', TRUE, TRUE, TRUE, TRUE, TRUE),
('Admin',   'expenses',    TRUE, TRUE, TRUE, TRUE, TRUE),
('Admin',   'pos',         TRUE, TRUE, TRUE, TRUE, TRUE),
('Admin',   'factory',     TRUE, TRUE, TRUE, TRUE, TRUE),
('Admin',   'reports',     TRUE, TRUE, TRUE, TRUE, TRUE),
('Admin',   'permissions', TRUE, TRUE, TRUE, TRUE, TRUE),
-- Manager: no delete, no permissions management
('Manager', 'customers',   TRUE, TRUE, TRUE,  FALSE, TRUE),
('Manager', 'invoices',    TRUE, TRUE, TRUE,  FALSE, TRUE),
('Manager', 'payments',    TRUE, TRUE, TRUE,  FALSE, TRUE),
('Manager', 'suppliers',   TRUE, TRUE, TRUE,  FALSE, TRUE),
('Manager', 'employees',   TRUE, TRUE, TRUE,  FALSE, TRUE),
('Manager', 'departments', TRUE, TRUE, TRUE,  FALSE, TRUE),
('Manager', 'expenses',    TRUE, TRUE, TRUE,  FALSE, TRUE),
('Manager', 'pos',         TRUE, TRUE, TRUE,  FALSE, TRUE),
('Manager', 'factory',     TRUE, TRUE, TRUE,  FALSE, TRUE),
('Manager', 'reports',     TRUE, FALSE,FALSE, FALSE, TRUE),
('Manager', 'permissions', FALSE,FALSE,FALSE, FALSE, FALSE),
-- Finance: financial modules only
('Finance', 'customers',   TRUE,  FALSE,FALSE, FALSE, TRUE),
('Finance', 'invoices',    TRUE,  TRUE, TRUE,  FALSE, TRUE),
('Finance', 'payments',    TRUE,  TRUE, TRUE,  FALSE, TRUE),
('Finance', 'expenses',    TRUE,  TRUE, TRUE,  FALSE, TRUE),
('Finance', 'reports',     TRUE,  FALSE,FALSE, FALSE, TRUE),
('Finance', 'suppliers',   TRUE,  FALSE,FALSE, FALSE, FALSE),
('Finance', 'employees',   FALSE, FALSE,FALSE, FALSE, FALSE),
('Finance', 'departments', FALSE, FALSE,FALSE, FALSE, FALSE),
('Finance', 'pos',         FALSE, FALSE,FALSE, FALSE, FALSE),
('Finance', 'factory',     FALSE, FALSE,FALSE, FALSE, FALSE),
('Finance', 'permissions', FALSE, FALSE,FALSE, FALSE, FALSE),
-- Factory: factory module only
('Factory', 'factory',     TRUE, TRUE, TRUE, FALSE, TRUE),
('Factory', 'customers',   FALSE,FALSE,FALSE,FALSE, FALSE),
('Factory', 'invoices',    FALSE,FALSE,FALSE,FALSE, FALSE),
('Factory', 'payments',    FALSE,FALSE,FALSE,FALSE, FALSE),
('Factory', 'suppliers',   TRUE, FALSE,FALSE,FALSE, FALSE),
('Factory', 'employees',   FALSE,FALSE,FALSE,FALSE, FALSE),
('Factory', 'departments', FALSE,FALSE,FALSE,FALSE, FALSE),
('Factory', 'expenses',    FALSE,FALSE,FALSE,FALSE, FALSE),
('Factory', 'pos',         FALSE,FALSE,FALSE,FALSE, FALSE),
('Factory', 'reports',     TRUE, FALSE,FALSE,FALSE, FALSE),
('Factory', 'permissions', FALSE,FALSE,FALSE,FALSE, FALSE),
-- Cashier: POS only
('Cashier', 'pos',         TRUE, TRUE, FALSE,FALSE, FALSE),
('Cashier', 'customers',   TRUE, FALSE,FALSE,FALSE, FALSE),
('Cashier', 'invoices',    FALSE,FALSE,FALSE,FALSE, FALSE),
('Cashier', 'payments',    FALSE,FALSE,FALSE,FALSE, FALSE),
('Cashier', 'suppliers',   FALSE,FALSE,FALSE,FALSE, FALSE),
('Cashier', 'employees',   FALSE,FALSE,FALSE,FALSE, FALSE),
('Cashier', 'departments', FALSE,FALSE,FALSE,FALSE, FALSE),
('Cashier', 'expenses',    FALSE,FALSE,FALSE,FALSE, FALSE),
('Cashier', 'factory',     FALSE,FALSE,FALSE,FALSE, FALSE),
('Cashier', 'reports',     FALSE,FALSE,FALSE,FALSE, FALSE),
('Cashier', 'permissions', FALSE,FALSE,FALSE,FALSE, FALSE);
