const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('../models/User');
const Lead = require('../models/Lead');


const testUser = {
  email: 'test@erino.io',
  password: 'test123',
  firstName: 'Test',
  lastName: 'User'
};

const sources = ['website', 'facebook_ads', 'google_ads', 'referral', 'events', 'other'];
const statuses = ['new', 'contacted', 'qualified', 'lost', 'won'];
const companies = [
  'Tech Solutions Inc', 'Digital Marketing Pro', 'CloudFirst Systems', 'DataDrive Analytics',
  'NextGen Software', 'InnovateHub', 'SmartFlow Technologies', 'Growth Partners LLC',
  'TechAdvantage Group', 'Digital Transform Co', 'ScaleUp Solutions', 'ConnectWise Inc',
  'FutureVision Labs', 'AgilePoint Systems', 'CloudSync Technologies', 'DataBridge Corp',
  'TechStream Solutions', 'Digital Edge Partners', 'InnovateTech Hub', 'GrowthEngine LLC'
];

const cities = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
  'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle',
  'Denver', 'Boston', 'Washington', 'Nashville', 'El Paso', 'Detroit', 'Portland'
];

const states = [
  'NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH', 'NC', 'WA',
  'CO', 'MA', 'DC', 'TN', 'MI', 'OR', 'GA', 'VA', 'NV', 'MD'
];

const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
  'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Stephanie', 'Daniel',
  'Nicole', 'Matthew', 'Elizabeth', 'Anthony', 'Heather', 'Mark', 'Michelle',
  'Donald', 'Kimberly', 'Steven', 'Dorothy', 'Paul', 'Lisa', 'Andrew', 'Nancy'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
];


const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));


const generatePhoneNumber = () => {
  const area = getRandomNumber(200, 999);
  const first = getRandomNumber(200, 999);
  const last = getRandomNumber(1000, 9999);
  return `(${area}) ${first}-${last}`;
};

const generateEmail = (firstName, lastName, company) => {
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
  return email;
};

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

 
    console.log('Clearing existing data...');
    await Lead.deleteMany({});
    await User.deleteMany({});
    console.log('Existing data cleared');


    console.log('Creating test user...');
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    const user = await User.create({
      ...testUser,
      password: hashedPassword
    });
    console.log(`Test user created: ${user.email}`);


    console.log('Generating 120 leads...');
    const leads = [];
    const usedEmails = new Set();

    for (let i = 0; i < 120; i++) {
      const firstName = getRandomItem(firstNames);
      const lastName = getRandomItem(lastNames);
      const company = getRandomItem(companies);
      let email = generateEmail(firstName, lastName, company);
      

      let counter = 1;
      while (usedEmails.has(email)) {
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${counter}@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
        counter++;
      }
      usedEmails.add(email);

      const isQualified = Math.random() > 0.7;
      const hasActivity = Math.random() > 0.6;
      
      const lead = {
        userId: user._id,
        firstName,
        lastName,
        email,
        phone: generatePhoneNumber(),
        company,
        city: getRandomItem(cities),
        state: getRandomItem(states),
        source: getRandomItem(sources),
        status: getRandomItem(statuses),
        score: getRandomNumber(0, 100),
        leadValue: getRandomNumber(1000, 50000),
        isQualified,
        lastActivityAt: hasActivity ? getRandomDate(new Date(2024, 0, 1), new Date()) : null,
        createdAt: getRandomDate(new Date(2024, 0, 1), new Date()),
      };

      leads.push(lead);
    }

    await Lead.insertMany(leads);
    console.log(`${leads.length} leads created successfully!`);

    console.log('\n=== SEED DATA COMPLETE ===');
    console.log('Test User Credentials:');
    console.log(`Email: ${testUser.email}`);
    console.log(`Password: ${testUser.password}`);
    console.log('===========================');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();