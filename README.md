# Savishkar India - Empowering Youth

A comprehensive platform for youth empowerment, leadership development, and community engagement built with modern web technologies.

## Project Overview

**Savishkar India** is a youth-led organization focused on empowering young minds through education, leadership programs, and community initiatives. This platform serves as a digital hub for:

- Youth registration and profile management
- Leadership program applications
- Community engagement tracking
- Administrative oversight and analytics

## Technology Stack

This project is built with modern web technologies:

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **State Management**: React Query + Context API
- **Deployment**: Vercel/Netlify ready

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account (for backend services)

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd savishkar-india

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Build for Production

```sh
# Build the application
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
savishkar-india/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and constants
│   └── integrations/       # External service integrations
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── dist/                   # Production build output
```

## Key Features

### For Users
- **Profile Management**: Complete user profiles with social media integration
- **Program Applications**: Streamlined application process
- **ID Card Generation**: Digital membership cards with QR codes
- **Community Engagement**: Track participation and achievements

### For Administrators
- **User Management**: Comprehensive admin dashboard
- **Role-Based Access Control**: SUPER_CONTROLLER, ADMIN, MODERATOR roles
- **Audit Logging**: Complete activity tracking
- **Content Management**: Dynamic footer and CMS integration

## Security Features

- **Password Reset**: Secure admin-controlled password reset
- **Input Validation**: Comprehensive server-side validation
- **Rate Limiting**: Protection against abuse
- **Audit Trails**: Complete logging of administrative actions
- **CORS Protection**: Environment-specific origin restrictions

## Deployment

### Environment Variables

Create a `.env.local` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/`
3. Deploy edge functions in `supabase/functions/`
4. Configure authentication settings

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is part of Savishkar India's mission to empower youth. All rights reserved.

## Contact

For questions or support, please reach out to the Savishkar India team.
