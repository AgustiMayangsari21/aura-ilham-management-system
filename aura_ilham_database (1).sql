-- ============================================================
-- DATABASE: AURA ILHAM MANAGEMENT SYSTEM
-- Course  : BIC21404 Database | Session 2: 2025/2026
-- Group   : Section 4
-- ============================================================

CREATE DATABASE IF NOT EXISTS aurailham;
USE aurailham;

-- ============================================================
-- TABLE 1: CUSTOMER
-- Purpose: Stores customer information
-- ============================================================
CREATE TABLE Customer (
    customer_id     INT             AUTO_INCREMENT,
    customer_name   VARCHAR(100)    NOT NULL,
    phone_number    VARCHAR(15)     NOT NULL,
    email           VARCHAR(100),

    CONSTRAINT PK_Customer
        PRIMARY KEY (customer_id)
);

-- ============================================================
-- TABLE 2: STAFF
-- Purpose: Stores staff accounts and roles
-- ============================================================
CREATE TABLE Staff (
    staff_id        INT             AUTO_INCREMENT,
    staff_name      VARCHAR(100)    NOT NULL,
    role            ENUM('Admin','Manager','Waiter','Kitchen Staff')
                                    NOT NULL,
    phone_number    VARCHAR(15)     NOT NULL,
    username        VARCHAR(50)     NOT NULL,
    password        VARCHAR(255)    NOT NULL,

    CONSTRAINT PK_Staff
        PRIMARY KEY (staff_id),
    CONSTRAINT UQ_Staff_Username
        UNIQUE (username)
);

-- ============================================================
-- TABLE 3: CATEGORY
-- Purpose: Groups menu items into categories
-- ============================================================
CREATE TABLE Category (
    category_id     INT             AUTO_INCREMENT,
    category_name   VARCHAR(50)     NOT NULL,

    CONSTRAINT PK_Category
        PRIMARY KEY (category_id)
);

-- ============================================================
-- TABLE 4: INVENTORY
-- Purpose: Tracks ingredient stock levels
-- Standalone: No FK relationships
-- ============================================================
CREATE TABLE Inventory (
    inventory_id    INT             AUTO_INCREMENT,
    inventory_name  VARCHAR(100)    NOT NULL,
    category        VARCHAR(100)    NULL        DEFAULT 'General',
    quantity        DECIMAL(10,2)   NOT NULL    DEFAULT 0.00,
    unit            VARCHAR(20)     NOT NULL,
    min_threshold   DECIMAL(10,2)   NOT NULL,
    stock_status    ENUM('Sufficient','Low Stock')
                                    NOT NULL    DEFAULT 'Sufficient',
    image_url       VARCHAR(255)    NULL,

    CONSTRAINT PK_Inventory
        PRIMARY KEY (inventory_id),
    CONSTRAINT CHK_Inventory_Quantity
        CHECK (quantity >= 0),
    CONSTRAINT CHK_Inventory_Threshold
        CHECK (min_threshold >= 0)
);

