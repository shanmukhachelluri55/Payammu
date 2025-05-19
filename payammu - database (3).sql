-- Creating the Users table
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL, 
    shop_name VARCHAR(255),
    subscription VARCHAR(50) NOT NULL,
    category VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    gstin VARCHAR(15), 
    image TEXT, -- Add the image column to store binary data
    licence_name VARCHAR(255) -- New LicenceName field
);

-- Creating the Subscriptions table
CREATE TABLE Subscriptions (
    logic_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id),
    subscription VARCHAR(50),
    start_date DATE,
    end_date DATE
);

-- Creating the Payload table
CREATE TABLE Payload (
    payload_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id),
    email VARCHAR(255) UNIQUE NOT NULL, 
    password VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    licence_name VARCHAR(255) -- New LicenceName field
);

-- Creating the function to insert a subscription record after a user is created
CREATE OR REPLACE FUNCTION insert_subscription()
RETURNS TRIGGER AS $$ 
BEGIN
    INSERT INTO Subscriptions (user_id, subscription, start_date, end_date)
    VALUES (
        NEW.user_id,
        NEW.subscription,
        CURRENT_DATE,  -- Subscription starts today
        CASE 
            WHEN NEW.subscription = '1 month' THEN CURRENT_DATE + INTERVAL '1 month'
            WHEN NEW.subscription = '3 months' THEN CURRENT_DATE + INTERVAL '3 months'
            WHEN NEW.subscription = '6 months' THEN CURRENT_DATE + INTERVAL '6 months'
            WHEN NEW.subscription = '1 year' THEN CURRENT_DATE + INTERVAL '1 year'
            ELSE NULL  -- Default in case subscription is not set
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creating the trigger for inserting subscriptions
CREATE TRIGGER after_insert_user_subscription
AFTER INSERT ON Users
FOR EACH ROW
EXECUTE FUNCTION insert_subscription();

-- Creating the function to insert a payload record and copy LicenceName from Users
CREATE OR REPLACE FUNCTION insert_payload()
RETURNS TRIGGER AS $$ 
BEGIN
    INSERT INTO Payload (user_id, email, password, role, licence_name)
    VALUES (NEW.user_id, NEW.email, NEW.password, NEW.role, NEW.licence_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creating the trigger for inserting payloads
CREATE TRIGGER after_insert_user_payload
AFTER INSERT ON Users
FOR EACH ROW
EXECUTE FUNCTION insert_payload();

-- Insert a new user
INSERT INTO Users (email, password, phone_number, role, shop_name, subscription, category, address, gstin, licence_name)
VALUES (
    'dk6096331@gmail.com', 
    'Ram@2002', 
    '9999999999', 
    'UNIVERSAL_ADMIN', 
    'Shanmukha Enterprises', 
    '1 year', 
    'General', 
    '123, Chinatapalli, Andhra Pradesh', 
    'GSTIN000000001', 
    'Shanmukha'
);

-- Creating the Bills table
CREATE TABLE bills (
    user_id INTEGER NOT NULL,
    bill_number SERIAL NOT NULL,
    subtotal DECIMAL(10, 2),
    gst DECIMAL(10, 2),
    gst_rate DECIMAL(5, 2),
    total DECIMAL(10, 2),
    billed_user VARCHAR(255) NOT NULL,
    payload_id INTEGER NOT NULL,
    serviceCharge DECIMAL(10, 2),
    serviceChargeAmount DECIMAL(10, 2),
    PRIMARY KEY (user_id, bill_number),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Removed AT TIME ZONE 'Asia/Kolkata'
);

-- Altering the Bills table to set non-null constraints
ALTER TABLE bills
ALTER COLUMN billed_user SET NOT NULL,
ALTER COLUMN payload_id SET NOT NULL;

-- Updating the Bills table with default values for billed_user and payload_id
UPDATE bills
SET billed_user = 'Default User', -- Replace with a meaningful default if necessary
    payload_id = 0; -- Replace with a meaningful default if necessary

-- Creating the Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    bill_number INTEGER NOT NULL,
    method VARCHAR(50),
    amount DECIMAL(10, 2),
    FOREIGN KEY (user_id, bill_number) REFERENCES bills(user_id, bill_number) ON DELETE CASCADE
);

-- Creating the Customers table
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,          -- Auto-incrementing primary key
  user_id INT NOT NULL,           -- Stores user_id for tracking purposes (you can fetch this from localStorage)
  name VARCHAR(255) NOT NULL,     -- Customer's name
  phone VARCHAR(15) NOT NULL,     -- Customer's phone number (no UNIQUE constraint)
  royalty_points INT DEFAULT 0    -- Default royalty points (calculated based on purchase amount)
);

-- Creating the Coupons table
CREATE TABLE "Coupons" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(255) NOT NULL,
    discount FLOAT NOT NULL,
    type VARCHAR(50) CHECK(type IN ('percentage', 'fixed')) NOT NULL,
    "validUntil" DATE NOT NULL,
    description TEXT,
    "minBillAmount" FLOAT NOT NULL,
    "userId" INTEGER NOT NULL
);

-- Creating the Cancelled Bills table
CREATE TABLE cancelled_bills (
    id SERIAL PRIMARY KEY,
    bill_id VARCHAR(50) NOT NULL,
    date TIMESTAMP NOT NULL,
    items JSONB NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reason TEXT,
    total NUMERIC(10, 2) NOT NULL,
    user_id INTEGER NOT NULL
);

-- Create or replace a function to auto-update the 'updatedAt' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ 
BEGIN
  NEW.updatedAt = CURRENT_TIMESTAMP; -- Updates 'updatedAt' to the current timestamp
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creating the Items table
CREATE TABLE "Items" (
  "id" SERIAL PRIMARY KEY,               -- Auto-incrementing primary key
  "name" VARCHAR(255) NOT NULL,          -- Name of the item (required)
  "price" DECIMAL(10, 2) NOT NULL,       -- Price of the item (up to 10 digits with 2 decimals)
  "image" VARCHAR(10485760) NOT NULL,      -- URL or path for the item's image
  "category" VARCHAR(100) NOT NULL,      -- Category of the item (required)
  "available" BOOLEAN DEFAULT true,      -- Availability of the item (default is true)
  "minStock" INTEGER DEFAULT 0,          -- Minimum stock threshold (default 0)
  "stockPosition" INTEGER NOT NULL,      -- Current stock position (required)
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Creation timestamp
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last updated timestamp
  "userId" INTEGER NOT NULL,             -- Foreign key referencing 'Users' table
  FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE CASCADE -- Cascade delete
);

-- Create index on 'userId' for optimized lookups
CREATE INDEX idx_userId ON "Items"("userId");

-- Creating the Items table (another version)
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    bill_number INTEGER NOT NULL,
    name VARCHAR(255),
    price DECIMAL(10, 2),
    image TEXT,
    category VARCHAR(100),
    available BOOLEAN,
    quantity INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id, bill_number) REFERENCES bills(user_id, bill_number) ON DELETE CASCADE
);

-- Creating the Razorpay Credentials table
CREATE TABLE razorpay_credentials (
    store_id VARCHAR(50) PRIMARY KEY,
    key_id VARCHAR(100) NOT NULL,
    key_secret VARCHAR(100) NOT NULL
);
