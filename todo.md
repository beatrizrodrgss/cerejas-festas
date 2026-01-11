# Cerejas Festas - Sistema de Gestão de Inventário

## Design Guidelines

### Design References
- **Airbnb.com**: Clean card layouts, excellent search/filter UX
- **Notion.so**: Intuitive data management, smooth interactions
- **Style**: Modern Professional + Clean Interface + Data-Focused

### Color Palette
- Primary: #1A1A1A (Deep Black - headers, text)
- Secondary: #F5F5F5 (Light Gray - backgrounds)
- Accent: #FF6B6B (Cherry Red - CTAs, highlights)
- Success: #51CF66 (Green - available status)
- Warning: #FFA94D (Orange - maintenance)
- Danger: #FF6B6B (Red - unavailable)
- Text: #1A1A1A (Black), #6B7280 (Gray - secondary)

### Typography
- Heading1: Inter font-weight 700 (32px)
- Heading2: Inter font-weight 600 (24px)
- Heading3: Inter font-weight 600 (18px)
- Body/Normal: Inter font-weight 400 (14px)
- Body/Emphasis: Inter font-weight 600 (14px)
- Navigation: Inter font-weight 500 (16px)

### Key Component Styles
- **Buttons**: Cherry red background (#FF6B6B), white text, 6px rounded, hover: darken 10%
- **Cards**: White background, 1px border (#E5E7EB), 8px rounded, hover: lift 2px
- **Forms**: Clean inputs with border, focus: cherry red accent
- **Status Badges**: Rounded pills with status-specific colors

### Layout & Spacing
- Dashboard: Grid layout with KPI cards
- Catalog: Responsive grid (4 cols desktop, 2 tablet, 1 mobile)
- Section padding: 24px
- Card hover: Subtle lift with shadow transition

### Images to Generate
1. **hero-inventory-warehouse.jpg** - Modern organized warehouse with shelving (Style: photorealistic, bright lighting)
2. **icon-qr-scan.png** - QR code scanner icon (Style: minimalist, line art)
3. **placeholder-party-item.jpg** - Generic party decoration item (Style: photorealistic, neutral background)
4. **dashboard-background.jpg** - Subtle pattern or gradient for dashboard (Style: abstract, professional)

---

## Development Tasks

### Phase 1: Setup & Database (Tasks 1-2)
- [x] Initialize Shadcn-UI template
- [ ] Install Supabase client dependencies
- [ ] Create database schema with all tables
- [ ] Set up Row Level Security policies
- [ ] Create edge functions for business logic

### Phase 2: Authentication (Task 3)
- [ ] Implement AuthContext with Supabase Auth
- [ ] Create login/register pages
- [ ] Add protected route wrapper
- [ ] Implement role-based access control

### Phase 3: Item Management - MVP (Task 4)
- [ ] Create catalog listing page with search/filters
- [ ] Build item detail page with photo gallery
- [ ] Implement item creation form with camera access
- [ ] Add photo upload to Supabase Storage
- [ ] Create category and theme management

### Phase 4: Rental Management (Task 5)
- [ ] Build rental creation wizard (multi-step)
- [ ] Implement item selection with availability check
- [ ] Create rental tracking dashboard
- [ ] Add return processing with condition check
- [ ] Implement rental history and audit logs

### Phase 5: QR Code System (Task 6)
- [ ] Generate QR codes for each item
- [ ] Implement QR scanner using device camera
- [ ] Create quick lookup by scanning
- [ ] Add printable QR labels

### Phase 6: Reports & Analytics (Task 7)
- [ ] Create dashboard with KPIs
- [ ] Build inventory occupancy reports
- [ ] Add popular items analysis
- [ ] Implement maintenance tracking
- [ ] Create rental history reports

### Phase 7: UI Polish (Task 8)
- [ ] Apply consistent styling across all pages
- [ ] Add loading states and skeletons
- [ ] Implement error handling and toast notifications
- [ ] Ensure responsive design for mobile
- [ ] Add animations and transitions

---

## Technical Stack
- Frontend: React + TypeScript + Vite
- UI: Shadcn-UI + Tailwind CSS
- Backend: Supabase (Auth, Database, Storage, Edge Functions)
- State: React Query for server state
- Forms: React Hook Form + Zod validation
- QR: html5-qrcode for scanning, qrcode.react for generation
- Camera: getUserMedia API for photo capture