-- ============================================================
-- TABLE 5: MENU_ITEM
-- Purpose: Stores food and drink items
-- FK: category_id → Category
-- ============================================================
CREATE TABLE Menu_Item (
    menu_item_id        INT             AUTO_INCREMENT,
    menu_name           VARCHAR(100)    NOT NULL,
    price               DECIMAL(8,2)    NOT NULL,
    availability_status ENUM('Available','Unavailable')
                                        NOT NULL    DEFAULT 'Available',
    category_id         INT             NOT NULL,
    image_url           VARCHAR(255)    NULL,

    CONSTRAINT PK_Menu_Item
        PRIMARY KEY (menu_item_id),
    CONSTRAINT CHK_Menu_Item_Price
        CHECK (price > 0),
    CONSTRAINT FK_Menu_Item_Category
        FOREIGN KEY (category_id)
        REFERENCES Category(category_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- ============================================================
-- TABLE 6: ORDER
-- Purpose: Stores customer orders
-- FK: customer_id → Customer | staff_id → Staff
-- NOTE: ORDER is reserved in MySQL — backticks required
-- ============================================================
CREATE TABLE `Order` (
    order_id        INT             AUTO_INCREMENT,
    customer_id     INT             NOT NULL,
    staff_id        INT             NOT NULL,
    order_date      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    order_type      ENUM('Dine-In','Takeaway','Pre-Order')
                                    NOT NULL,
    order_status    ENUM('Pending','Preparing','Ready','Completed')
                                    NOT NULL    DEFAULT 'Pending',
    total_amount    DECIMAL(10,2)   NOT NULL    DEFAULT 0.00,

    CONSTRAINT PK_Order
        PRIMARY KEY (order_id),
    CONSTRAINT FK_Order_Customer
        FOREIGN KEY (customer_id)
        REFERENCES Customer(customer_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT FK_Order_Staff
        FOREIGN KEY (staff_id)
        REFERENCES Staff(staff_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- ============================================================
-- TABLE 7: ORDER_ITEM  [Join Table]
-- Purpose: Links orders to menu items (M:N resolved)
-- FK: order_id → Order | menu_item_id → Menu_Item
-- ============================================================
CREATE TABLE Order_Item (
    order_item_id   INT             AUTO_INCREMENT,
    order_id        INT             NOT NULL,
    menu_item_id    INT             NOT NULL,
    quantity        INT             NOT NULL,
    subtotal        DECIMAL(10,2)   NOT NULL,

    CONSTRAINT PK_Order_Item
        PRIMARY KEY (order_item_id),
    CONSTRAINT CHK_Order_Item_Quantity
        CHECK (quantity >= 1),
    CONSTRAINT FK_Order_Item_Order
        FOREIGN KEY (order_id)
        REFERENCES `Order`(order_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT FK_Order_Item_Menu
        FOREIGN KEY (menu_item_id)
        REFERENCES Menu_Item(menu_item_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- ============================================================
-- TABLE 8: PAYMENT
-- Purpose: Stores payment records
-- FK: order_id → Order (UNIQUE enforces 1:1 with Order)
-- ============================================================
CREATE TABLE Payment (
    payment_id      INT             AUTO_INCREMENT,
    order_id        INT             NOT NULL,
    payment_method  ENUM('Cash','QR Code','Online Transfer')
                                    NOT NULL,
    payment_amount  DECIMAL(10,2)   NOT NULL,
    payment_date    DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT PK_Payment
        PRIMARY KEY (payment_id),
    CONSTRAINT UQ_Payment_Order
        UNIQUE (order_id),
    CONSTRAINT FK_Payment_Order
        FOREIGN KEY (order_id)
        REFERENCES `Order`(order_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- ============================================================
-- SAMPLE DATA — CATEGORY
-- ============================================================
INSERT INTO Category (category_name) VALUES
('Main Course'),
('Drinks'),
('Dessert'),
('Snacks');

-- ============================================================
-- SAMPLE DATA — MENU_ITEM
-- ============================================================
INSERT INTO Menu_Item (menu_name, price, availability_status, category_id, image_url) VALUES
('Nasi Lemak',       8.00,  'Available',   1, '/images/menu/1779418922552-3f0d98a9-c59f-4dac-8071-4087d82aa365-scaled.webp'),
('Mee Goreng',       7.50,  'Available',   1, '/images/menu/1779418942472-tkfz-listing.jpg'),
('Ayam Goreng',      9.00,  'Available',   1, '/images/menu/1779530790725-Resep-Ayam-Goreng-Serundeng-ala-Rumahan-yang-Nggak-Kalah-Enak-dari-Restoran.jpg'),
('Teh Tarik',        3.50,  'Available',   2, '/images/menu/1779419460864-teh-ais.jpg'),
('Milo Ais',         3.50,  'Available',   2, NULL),
('Air Sirap',        2.00,  'Available',   2, '/images/menu/1779421398966-sirap-ais-agtg.jpg'),
('Cendol',           4.00,  'Available',   3, '/images/menu/1779347295173-Kampung_Paya_Jaras_Tengah__Selangor_20250112_111330.jpg'),
('Pisang Goreng',    3.00,  'Available',   4, NULL);

-- ============================================================
-- SAMPLE DATA — INVENTORY
-- ============================================================
INSERT INTO Inventory (inventory_name, quantity, unit, min_threshold, stock_status) VALUES
('Rice',        50.00,  'kg',     10.00,  'Sufficient'),
('Chicken',     20.00,  'kg',      5.00,  'Sufficient'),
('Cooking Oil',  8.00,  'litre',   2.00,  'Sufficient'),
('Sugar',        4.00,  'kg',      5.00,  'Low Stock'),
('Tea Leaves',   2.50,  'kg',      1.00,  'Sufficient'),
('Flour',        3.00,  'kg',      5.00,  'Low Stock');

-- ============================================================
-- SAMPLE DATA — STAFF
-- ============================================================
INSERT INTO Staff (staff_name, role, phone_number, username, password) VALUES
('Ahmad Farid',     'Admin',         '011-11111111', 'admin01',   SHA2('admin123',   256)),
('Nurul Hana',      'Manager',       '012-22222222', 'manager01', SHA2('manager123', 256)),
('Hafiz Izzat',     'Waiter',        '013-33333333', 'waiter01',  SHA2('waiter123',  256)),
('Zulaikha Mira',   'Kitchen Staff', '014-44444444', 'kitchen01', SHA2('kitchen123', 256));

-- ============================================================
-- SAMPLE DATA — CUSTOMER
-- ============================================================
INSERT INTO Customer (customer_name, phone_number, email) VALUES
('Muhammad Ali',    '016-55555555', 'ali@email.com'),
('Siti Nurhaliza',  '017-66666666', NULL),
('Raj Kumar',       '018-77777777', 'raj@email.com');

-- ============================================================
-- SAMPLE DATA — ORDER
-- ============================================================
INSERT INTO `Order` (customer_id, staff_id, order_date, order_type, order_status, total_amount) VALUES
(1, 3, '2025-01-10 12:30:00', 'Dine-In',  'Completed', 24.00),
(2, 3, '2025-01-10 13:00:00', 'Takeaway', 'Completed',  7.50),
(3, 3, '2025-01-11 12:00:00', 'Dine-In',  'Completed', 16.50);

-- ============================================================
-- SAMPLE DATA — ORDER_ITEM
-- ============================================================
INSERT INTO Order_Item (order_id, menu_item_id, quantity, subtotal) VALUES
(1, 1, 2, 16.00),  -- Order 1: Nasi Lemak x2
(1, 4, 2,  8.00),  -- Order 1: Teh Tarik x2
(2, 2, 1,  7.50),  -- Order 2: Mee Goreng x1
(3, 3, 1,  9.00),  -- Order 3: Ayam Goreng x1
(3, 5, 2,  7.00);  -- Order 3: Milo Ais x2  (3.50 x2 = 7.00, but total is 16.50)

-- ============================================================
-- SAMPLE DATA — PAYMENT
-- ============================================================
INSERT INTO Payment (order_id, payment_method, payment_amount, payment_date) VALUES
(1, 'Cash',            24.00, '2025-01-10 13:00:00'),
(2, 'QR Code',          7.50, '2025-01-10 13:20:00'),
(3, 'Online Transfer', 16.50, '2025-01-11 12:45:00');

