const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { db } = require('./database/client');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Lista de orígenes permitidos
/*    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // React dev server
      'http://localhost:4173', // Vite preview
      'http://127.0.0.1:5173',
      'https://kpazserv0018-djcqb2ecg5hfgcdw.eastus-01.azurewebsites.net',
      'http://127.0.0.1:4173',
      // Agregar aquí los dominios de producción cuando estén disponibles
      // 'https://tu-dominio.com',
      // 'https://www.tu-dominio.com'
    ];*/
    const allowedOrigins = [
//      'https://kpazserv0018-djcqb2ecg5hfgcdw.eastus-01.azurewebsites.net',
      'http://localhost:8080',
      // Agregar aquí los dominios de producción cuando estén disponibles
      // 'https://tu-dominio.com',
      // 'https://www.tu-dominio.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400 // Cache preflight requests for 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Logging middleware for CORS and requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'No origin'}`);
  next();
});

// Error handling for CORS
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    console.log('🚫 CORS Error:', err.message);
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      origin: req.get('Origin')
    });
  }
  next(err);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt for:', email);
    
    const user = await db.getUserByEmail(email);
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('✅ User found, checking password...');
    
    // Check if user is active
    if (!user.is_active) {
      console.log('❌ User is inactive');
      return res.status(401).json({ error: 'User account is deactivated' });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('🔑 Password verification:', isValidPassword ? '✅ Correct' : '❌ Incorrect');
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('🎫 Token generated successfully');
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Countries endpoints
app.get('/api/countries', async (req, res) => {
  try {
    const countries = await db.getCountries();
    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/countries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    await db.updateCountry(id, updateData);
    res.json({ message: 'Country updated successfully' });
  } catch (error) {
    console.error('Error updating country:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clients endpoints
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await db.getClients();
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const clientData = req.body;
    await db.createClient(clientData);
    res.status(201).json({ message: 'Client created successfully' });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    await db.updateClient(id, updateData);
    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request Types endpoints
app.get('/api/request-types', async (req, res) => {
  try {
    const requestTypes = await db.getRequestTypes();
    res.json(requestTypes);
  } catch (error) {
    console.error('Error fetching request types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/request-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    await db.updateRequestType(id, updateData);
    res.json({ message: 'Request type updated successfully' });
  } catch (error) {
    console.error('Error updating request type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    await db.createUser(userData);
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    await db.updateUser(id, updateData);
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    await db.updateUserPassword(id, password);
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error updating user password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resolvers endpoints
app.get('/api/resolvers', async (req, res) => {
  try {
    const resolvers = await db.getResolvers();
    res.json(resolvers);
  } catch (error) {
    console.error('Error fetching resolvers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/resolvers', async (req, res) => {
  try {
    const resolverData = req.body;
    await db.createResolver(resolverData);
    res.status(201).json({ message: 'Resolver created successfully' });
  } catch (error) {
    console.error('Error creating resolver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/resolvers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    await db.updateResolver(id, updateData);
    res.json({ message: 'Resolver updated successfully' });
  } catch (error) {
    console.error('Error updating resolver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Holidays endpoints
app.get('/api/holidays', async (req, res) => {
  try {
    const holidays = await db.getHolidays();
    res.json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/holidays', async (req, res) => {
  try {
    const holidayData = req.body;
    await db.createHoliday(holidayData);
    res.status(201).json({ message: 'Holiday created successfully' });
  } catch (error) {
    console.error('Error creating holiday:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/holidays/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    await db.updateHoliday(id, updateData);
    res.json({ message: 'Holiday updated successfully' });
  } catch (error) {
    console.error('Error updating holiday:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tickets endpoints
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await db.getTickets();
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await db.getTicketById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const ticketData = req.body;
    await db.createTicket(ticketData);
    res.status(201).json({ message: 'Ticket created successfully' });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    await db.updateTicket(id, updateData);
    res.json({ message: 'Ticket updated successfully' });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    const stats = await db.getDashboardStats(userId || null);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reports endpoints
app.get('/api/reports/client-tickets/:clientId/:year', async (req, res) => {
  try {
    const { clientId, year } = req.params;
    const reportData = await db.getClientTicketsReport(clientId, parseInt(year));
    res.json(reportData);
  } catch (error) {
    console.error('Error fetching client tickets report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/reports/resolver-tickets/:resolverId/:year', async (req, res) => {
  try {
    const { resolverId, year } = req.params;
    const reportData = await db.getResolverTicketsReport(resolverId, parseInt(year));
    res.json(reportData);
  } catch (error) {
    console.error('Error fetching resolver tickets report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/reports/client-resolution-time/:clientId/:year', async (req, res) => {
  try {
    const { clientId, year } = req.params;
    const reportData = await db.getClientResolutionTimeReport(clientId, parseInt(year));
    res.json(reportData);
  } catch (error) {
    console.error('Error fetching client resolution time report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/reports/ticket-detail', async (req, res) => {
  try {
    const filters = req.body;
    const reportData = await db.getTicketDetailReport(filters);
    res.json(reportData);
  } catch (error) {
    console.error('Error fetching ticket detail report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});
