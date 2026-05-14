# Pawnshop Management System

A comprehensive pawnshop management system built with React, TypeScript, Vite, and Supabase.

## 🎯 Features

- **Admin Dashboard** - Complete admin panel with statistics and management tools
- **Customer Management** - Add, edit, and manage customers with search functionality
- **Master Data Management** - Manage companies, loan types, jewellery types, schemes, and banks
- **Transaction Management** - Handle pledges, returns, part payments, and sales
- **Bank Operations** - Manage bank pledges
- **Accounts** - Track cash transactions
- **Reports** - Generate detailed reports (placeholder - ready for implementation)
- **Authentication** - Secure admin authentication with protected routes
- **Live Metal Rates** - View and update gold/silver rates
- **Modern UI** - Beautiful, responsive design with TailwindCSS

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pawnshop-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up database**
   - Follow the instructions in `SETUP_GUIDE.md`
   - Run the SQL scripts in Supabase SQL Editor
   - Create admin user in Supabase Auth

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Public: `http://localhost:5173/`
   - Admin Login: `http://localhost:5173/admin/login`

## 📖 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[PAWNSHOP_SETUP.md](./PAWNSHOP_SETUP.md)** - Original setup guide
- **[PROJECT_ANALYSIS_AND_IMPROVEMENTS.md](./PROJECT_ANALYSIS_AND_IMPROVEMENTS.md)** - Detailed project analysis
- **[CRITICAL_FIXES_APPLIED.md](./CRITICAL_FIXES_APPLIED.md)** - List of security fixes
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Implementation details

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Routing**: React Router v6
- **Notifications**: react-toastify
- **Icons**: Lucide React

## 📁 Project Structure

```
pawnshop-main/
├── src/
│   ├── components/        # Reusable components
│   │   ├── admin/         # Admin section components
│   │   └── ...
│   ├── context/           # React contexts (Auth, Cart, etc.)
│   ├── pages/             # Page components
│   ├── services/          # API service functions
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── supabase/
│   ├── migrations/        # Database migrations
│   └── functions/         # Supabase edge functions
├── public/                # Static assets
└── ...
```

## 🔐 Security Features

- ✅ Protected admin routes with authentication
- ✅ Row Level Security (RLS) policies
- ✅ Environment variables for sensitive data
- ✅ No hardcoded credentials
- ✅ Input validation (to be enhanced)
- ✅ Error boundaries for error handling

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Features Overview

### Admin Panel
- Dashboard with statistics
- Customer management (CRUD operations)
- Master data management
- Transaction management (ready for implementation)
- Bank operations
- Accounts management
- Reports generation

### Public Pages
- Home page
- Jewelry browsing
- Pawn request submission
- Customer login/signup

## ⚠️ Important Notes

1. **Environment Variables**: Never commit `.env` file to git
2. **Database Setup**: Must run SQL scripts in Supabase SQL Editor
3. **RLS Policies**: Important to run `fix-rls-policies.sql` for security
4. **Admin Users**: Create users in Supabase Auth, not in app_users table

## 🐛 Known Issues / TODO

- Transaction management forms need implementation
- Reports need to be connected to actual data
- Input validation can be enhanced
- Testing infrastructure to be added
- Role-based access control can be improved

## 🤝 Contributing

1. Review the project analysis document
2. Follow the coding standards
3. Test your changes
4. Update documentation if needed

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

Built with modern web technologies and best practices.

---

**Need Help?** Check the [SETUP_GUIDE.md](./SETUP_GUIDE.md) or project documentation.

